/**
 * Rótulos em português para os enums do banco, compartilhados entre
 * formulários de admin e o gerador de provas. Existem porque o Select do
 * Base UI só resolve automaticamente o texto exibido se receber uma prop
 * `items`, que este projeto não usa — sem um mapa explícito, o
 * `<SelectValue>` mostra o valor bruto do enum (ex: "easy") em vez do
 * rótulo (ex: "Fácil") depois que o usuário seleciona uma opção.
 */

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

export const CONTENT_ACCESS_TYPE_LABELS: Record<string, string> = {
  public: "Público",
  free_signup: "Gratuito com cadastro",
  teacher_only: "Exclusivo para professores",
  subscriber_only: "Exclusivo para assinantes",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
};

export const ACTIVE_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export const BILLING_PERIOD_LABELS: Record<string, string> = {
  free: "Gratuito",
  monthly: "Mensal",
  yearly: "Anual",
};

export const LEARNING_ACTIVITY_TYPE_LABELS: Record<string, string> = {
  quiz: "Quiz",
  true_false: "Verdadeiro ou falso",
  matching: "Associação",
  memory: "Jogo da memória",
  fill_blank: "Completar lacunas",
  ordering: "Ordenação",
  flashcards: "Flashcards",
  simulation: "Simulação",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  expired: "Expirada",
  canceled: "Cancelada",
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  open_response: "Resposta aberta",
  multiple_choice: "Múltipla escolha",
  essay: "Resposta aberta",
  discursive: "Resposta aberta",
  true_false: "Verdadeiro ou falso",
  matching: "Associação",
  fill_blank: "Completar lacunas",
  ordering: "Ordenação",
  argumentative: "Argumentativa",
  image_based: "Baseada em imagem",
  mixed: "Mista",
};

export const BLOOM_TAXONOMY_LABELS: Record<string, string> = {
  lembrar: "Lembrar",
  entender: "Entender",
  aplicar: "Aplicar",
  analisar: "Analisar",
  avaliar: "Avaliar",
  criar: "Criar",
};

export const RUBRIC_LEVEL_LABELS: Record<string, string> = {
  full: "Pleno domínio",
  partial: "Domínio parcial",
  none: "Incorreta",
};

export const QUESTION_IMPORT_STATUS_LABELS: Record<string, string> = {
  uploaded: "Enviado",
  processing: "Processando",
  needs_review: "Revisar",
  approved: "Aprovado",
  failed: "Erro",
  rejected: "Rejeitado",
};
