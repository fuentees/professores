const COVER_ROOT = "/covers";

function hasAny(slug: string, terms: string[]) {
  return terms.some((term) => slug.includes(term));
}

/** Local editorial covers used only while an entity has no uploaded cover. */
export function contentCover(slug: string): string {
  if (slug.includes("povos-indigenas")) return `${COVER_ROOT}/indigenous-brazil.webp`;
  if (slug.includes("quilombola")) return `${COVER_ROOT}/quilombola-resistance.webp`;
  if (hasAny(slug, ["patrimonio-material", "patrimonio-historico"])) return `${COVER_ROOT}/heritage-city.webp`;
  if (hasAny(slug, ["formacao-da-populacao", "povos-formadores"])) return `${COVER_ROOT}/brazil-people.webp`;
  if (slug.includes("avaliacao")) return `${COVER_ROOT}/assessment-teaching.webp`;
  return `${COVER_ROOT}/historical-research.webp`;
}

export function learningObjectCover(slug: string): string {
  if (hasAny(slug, ["sistema-solar", "planetas"])) return `${COVER_ROOT}/solar-system.webp`;
  if (hasAny(slug, ["fracoes", "multiplicacao", "divisao", "area-perimetro", "probabilidade", "tabuada", "numeros-crescente", "operacoes-resultados"])) return `${COVER_ROOT}/math-fractions.webp`;
  if (hasAny(slug, ["capitais", "regioes-brasil", "relevo-clima"])) return `${COVER_ROOT}/brazil-geography.webp`;
  if (hasAny(slug, ["sinonimos", "ortografia", "redacao", "ingles", "espanhol"])) return `${COVER_ROOT}/language-words.webp`;
  if (slug.includes("corpo-humano")) return `${COVER_ROOT}/human-body.webp`;
  if (hasAny(slug, ["animais", "metamorfose", "borboleta"])) return `${COVER_ROOT}/animals-habitats.webp`;
  if (slug.includes("ciclo-agua")) return `${COVER_ROOT}/water-cycle.webp`;
  if (slug.includes("idade-media")) return `${COVER_ROOT}/medieval-history.webp`;
  if (hasAny(slug, ["brasil-colonia", "independencia-brasil", "personagens-historicos", "datas-historia-brasil"])) return `${COVER_ROOT}/brazil-people.webp`;
  return `${COVER_ROOT}/gamification-classroom.webp`;
}

export function courseCover(slug: string): string {
  return slug.includes("bncc") ? `${COVER_ROOT}/bncc-planning.webp` : `${COVER_ROOT}/assessment-teaching.webp`;
}

export function blogCover(slug: string): string {
  if (slug.includes("gamificacao")) return `${COVER_ROOT}/gamification-classroom.webp`;
  if (slug.includes("banco-de-questoes")) return `${COVER_ROOT}/question-bank.webp`;
  if (slug.includes("bncc")) return `${COVER_ROOT}/bncc-planning.webp`;
  return `${COVER_ROOT}/assessment-teaching.webp`;
}

export function folderCover(slug: string): string {
  if (hasAny(slug, ["historia", "brasil"])) return `${COVER_ROOT}/historical-research.webp`;
  if (hasAny(slug, ["matematica", "fracoes"])) return `${COVER_ROOT}/math-fractions.webp`;
  if (hasAny(slug, ["ciencias", "natureza"])) return `${COVER_ROOT}/animals-habitats.webp`;
  return `${COVER_ROOT}/heritage-city.webp`;
}
