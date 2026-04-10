export function sanitizeStorageFileName(name: string): string {
  return name
    .replace(/[^\w.\-()+ ]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}
