"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, NotAdminError } from "@/lib/auth/require-admin";
import {
  bnccComponentSchema,
  bnccKnowledgeAreaSchema,
  bnccSkillSchema,
  bnccStageSchema,
} from "@/lib/validations/bncc";

export type ActionResult = { error: string | null };

const BNCC_PATH = "/admin/bncc";

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof NotAdminError) return { error: e.message };
    throw e;
  }
}

// ---------- Etapas ----------

export async function createBnccStage(input: unknown): Promise<ActionResult> {
  const parsed = bnccStageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("bncc_stages")
    .insert({ name: parsed.data.name, order_index: parsed.data.orderIndex });
  if (error) return { error: error.message };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

export async function deleteBnccStage(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("bncc_stages").delete().eq("id", id);
  if (error) return { error: "Não é possível excluir: existem áreas vinculadas a esta etapa." };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

// ---------- Áreas do conhecimento ----------

export async function createBnccKnowledgeArea(input: unknown): Promise<ActionResult> {
  const parsed = bnccKnowledgeAreaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("bncc_knowledge_areas").insert({
    name: parsed.data.name,
    order_index: parsed.data.orderIndex,
    stage_id: parsed.data.stageId,
  });
  if (error) return { error: error.message };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

export async function deleteBnccKnowledgeArea(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("bncc_knowledge_areas").delete().eq("id", id);
  if (error) return { error: "Não é possível excluir: existem componentes vinculados a esta área." };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

// ---------- Componentes curriculares ----------

export async function createBnccComponent(input: unknown): Promise<ActionResult> {
  const parsed = bnccComponentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("bncc_components").insert({
    name: parsed.data.name,
    order_index: parsed.data.orderIndex,
    knowledge_area_id: parsed.data.knowledgeAreaId,
  });
  if (error) return { error: error.message };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

export async function deleteBnccComponent(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("bncc_components").delete().eq("id", id);
  if (error) return { error: "Não é possível excluir: existem habilidades vinculadas a este componente." };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

// ---------- Habilidades ----------

export async function createBnccSkill(input: unknown): Promise<ActionResult> {
  const parsed = bnccSkillSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;
  const { error } = await supabase.from("bncc_skills").insert({
    code: data.code,
    description: data.description,
    thematic_unit: data.thematicUnit || null,
    knowledge_object: data.knowledgeObject || null,
    component_id: data.componentId,
    grade_id: data.gradeId || null,
    status: data.status,
  });
  if (error) {
    if (error.code === "23505") return { error: "Já existe uma habilidade com este código." };
    return { error: error.message };
  }
  revalidatePath(BNCC_PATH);
  return { error: null };
}

export async function updateBnccSkill(id: string, input: unknown): Promise<ActionResult> {
  const parsed = bnccSkillSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const data = parsed.data;
  const { error } = await supabase
    .from("bncc_skills")
    .update({
      code: data.code,
      description: data.description,
      thematic_unit: data.thematicUnit || null,
      knowledge_object: data.knowledgeObject || null,
      component_id: data.componentId,
      grade_id: data.gradeId || null,
      status: data.status,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

export async function deleteBnccSkill(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("bncc_skills").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(BNCC_PATH);
  return { error: null };
}

// ---------- Vínculo material <-> habilidade ----------

export async function linkContentBnccSkill(contentId: string, skillId: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_bncc_skills")
    .insert({ content_id: contentId, bncc_skill_id: skillId });
  if (error) return { error: error.message };
  revalidatePath("/admin/materiais");
  return { error: null };
}

export async function unlinkContentBnccSkill(id: string): Promise<ActionResult> {
  const guard = await guardAdmin();
  if (guard) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("content_bncc_skills").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/materiais");
  return { error: null };
}
