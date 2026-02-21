import fs from "fs/promises";
import { existsSync, lstatSync } from "fs";
import path from "path";
import sharp from "sharp";
import { Jimp } from "jimp";
import pngToIco from "png-to-ico";
import decodeIco from "decode-ico";
import { logger, createSpinner } from "./logger.js";
import {
  findImagesWalk,
  isSupportedFormat,
  generateOutputPath,
  SUPPORTED_FORMATS,
} from "./utils.js";

export async function processInput(input, targetFormat, options = {}) {
  if (!SUPPORTED_FORMATS.includes(targetFormat)) {
    throw new Error(
      `Unsupported target format: ${targetFormat}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    );
  }

  const absoluteInput = path.resolve(input);
  if (!existsSync(absoluteInput)) {
    throw new Error(`Input path does not exist: ${absoluteInput}`);
  }

  const stat = lstatSync(absoluteInput);
  let filesToProcess = [];

  if (stat.isDirectory()) {
    logger.info(
      `Scanning directory: ${absoluteInput}${options.recursive ? " (recursive)" : ""}`,
    );
    filesToProcess = await findImagesWalk(absoluteInput, options.recursive);
    if (filesToProcess.length === 0) {
      logger.warn("No supported images found in the directory.");
      return;
    }
    logger.info(`Found ${filesToProcess.length} images to convert.`);
  } else if (stat.isFile()) {
    const ext = path.extname(absoluteInput);
    if (!isSupportedFormat(ext)) {
      throw new Error(
        `Unsupported file format: ${ext}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
      );
    }
    filesToProcess.push(absoluteInput);
  } else {
    throw new Error("Input is neither a file nor a directory.");
  }

  let successCount = 0;
  let errorCount = 0;

  if (options.out) {
    const absoluteOut = path.resolve(options.out);
    if (!existsSync(absoluteOut)) {
      await fs.mkdir(absoluteOut, { recursive: true });
    }
  }

  if (options.quality) {
    const qualitySupported = [
      "jpg",
      "jpeg",
      "webp",
      "avif",
      "tiff",
      "tif",
    ].includes(targetFormat);
    if (!qualitySupported) {
      logger.warn(
        `Quality parameter (-q, --quality) is not supported for '${targetFormat}' format and will be ignored.`,
      );
    }
  }

  const baseDir = stat.isDirectory() ? absoluteInput : null;
  for (const file of filesToProcess) {
    const spinner = createSpinner(
      `Converting ${path.basename(file)} to ${targetFormat}...`,
    ).start();
    try {
      await convertImage(file, targetFormat, options, baseDir);
      spinner.succeed(`Converted ${path.basename(file)} to ${targetFormat}`);
      successCount++;
    } catch (err) {
      spinner.fail(`Failed to convert ${path.basename(file)}: ${err.message}`);
      errorCount++;
    }
  }

  logger.info("");
  if (successCount > 0)
    logger.success(`Successfully converted ${successCount} images.`);
  if (errorCount > 0) logger.error(`Failed to convert ${errorCount} images.`);
}

async function convertImage(inputPath, targetFormat, options, baseDir) {
  const outputPath = generateOutputPath(
    inputPath,
    targetFormat,
    options.out,
    baseDir,
  );

  const outDirName = path.dirname(outputPath);
  if (!existsSync(outDirName)) {
    await fs.mkdir(outDirName, { recursive: true });
  }

  const ext = path.extname(inputPath).toLowerCase();
  let sharpInput = inputPath;
  let tempInputPng = null;

  if (ext === ".bmp") {
    tempInputPng = path.join(
      path.dirname(outputPath),
      `.temp_in_${Date.now()}.png`,
    );
    const image = await Jimp.read(inputPath);
    await image.write(tempInputPng);
    sharpInput = tempInputPng;
  } else if (ext === ".ico") {
    tempInputPng = path.join(
      path.dirname(outputPath),
      `.temp_in_${Date.now()}.png`,
    );
    const buf = await fs.readFile(inputPath);
    const images = decodeIco(buf);

    const imgData = images.reduce((max, img) => (img.width > max.width ? img : max), images[0]);

    if (imgData.type === 'png') {
      const pngBuf = Buffer.from(imgData.data.buffer, imgData.data.byteOffset, imgData.data.byteLength);
      await fs.writeFile(tempInputPng, pngBuf);
    } else {
      const image = new Jimp({
        width: imgData.width,
        height: imgData.height,
        data: Buffer.from(imgData.data)
      });
      await image.write(tempInputPng);
    }
    sharpInput = tempInputPng;
  }

  if (targetFormat === "ico") {
    const tempPng = path.join(
      path.dirname(outputPath),
      `.temp_${Date.now()}.png`,
    );
    await sharp(sharpInput).toFormat("png").toFile(tempPng);
    const buf = await pngToIco(tempPng);
    await fs.writeFile(outputPath, buf);
    await fs.unlink(tempPng);
    if (tempInputPng) await fs.unlink(tempInputPng);
    return;
  }

  if (targetFormat === "bmp") {
    const tempPng = path.join(
      path.dirname(outputPath),
      `.temp_${Date.now()}.png`,
    );
    await sharp(sharpInput).toFormat("png").toFile(tempPng);
    const image = await Jimp.read(tempPng);
    await image.write(outputPath);
    await fs.unlink(tempPng);
    if (tempInputPng) await fs.unlink(tempInputPng);
    return;
  }

  const qualitySupported = [
    "jpg",
    "jpeg",
    "webp",
    "avif",
    "tiff",
    "tif",
  ].includes(targetFormat);
  const quality = options.quality ? parseInt(options.quality, 10) : undefined;
  let formatOptions = {};

  if (qualitySupported && quality !== undefined && !isNaN(quality)) {
    formatOptions.quality = quality;
  }

  await sharp(sharpInput)
    .toFormat(targetFormat, formatOptions)
    .toFile(outputPath);
  if (tempInputPng) await fs.unlink(tempInputPng);
}
