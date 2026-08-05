"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/slug";
import type { Database } from "@/types/supabase";
import {
  contentTypeSchema,
  curriculumUnitSchema,
  educationLevelSchema,
  gradeSchema,
  gradeSubjectSchema,
  subjectSchema,
  subthemeSchema,
  themeSchema,
} from "@/lib/validations/pedagogical";

export type ActionResult = { error: string | null };

type Tables = Database["public"]["Tables"];
type CatalogTable = keyof Tables;

function friendlyError(error: { message: string; code?: string }): string {
  if (error.code === "23505") return "Já existe um registro com este nome/slug.";
  return error.message;
}

async function insertCatalogRow(
  table: CatalogTable,
  values: Record<string, unknown>,
  path: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert(values as never);

  if (error) return { error: friendlyError(error) };
  revalidatePath(path);
  return { error: null };
}

async function updateCatalogRow(
  table: CatalogTable,
  id: string,
  values: Record<string, unknown>,
  path: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from(table).update(values as never).eq("id", id);

  if (error) return { error: friendlyError(error) };
  revalidatePath(path);
  return { error: null };
}

async function deleteCatalogRow(
  table: CatalogTable,
  id: string,
  path: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "Não é possível excluir: existem registros vinculados a este item.",
      };
    }
    return { error: friendlyError(error) };
  }
  revalidatePath(path);
  return { error: null };
}

async function setCatalogStatus(
  table: CatalogTable,
  id: string,
  status: "active" | "inactive",
  path: string,
): Promise<ActionResult> {
  return updateCatalogRow(table, id, { status }, path);
}

// ---------- Níveis de ensino ----------

const NIVEIS_PATH = "/admin/niveis-series";

export async function createEducationLevel(input: unknown): Promise<ActionResult> {
  const parsed = educationLevelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status } = parsed.data;
  return insertCatalogRow(
    "education_levels",
    { name, slug: slugify(name), description: description || null, order_index: orderIndex, status },
    NIVEIS_PATH,
  );
}

export async function updateEducationLevel(id: string, input: unknown): Promise<ActionResult> {
  const parsed = educationLevelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status } = parsed.data;
  return updateCatalogRow(
    "education_levels",
    id,
    { name, slug: slugify(name), description: description || null, order_index: orderIndex, status },
    NIVEIS_PATH,
  );
}

export async function deleteEducationLevel(id: string): Promise<ActionResult> {
  return deleteCatalogRow("education_levels", id, NIVEIS_PATH);
}

export async function setEducationLevelStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("education_levels", id, status, NIVEIS_PATH);
}

// ---------- Séries / anos ----------

export async function createGrade(input: unknown): Promise<ActionResult> {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, educationLevelId } = parsed.data;
  return insertCatalogRow(
    "grades",
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      education_level_id: educationLevelId,
    },
    NIVEIS_PATH,
  );
}

export async function updateGrade(id: string, input: unknown): Promise<ActionResult> {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, educationLevelId } = parsed.data;
  return updateCatalogRow(
    "grades",
    id,
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      education_level_id: educationLevelId,
    },
    NIVEIS_PATH,
  );
}

export async function deleteGrade(id: string): Promise<ActionResult> {
  return deleteCatalogRow("grades", id, NIVEIS_PATH);
}

export async function setGradeStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("grades", id, status, NIVEIS_PATH);
}

// ---------- Disciplinas ----------

const DISCIPLINAS_PATH = "/admin/disciplinas";

export async function createSubject(input: unknown): Promise<ActionResult> {
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, shortName, icon, color } = parsed.data;
  return insertCatalogRow(
    "subjects",
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      short_name: shortName || null,
      icon: icon || null,
      color: color || null,
    },
    DISCIPLINAS_PATH,
  );
}

export async function updateSubject(id: string, input: unknown): Promise<ActionResult> {
  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, shortName, icon, color } = parsed.data;
  return updateCatalogRow(
    "subjects",
    id,
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      short_name: shortName || null,
      icon: icon || null,
      color: color || null,
    },
    DISCIPLINAS_PATH,
  );
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  return deleteCatalogRow("subjects", id, DISCIPLINAS_PATH);
}

export async function setSubjectStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("subjects", id, status, DISCIPLINAS_PATH);
}

