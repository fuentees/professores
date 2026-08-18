"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { validateDocxFile } from "@/lib/storage/file-validation";
import { questionAssetStoragePath, questionOriginalStoragePath } from "@/lib/storage/paths";
import { parseQuestionDocx } from "@/lib/parsing/docx";
import type { ParsedQuestionDraft, ParsedWarning } from "@/lib/parsing/docx/types";
import type { BloomTaxonomyLevel } from "@/types/supabase";

export type ImportResult = {
  error: string | null;
  importId?: string;
  questionId?: string;
};

const LIST_PATH = "/admin/questoes";
const BLOOM_LEVELS: readonly string[] = ["lembrar", "entender", "aplicar", "analisar", "avaliar", "criar"];

async function guardAdmin(): Promise<ImportResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

function sha256(buffer: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

/**
 * Resolve nomes extraídos do .docx contra as tabelas de taxonomia já
 * existentes (grades/subjects/academic_periods/bncc_skills). Nunca cria
 * entidade nova nem "adivinha" o mais parecido — só casa exato
 * (case/acento-insensível) e, quando não encontra, devolve null + deixa a
 * chamadora decidir se isso vira aviso.
 */
async function resolveTaxonomy(
  admin: ReturnType<typeof createAdminClient>,
  draft: ParsedQuestionDraft,
) {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const [{ data: subjects }, { data: grades }, { data: periods }, { data: bnccSkills }] = await Promise.all([
    admin.from("subjects").select("id, name"),
    admin.from("grades").select("id, name"),
    admin.from("academic_periods").select("id, name"),
    draft.bnccCodes.length > 0
      ? admin.from("bncc_skills").select("id, code").in("code", draft.bnccCodes)
      : Promise.resolve({ data: [] as { id: string; code: string }[] }),
  ]);

  const subjectId = draft.subjectName.value
    ? (subjects ?? []).find((s) => normalize(s.name) === normalize(draft.subjectName.value!))?.id ?? null
    : null;
  const gradeId = draft.gradeName.value
    ? (grades ?? []).find((g) => normalize(g.name) === normalize(draft.gradeName.value!))?.id ?? null
    : null;
  const academicPeriodId = draft.academicPeriodRaw.value
    ? (periods ?? []).find((p) => normalize(draft.academicPeriodRaw.value!).includes(normalize(p.name)))?.id ?? null
    : null;

  const matchedBnccIds = (bnccSkills ?? []).map((s) => s.id);
  const missingBnccCodes = draft.bnccCodes.filter(
    (code) => !(bnccSkills ?? []).some((s) => s.code === code),
  );

  return { subjectId, gradeId, academicPeriodId, matchedBnccIds, missingBnccCodes };
}

function buildWarnings(
  importId: string,
  parserWarnings: ParsedWarning[],
  extra: ParsedWarning[],
): { import_id: string; severity: "warning" | "error"; field: string | null; message: string }[] {
  return [...parserWarnings, ...extra].map((w) => ({
    import_id: importId,
    severity: w.severity,
    field: w.field,
    message: w.message,
  }));
}

export async function importQuestionDocx(file: File): Promise<ImportResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const validationError = await validateDocxFile(file);
  if (validationError) return { error: validationError };

  const admin = createAdminClient();
  const buffer = await file.arrayBuffer();
  const fileHash = sha256(buffer);

  const { data: duplicateImport } = await admin
    .from("question_imports")
    .select("id, file_name, question_id")
    .eq("file_hash", fileHash)
    .limit(1)
    .maybeSingle();

  const importId = randomUUID();
  const storagePath = questionOriginalStoragePath(importId, file.name);

  const { error: uploadError } = await admin.storage.from("private").upload(storagePath, buffer, {
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  if (uploadError) return { error: `Falha ao enviar o arquivo original: ${uploadError.message}` };

  const { error: importInsertError } = await admin.from("question_imports").insert({
    id: importId,
    file_name: file.name,
    file_hash: fileHash,
    storage_path: storagePath,
    status: "processing",
  });
  if (importInsertError) {
    return { error: `Não foi possível registrar a importação: ${importInsertError.message}` };
  }

  let parsed: Awaited<ReturnType<typeof parseQuestionDocx>>;
  try {
    parsed = await parseQuestionDocx(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao ler o .docx.";
    await admin
      .from("question_imports")
      .update({ status: "failed", error_message: message, processed_at: new Date().toISOString() })
      .eq("id", importId);
    return { error: null, importId };
  }

  const { draft, media } = parsed;
  const extraWarnings: ParsedWarning[] = [];

  if (duplicateImport) {
    extraWarnings.push({
      severity: "warning",
      field: "duplicate",
      message: `Arquivo idêntico já foi importado antes (${duplicateImport.file_name}).`,
    });
  }

  const fileNameCode = file.name.replace(/\.docx$/i, "");
  if (draft.code.value && normalizeCode(draft.code.value) !== normalizeCode(fileNameCode)) {
    extraWarnings.push({
      severity: "warning",
      field: "code",
      message: `O código no conteúdo ("${draft.code.value}") diverge do nome do arquivo ("${fileNameCode}").`,
    });
  }

  if (draft.code.value) {
    const { data: existingPublished } = await admin
      .from("questions")
      .select("id")
      .eq("code", draft.code.value)
      .eq("publication_status", "published")
      .limit(1)
      .maybeSingle();
    if (existingPublished) {
      extraWarnings.push({
        severity: "warning",
        field: "duplicate_code",
        message: `Já existe uma questão publicada com o código "${draft.code.value}".`,
      });
    }
  }

  const { subjectId, gradeId, academicPeriodId, matchedBnccIds, missingBnccCodes } = await resolveTaxonomy(
    admin,
    draft,
  );
  for (const code of missingBnccCodes) {
    extraWarnings.push({
      severity: "warning",
      field: "bncc",
      message: `Habilidade BNCC ${code} não encontrada no cadastro. Revisão necessária.`,
    });
  }
  if (draft.curriculumUnitName.value) {
    extraWarnings.push({
      severity: "warning",
      field: "curriculum_unit",
      message: `Unidade temática "${draft.curriculumUnitName.value}" não foi vinculada automaticamente — associe manualmente se aplicável.`,
    });
  }

  const bloomPrimary = BLOOM_LEVELS.includes(draft.bloomPrimaryRaw.value ?? "")
    ? (draft.bloomPrimaryRaw.value as BloomTaxonomyLevel)
    : null;

  const questionId = randomUUID();
  const { error: questionInsertError } = await admin.from("questions").insert({
    id: questionId,
    statement: draft.statementCandidates[0] ?? "",
    question_type: "discursive",
    difficulty: draft.difficultyRaw.value ?? "medium",
    theme_id: null,
    status: "inactive",
    publication_status: "draft",
    code: draft.code.value,
    subject_id: subjectId,
    grade_id: gradeId,
    knowledge_objects: draft.knowledgeObjects.length > 0 ? draft.knowledgeObjects : null,
    academic_period_id: academicPeriodId,
    book_name: draft.bookName.value,
    book_unit: draft.bookUnit.value,
    bloom_primary_level: bloomPrimary,
    bloom_justification: draft.bloomJustification.value,
    pedagogical_note: draft.pedagogicalNote.value,
    original_file_path: storagePath,
    import_id: importId,
  });
  if (questionInsertError) {
    await admin
      .from("question_imports")
      .update({ status: "failed", error_message: questionInsertError.message, processed_at: new Date().toISOString() })
      .eq("id", importId);
    return { error: null, importId };
  }

  if (matchedBnccIds.length > 0) {
    await admin
      .from("question_bncc_skills")
      .insert(matchedBnccIds.map((bncc_skill_id) => ({ question_id: questionId, bncc_skill_id })));
  }

  const partIdByLabel = new Map<string, string>();
  if (draft.items.length > 0) {
    const partsToInsert = draft.items.map((item, index) => ({
      id: randomUUID(),
      question_id: questionId,
      label: item.label,
      prompt: item.prompt,
      order_index: index,
    }));
    await admin.from("question_parts").insert(partsToInsert);
    for (const part of partsToInsert) partIdByLabel.set(part.label, part.id);
  }

  if (draft.answers.length > 0) {
    await admin.from("question_answers").insert(
      draft.answers.map((answer) => ({
        question_id: questionId,
        question_part_id: answer.itemLabel ? (partIdByLabel.get(answer.itemLabel) ?? null) : null,
        expected_answer: answer.expectedAnswer,
        correction_guidance: answer.correctionGuidance,
      })),
    );
  } else if (draft.correctionProse) {
    // Documentos que só têm correção em prosa livre (sem "Comando X"/"Item
    // X" por item) não geram `answers` estruturadas — sem isto, esse texto
    // (já extraído pelo parser) nunca seria salvo em lugar nenhum e o
    // trabalho pedagógico da correção se perderia.
    await admin.from("question_answers").insert({
      question_id: questionId,
      question_part_id: null,
      expected_answer: draft.correctionProse,
      correction_guidance: null,
    });
  }

  if (draft.rubrics.length > 0) {
    await admin.from("question_rubrics").insert(
      draft.rubrics.map((rubric, index) => ({
        question_id: questionId,
        question_part_id: rubric.itemLabel ? (partIdByLabel.get(rubric.itemLabel) ?? null) : null,
        level: rubric.level,
        points: rubric.points,
        criteria: rubric.criteria,
        order_index: index,
      })),
    );
  }

  const assetIdByRelId = new Map<string, string>();
  for (const asset of media) {
    const assetId = randomUUID();
    const assetPath = questionAssetStoragePath(questionId, assetId, asset.fileName);
    const { error: assetUploadError } = await admin.storage.from("private").upload(assetPath, asset.buffer, {
      contentType: asset.mimeType,
    });
    if (assetUploadError) continue;

    await admin.from("question_assets").insert({
      id: assetId,
      question_id: questionId,
      storage_path: assetPath,
      asset_type: "image",
      original_name: asset.fileName,
      mime_type: asset.mimeType,
      order_index: assetIdByRelId.size,
    });
    assetIdByRelId.set(asset.relId, assetId);
  }

  if (draft.blocks.length > 0) {
    const blockRows = draft.blocks
      .map((block) => {
        let content: Record<string, unknown>;
        if (block.blockType === "image" && "relId" in block.content) {
          const assetId = assetIdByRelId.get(block.content.relId);
          if (!assetId) return null;
          content = { assetId };
        } else {
          content = block.content as unknown as Record<string, unknown>;
        }
        return {
          question_id: questionId,
          section: block.section,
          block_type: block.blockType,
          content,
          order_index: block.orderIndex,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    if (blockRows.length > 0) await admin.from("question_document_blocks").insert(blockRows);
  }

  const warningRows = buildWarnings(importId, draft.warnings, extraWarnings);
  if (warningRows.length > 0) await admin.from("question_import_warnings").insert(warningRows);

  await admin
    .from("question_imports")
    .update({
      status: "needs_review",
      question_id: questionId,
      extracted_code: draft.code.value,
      processed_at: new Date().toISOString(),
    })
    .eq("id", importId);

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/importacoes`);

  return { error: null, importId, questionId };
}

function normalizeCode(code: string): string {
  return code.toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * Aprova o rascunho gerado por uma importação: publica a questão (mesmo
 * update que ativa `status` e `publication_status` juntos, nunca um sem o
 * outro) e marca a importação como aprovada.
 */
export async function approveQuestionImport(importId: string): Promise<ImportResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const admin = createAdminClient();
  const { data: importRow } = await admin
    .from("question_imports")
    .select("question_id")
    .eq("id", importId)
    .maybeSingle();

  if (!importRow?.question_id) return { error: "Importação sem questão associada." };

  const { error: questionError } = await admin
    .from("questions")
    .update({ status: "active", publication_status: "published" })
    .eq("id", importRow.question_id);
  if (questionError) return { error: questionError.message };

  const { error: importError } = await admin
    .from("question_imports")
    .update({ status: "approved" })
    .eq("id", importId);
  if (importError) return { error: importError.message };

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/importacoes`);
  return { error: null, importId, questionId: importRow.question_id };
}

/**
 * Rejeita a importação: apaga o rascunho (questão + filhos + assets do
 * Storage) e marca a importação como rejeitada. O .docx original permanece
 * no Storage — é histórico da importação, não da questão.
 */
export async function rejectQuestionImport(importId: string): Promise<ImportResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const admin = createAdminClient();
  const { data: importRow } = await admin
    .from("question_imports")
    .select("question_id")
    .eq("id", importId)
    .maybeSingle();

  if (importRow?.question_id) {
    const { data: assets } = await admin
      .from("question_assets")
      .select("storage_path")
      .eq("question_id", importRow.question_id);
    if (assets && assets.length > 0) {
      await admin.storage.from("private").remove(assets.map((a) => a.storage_path));
    }
    await admin.from("questions").delete().eq("id", importRow.question_id);
  }

  const { error } = await admin
    .from("question_imports")
    .update({ status: "rejected", question_id: null })
    .eq("id", importId);
  if (error) return { error: error.message };

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/importacoes`);
  return { error: null, importId };
}
