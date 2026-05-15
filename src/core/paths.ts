/**
 * Provides filesystem discovery and output path helpers for image conversion.
 */
import fs from "node:fs/promises";
import path from "node:path";

import { isSupportedFormat, type SupportedFormat } from "./formats.js";

/**
 * Finds supported image files inside a directory, optionally walking subdirectories.
 */
export async function findImageFiles(
  directory: string,
  recursive = false,
): Promise<string[]> {
  const directoryEntries = await fs.readdir(directory, { withFileTypes: true });
  const imageFiles: string[] = [];

  for (const entry of directoryEntries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        imageFiles.push(...(await findImageFiles(entryPath, recursive)));
      }

      continue;
    }

    if (entry.isFile() && isSupportedFormat(path.extname(entryPath))) {
      imageFiles.push(entryPath);
    }
  }

  return imageFiles;
}

/**
 * Generates the output path while preserving relative folders during directory conversion.
 */
export function generateOutputPath(
  inputPath: string,
  targetFormat: SupportedFormat,
  outputDirectory?: string,
  baseDirectory: string | null = null,
): string {
  const directory = resolveOutputDirectory(inputPath, outputDirectory, baseDirectory);
  const extension = path.extname(inputPath);
  const baseName = path.basename(inputPath, extension);

  return path.join(directory, `${baseName}.${targetFormat}`);
}

/**
 * Resolves the directory where a converted file should be written.
 */
function resolveOutputDirectory(
  inputPath: string,
  outputDirectory: string | undefined,
  baseDirectory: string | null,
): string {
  if (outputDirectory && baseDirectory) {
    const relativeDirectory = path.relative(baseDirectory, path.dirname(inputPath));

    return path.join(path.resolve(outputDirectory), relativeDirectory);
  }

  if (outputDirectory) {
    return path.resolve(outputDirectory);
  }

  return path.dirname(inputPath);
}
