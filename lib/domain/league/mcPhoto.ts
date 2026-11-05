/** "Ñaña Free" → "nana-free", "D.I El Lirico" → "d-i-el-lirico": el nombre del archivo de la foto de un MC. */
export function mcSlug(alias: string): string {
  return alias
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
