import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const target = new URL("../public/pdfjs/", import.meta.url);
await mkdir(target, { recursive: true });
for (const directory of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  await cp(
    fileURLToPath(
      new URL(`../node_modules/pdfjs-dist/${directory}/`, import.meta.url),
    ),
    fileURLToPath(new URL(`${directory}/`, target)),
    { recursive: true },
  );
}
