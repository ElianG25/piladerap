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

// Enfoque manual opcional (fotos-mcs/enfoque.json): { "stewart": { "x": 0.45, "y": 0.26, "zoom": 2 } }
// x e y son la posición de la cara (0 a 1, desde arriba a la izquierda); zoom 1 = el cuadrado más grande posible.
let enfoque = {};
const enfoquePath = path.join(SRC, "enfoque.json");
if (fs.existsSync(enfoquePath)) {
  try {
    for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(enfoquePath, "utf8")))) enfoque[slug(k)] = v;
  } catch (err) {
    console.log(`AVISO: enfoque.json no se pudo leer (${err.message}); se ignora.`);
  }
}
const enfoqueMtime = fs.existsSync(enfoquePath) ? fs.statSync(enfoquePath).mtimeMs : 0;
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
  if (fs.existsSync(to) && fs.statSync(to).mtimeMs >= Math.max(fs.statSync(from).mtimeMs, enfoqueMtime)) { sinCambios++; continue; }
  try {
    // Se aplica la orientación de la cámara primero, para trabajar con el ancho y alto reales
    const { data, info } = await sharp(from).rotate().toBuffer({ resolveWithObject: true });
    let img = sharp(data);
    const f = enfoque[name];
    if (f && typeof f.x === "number" && typeof f.y === "number") {
      const side = Math.max(32, Math.round(Math.min(info.width, info.height) / (f.zoom > 1 ? f.zoom : 1)));
      const clamp = (n, max) => Math.min(Math.max(Math.round(n), 0), max);
      img = img
        .extract({ left: clamp(f.x * info.width - side / 2, info.width - side), top: clamp(f.y * info.height - side / 2, info.height - side), width: side, height: side })
        .resize(SIZE, SIZE);
    } else {
      // Retratos verticales: la cara casi siempre está arriba, así que se alinea el recorte arriba.
      // Fotos horizontales o cuadradas: se centra en lo que más resalta.
      img = img.resize(SIZE, SIZE, { fit: "cover", position: info.height > info.width * 1.05 ? "north" : "attention" });
    }
    await img.jpeg({ quality: 78, mozjpeg: true }).toFile(to);
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
