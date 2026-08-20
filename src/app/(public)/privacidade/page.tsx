import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { getSiteSettings } from "@/actions/owner/settings";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Portal do Professor coleta, usa e protege seus dados.",
};

const LAST_UPDATED = "19 de agosto de 2026";

export default async function PrivacidadePage() {
  const settings = await getSiteSettings();
  const supportEmail = settings?.support_email || "[e-mail de contato a definir]";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
      <PageHeader title="Política de Privacidade" description={`Última atualização: ${LAST_UPDATED}`} />

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p className="text-foreground">
          Esta política explica como o Portal do Professor (“nós”) coleta,
          usa, armazena e protege dados pessoais de professores que usam a
          Plataforma, em conformidade com a Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018 — LGPD).
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. Quais dados coletamos</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Dados de cadastro: nome completo, e-mail, telefone (opcional), nome e telefone da escola.</li>
            <li>Dados de uso: materiais visualizados/baixados, provas geradas, favoritos, participação no fórum.</li>
            <li>Dados de pagamento: processados pelo provedor de pagamento — não armazenamos número de cartão nos nossos servidores.</li>
            <li>Dados técnicos: endereço IP, tipo de navegador e cookies de sessão, usados apenas para manter você autenticado e para segurança.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. Para que usamos seus dados</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Viabilizar login, geração e salvamento de provas, download de materiais e demais funcionalidades da conta.</li>
            <li>Processar assinaturas e cobranças de planos pagos.</li>
            <li>Enviar comunicações operacionais (confirmação de cadastro, recuperação de senha, avisos sobre a assinatura).</li>
            <li>Melhorar a Plataforma a partir de métricas agregadas de uso (nunca vendemos dados pessoais a terceiros).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Com quem compartilhamos</h2>
          <p>
            Compartilhamos dados apenas com prestadores de serviço
            essenciais à operação (hospedagem, banco de dados, processamento
            de pagamento), sob obrigação contratual de confidencialidade, e
            quando exigido por lei ou ordem judicial. Não vendemos nem
            alugamos seus dados pessoais.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. Seus direitos (LGPD)</h2>
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
            <li>Exclusão dos seus dados pessoais, exceto os que precisamos reter por obrigação legal (ex.: registros fiscais de pagamento).</li>
            <li>Portabilidade dos seus dados a outro fornecedor.</li>
            <li>Revogação do consentimento e informação sobre com quem compartilhamos seus dados.</li>
          </ul>
          <p>
            Boa parte disso já pode ser feito diretamente em{" "}
            <a href="/painel/perfil" className="text-primary underline">
              Perfil
            </a>
            . Para o restante, entre em contato pelo canal abaixo.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">5. Retenção e segurança</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa e pelo
            prazo adicional exigido por obrigações legais/fiscais após o
            encerramento. Usamos controles de acesso técnicos (autenticação,
            criptografia em trânsito, permissões por perfil) pra proteger
            seus dados contra acesso não autorizado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">6. Cookies</h2>
          <p>
            Usamos apenas cookies essenciais de sessão/autenticação —
            necessários pra você continuar logado entre páginas. Não usamos
            cookies de rastreamento publicitário de terceiros.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">7. Contato do encarregado (DPO)</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas sobre esta política,
            entre em contato pelo e-mail{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary underline">
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
