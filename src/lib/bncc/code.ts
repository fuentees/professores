export type BnccTaxonomyTarget = {
  stageName: string;
  areaName: string;
  componentName: string;
};

const FUNDAMENTAL_COMPONENTS: Record<string, Omit<BnccTaxonomyTarget, "stageName">> = {
  LP: { areaName: "Linguagens", componentName: "Língua Portuguesa" },
  AR: { areaName: "Linguagens", componentName: "Arte" },
  EF: { areaName: "Linguagens", componentName: "Educação Física" },
  LI: { areaName: "Linguagens", componentName: "Língua Inglesa" },
  MA: { areaName: "Matemática", componentName: "Matemática" },
  CI: { areaName: "Ciências da Natureza", componentName: "Ciências" },
  GE: { areaName: "Ciências Humanas", componentName: "Geografia" },
  HI: { areaName: "Ciências Humanas", componentName: "História" },
  ER: { areaName: "Ensino Religioso", componentName: "Ensino Religioso" },
};

const CHILDHOOD_FIELDS: Record<string, string> = {
  EO: "O eu, o outro e o nós",
  CG: "Corpo, gestos e movimentos",
  TS: "Traços, sons, cores e formas",
  EF: "Escuta, fala, pensamento e imaginação",
  ET: "Espaços, tempos, quantidades, relações e transformações",
};

const HIGH_SCHOOL_COMPONENTS: Record<string, Omit<BnccTaxonomyTarget, "stageName">> = {
  LP: { areaName: "Linguagens e suas Tecnologias", componentName: "Língua Portuguesa" },
  LGG: { areaName: "Linguagens e suas Tecnologias", componentName: "Linguagens e suas Tecnologias" },
  MAT: { areaName: "Matemática e suas Tecnologias", componentName: "Matemática" },
  CNT: { areaName: "Ciências da Natureza e suas Tecnologias", componentName: "Ciências da Natureza" },
  CHS: {
    areaName: "Ciências Humanas e Sociais Aplicadas",
    componentName: "Ciências Humanas e Sociais Aplicadas",
  },
};

/** Traduz somente formatos oficiais conhecidos; código desconhecido nunca é adivinhado. */
export function getBnccTaxonomyTarget(code: string): BnccTaxonomyTarget | null {
  const normalized = code.trim().toUpperCase();

  const fundamental = normalized.match(/^EF\d{2}([A-Z]{2})\d{2}$/);
  if (fundamental) {
    const target = FUNDAMENTAL_COMPONENTS[fundamental[1]];
    return target ? { stageName: "Ensino Fundamental", ...target } : null;
  }

  const childhood = normalized.match(/^EI\d{2}([A-Z]{2})\d{2}$/);
  if (childhood) {
    const componentName = CHILDHOOD_FIELDS[childhood[1]];
    return componentName
      ? { stageName: "Educação Infantil", areaName: "Campos de experiências", componentName }
      : null;
  }

  const highSchool = normalized.match(/^EM\d{2}([A-Z]{2,3})\d{2,3}$/);
  if (highSchool) {
    const target = HIGH_SCHOOL_COMPONENTS[highSchool[1]];
    return target ? { stageName: "Ensino Médio", ...target } : null;
  }

  return null;
}
