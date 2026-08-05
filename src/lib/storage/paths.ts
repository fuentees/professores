export function coverStoragePath(contentId: string, fileName: string) {
  return `covers/${contentId}/${Date.now()}-${fileName}`;
}

export function contentFileStoragePath(contentId: string, fileName: string) {
  return `contents/${contentId}/${Date.now()}-${fileName}`;
}
