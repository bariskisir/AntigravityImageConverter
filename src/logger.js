import chalk from "chalk";
import ora from "ora";

export const logger = {
  success: (message) => console.log(chalk.green("✔") + " " + message),
  error: (message) => console.error(chalk.red("✖ Error:") + " " + message),
  warn: (message) => console.warn(chalk.yellow("⚠ Warning:") + " " + message),
  info: (message) => console.log(chalk.blue("ℹ") + " " + message),
};

export const createSpinner = (text) => {
  return ora(text);
};
