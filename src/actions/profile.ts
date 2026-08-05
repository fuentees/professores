"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
