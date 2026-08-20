/**
 * Cor por área do currículo pros badges de disciplina — uso deliberadamente
 * restrito a 5 grupos (as 4 macroáreas oficiais da BNCC + "Diversos" pro
 * resto), não uma cor por disciplina individual: 43 disciplinas cadastradas
 * hoje tornariam uma paleta 1-a-1 inconsistente e difícil de manter. Nomes
 * não reconhecidos (disciplina nova cadastrada depois) caem em "other" —
 * neutro, nunca quebra.
 */
export type SubjectArea = "languages" | "math" | "science" | "humanities" | "other";

const AREA_BY_SUBJECT_NAME: Record<string, SubjectArea> = {
  "Arte": "languages",
  "Artes visuais": "languages",
  "Contação de histórias": "languages",
  "Língua Espanhola": "languages",
  "Língua Inglesa": "languages",
  "Língua Portuguesa": "languages",
  "Linguagem oral": "languages",
  "Literatura": "languages",
  "Musicalização": "languages",
  "Redação": "languages",

  "Estatística": "math",
  "Geometria": "math",
  "Matemática": "math",
  "Matemática Financeira": "math",
  "Noções matemáticas": "math",

  "Biologia": "science",
  "Ciências": "science",
  "Ciências da Natureza": "science",
  "Física": "science",
  "Natureza e sociedade": "science",
  "Química": "science",

  "Atualidades": "humanities",
  "Educação Financeira": "humanities",
  "Educação socioemocional": "humanities",
  "Empreendedorismo": "humanities",
  "Ensino Religioso": "humanities",
  "Filosofia": "humanities",
  "Geografia": "humanities",
  "História": "humanities",
  "Orientação profissional": "humanities",
  "Projeto de Vida": "humanities",
  "Sociologia": "humanities",
};

export function subjectArea(subjectName: string | null | undefined): SubjectArea {
  if (!subjectName) return "other";
  return AREA_BY_SUBJECT_NAME[subjectName] ?? "other";
}

export const SUBJECT_AREA_BADGE_CLASSNAMES: Record<SubjectArea, string> = {
  languages: "border-transparent bg-area-languages-soft text-area-languages",
  math: "border-transparent bg-area-math-soft text-area-math",
  science: "border-transparent bg-area-science-soft text-area-science",
  humanities: "border-transparent bg-area-humanities-soft text-area-humanities",
  other: "border-transparent bg-muted text-muted-foreground",
};

/** Classe de badge pronta a partir do nome da disciplina — o caso comum nos cards. */
export function subjectBadgeClassName(subjectName: string | null | undefined): string {
  return SUBJECT_AREA_BADGE_CLASSNAMES[subjectArea(subjectName)];
}
