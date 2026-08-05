"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validations/auth";

export type AuthFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
} | undefined;

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { fullName, email, password } = validated.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/confirm?next=/painel`,
    },
  });

  if (error) {
    return { message: traduzErroAuth(error.message) };
  }

  return {
    success: true,
    message: "Cadastro realizado. Verifique seu e-mail para confirmar a conta.",
  };
}

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { email, password } = validated.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: traduzErroAuth(error.message) };
  }

  const redirectTo = formData.get("redirect");
  const destino =
    typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/painel";

  redirect(destino);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();

  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/redefinir-senha`,
  });

  // Sempre retorna sucesso, mesmo que o e-mail não exista, para não vazar
  // quais e-mails estão cadastrados no portal.
  return {
    success: true,
    message: "Se o e-mail estiver cadastrado, você receberá um link de recuperação.",
  };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  });

  if (error) {
    return { message: traduzErroAuth(error.message) };
  }

  redirect("/painel");
}

function traduzErroAuth(message: string): string {
  const conhecidos: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha inválidos.",
    "User already registered": "Já existe uma conta com este e-mail.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "email rate limit exceeded":
      "Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.",
    "For security purposes, you can only request this after":
      "Aguarde um pouco antes de tentar novamente (limite de envio de e-mails).",
  };

  const match = Object.keys(conhecidos).find((key) => message.includes(key));
  return match ? conhecidos[match] : `Ocorreu um erro: ${message}`;
}
