export type FieldConfidence = "high" | "medium" | "low";

export type ExtractedField<T> = {
  value: T | null;
  confidence: FieldConfidence;
  raw?: string;
};

export type DocumentBlockSection = "base_text" | "statement" | "correction" | "other";
export type DocumentBlockType = "heading" | "paragraph" | "image" | "table" | "list_item";

export type ParsedDocumentBlock = {
  section: DocumentBlockSection;
  blockType: DocumentBlockType;
  content: { text: string } | { relId: string } | { rows: string[][] };
  orderIndex: number;
};

export type ParsedImageRef = {
  relId: string;
};

export type ParsedItem = {
  label: string;
  prompt: string;
};

export type ParsedAnswer = {
  itemLabel: string | null;
  expectedAnswer: string;
  correctionGuidance: string | null;
};

export type ParsedRubricRow = {
  itemLabel: string | null;
  level: "full" | "partial" | "none";
  points: number | null;
  criteria: string;
};

export type ParsedWarning = {
  severity: "warning" | "error";
  field: string | null;
  message: string;
};

export type ParsedQuestionDraft = {
  code: ExtractedField<string>;
  subjectName: ExtractedField<string>;
  gradeName: ExtractedField<string>;
  curriculumUnitName: ExtractedField<string>;
  academicPeriodRaw: ExtractedField<string>;
  bookName: ExtractedField<string>;
  bookUnit: ExtractedField<string>;
  knowledgeObjects: string[];
  bnccCodes: string[];
  difficultyRaw: ExtractedField<"easy" | "medium" | "hard">;
  pedagogicalNote: ExtractedField<string>;
  bloomPrimaryRaw: ExtractedField<string>;
  bloomJustification: ExtractedField<string>;
  statementCandidates: string[];
  /** Enunciado sem os itens A/B/C embutidos (ver extractItems) — é o que vai pra `questions.statement`; `items` cobre a parte itemizada. */
  leadingText: string;
  items: ParsedItem[];
  answers: ParsedAnswer[];
  rubrics: ParsedRubricRow[];
  correctionProse: string | null;
  blocks: ParsedDocumentBlock[];
  images: ParsedImageRef[];
  warnings: ParsedWarning[];
};
