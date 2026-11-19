// Copia data/ (base de datos + imágenes) a backups/AAAA-MM-DD_HHMM/
// Uso: npm run backup   ·   o con destino propio: npm run backup -- "D:/Drive/alive-backups"
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const src = path.resolve("data");
if (!existsSync(src)) {
  console.error("No hay carpeta data/ todavía: abre la app una vez primero.");
  process.exit(1);
}
const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve("backups");
const dest = path.join(root, stamp);
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Respaldo listo en ${dest}`);