export async function linkGradeSubject(input: unknown): Promise<ActionResult> {
  const parsed = gradeSubjectSchema.safeParse(input);
  if (!parsed.success) return { error: "Selecione a série e a disciplina." };

  return insertCatalogRow(
    "grade_subjects",
    { grade_id: parsed.data.gradeId, subject_id: parsed.data.subjectId },
    DISCIPLINAS_PATH,
  );
}

export async function unlinkGradeSubject(id: string): Promise<ActionResult> {
  return deleteCatalogRow("grade_subjects", id, DISCIPLINAS_PATH);
}

// ---------- Unidades, temas e subtemas ----------

const UNIDADES_PATH = "/admin/unidades-temas";

export async function createCurriculumUnit(input: unknown): Promise<ActionResult> {
  const parsed = curriculumUnitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, gradeId, subjectId } = parsed.data;
  return insertCatalogRow(
    "curriculum_units",
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      grade_id: gradeId,
      subject_id: subjectId,
    },
    UNIDADES_PATH,
  );
}

export async function updateCurriculumUnit(id: string, input: unknown): Promise<ActionResult> {
  const parsed = curriculumUnitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, gradeId, subjectId } = parsed.data;
  return updateCatalogRow(
    "curriculum_units",
    id,
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      grade_id: gradeId,
      subject_id: subjectId,
    },
    UNIDADES_PATH,
  );
}

export async function deleteCurriculumUnit(id: string): Promise<ActionResult> {
  return deleteCatalogRow("curriculum_units", id, UNIDADES_PATH);
}

export async function setCurriculumUnitStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("curriculum_units", id, status, UNIDADES_PATH);
}

export async function createTheme(input: unknown): Promise<ActionResult> {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, curriculumUnitId } = parsed.data;
  return insertCatalogRow(
    "themes",
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      curriculum_unit_id: curriculumUnitId,
    },
    UNIDADES_PATH,
  );
}

export async function updateTheme(id: string, input: unknown): Promise<ActionResult> {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, curriculumUnitId } = parsed.data;
  return updateCatalogRow(
    "themes",
    id,
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      curriculum_unit_id: curriculumUnitId,
    },
    UNIDADES_PATH,
  );
}

export async function deleteTheme(id: string): Promise<ActionResult> {
  return deleteCatalogRow("themes", id, UNIDADES_PATH);
}

export async function setThemeStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("themes", id, status, UNIDADES_PATH);
}

export async function createSubtheme(input: unknown): Promise<ActionResult> {
  const parsed = subthemeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, themeId } = parsed.data;
  return insertCatalogRow(
    "subthemes",
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      theme_id: themeId,
    },
    UNIDADES_PATH,
  );
}

export async function updateSubtheme(id: string, input: unknown): Promise<ActionResult> {
  const parsed = subthemeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, themeId } = parsed.data;
  return updateCatalogRow(
    "subthemes",
    id,
    {
      name,
      slug: slugify(name),
      description: description || null,
      order_index: orderIndex,
      status,
      theme_id: themeId,
    },
    UNIDADES_PATH,
  );
}

export async function deleteSubtheme(id: string): Promise<ActionResult> {
  return deleteCatalogRow("subthemes", id, UNIDADES_PATH);
}

export async function setSubthemeStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("subthemes", id, status, UNIDADES_PATH);
}

// ---------- Tipos de material ----------

const TIPOS_PATH = "/admin/tipos-materiais";

export async function createContentType(input: unknown): Promise<ActionResult> {
  const parsed = contentTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, icon } = parsed.data;
  return insertCatalogRow(
    "content_types",
    { name, slug: slugify(name), description: description || null, order_index: orderIndex, status, icon: icon || null },
    TIPOS_PATH,
  );
}

export async function updateContentType(id: string, input: unknown): Promise<ActionResult> {
  const parsed = contentTypeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { name, description, orderIndex, status, icon } = parsed.data;
  return updateCatalogRow(
    "content_types",
    id,
    { name, slug: slugify(name), description: description || null, order_index: orderIndex, status, icon: icon || null },
    TIPOS_PATH,
  );
}

export async function deleteContentType(id: string): Promise<ActionResult> {
  return deleteCatalogRow("content_types", id, TIPOS_PATH);
}

export async function setContentTypeStatus(
  id: string,
  status: "active" | "inactive",
): Promise<ActionResult> {
  return setCatalogStatus("content_types", id, status, TIPOS_PATH);
}
