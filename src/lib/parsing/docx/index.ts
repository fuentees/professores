import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { findBody, parseXml } from "./ooxml";
import { walkBody } from "./walk-body";
import { extractQuestionDraft } from "./extract";
import type { ParsedQuestionDraft } from "./types";

export type ExtractedMedia = {
  relId: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  supported: boolean;
};

export type DocxParseResult = {
  draft: ParsedQuestionDraft;
  media: ExtractedMedia[];
};

const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  bmp: "image/bmp",
  emf: "image/x-emf",
  wmf: "image/x-wmf",
};

// .emf/.wmf são metarquivos vetoriais do Windows (comuns quando a imagem
// veio de colar do PowerPoint/Excel) — não renderizam em <img> de navegador.
// Extraímos e guardamos mesmo assim (não perde o arquivo), mas sinalizamos.
const UNSUPPORTED_PREVIEW_EXTENSIONS = new Set(["emf", "wmf"]);

const relsParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function parseRelationships(xml: string): Map<string, string> {
  const parsed = relsParser.parse(xml) as {
    Relationships?: { Relationship?: { "@_Id": string; "@_Target": string }[] | { "@_Id": string; "@_Target": string } };
  };
  const raw = parsed.Relationships?.Relationship;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const map = new Map<string, string>();
  for (const rel of list) map.set(rel["@_Id"], rel["@_Target"]);
  return map;
}

/**
 * Parser puro: sem I/O de banco/storage, só transforma bytes de um .docx
 * numa estrutura pedagógica extraída + mídias embutidas. A resolução de
 * BNCC contra o banco, persistência e upload pro Storage acontecem na
 * Server Action que chama isto (Fase 4).
 */
export async function parseQuestionDocx(buffer: ArrayBuffer): Promise<DocxParseResult> {
  const zip = await JSZip.loadAsync(buffer);

  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) {
    throw new Error("word/document.xml não encontrado — o arquivo não parece ser um .docx válido.");
  }
  const documentXml = await documentXmlFile.async("string");

  const relsFile = zip.file("word/_rels/document.xml.rels");
  const relMap = relsFile ? parseRelationships(await relsFile.async("string")) : new Map<string, string>();

  const root = parseXml(documentXml);
  const body = findBody(root);
  if (!body) {
    throw new Error("Estrutura do documento inválida — <w:body> não encontrado em word/document.xml.");
  }

  const bodyNodes = walkBody(body);
  const draft = extractQuestionDraft(bodyNodes);

  const media: ExtractedMedia[] = [];
  const seenRelIds = new Set<string>();
  for (const image of draft.images) {
    if (seenRelIds.has(image.relId)) continue;
    seenRelIds.add(image.relId);

    const target = relMap.get(image.relId);
    if (!target) continue;
    const mediaPath = target.startsWith("media/") ? `word/${target}` : `word/media/${target}`;
    const file = zip.file(mediaPath);
    if (!file) continue;

    const fileName = mediaPath.split("/").pop() ?? `${image.relId}.bin`;
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const buf = await file.async("nodebuffer");

    media.push({
      relId: image.relId,
      fileName,
      buffer: buf,
      mimeType: MIME_TYPES[extension] ?? "application/octet-stream",
      supported: !UNSUPPORTED_PREVIEW_EXTENSIONS.has(extension),
    });
  }

  for (const asset of media) {
    if (!asset.supported) {
      draft.warnings.push({
        severity: "warning",
        field: "assets",
        message: `Imagem "${asset.fileName}" está em formato .${asset.fileName.split(".").pop()} (metarquivo do Windows) e não terá preview no navegador — o arquivo original foi preservado.`,
      });
    }
  }

  return { draft, media };
}

export type { ParsedQuestionDraft } from "./types";
