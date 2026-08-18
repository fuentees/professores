export function coverStoragePath(contentId: string, fileName: string) {
  return `covers/${contentId}/${Date.now()}-${fileName}`;
}

export function contentFileStoragePath(contentId: string, fileName: string) {
  return `contents/${contentId}/${Date.now()}-${fileName}`;
}

/** Word original de uma importação do banco de questões — nunca público. */
export function questionOriginalStoragePath(importId: string, fileName: string) {
  return `question-originals/${importId}/${fileName}`;
}

/** Imagem extraída de um .docx durante a importação de uma questão. */
export function questionAssetStoragePath(questionId: string, assetId: string, fileName: string) {
  return `questions/${questionId}/assets/${assetId}-${fileName}`;
}

/**
 * Reverses getPublicUrl() so a cover-replace/delete flow can remove the
 * previous object. Cover URLs are always full public URLs (never a bare
 * storage path), so a plain `.storage.remove()` needs this extraction step.
 */
export function extractStoragePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}
