import { BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import type { ExamQuestion, GeneratedExamDetail } from "@/actions/exam-generator";

const DIFFICULTY_LABELS: Record<ExamQuestion["difficulty"], string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

type PrintSettings = { schoolLogoUrl: string | null; schoolPhone: string | null };

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Linhas pontilhadas pro aluno escrever — mesma ideia das AnswerLines da impressão em HTML. */
function answerLineParagraphs(count: number): Paragraph[] {
  return Array.from(
    { length: count },
    () =>
      new Paragraph({
        spacing: { before: 240, after: 240 },
        border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: "999999" } },
        children: [new TextRun({ text: " " })],
      }),
  );
}

/** Um bloco de enunciado pode ter "\n\n" entre parágrafos (ver walk-body.ts) — um Paragraph por bloco. */
function textBlockParagraphs(text: string, firstRunPrefix?: TextRun): Paragraph[] {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const runs: TextRun[] = [];
    if (i === 0 && firstRunPrefix) runs.push(firstRunPrefix);
    runs.push(new TextRun({ text: block.trim() }));
    return new Paragraph({ spacing: { before: i === 0 ? 0 : 120, after: 80 }, children: runs });
  });
}

function questionParagraphs(question: ExamQuestion, index: number): Paragraph[] {
  const paragraphs: Paragraph[] = [
    ...textBlockParagraphs(question.statement, new TextRun({ text: `${index + 1}. `, bold: true })),
  ];

  for (const part of question.parts) {
    paragraphs.push(
      new Paragraph({
        indent: { left: 240 },
        spacing: { before: 120, after: 60 },
        children: [new TextRun({ text: `${part.label}) `, bold: true }), new TextRun({ text: part.prompt })],
      }),
    );
    if (question.questionType !== "multiple_choice") paragraphs.push(...answerLineParagraphs(3));
  }

  if (question.questionType === "multiple_choice") {
    for (const alt of question.alternatives) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 240 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "(   ) " }),
            new TextRun({ text: `${alt.label}) `, bold: true }),
            new TextRun({ text: alt.body }),
          ],
        }),
      );
    }
  } else if (question.parts.length === 0) {
    paragraphs.push(...answerLineParagraphs(6));
  }

  return paragraphs;
}

/**
 * Gera o mesmo documento da folha de impressão (cabeçalho, questões,
 * gabarito) como um arquivo .docx de verdade, editável no Word — pro
 * professor que prefere ajustar antes de imprimir em vez de usar
 * "imprimir → salvar como PDF" do navegador.
 */
export async function generateExamDocx(
  exam: GeneratedExamDetail,
  questions: ExamQuestion[],
  printSettings?: PrintSettings,
): Promise<Blob> {
  const children: Paragraph[] = [];

  if (printSettings?.schoolLogoUrl) {
    const bytes = await fetchImageBytes(printSettings.schoolLogoUrl);
    if (bytes) {
      children.push(
        new Paragraph({
          children: [new ImageRun({ data: bytes, transformation: { width: 56, height: 56 }, type: "png" })],
        }),
      );
    }
  }

  if (exam.schoolName) {
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: exam.schoolName.toUpperCase(), bold: true, size: 20 })],
      }),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 80 },
      children: [new TextRun({ text: exam.title, bold: true, size: 28 })],
    }),
  );

  if (printSettings?.schoolPhone) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: `Tel: ${printSettings.schoolPhone}`, size: 18, color: "666666" })],
      }),
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [new TextRun({ text: "Nome: _______________________________________          Data: ____/____/______" })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: "Turma: ___________          Nota: ___________" })],
    }),
  );

  if (exam.instructions) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: exam.instructions, italics: true })],
      }),
    );
  }

  questions.forEach((question, index) => {
    children.push(...questionParagraphs(question, index));
  });

  if (exam.showAnswerKey) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { after: 160 },
        children: [new TextRun({ text: "GABARITO", bold: true, size: 24 })],
      }),
    );
    questions.forEach((question, index) => {
      const answer =
        question.questionType === "multiple_choice"
          ? (question.alternatives.find((a) => a.isCorrect)?.label ?? "—")
          : question.answerKey || "Sem resposta esperada cadastrada.";
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: `[${DIFFICULTY_LABELS[question.difficulty]}] `, color: "666666" }),
            new TextRun({ text: String(answer) }),
          ],
        }),
      );
    });
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
