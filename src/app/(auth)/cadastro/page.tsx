import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Criar conta | Portal do Professor",
};

export default function CadastroPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre-se gratuitamente para acessar os materiais.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
