import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { LessonPlanOutput } from "@/lib/ai/schemas";

type LessonPlanDocumentData = {
  subjectName: string;
  gradeName: string;
  theme: string;
  durationMinutes: number;
  classCount: number;
  output: LessonPlanOutput;
};

const navy = "172B4D";
const coral = "A33A1D";

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [new TextRun({ text, bold: true, color: coral, size: 24 })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 21 })],
  });
}

function labelValue(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 70 },
    children: [new TextRun({ text: `${label}: `, bold: true, color: navy }), new TextRun({ text: value })],
  });
}

export async function generateLessonPlanDocx(data: LessonPlanDocumentData): Promise<Blob> {
  const { output } = data;
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "PLANEJAMENTO DE AULA", bold: true, size: 32, color: navy })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [new TextRun({ text: output.title, bold: true, size: 26, color: coral })],
    }),
    labelValue("Disciplina", data.subjectName),
    labelValue("Série", data.gradeName),
    labelValue("Tema", data.theme),
    labelValue("Duração", `${data.durationMinutes} minutos em ${data.classCount} aula(s)`),
    heading("Visão geral"),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun(output.summary)] }),
  ];

  if (output.bnccCodes.length) {
    children.push(heading("Alinhamento à BNCC"), ...output.bnccCodes.map(bullet));
  }
  children.push(
    heading("Objetivos de aprendizagem"),
    ...output.learningObjectives.map(bullet),
    heading("Conteúdos"),
    ...output.contents.map(bullet),
    heading("Metodologia"),
    ...output.methodology.map(bullet),
    heading("Recursos"),
    ...output.resources.map(bullet),
    heading("Desenvolvimento da aula"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: ["Etapa", "Tempo", "Ações"].map((text) => new TableCell({
          shading: { fill: "F6E8E1" },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: navy })] })],
        })) }),
        ...output.schedule.map((item) => new TableRow({ children: [
          new TableCell({ children: [new Paragraph(item.phase)] }),
          new TableCell({ children: [new Paragraph(`${item.durationMinutes} min`)] }),
          new TableCell({ children: [new Paragraph(item.actions)] }),
        ] })),
      ],
    }),
    heading("Avaliação"),
    ...output.assessment.flatMap((item) => [
      new Paragraph({
        spacing: { before: 100, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD" } },
        children: [new TextRun({ text: item.criterion, bold: true })],
      }),
      labelValue("Evidência", item.evidence),
      labelValue("Instrumento", item.instrument),
    ]),
  );

  if (output.adaptations.length) {
    children.push(
      heading("Adaptações e inclusão"),
      ...output.adaptations.flatMap((item) => [
        new Paragraph({ spacing: { before: 90 }, children: [new TextRun({ text: item.profile, bold: true, color: navy })] }),
        ...item.strategies.map(bullet),
      ]),
    );
  }
  if (output.homework) children.push(heading("Atividade para casa"), new Paragraph(output.homework));
  if (output.teacherNotes.length) children.push(heading("Orientações ao professor"), ...output.teacherNotes.map(bullet));

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBlob(doc);
}

export function downloadLessonPlanBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
