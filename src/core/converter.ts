/**
 * Coordinates image discovery, validation, conversion, and per-file reporting.
 */
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import decodeIco, { type DecodedIcoImage } from "decode-ico";
import { Jimp } from "jimp";
import pngToIco from "png-to-ico";
import sharp from "sharp";

import {
  findImageFiles,
  generateOutputPath,
} from "./paths.js";
import {
  isSupportedFormat,
  normalizeFormat,
  SUPPORTED_FORMATS,
  supportsQuality,
  type SupportedFormat,
} from "./formats.js";
import { createSpinner, logger } from "../infrastructure/logger.js";

export interface ConvertOptions {
  out?: string;
  quality?: number | string;
  recursive?: boolean;
}

interface ConversionInput {
  baseDir: string | null;
  files: string[];
  isDirectory: boolean;
}

interface PreparedInput {
  cleanupPaths: string[];
  sharpInput: string;
}

type WritableImagePath = `${string}.${string}`;
type SharpFormatOptions = sharp.OutputOptions & {
  quality?: number;
};

/**
 * Processes a file or directory input and converts every supported image into the target format.
 */
export async function processInput(
  input: string,
  targetFormatValue: string,
  options: ConvertOptions = {},
): Promise<void> {
  const targetFormat = normalizeFormat(targetFormatValue);
  const absoluteInput = path.resolve(input);

  if (!existsSync(absoluteInput)) {
    throw new Error(`Input path does not exist: ${absoluteInput}`);
  }

  const conversionInput = await resolveConversionInput(absoluteInput, options);
  if (conversionInput.files.length === 0) {
    logger.warn("No supported images found in the directory.");
    return;
  }

  await ensureOutputDirectory(options.out);
  warnWhenQualityIsIgnored(targetFormat, options);
  await convertFiles(conversionInput.files, targetFormat, options, conversionInput.baseDir);
}

/**
 * Resolves a user-provided path into concrete image files ready for conversion.
 */
