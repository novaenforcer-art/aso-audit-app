export function extractAppId(url: string): string | null {
  const directMatch = url.match(/^id?(\d+)$/i);
  if (directMatch) {
    return directMatch[1];
  }

  const pathMatch = url.match(/\/id(\d+)/i);
  return pathMatch ? pathMatch[1] : null;
}
