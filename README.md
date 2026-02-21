# AntigravityImageConverter

A modern, fast, and production-ready CLI tool for converting image formats, powered by Node.js and [Sharp](https://sharp.pixelplumbing.com/).

[![npm version](https://img.shields.io/npm/v/antigravityimageconverter.svg)](https://www.npmjs.com/package/antigravityimageconverter)
[![GitHub](https://img.shields.io/github/license/bariskisir/AntigravityImageConverter)](https://github.com/bariskisir/AntigravityImageConverter)

[NPM Package](https://www.npmjs.com/package/antigravityimageconverter) | [GitHub Repository](https://github.com/bariskisir/AntigravityImageConverter)

## Features

- **Single Image Conversion**: Convert any supported image file to another format.
- **Batch Processing**: Point to a directory and convert all supported images inside it recursively.
- **High Performance**: Built on top of `libvips` via `sharp` for maximum speed and efficiency.
- **User Friendly UX**: Provides elegant terminal output using `chalk` and `ora`.

## Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.avif`
- `.tiff` / `.tif`
- `.bmp`
- `.ico`
- `.gif`

## Installation

You can install this package globally via npm:

```bash
npm install -g antigravityimageconverter
```

## Usage

### Usage Command

```bash
agimgconv <input> --to <format> [options]
```

- `<input>`: Can be a path to a single file or a directory containing images.
- `-t, --to <format>`: The target format you want to convert the images to.
- `-o, --out <dir>`: (Optional) Specify an output directory for the converted files. If not provided, saves in the same folder.
- `-r, --recursive`: (Optional) If the input is a directory, searches for images in all subdirectories as well.
- `-q, --quality <number>`: (Optional) Set the output image quality (1-100) for supported formats (JPG, WEBP, AVIF, TIFF).

### Examples

**Convert a single image:**

```bash
agimgconv input.jpg --to png
agimgconv image.png --to webp
```

**Convert an entire directory (recursively):**

```bash
agimgconv ./images --to avif --recursive
```

**Convert an entire directory (recursively) with a specific quality:**

```bash
agimgconv ./images --to webp --out ./dist/images --recursive --quality 80
```

**View Help Page:**

```bash
agimgconv --help
```

## Developer Notes

This package uses ES Modules (`"type": "module"`) and modern JavaScript features.

## License

MIT License.
