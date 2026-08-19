"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner, NotOwnerError } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

/** Lido pelo layout público (footer + gate de manutenção) e pela página de configurações do dono. */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", true).single();
  return data;
}

const settingsSchema = z.object({
  supportEmail: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().trim().max(500).optional(),
});

export type SettingsFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | undefined;

export async function updateSiteSettings(_state: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const validated = settingsSchema.safeParse({
    supportEmail: formData.get("supportEmail"),
    maintenanceMode: formData.get("maintenanceMode") === "on",
    maintenanceMessage: formData.get("maintenanceMessage"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await requireOwner();
  } catch (e) {
    if (e instanceof NotOwnerError) return { message: e.message };
    throw e;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      support_email: validated.data.supportEmail || null,
      maintenance_mode: validated.data.maintenanceMode,
      maintenance_message: validated.data.maintenanceMessage || null,
    })
    .eq("id", true);

  if (error) return { message: error.message };

  revalidatePath("/dono/configuracoes");
  revalidatePath("/", "layout");
  return { success: true, message: "Configurações salvas com sucesso." };
}
