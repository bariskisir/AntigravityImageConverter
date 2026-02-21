import { Command } from "commander";
import { logger } from "./logger.js";
import { processInput } from "./converter.js";

const program = new Command();

export function run(argv) {
  program
    .name("agimgconv")
    .description("A fast and modern CLI tool to convert image formats.")
    .version("1.0.2")
    .argument("[input]", "Input file or directory")
    .option(
      "-t, --to <format>",
      "Target image format (e.g., png, webp, jpg, avif)",
    )
    .option("-o, --out <dir>", "Output folder (default: same as input)")
    .option("-r, --recursive", "Search directories recursively")
    .option(
      "-q, --quality <number>",
      "Quality of the output image (1-100) for supported formats",
    )
    .action(async (input, options) => {
      if (!input) {
        program.help();
        return;
      }

      if (!options.to) {
        logger.error("You must specify a target format using --to <format>");
        process.exit(1);
      }

      try {
        await processInput(input, options.to.toLowerCase(), options);
      } catch (err) {
        logger.error(err.message);
        process.exit(1);
      }
    });

  if (argv.length <= 2) {
    program.help();
  } else {
    program.parse(argv);
  }
}
