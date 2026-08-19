"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCoverImage } from "@/lib/storage/file-validation";
import { schoolLogoStoragePath, extractStoragePathFromPublicUrl } from "@/lib/storage/paths";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo."),
  phone: z.string().trim().optional(),
});

export type ProfileFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | undefined;

export async function updateProfile(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const validated = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: validated.data.fullName,
      phone: validated.data.phone || null,
    })
    .eq("auth_user_id", user.id);

  if (error) {
    return { message: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/painel/perfil");
  return { success: true, message: "Perfil atualizado com sucesso." };
}

const printSettingsSchema = z.object({
  schoolName: z.string().trim().max(200).optional(),
  schoolPhone: z.string().trim().max(30).optional(),
});

export async function updatePrintSettings(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const validated = printSettingsSchema.safeParse({
    schoolName: formData.get("schoolName"),
    schoolPhone: formData.get("schoolPhone"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      school_name: validated.data.schoolName || null,
      school_phone: validated.data.schoolPhone || null,
    })
    .eq("auth_user_id", user.id);

  if (error) {
    return { message: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/painel/perfil");
  return { success: true, message: "Dados de impressão atualizados com sucesso." };
}

export type UploadResult = { error: string | null; url?: string | null };

export async function uploadSchoolLogo(file: File): Promise<UploadResult> {
  const validationError = validateCoverImage(file);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: current } = await supabase
    .from("profiles")
    .select("id, school_logo_url")
    .eq("auth_user_id", user.id)
    .single();
  if (!current) return { error: "Perfil não encontrado." };

  // O bucket "public" só aceita escrita do admin via RLS (política
  // public_bucket_admin_write) — o professor faz upload da própria logo
  // através do admin client, escopado ao próprio profile já validado acima.
  const admin = createAdminClient();
  const path = schoolLogoStoragePath(current.id, file.name);
  const { error: uploadError } = await admin.storage.from("public").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = admin.storage.from("public").getPublicUrl(path);

  const { error } = await supabase.from("profiles").update({ school_logo_url: publicUrl }).eq("id", current.id);
  if (error) return { error: error.message };

  if (current.school_logo_url) {
    const oldPath = extractStoragePathFromPublicUrl(current.school_logo_url, "public");
    if (oldPath) await admin.storage.from("public").remove([oldPath]);
  }

  revalidatePath("/painel/perfil");
  return { error: null, url: publicUrl };
}

export async function removeSchoolLogo(): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: current } = await supabase
    .from("profiles")
    .select("id, school_logo_url")
    .eq("auth_user_id", user.id)
    .single();
  if (!current?.school_logo_url) return { error: null };

  const { error } = await supabase.from("profiles").update({ school_logo_url: null }).eq("id", current.id);
  if (error) return { error: error.message };

  const oldPath = extractStoragePathFromPublicUrl(current.school_logo_url, "public");
  if (oldPath) await createAdminClient().storage.from("public").remove([oldPath]);

  revalidatePath("/painel/perfil");
  return { error: null };
}
