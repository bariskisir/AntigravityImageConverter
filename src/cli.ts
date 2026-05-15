#!/usr/bin/env node
/**
 * Defines the imgcon command-line interface and delegates conversion work to the core converter.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Command, type OptionValues } from "commander";

import { processInput } from "./core/converter.js";
import { logger } from "./infrastructure/logger.js";

interface CliOptions extends OptionValues {
  out?: string;
  quality?: string;
  recursive?: boolean;
  to?: string;
}

/**
 * Starts the CLI program with the provided process arguments.
 */
export function run(argv: string[] = process.argv): void {
  const program = createProgram();

  if (argv.length <= 2) {
    program.help();
    return;
  }

  program.parse(argv);
}

/**
 * Creates and configures the Commander program used by the imgcon binary.
 */
function createProgram(): Command {
  const program = new Command();

  return program
    .name("imgcon")
    .description("A fast and modern CLI tool to convert image formats.")
    .version(readPackageVersion())
    .argument("[input]", "Input file or directory")
    .option(
      "-t, --to <format>",
      "Target image format (for example: png, webp, jpg, avif)",
    )
    .option("-o, --out <dir>", "Output folder (default: same as input)")
    .option("-r, --recursive", "Search directories recursively")
    .option(
      "-q, --quality <number>",
      "Quality of the output image (1-100) for supported formats",
    )
    .action(handleConvertCommand);
}

/**
 * Validates CLI options and runs the conversion workflow.
 */
async function handleConvertCommand(
  input: string | undefined,
  options: CliOptions,
): Promise<void> {
  if (!input) {
    createProgram().help();
    return;
  }

  if (!options.to) {
    logger.error("You must specify a target format using --to <format>.");
    process.exitCode = 1;
    return;
  }

  try {
    await processInput(input, options.to, options);
  } catch (error) {
    logger.error(toErrorMessage(error));
    process.exitCode = 1;
  }
}

/**
 * Reads the npm package version so CLI output stays aligned with package.json.
 */
function readPackageVersion(): string {
  const packageJsonUrl = new URL("../package.json", import.meta.url);
  const packageJsonPath = fileURLToPath(packageJsonUrl);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: string;
  };

  return packageJson.version ?? "0.0.0";
}

/**
 * Converts unknown thrown values into readable CLI error text.
 */
function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

run();
