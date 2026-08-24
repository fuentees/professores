import { getSiteSettings } from "@/actions/owner/settings";
import { SiteSettingsForm } from "@/components/owner/site-settings-form";
import { PageHeader } from "@/components/common/page-header";

export default async function DonoConfiguracoesPage() {
  const settings = await getSiteSettings();

  if (!settings) {
    return <p className="text-muted-foreground">Não foi possível carregar as configurações.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Ajustes gerais que afetam o site público." />

      <SiteSettingsForm settings={settings} />
    </div>
  );
}
