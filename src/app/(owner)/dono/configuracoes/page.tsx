import { getSiteSettings } from "@/actions/owner/settings";
import { SiteSettingsForm } from "@/components/owner/site-settings-form";

export default async function DonoConfiguracoesPage() {
  const settings = await getSiteSettings();

  if (!settings) {
    return <p className="text-muted-foreground">Não foi possível carregar as configurações.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Ajustes gerais que afetam o site público.</p>
      </div>

      <SiteSettingsForm settings={settings} />
    </div>
  );
}
