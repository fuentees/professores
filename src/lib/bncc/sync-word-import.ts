import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedQuestionDraft, ParsedWarning } from "@/lib/parsing/docx/types";
import { getBnccTaxonomyTarget } from "./code";

type AdminClient = ReturnType<typeof createAdminClient>;

type SyncInput = {
  importId: string;
  gradeId: string | null;
  draft: ParsedQuestionDraft;
};

type ExistingSkill = {
  id: string;
  code: string;
  description: string;
  verification_status: "pending" | "verified";
};

type SnapshotResolution = "matched" | "new" | "conflict" | "unmapped" | "missing_description";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Vincula códigos já conhecidos e cadastra habilidades novas usando somente
 * o texto presente no Word. Novas habilidades ficam inativas/pendentes até a
 * aprovação humana da importação.
 */
export async function syncBnccFromWordImport(
  admin: AdminClient,
  { importId, gradeId, draft }: SyncInput,
): Promise<{ skillIds: string[]; warnings: ParsedWarning[] }> {
  if (draft.bnccSkills.length === 0) return { skillIds: [], warnings: [] };

  const warnings: ParsedWarning[] = [];
  const codes = draft.bnccSkills.map((skill) => skill.code);
  const [existingResult, stagesResult, areasResult, componentsResult] = await Promise.all([
    admin
      .from("bncc_skills")
      .select("id, code, description, verification_status")
      .in("code", codes)
      .returns<ExistingSkill[]>(),
    admin.from("bncc_stages").select("id, name"),
    admin.from("bncc_knowledge_areas").select("id, name, stage_id"),
    admin.from("bncc_components").select("id, name, knowledge_area_id"),
  ]);

  if (existingResult.error) {
    return {
      skillIds: [],
      warnings: [{ severity: "error", field: "bncc", message: "Não foi possível consultar o catálogo BNCC." }],
    };
  }

  const existingByCode = new Map((existingResult.data ?? []).map((skill) => [skill.code.toUpperCase(), skill]));
  const skillIds: string[] = [];
  const snapshots: {
    import_id: string;
    bncc_skill_id: string | null;
    code: string;
    imported_description: string | null;
    catalog_description: string | null;
    resolution: SnapshotResolution;
  }[] = [];

  for (const imported of draft.bnccSkills) {
    const existing = existingByCode.get(imported.code);
    if (existing) {
      skillIds.push(existing.id);
      const hasConflict = Boolean(
        imported.description && normalize(imported.description) !== normalize(existing.description),
      );
      snapshots.push({
        import_id: importId,
        bncc_skill_id: existing.id,
        code: imported.code,
        imported_description: imported.description,
        catalog_description: existing.description,
        resolution: hasConflict ? "conflict" : "matched",
      });
      if (hasConflict) {
        warnings.push({
          severity: "warning",
          field: "bncc",
          message: `O texto de ${imported.code} no Word difere do catálogo. O cadastro existente foi mantido para revisão.`,
        });
      }
      continue;
    }

    if (!imported.description) {
      snapshots.push({
        import_id: importId,
        bncc_skill_id: null,
        code: imported.code,
        imported_description: null,
        catalog_description: null,
        resolution: "missing_description",
      });
      warnings.push({
        severity: "error",
        field: "bncc",
        message: `${imported.code} foi encontrado sem descrição no Word e não foi cadastrado automaticamente.`,
      });
      continue;
    }

    const target = getBnccTaxonomyTarget(imported.code);
    if (!target) {
      snapshots.push({
        import_id: importId,
        bncc_skill_id: null,
        code: imported.code,
        imported_description: imported.description,
        catalog_description: null,
        resolution: "unmapped",
      });
      warnings.push({
        severity: "error",
        field: "bncc",
        message: `${imported.code} tem um formato ainda não mapeado e precisa de revisão manual.`,
      });
      continue;
    }

    const stage = (stagesResult.data ?? []).find((row) => normalize(row.name) === normalize(target.stageName));
    const area = (areasResult.data ?? []).find(
      (row) => row.stage_id === stage?.id && normalize(row.name) === normalize(target.areaName),
    );
    const component = (componentsResult.data ?? []).find(
      (row) => row.knowledge_area_id === area?.id && normalize(row.name) === normalize(target.componentName),
    );

    if (!component) {
      snapshots.push({
        import_id: importId,
        bncc_skill_id: null,
        code: imported.code,
        imported_description: imported.description,
        catalog_description: null,
        resolution: "unmapped",
      });
      warnings.push({
        severity: "error",
        field: "bncc",
        message: `A estrutura curricular de ${imported.code} não está disponível. Aplique a atualização do catálogo BNCC.`,
      });
      continue;
    }

    const { data: created, error: createError } = await admin
      .from("bncc_skills")
      .insert({
        code: imported.code,
        description: imported.description,
        thematic_unit: draft.curriculumUnitName.value,
        knowledge_object: draft.knowledgeObjects.length > 0 ? draft.knowledgeObjects.join("; ") : null,
        component_id: component.id,
        grade_id: gradeId,
        status: "inactive",
        source_type: "word_import",
        source_import_id: importId,
        verification_status: "pending",
      })
      .select("id")
      .single();

    if (createError?.code === "23505") {
      // Dois uploads simultâneos podem encontrar o mesmo código novo. Nesse
      // caso, reutiliza a linha criada pelo primeiro sem duplicar o catálogo.
      const { data: concurrent } = await admin
        .from("bncc_skills")
        .select("id")
        .eq("code", imported.code)
        .maybeSingle();
      if (concurrent) skillIds.push(concurrent.id);
      if (concurrent) {
        snapshots.push({
          import_id: importId,
          bncc_skill_id: concurrent.id,
          code: imported.code,
          imported_description: imported.description,
          catalog_description: imported.description,
          resolution: "matched",
        });
      }
      continue;
    }

    if (createError || !created) {
      warnings.push({
        severity: "error",
        field: "bncc",
        message: `Não foi possível cadastrar automaticamente ${imported.code}.`,
      });
      continue;
    }

    skillIds.push(created.id);
    snapshots.push({
      import_id: importId,
      bncc_skill_id: created.id,
      code: imported.code,
      imported_description: imported.description,
      catalog_description: imported.description,
      resolution: "new",
    });
    warnings.push({
      severity: "warning",
      field: "bncc",
      message: `${imported.code} foi adicionada ao catálogo a partir deste Word. Ela será ativada quando a importação for aprovada.`,
    });
  }

  if (snapshots.length > 0) {
    const { error: snapshotError } = await admin.from("question_import_bncc_snapshots").insert(snapshots);
    if (snapshotError) {
      warnings.push({
        severity: "warning",
        field: "bncc",
        message: "As habilidades foram vinculadas, mas a comparação BNCC não pôde ser registrada.",
      });
    }
  }

  return { skillIds: [...new Set(skillIds)], warnings };
}
