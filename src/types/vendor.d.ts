/**
 * Provides local declarations for image libraries that do not expose complete TypeScript types.
 */
declare module "decode-ico" {
  export interface DecodedIcoImage {
    data: Uint8Array;
    height: number;
    type?: string;
    width: number;
  }

  /**
   * Decodes ICO file bytes into individual image frames.
   */
  export default function decodeIco(input: Buffer | Uint8Array): DecodedIcoImage[];
}

declare module "png-to-ico" {
  /**
   * Converts one or more PNG files into ICO bytes.
   */
  export default function pngToIco(input: string | string[]): Promise<Buffer>;
}
