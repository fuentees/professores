"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { validateDocxFile } from "@/lib/storage/file-validation";
import { questionAssetStoragePath, questionOriginalStoragePath } from "@/lib/storage/paths";
import { parseQuestionDocx } from "@/lib/parsing/docx";
import type { ParsedQuestionDraft, ParsedWarning } from "@/lib/parsing/docx/types";
import { syncBnccFromWordImport } from "@/lib/bncc/sync-word-import";
import { getBnccTaxonomyTarget } from "@/lib/bncc/code";
import { recordQuestionImportEvent } from "@/lib/audit/question-import";
import type { BloomTaxonomyLevel } from "@/types/supabase";

export type ImportResult = {
  error: string | null;
  importId?: string;
  questionId?: string;
  summary?: { warnings: number; errors: number; bnccFound: number; bnccLinked: number };
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
 * existentes (grades/subjects/academic_periods). Nunca cria
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

  const [{ data: subjects }, { data: grades }, { data: periods }] = await Promise.all([
    admin.from("subjects").select("id, name"),
    admin.from("grades").select("id, name"),
    admin.from("academic_periods").select("id, name"),
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

  return { subjectId, gradeId, academicPeriodId };
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
  const actor = await requireAdmin();
  return processQuestionDocx(file, actor.id);
}

async function processQuestionDocx(
  file: File,
  actorId: string,
  reprocessedFromId: string | null = null,
): Promise<ImportResult> {
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
    imported_by: actorId,
    reprocessed_from_id: reprocessedFromId,
  });
  if (importInsertError) {
    return { error: `Não foi possível registrar a importação: ${importInsertError.message}` };
  }
  await recordQuestionImportEvent(admin, {
    importId,
    actorId,
    action: reprocessedFromId ? "reprocess_started" : "uploaded",
    details: { fileName: file.name, reprocessedFromId },
  });

  let parsed: Awaited<ReturnType<typeof parseQuestionDocx>>;
  try {
    parsed = await parseQuestionDocx(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao ler o .docx.";
    await admin
      .from("question_imports")
      .update({ status: "failed", error_message: message, processed_at: new Date().toISOString() })
      .eq("id", importId);
    await recordQuestionImportEvent(admin, {
      importId,
      actorId,
      action: "processing_failed",
      details: { message },
    });
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

  const { subjectId, gradeId, academicPeriodId } = await resolveTaxonomy(admin, draft);
  if (draft.subjectName.value && !subjectId) {
    extraWarnings.push({
      severity: "error",
      field: "subject",
      message: `A disciplina "${draft.subjectName.value}" não existe no cadastro. Corrija o Word e reprocesse.`,
    });
  }
  if (draft.gradeName.value && !gradeId) {
    extraWarnings.push({
      severity: "error",
      field: "grade",
      message: `A série "${draft.gradeName.value}" não existe no cadastro. Corrija o Word e reprocesse.`,
    });
  }
  if (!draft.leadingText.trim()) {
    extraWarnings.push({ severity: "error", field: "statement", message: "O enunciado não foi identificado." });
  }
  if (!draft.correctionProse && draft.answers.length === 0 && draft.rubrics.length === 0) {
    extraWarnings.push({
      severity: "error",
      field: "correction",
      message: "O arquivo não possui gabarito, resposta esperada ou orientação de correção identificável.",
    });
  }
  validateBnccPedagogicalConsistency(draft, extraWarnings);
  const bnccSync = await syncBnccFromWordImport(admin, { importId, gradeId, draft });
  extraWarnings.push(...bnccSync.warnings);
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

  const partIdByLabel = new Map<string, string>();
  const parts = draft.items.map((item, index) => {
    const id = randomUUID();
    partIdByLabel.set(item.label, id);
    return { id, label: item.label, prompt: item.prompt, order_index: index };
  });

  const answers =
    draft.answers.length > 0
      ? draft.answers.map((answer) => ({
          item_label: answer.itemLabel ?? null,
          expected_answer: answer.expectedAnswer,
          correction_guidance: answer.correctionGuidance,
        }))
      : draft.correctionProse
        ? // Documentos que só têm correção em prosa livre (sem "Comando X"/
          // "Item X" por item) não geram `answers` estruturadas — sem isto,
          // esse texto (já extraído pelo parser) nunca seria salvo em lugar
          // nenhum e o trabalho pedagógico da correção se perderia.
          [{ item_label: null, expected_answer: draft.correctionProse, correction_guidance: null }]
        : [];

  const rubrics = draft.rubrics.map((rubric, index) => ({
    item_label: rubric.itemLabel ?? null,
    level: rubric.level,
    points: rubric.points,
    criteria: rubric.criteria,
    order_index: index,
  }));

  // Assets sobem pro Storage ANTES da RPC (Storage não participa da
  // transação SQL) — se a RPC falhar depois, esses arquivos já enviados são
  // removidos explicitamente (compensação manual) pra não ficarem órfãos.
  const assetIdByRelId = new Map<string, string>();
  const uploadedAssetPaths: string[] = [];
  const assets: {
    id: string;
    storage_path: string;
    asset_type: string;
    original_name: string;
    mime_type: string;
    order_index: number;
  }[] = [];
  for (const asset of media) {
    const assetId = randomUUID();
    const assetPath = questionAssetStoragePath(questionId, assetId, asset.fileName);
    const { error: assetUploadError } = await admin.storage.from("private").upload(assetPath, asset.buffer, {
      contentType: asset.mimeType,
    });
    if (assetUploadError) continue;

    uploadedAssetPaths.push(assetPath);
    assets.push({
      id: assetId,
      storage_path: assetPath,
      asset_type: "image",
      original_name: asset.fileName,
      mime_type: asset.mimeType,
      order_index: assets.length,
    });
    assetIdByRelId.set(asset.relId, assetId);
  }

  const blocks = draft.blocks
    .map((block) => {
      let content: Record<string, unknown>;
      if (block.blockType === "image" && "relId" in block.content) {
        const assetId = assetIdByRelId.get(block.content.relId);
        if (!assetId) return null;
        content = { assetId };
      } else {
        content = block.content as unknown as Record<string, unknown>;
      }
      return { section: block.section, block_type: block.blockType, content, order_index: block.orderIndex };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const warningRows = buildWarnings(importId, draft.warnings, extraWarnings).map((w) => ({
    severity: w.severity,
    field: w.field,
    message: w.message,
  }));
  const summary = {
    warnings: warningRows.filter((warning) => warning.severity === "warning").length,
    errors: warningRows.filter((warning) => warning.severity === "error").length,
    bnccFound: draft.bnccSkills.length,
    bnccLinked: bnccSync.skillIds.length,
  };

  // import_question_draft insere questão + partes + respostas + rubrica +
  // habilidades BNCC + assets + blocos + avisos numa única transação —
  // tudo ou nada, sem o risco de ficar um rascunho pela metade que a
  // versão anterior (inserts sequenciais sem checar erro) podia deixar.
  const { error: rpcError } = await admin.rpc("import_question_draft", {
    p_question_id: questionId,
    p_import_id: importId,
    // leadingText já é o enunciado limpo: sem os itens A/B/C embutidos
    // (viram question_parts separados) e sem rascunho duplicado colado no
    // meio do texto (ver MID_DRAFT_MARKER em extract.ts). Gravar o
    // statementCandidate bruto reintroduziria as duas duplicações.
    p_statement: draft.leadingText,
    p_question_type: "discursive",
    p_difficulty: draft.difficultyRaw.value ?? "medium",
    p_code: draft.code.value,
    p_subject_id: subjectId,
    p_grade_id: gradeId,
    p_knowledge_objects: draft.knowledgeObjects.length > 0 ? draft.knowledgeObjects : null,
    p_academic_period_id: academicPeriodId,
    p_book_name: draft.bookName.value,
    p_book_unit: draft.bookUnit.value,
    p_bloom_primary_level: bloomPrimary,
    p_bloom_justification: draft.bloomJustification.value,
    p_pedagogical_note: draft.pedagogicalNote.value,
    p_original_file_path: storagePath,
    p_bncc_skill_ids: bnccSync.skillIds.length > 0 ? bnccSync.skillIds : null,
    p_parts: parts,
    p_answers: answers,
    p_rubrics: rubrics,
    p_assets: assets,
    p_blocks: blocks,
    p_warnings: warningRows,
  });

  if (rpcError) {
    if (uploadedAssetPaths.length > 0) {
      await admin.storage.from("private").remove(uploadedAssetPaths);
    }
    await admin
      .from("question_imports")
      .update({ status: "failed", error_message: rpcError.message, processed_at: new Date().toISOString() })
      .eq("id", importId);
    await recordQuestionImportEvent(admin, {
      importId,
      actorId,
      action: "processing_failed",
      details: { message: rpcError.message },
    });
    return { error: null, importId };
  }

  await admin.from("question_imports").update({ summary }).eq("id", importId);
  await recordQuestionImportEvent(admin, {
    importId,
    actorId,
    action: "processed",
    details: { questionId, ...summary },
  });

  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/importacoes`);

  return { error: null, importId, questionId, summary };
}

function normalizeCode(code: string): string {
  return code.toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizePedagogicalName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function sameComponent(subjectName: string, componentName: string) {
  const subject = normalizePedagogicalName(subjectName);
  const component = normalizePedagogicalName(componentName);
  if (subject === component || subject.includes(component) || component.includes(subject)) return true;
  const aliases: Record<string, string[]> = {
    portugues: ["linguaportuguesa"],
    linguaportuguesa: ["portugues"],
    artes: ["arte"],
    ciencias: ["cienciasdanatureza"],
    ingles: ["linguainglesa"],
  };
  return (aliases[subject] ?? []).includes(component);
}

function validateBnccPedagogicalConsistency(draft: ParsedQuestionDraft, warnings: ParsedWarning[]) {
  if (draft.bnccSkills.length === 0) {
    warnings.push({
      severity: "warning",
      field: "bncc",
      message: "Nenhuma habilidade BNCC foi encontrada no arquivo.",
    });
    return;
  }

  for (const skill of draft.bnccSkills) {
    const target = getBnccTaxonomyTarget(skill.code);
    if (target && draft.subjectName.value && !sameComponent(draft.subjectName.value, target.componentName)) {
      warnings.push({
        severity: "error",
        field: "bncc",
        message: `${skill.code} pertence a ${target.componentName}, mas o Word informa ${draft.subjectName.value}.`,
      });
    }

    const exactFundamentalYear = skill.code.match(/^EF(0[1-9])/i)?.[1];
    const wordYear = draft.gradeName.value?.match(/\b([1-9])\s*[º°o]?\s*ano\b/i)?.[1];
    if (exactFundamentalYear && wordYear && Number(exactFundamentalYear) !== Number(wordYear)) {
      warnings.push({
        severity: "error",
        field: "bncc",
        message: `${skill.code} é do ${Number(exactFundamentalYear)}º ano, mas o Word informa ${draft.gradeName.value}.`,
      });
    }
  }
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
  const actor = await requireAdmin();
  const result = await approveOneImport(admin, actor.id, importId);
  revalidateImportPaths();
  return result;
}

async function approveOneImport(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string,
  importId: string,
): Promise<ImportResult> {
  const { data: importRow } = await admin
    .from("question_imports")
    .select("question_id, status")
    .eq("id", importId)
    .maybeSingle();

  if (!importRow?.question_id) return { error: "Importação sem questão associada." };
  if (importRow.status === "approved") return { error: null, importId, questionId: importRow.question_id };
  if (importRow.status !== "needs_review") return { error: "Esta importação não está disponível para aprovação." };

  const { count: blockingErrors } = await admin
    .from("question_import_warnings")
    .select("id", { count: "exact", head: true })
    .eq("import_id", importId)
    .eq("severity", "error");
  if ((blockingErrors ?? 0) > 0) {
    return { error: "Corrija os erros graves e reprocesse o Word antes de aprovar." };
  }

  const { error: questionError } = await admin
    .from("questions")
    .update({ status: "active", publication_status: "published" })
    .eq("id", importRow.question_id);
  if (questionError) return { error: questionError.message };

  // Aprovar a questão também valida as habilidades novas que o Word trouxe.
  // Uma habilidade manualmente inativada não é afetada, pois só entram aqui
  // as que ainda estão marcadas como pendentes de revisão.
  const { data: bnccLinks } = await admin
    .from("question_bncc_skills")
    .select("bncc_skill_id")
    .eq("question_id", importRow.question_id);
  const linkedSkillIds = [...new Set((bnccLinks ?? []).map((link) => link.bncc_skill_id))];
  if (linkedSkillIds.length > 0) {
    const { error: bnccError } = await admin
      .from("bncc_skills")
      .update({ status: "active", verification_status: "verified" })
      .in("id", linkedSkillIds)
      .eq("verification_status", "pending");
    if (bnccError) return { error: `A questão foi publicada, mas a BNCC não pôde ser ativada: ${bnccError.message}` };
  }

  const { error: importError } = await admin
    .from("question_imports")
    .update({ status: "approved", reviewed_by: actorId, reviewed_at: new Date().toISOString() })
    .eq("id", importId);
  if (importError) return { error: importError.message };
  await recordQuestionImportEvent(admin, {
    importId,
    actorId,
    action: "approved",
    details: { questionId: importRow.question_id },
  });
  return { error: null, importId, questionId: importRow.question_id };
}

export async function approveQuestionImports(
  importIds: string[],
): Promise<{ error: string | null; approved: number; failed: { id: string; message: string }[] }> {
  const guard = await guardAdmin();
  if (guard) return { error: guard.error, approved: 0, failed: [] };
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const ids = [...new Set(importIds)].filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  if (ids.length === 0) return { error: "Selecione pelo menos uma importação pronta.", approved: 0, failed: [] };

  let approved = 0;
  const failed: { id: string; message: string }[] = [];
  for (const id of ids) {
    const result = await approveOneImport(admin, actor.id, id);
    if (result.error) failed.push({ id, message: result.error });
    else approved++;
  }
  await recordQuestionImportEvent(admin, {
    importId: null,
    actorId: actor.id,
    action: "bulk_approval",
    details: { requested: ids.length, approved, failed: failed.length },
  });
  revalidateImportPaths();
  return { error: null, approved, failed };
}

function revalidateImportPaths() {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/importacoes`);
  revalidatePath(`${LIST_PATH}/cobertura`);
  revalidatePath("/admin/bncc");
  revalidatePath("/bncc");
}

/**
 * Rejeita a importação: apaga o rascunho (questão + filhos + assets do
 * Storage) e marca a importação como rejeitada. O .docx original permanece
 * no Storage — é histórico da importação, não da questão.
 */
export async function rejectQuestionImport(importId: string): Promise<ImportResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const { data: importRow } = await admin
    .from("question_imports")
    .select("question_id, status")
    .eq("id", importId)
    .maybeSingle();
  if (!importRow) return { error: "Importação não encontrada." };
  if (importRow.status === "approved" || importRow.status === "superseded") {
    return { error: "Uma importação aprovada ou substituída não pode ser rejeitada." };
  }

  if (importRow?.question_id) {
    await deleteImportedDraft(admin, importRow.question_id);
  }

  const { error } = await admin
    .from("question_imports")
    .update({
      status: "rejected",
      question_id: null,
      reviewed_by: actor.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", importId);
  if (error) return { error: error.message };
  await recordQuestionImportEvent(admin, { importId, actorId: actor.id, action: "rejected" });

  revalidateImportPaths();
  return { error: null, importId };
}

async function deleteImportedDraft(admin: ReturnType<typeof createAdminClient>, questionId: string) {
  const { data: assets } = await admin
    .from("question_assets")
    .select("storage_path")
    .eq("question_id", questionId);
  if (assets && assets.length > 0) {
    await admin.storage.from("private").remove(assets.map((asset) => asset.storage_path));
  }
  await admin.from("questions").delete().eq("id", questionId);
}

export async function reprocessQuestionImport(importId: string, file: File): Promise<ImportResult> {
  const guard = await guardAdmin();
  if (guard) return guard;
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const { data: previous } = await admin
    .from("question_imports")
    .select("id, status, question_id")
    .eq("id", importId)
    .maybeSingle();
  if (!previous) return { error: "Importação não encontrada." };
  if (previous.status === "approved" || previous.status === "superseded") {
    return { error: "Conteúdo aprovado não pode ser substituído por reprocessamento." };
  }

  const result = await processQuestionDocx(file, actor.id, importId);
  if (result.error || !result.questionId || !result.importId) return result;

  if (previous.question_id) await deleteImportedDraft(admin, previous.question_id);
  const now = new Date().toISOString();
  await admin
    .from("question_imports")
    .update({
      status: "superseded",
      question_id: null,
      replaced_by_id: result.importId,
      reviewed_by: actor.id,
      reviewed_at: now,
    })
    .eq("id", importId);
  await recordQuestionImportEvent(admin, {
    importId,
    actorId: actor.id,
    action: "superseded",
    details: { replacementImportId: result.importId },
  });
  revalidateImportPaths();
  return result;
}

export async function resolveBnccImportConflict(
  importId: string,
  code: string,
  choice: "catalog" | "word",
): Promise<{ error: string | null }> {
  const guard = await guardAdmin();
  if (guard) return { error: guard.error };
  const actor = await requireAdmin();
  const admin = createAdminClient();
  const normalizedCode = code.trim().toUpperCase();
  if (!/^(?:EI|EF|EM)[A-Z0-9]{6,10}$/.test(normalizedCode)) return { error: "Código BNCC inválido." };

  const { data: snapshot } = await admin
    .from("question_import_bncc_snapshots")
    .select("bncc_skill_id, imported_description, catalog_description, resolution")
    .eq("import_id", importId)
    .eq("code", normalizedCode)
    .maybeSingle();
  if (!snapshot?.bncc_skill_id || snapshot.resolution !== "conflict") {
    return { error: "Esta divergência não está mais pendente." };
  }

  let chosenDescription = snapshot.catalog_description;
  if (choice === "word") {
    if (!snapshot.imported_description) return { error: "O Word não possui uma descrição válida." };
    chosenDescription = snapshot.imported_description;
    const { error } = await admin
      .from("bncc_skills")
      .update({ description: chosenDescription, verification_status: "verified" })
      .eq("id", snapshot.bncc_skill_id);
    if (error) return { error: error.message };
  }

  await admin
    .from("question_import_bncc_snapshots")
    .update({ catalog_description: chosenDescription, resolution: "matched" })
    .eq("import_id", importId)
    .eq("code", normalizedCode);
  await admin
    .from("question_import_warnings")
    .delete()
    .eq("import_id", importId)
    .eq("field", "bncc")
    .ilike("message", `%${normalizedCode}%difere%`);
  await recordQuestionImportEvent(admin, {
    importId,
    actorId: actor.id,
    action: "bncc_conflict_resolved",
    details: { code: normalizedCode, choice },
  });
  revalidatePath(`${LIST_PATH}/importacoes/${importId}`);
  revalidatePath("/admin/bncc");
  revalidatePath("/bncc");
  return { error: null };
}
