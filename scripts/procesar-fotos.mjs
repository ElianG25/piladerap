// Reduce las fotos de fotos-mcs/ a 480x480 JPEG y actualiza la lista que usa la web.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "fotos-mcs";
const OUT = "public/mcs";
const MANIFEST = "lib/generated/mcPhotos.ts";
const SIZE = 480;
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Misma regla que mcSlug() en lib/domain/league/mcPhoto.ts
const slug = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

fs.mkdirSync(OUT, { recursive: true });
let hechas = 0;
let sinCambios = 0;
const avisos = [];

for (const file of fs.existsSync(SRC) ? fs.readdirSync(SRC) : []) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.has(ext)) continue;
  const name = slug(path.basename(file, path.extname(file)));
  if (!name) { avisos.push(`"${file}": el nombre no genera un nombre de archivo válido.`); continue; }
  const from = path.join(SRC, file);
  const to = path.join(OUT, `${name}.jpg`);
  if (fs.existsSync(to) && fs.statSync(to).mtimeMs >= fs.statSync(from).mtimeMs) { sinCambios++; continue; }
  try {
    await sharp(from)
      .rotate() // respeta la orientación de la cámara
      .resize(SIZE, SIZE, { fit: "cover", position: "attention" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(to);
    hechas++;
    const kb = Math.round(fs.statSync(to).size / 1024);
    if (kb > 120) avisos.push(`${name}.jpg pesa ${kb} KB (revisa la foto original).`);
  } catch (err) {
    avisos.push(`No se pudo procesar "${file}": ${err.message}`);
  }
}

const slugs = fs.readdirSync(OUT).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)).sort();
const body = `/**
 * Fotos de MCs disponibles en /public/mcs (nombre = mcSlug(alias).jpg).
 * Lo genera \`npm run fotos\`; no se edita a mano.
 */
export const MC_PHOTO_SLUGS: readonly string[] = ${JSON.stringify(slugs, null, 2)};
`;
fs.writeFileSync(MANIFEST, body);

const total = slugs.reduce((n, s) => n + fs.statSync(path.join(OUT, `${s}.jpg`)).size, 0);
console.log(`Fotos nuevas o actualizadas: ${hechas} · sin cambios: ${sinCambios} · en total: ${slugs.length} (${Math.round(total / 1024)} KB)`);
for (const a of avisos) console.log(`AVISO: ${a}`);
