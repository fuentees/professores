import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar | Portal do Professor",
};

export default async function EntrarPage({
  searchParams,
}: PageProps<"/entrar">) {
  const { redirect } = await searchParams;
  const redirectTo = typeof redirect === "string" ? redirect : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Acesse sua conta de professor.
        </p>
      </div>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
