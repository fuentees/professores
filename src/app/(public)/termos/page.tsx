import type { Metadata } from "next";
import { PageHeader } from "@/components/common/page-header";
import { getSiteSettings } from "@/actions/owner/settings";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do Portal do Professor.",
};

const LAST_UPDATED = "19 de agosto de 2026";

export default async function TermosPage() {
  const settings = await getSiteSettings();
  const supportEmail = settings?.support_email || "[e-mail de contato a definir]";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
      <PageHeader title="Termos de Uso" description={`Última atualização: ${LAST_UPDATED}`} />

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p className="text-foreground">
          Estes Termos de Uso regulam o acesso e uso do Portal do Professor
          (“Plataforma”), operado por [razão social a definir], inscrita no
          CNPJ [a definir] (“nós”). Ao criar uma conta ou usar a Plataforma,
          você (“professor” ou “usuário”) concorda com estes termos.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. O que é a Plataforma</h2>
          <p>
            O Portal do Professor é uma biblioteca digital de materiais
            pedagógicos, cursos, recursos interativos, banco de questões e
            gerador de provas voltada a professores da educação básica.
            Parte do conteúdo é gratuito e parte exige assinatura de um
            plano pago, conforme descrito na página{" "}
            <a href="/planos" className="text-primary underline">
              Planos
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. Cadastro e conta</h2>
          <p>
            Você é responsável por manter a confidencialidade do acesso à
            sua conta (login por link mágico enviado ao seu e-mail) e por
            todas as atividades realizadas nela. Informe dados verdadeiros
            no cadastro. Podemos suspender ou encerrar contas que violem
            estes termos, usem a Plataforma de forma fraudulenta, ou
            compartilhem acesso pago com terceiros não autorizados.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Assinaturas e pagamento</h2>
          <p>
            Planos pagos são cobrados de forma recorrente (mensal ou anual,
            conforme o plano escolhido) até o cancelamento. Você pode
            cancelar a qualquer momento pelo painel — o acesso ao conteúdo
            pago permanece até o fim do período já pago, sem reembolso
            proporcional, salvo quando exigido por lei.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. Uso do conteúdo</h2>
          <p>
            Materiais, questões, provas geradas e demais conteúdos
            disponibilizados são para uso pedagógico do professor
            assinante/cadastrado — em sala de aula, com seus alunos, ou em
            atividades escolares. É vedada a redistribuição comercial,
            revenda ou republicação pública do conteúdo original (arquivos
            baixados, provas geradas, questões do banco) fora desse
            contexto de uso educacional, mesmo em contas gratuitas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">5. Conteúdo gerado por usuários</h2>
          <p>
            Ao publicar no Fórum ou em qualquer área colaborativa da
            Plataforma, você é responsável pelo conteúdo publicado e
            garante ter o direito de compartilhá-lo. Nos reservamos o
            direito de remover publicações que violem a lei, direitos de
            terceiros, ou as diretrizes de convivência da comunidade.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">6. Disponibilidade e alterações</h2>
          <p>
            Nos esforçamos para manter a Plataforma disponível, mas não
            garantimos operação ininterrupta — manutenções programadas ou
            emergenciais podem causar indisponibilidade temporária.
            Podemos alterar, adicionar ou remover funcionalidades a
            qualquer momento, e atualizar estes termos, comunicando
            mudanças relevantes pelos canais habituais (e-mail cadastrado
            ou aviso na Plataforma).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">7. Limitação de responsabilidade</h2>
          <p>
            A Plataforma é fornecida “como está”. Não nos responsabilizamos
            por decisões pedagógicas tomadas com base no conteúdo
            disponibilizado — a revisão e adequação do material à sua turma
            é sempre responsabilidade do professor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">8. Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{" "}
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
