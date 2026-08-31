import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  PageOrientation,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const TABLE_WIDTH = 10_128;
const LABEL_WIDTH = 3_000;
const VALUE_WIDTH = TABLE_WIDTH - LABEL_WIDTH;

function cell(text: string, width: number, bold = false) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    children: [new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text, bold, size: 19 })],
    })],
  });
}

function field(label: string, example: string) {
  return new TableRow({
    cantSplit: true,
    children: [cell(label, LABEL_WIDTH, true), cell(example, VALUE_WIDTH)],
  });
}

export async function generateQuestionImportTemplate(): Promise<Uint8Array> {
  const header = new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [LABEL_WIDTH, VALUE_WIDTH],
    indent: { size: 120, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      field("CÓDIGO DA QUESTÃO:", "HIS4-1T-001"),
      field("Componente Curricular:", "História"),
      field("Ano/Série:", "4º ano"),
      field("Unidade Temática:", "Transformações e permanências"),
      field("Trimestre/Bimestre:", "1º trimestre"),
      field("Livro:", "Nome do livro"),
      field("Unidade:", "Unidade 1"),
      field("Objeto de Conhecimento (Conteúdo):", "* Mudanças e permanências\n* Memória da comunidade"),
      field("Habilidade BNCC:", "(EF04HI01) - Cole aqui a descrição completa e oficial da habilidade."),
      field("Nível de Complexidade:", "[ ] Fácil     [X] Médio     [ ] Difícil"),
      field("Nota pedagógica de articulação:", "Explique como a questão se conecta ao conteúdo e à habilidade."),
      field("Taxonomia de Bloom:", "Esta questão está no nível Entender da Taxonomia de Bloom."),
    ],
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: 20, color: "1F2937" },
          paragraph: { spacing: { line: 260, after: 80 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12_240, height: 15_840, orientation: PageOrientation.PORTRAIT },
          margin: { top: 936, right: 936, bottom: 936, left: 936 },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 180 },
          children: [new TextRun({ text: "MODELO OFICIAL — IMPORTAÇÃO DE QUESTÃO", bold: true, size: 28, color: "A33A1D" })],
        }),
        new Paragraph({
          spacing: { after: 180 },
          children: [new TextRun({ text: "Substitua os exemplos, mantenha os rótulos e salve em .docx. Não apague o código nem a descrição completa da BNCC.", italics: true, color: "666666" })],
        }),
        header,
        new Paragraph({
          spacing: { before: 260, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, color: "DDDDDD", size: 2 } },
          children: [new TextRun({ text: "Questão 1   Valor: 1,0", bold: true, size: 24 })],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun("Escreva aqui o enunciado completo da questão.")],
        }),
        new Paragraph({ children: [new TextRun({ text: "A) ", bold: true }), new TextRun("Escreva o primeiro comando, se houver.")] }),
        new Paragraph({ children: [new TextRun({ text: "B) ", bold: true }), new TextRun("Escreva o segundo comando, se houver.")] }),
        new Paragraph({
          spacing: { before: 260, after: 100 },
          children: [new TextRun({ text: "Subsídio para a Correção", bold: true, size: 24, color: "A33A1D" })],
        }),
        new Paragraph("Item A: descreva a resposta esperada e os critérios de correção."),
        new Paragraph("Item B: descreva a resposta esperada e os critérios de correção."),
      ],
    }],
  });

  return new Uint8Array(await Packer.toBuffer(doc));
}
