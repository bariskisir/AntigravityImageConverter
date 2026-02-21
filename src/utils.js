import fs from "fs/promises";
import { statSync, existsSync } from "fs";
import path from "path";

export const SUPPORTED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "tiff",
  "tif",
  "bmp",
  "ico",
  "gif",
];

export function isSupportedFormat(ext) {
  const normalizedExt = ext.replace(/^\./, "").toLowerCase();
  return SUPPORTED_FORMATS.includes(normalizedExt);
}

export async function findImagesWalk(dir, recursive = false) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (recursive) {
        results = results.concat(await findImagesWalk(filePath, recursive));
      }
    } else {
      const ext = path.extname(filePath);
      if (isSupportedFormat(ext)) {
        results.push(filePath);
      }
    }
  }
  return results;
}

export function generateOutputPath(
  inputPath,
  targetFormat,
  outputDir = null,
  baseDir = null,
) {
  let dir;
  if (outputDir && baseDir) {
    const relativePath = path.relative(baseDir, path.dirname(inputPath));
    dir = path.join(path.resolve(outputDir), relativePath);
  } else if (outputDir) {
    dir = path.resolve(outputDir);
  } else {
    dir = path.dirname(inputPath);
  }
  const ext = path.extname(inputPath);
  const baseName = path.basename(inputPath, ext);
  return path.join(dir, `${baseName}.${targetFormat}`);
}