async function resolveConversionInput(
  absoluteInput: string,
  options: ConvertOptions,
): Promise<ConversionInput> {
  const stat = await fs.lstat(absoluteInput);

  if (stat.isDirectory()) {
    logger.info(
      `Scanning directory: ${absoluteInput}${options.recursive ? " (recursive)" : ""}`,
    );

    const files = await findImageFiles(absoluteInput, Boolean(options.recursive));
    logger.info(`Found ${files.length} images to convert.`);

    return {
      baseDir: absoluteInput,
      files,
      isDirectory: true,
    };
  }

  if (stat.isFile()) {
    const extension = path.extname(absoluteInput);

    if (!isSupportedFormat(extension)) {
      throw new Error(
        `Unsupported file format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
      );
    }

    return {
      baseDir: null,
      files: [absoluteInput],
      isDirectory: false,
    };
  }

  throw new Error("Input is neither a file nor a directory.");
}

/**
 * Creates the root output directory when the user provides one.
 */
async function ensureOutputDirectory(outputDirectory: string | undefined): Promise<void> {
  if (!outputDirectory) {
    return;
  }

  const absoluteOutputDirectory = path.resolve(outputDirectory);
  await fs.mkdir(absoluteOutputDirectory, { recursive: true });
}

/**
 * Warns users when a requested quality option cannot affect the selected target format.
 */
function warnWhenQualityIsIgnored(
  targetFormat: SupportedFormat,
  options: ConvertOptions,
): void {
  if (options.quality === undefined || supportsQuality(targetFormat)) {
    return;
  }

  logger.warn(
    `Quality parameter (-q, --quality) is not supported for '${targetFormat}' format and will be ignored.`,
  );
}

/**
 * Converts a list of image files while collecting success and failure counts.
 */
async function convertFiles(
  files: string[],
  targetFormat: SupportedFormat,
  options: ConvertOptions,
  baseDir: string | null,
): Promise<void> {
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const spinner = createSpinner(
      `Converting ${path.basename(file)} to ${targetFormat}...`,
    ).start();

    try {
      await convertImage(file, targetFormat, options, baseDir);
      spinner.succeed(`Converted ${path.basename(file)} to ${targetFormat}`);
      successCount += 1;
    } catch (error) {
      spinner.fail(
        `Failed to convert ${path.basename(file)}: ${toErrorMessage(error)}`,
      );
      errorCount += 1;
    }
  }

  logger.info("");

  if (successCount > 0) {
    logger.success(`Successfully converted ${successCount} images.`);
  }

  if (errorCount > 0) {
    logger.error(`Failed to convert ${errorCount} images.`);
  }
}

/**
 * Converts a single image file into the selected target format.
 */
export async function convertImage(
  inputPath: string,
  targetFormat: SupportedFormat,
  options: ConvertOptions,
  baseDir: string | null,
): Promise<void> {
  const outputPath = generateOutputPath(inputPath, targetFormat, options.out, baseDir);
  const outputDirectory = path.dirname(outputPath);

  await fs.mkdir(outputDirectory, { recursive: true });

  const preparedInput = await prepareInputForSharp(inputPath, outputDirectory);

  try {
    if (targetFormat === "ico") {
      await convertSharpInputToIco(preparedInput.sharpInput, outputPath, outputDirectory);
      return;
    }

    if (targetFormat === "bmp") {
      await convertSharpInputToBmp(preparedInput.sharpInput, outputPath, outputDirectory);
      return;
    }

    await sharp(preparedInput.sharpInput)
      .toFormat(targetFormat, getSharpFormatOptions(targetFormat, options))
      .toFile(outputPath);
  } finally {
    await cleanupTemporaryFiles(preparedInput.cleanupPaths);
  }
}

/**
 * Converts source formats that Sharp cannot read directly into temporary PNG files.
 */
async function prepareInputForSharp(
  inputPath: string,
  outputDirectory: string,
): Promise<PreparedInput> {
  const extension = path.extname(inputPath).toLowerCase();
  const cleanupPaths: string[] = [];

  if (extension === ".bmp") {
    const temporaryPng = createTemporaryPath(outputDirectory, "input", "png");
    const image = await Jimp.read(inputPath);

    await image.write(toWritableImagePath(temporaryPng));
    cleanupPaths.push(temporaryPng);

    return {
      cleanupPaths,
      sharpInput: temporaryPng,
    };
  }

  if (extension === ".ico") {
    const temporaryPng = createTemporaryPath(outputDirectory, "input", "png");
    const icoBuffer = await fs.readFile(inputPath);
    const images = decodeIco(icoBuffer);
    const largestImage = selectLargestIconImage(images);

    await writeIconImageAsPng(largestImage, temporaryPng);
    cleanupPaths.push(temporaryPng);

    return {
      cleanupPaths,
      sharpInput: temporaryPng,
    };
  }

  return {
    cleanupPaths,
    sharpInput: inputPath,
  };
}

/**
 * Selects the largest decoded ICO frame for downstream conversion.
 */
function selectLargestIconImage(images: DecodedIcoImage[]): DecodedIcoImage {
  if (images.length === 0) {
    throw new Error("ICO file does not contain any image frames.");
  }

  return images.reduce(selectWiderImage);
}

/**
 * Chooses the wider image when reducing decoded ICO frame candidates.
 */
function selectWiderImage(
  currentLargest: DecodedIcoImage,
  candidate: DecodedIcoImage,
): DecodedIcoImage {
  return candidate.width > currentLargest.width ? candidate : currentLargest;
}

/**
 * Writes a decoded ICO frame to a PNG file that Sharp can consume.
 */
async function writeIconImageAsPng(
  image: DecodedIcoImage,
  outputPath: string,
): Promise<void> {
  if (image.type === "png") {
    await fs.writeFile(outputPath, Buffer.from(image.data));
    return;
  }

  const bitmap = new Jimp({
    data: Buffer.from(image.data),
    height: image.height,
    width: image.width,
  });

  await bitmap.write(toWritableImagePath(outputPath));
}

/**
 * Converts a Sharp-readable source image into an ICO file.
 */
async function convertSharpInputToIco(
  sharpInput: string,
  outputPath: string,
  outputDirectory: string,
): Promise<void> {
  const temporaryPng = createTemporaryPath(outputDirectory, "output", "png");

  try {
    await sharp(sharpInput).toFormat("png").toFile(temporaryPng);
    const icoBuffer = await pngToIco(temporaryPng);
    await fs.writeFile(outputPath, icoBuffer);
  } finally {
    await cleanupTemporaryFiles([temporaryPng]);
  }
}

/**
 * Converts a Sharp-readable source image into a BMP file through Jimp.
 */
async function convertSharpInputToBmp(
  sharpInput: string,
  outputPath: string,
  outputDirectory: string,
): Promise<void> {
  const temporaryPng = createTemporaryPath(outputDirectory, "output", "png");

  try {
    await sharp(sharpInput).toFormat("png").toFile(temporaryPng);
    const image = await Jimp.read(temporaryPng);
    await image.write(toWritableImagePath(outputPath));
  } finally {
    await cleanupTemporaryFiles([temporaryPng]);
  }
}

/**
 * Builds Sharp output options from CLI conversion settings.
 */
function getSharpFormatOptions(
  targetFormat: SupportedFormat,
  options: ConvertOptions,
): SharpFormatOptions {
  const quality = parseQuality(options.quality);

  if (!supportsQuality(targetFormat) || quality === undefined) {
    return {};
  }

  return { quality };
}

/**
 * Narrows generated file paths to the extension-bearing path type expected by Jimp.
 */
function toWritableImagePath(filePath: string): WritableImagePath {
  return filePath as WritableImagePath;
}

/**
 * Parses and validates the optional quality value supplied by the user.
 */
function parseQuality(quality: ConvertOptions["quality"]): number | undefined {
  if (quality === undefined) {
    return undefined;
  }

  const parsedQuality = Number.parseInt(String(quality), 10);

  if (Number.isNaN(parsedQuality)) {
    throw new Error("Quality must be a number between 1 and 100.");
  }

  if (parsedQuality < 1 || parsedQuality > 100) {
    throw new Error("Quality must be between 1 and 100.");
  }

  return parsedQuality;
}

/**
 * Creates a unique temporary file path in an output directory.
 */
function createTemporaryPath(
  directory: string,
  label: "input" | "output",
  extension: string,
): string {
  return path.join(directory, `.imgcon-${label}-${randomUUID()}.${extension}`);
}

/**
 * Removes temporary files and ignores missing files that were already cleaned up.
 */
async function cleanupTemporaryFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (!isMissingFileError(error)) {
        throw error;
      }
    }
  }
}

/**
 * Detects file-not-found errors raised while cleaning temporary files.
 */
function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/**
 * Converts unknown thrown values into readable conversion error text.
 */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
