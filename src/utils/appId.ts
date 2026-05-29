export function extractAppId(url: string): string | null {
  const match = url.match(/\/id(\d+)/i);
  return match ? match[1] : null;
}
