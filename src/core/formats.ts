/**
 * Defines supported image formats and format-related helpers.
 */
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
] as const;

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

const QUALITY_SUPPORTED_FORMATS: readonly SupportedFormat[] = [
  "jpg",
  "jpeg",
  "webp",
  "avif",
  "tiff",
  "tif",
];

/**
 * Normalizes a user-provided format and verifies that it is supported.
 */
export function normalizeFormat(format: string): SupportedFormat {
  const normalizedFormat = format.replace(/^\./, "").toLowerCase();

  if (!isSupportedFormat(normalizedFormat)) {
    throw new Error(
      `Unsupported target format: ${format}. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    );
  }

  return normalizedFormat;
}

/**
 * Checks whether a file extension or format name is supported.
 */
export function isSupportedFormat(formatOrExtension: string): formatOrExtension is SupportedFormat {
  const normalizedFormat = formatOrExtension.replace(/^\./, "").toLowerCase();

  return SUPPORTED_FORMATS.includes(normalizedFormat as SupportedFormat);
}

/**
 * Checks whether a target format accepts a quality option in Sharp.
 */
export function supportsQuality(format: SupportedFormat): boolean {
  return QUALITY_SUPPORTED_FORMATS.includes(format);
}
