/**
 * Exposes the public programmatic API for ImageConverter.
 */
export { convertImage, processInput, type ConvertOptions } from "./core/converter.js";
export {
  normalizeFormat,
  SUPPORTED_FORMATS,
  supportsQuality,
  type SupportedFormat,
} from "./core/formats.js";
export { findImageFiles, generateOutputPath } from "./core/paths.js";
