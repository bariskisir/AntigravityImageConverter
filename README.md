# ImageConverter

A modern, fast, and production-ready TypeScript CLI for converting image formats, powered by Node.js and [Sharp](https://sharp.pixelplumbing.com/).

[![npm version](https://img.shields.io/npm/v/imgcon.svg)](https://www.npmjs.com/package/imgcon)
[![GitHub](https://img.shields.io/github/license/bariskisir/ImageConverter)](https://github.com/bariskisir/ImageConverter)

[NPM Package](https://www.npmjs.com/package/imgcon) | [GitHub Repository](https://github.com/bariskisir/ImageConverter)

## Features

- **Single image conversion**: Convert any supported image file to another format.
- **Batch processing**: Convert every supported image in a directory.
- **Recursive scanning**: Preserve nested folders when converting directories with `--recursive`.
- **High performance**: Built on top of `libvips` through `sharp`.
- **Clean CLI output**: Uses `chalk` and `ora` for readable terminal feedback.

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

Install the package globally with npm:

```bash
npm install -g imgcon
```

## Usage

```bash
imgcon <input> --to <format> [options]
```

- `<input>`: Path to a single image file or a directory containing images.
- `-t, --to <format>`: Target output format.
- `-o, --out <dir>`: Output directory. Defaults to the input location.
- `-r, --recursive`: Recursively scan subdirectories.
- `-q, --quality <number>`: Output quality from 1 to 100 for JPG, WEBP, AVIF, and TIFF.

## Examples

Convert a single image:

```bash
imgcon input.jpg --to png
imgcon image.png --to webp
```

Convert a directory recursively:

```bash
imgcon ./images --to avif --recursive
```

Convert a directory recursively with a specific quality:

```bash
imgcon ./images --to webp --out ./dist/images --recursive --quality 80
```

Open the help page:

```bash
imgcon --help
```

## Development

```bash
npm install
npm run build
npm start -- ./test_images --to webp --out ./converted --recursive
```

## Publishing

The package publishes to npm through GitHub Actions when a git tag is pushed. The workflow verifies that the tag version matches `package.json`, builds the TypeScript source, checks package contents, and publishes with npm provenance.

## License

MIT License.
