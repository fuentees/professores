import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

export type MaterialDocxData = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  body: string;
  author?: string | null;
  subjects: string[];
  grades: string[];
  types: string[];
  bnccCodes: string[];
};

function isHeading(line: string): boolean {
  const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return line.length <= 110 && letters.length > 3 && line === line.toLocaleUpperCase("pt-BR");
}
function bodyParagraphs(body: string, title: string): Paragraph[] {
  const lines = body.split(/\r?\n/).map((line) => line.trim());
  if (lines[0]?.toLocaleLowerCase("pt-BR") === title.trim().toLocaleLowerCase("pt-BR")) lines.shift();

  return lines.flatMap((line) => {
    if (!line) return [];
    if (isHeading(line)) {
      return [new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 }, children: [new TextRun({ text: line, bold: true })] })];
    }
    if (/^[-•]\s+/.test(line)) {
      return [new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun(line.replace(/^[-•]\s+/, ""))] })];
    }
    return [new Paragraph({ spacing: { after: 100 }, children: [new TextRun(line)] })];
  });
}

export async function generateMaterialDocx(material: MaterialDocxData): Promise<Blob> {
  const metadata = [...material.types, ...material.subjects, ...material.grades].filter(Boolean).join(" · ");
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 80 }, children: [new TextRun({ text: material.title, bold: true, size: 30 })] }),
  ];

  if (material.subtitle) children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: material.subtitle, italics: true })] }));
  if (metadata) children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: metadata, color: "666666" })] }));
  if (material.description) children.push(new Paragraph({ spacing: { after: 180 }, children: [new TextRun(material.description)] }));
  children.push(...bodyParagraphs(material.body, material.title));

  if (material.bnccCodes.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 }, children: [new TextRun({ text: "Habilidades da BNCC", bold: true })] }));
    children.push(new Paragraph({ children: [new TextRun(material.bnccCodes.join(" · "))] }));
  }

  if (material.author) children.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: `Autoria: ${material.author}`, italics: true, color: "666666" })] }));

  const document = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBlob(document);
}

export function safeDocxFileName(title: string): string {
  const cleaned = title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim();
  return `${cleaned || "material"}.docx`;
}
