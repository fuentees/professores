import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha | Portal do Professor",
};

export default function RedefinirSenhaPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground">Defina sua nova senha de acesso.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
