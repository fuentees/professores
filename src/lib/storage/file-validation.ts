export const ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "mp3",
  "mp4",
  "zip",
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateUploadedFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FILE_EXTENSIONS.has(extension)) {
    return `Formato de arquivo não permitido: .${extension}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Arquivo maior que o limite de 50MB.";
  }
  return null;
}

export const ALLOWED_COVER_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
export const MAX_COVER_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateCoverImage(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_COVER_IMAGE_EXTENSIONS.has(extension)) {
    return `Formato de imagem não permitido: .${extension}`;
  }
  if (!file.type.startsWith("image/")) {
    return "O arquivo enviado não é uma imagem.";
  }
  if (file.size > MAX_COVER_IMAGE_SIZE) {
    return "Imagem maior que o limite de 10MB.";
  }
  return null;
}

export const MAX_DOCX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * .docx é um zip OOXML — os 4 primeiros bytes sempre são a assinatura zip
 * "PK\x03\x04". Checar isso além da extensão evita que um arquivo renomeado
 * (ou corrompido) entre no parser e falhe de forma confusa mais adiante.
 */
export async function validateDocxFile(file: File): Promise<string | null> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (extension !== "docx") {
    return `Apenas arquivos .docx são aceitos (recebido: .${extension}).`;
  }
  if (file.size > MAX_DOCX_FILE_SIZE) {
    return "Arquivo maior que o limite de 25MB.";
  }
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isZip = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
  if (!isZip) {
    return "O arquivo não parece ser um .docx válido (assinatura zip ausente).";
  }
  return null;
}
