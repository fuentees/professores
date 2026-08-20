import { AlignmentType, BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from "docx";
import type { ExamQuestion, GeneratedExamDetail } from "@/actions/exam-generator";

const DIFFICULTY_LABELS: Record<ExamQuestion["difficulty"], string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

type PrintSettings = { schoolLogoUrl: string | null; schoolPhone: string | null };
type DocxImageType = "png" | "jpg" | "gif" | "bmp";

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Magic bytes — o Word aceita png/jpg/gif/bmp como conteúdo real de questão (.emf/.wmf já são filtrados antes de chegar aqui, ver fetchQuestionImages em exam-generator.ts). */
function detectImageType(bytes: Uint8Array): DocxImageType | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "bmp";
  return null;
}

/**
 * Lê largura/altura sem depender de nenhuma lib de imagem (evita puxar um
 * pacote com dependência de "fs" pro bundle do navegador, onde este módulo
 * roda via import dinâmico) — só o necessário pra não distorcer a imagem ao
 * redimensionar pro documento: cabeçalho PNG (IHDR) e marcador SOF do JPEG.
 */
function getImageDimensions(bytes: Uint8Array, type: DocxImageType): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === "png" && bytes.length >= 24) {
    return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
  }
  if (type === "jpg") {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const segmentLength = view.getUint16(offset + 2, false);
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isStartOfFrame) {
        return { height: view.getUint16(offset + 5, false), width: view.getUint16(offset + 7, false) };
      }
      offset += 2 + segmentLength;
    }
  }
  if (type === "bmp" && bytes.length >= 26) {
    return { width: view.getInt32(18, true), height: Math.abs(view.getInt32(22, true)) };
  }
  return null;
}

const MAX_IMAGE_WIDTH_PX = 420;

async function imageParagraph(image: { url: string; altText: string | null }): Promise<Paragraph | null> {
  const bytes = await fetchImageBytes(image.url);
  if (!bytes) return null;
  const type = detectImageType(bytes);
  if (!type) return null;
  const dims = getImageDimensions(bytes, type);
  const width = dims?.width && dims.width > 0 ? dims.width : MAX_IMAGE_WIDTH_PX;
  const height = dims?.height && dims.height > 0 ? dims.height : Math.round((MAX_IMAGE_WIDTH_PX * 2) / 3);
  const scale = width > MAX_IMAGE_WIDTH_PX ? MAX_IMAGE_WIDTH_PX / width : 1;

  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [
      new ImageRun({
        data: bytes,
        type,
        transformation: { width: Math.round(width * scale), height: Math.round(height * scale) },
        altText: { name: "Imagem da questão", description: image.altText ?? "Imagem da questão" },
      }),
    ],
  });
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
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: i === 0 ? 0 : 120, after: 80 },
      children: runs,
    });
  });
}

async function questionParagraphs(question: ExamQuestion, index: number): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [
    ...textBlockParagraphs(question.statement, new TextRun({ text: `${index + 1}. `, bold: true })),
  ];

  for (const image of question.images) {
    const paragraph = await imageParagraph(image);
    if (paragraph) paragraphs.push(paragraph);
  }

  for (const part of question.parts) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
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

  for (let index = 0; index < questions.length; index++) {
    children.push(...(await questionParagraphs(questions[index], index)));
  }

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
