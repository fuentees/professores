import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ProfileForm } from "@/components/profile/profile-form";
import { PrintSettingsForm } from "@/components/profile/print-settings-form";

export default async function PerfilPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/entrar?redirect=/painel/perfil");
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="text-muted-foreground">Atualize suas informações pessoais.</p>
        <div className="mt-6">
          <ProfileForm profile={profile} />
        </div>
      </div>

      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold">Dados para impressão</h2>
        <p className="text-muted-foreground">
          Logo, nome e telefone da escola aparecem prontos no cabeçalho quando você imprimir uma avaliação.
        </p>
        <div className="mt-6">
          <PrintSettingsForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
