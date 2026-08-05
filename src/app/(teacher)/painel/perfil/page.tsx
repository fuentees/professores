import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function PerfilPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/entrar?redirect=/painel/perfil");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meu perfil</h1>
        <p className="text-muted-foreground">Atualize suas informações pessoais.</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
