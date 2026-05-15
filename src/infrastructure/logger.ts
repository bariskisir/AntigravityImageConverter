/**
 * Provides terminal logging and spinner utilities for the CLI.
 */
import chalk from "chalk";
import ora, { type Ora } from "ora";

export interface Logger {
  /**
   * Writes an error message to stderr.
   */
  error(message: string): void;

  /**
   * Writes an informational message to stdout.
   */
  info(message: string): void;

  /**
   * Writes a success message to stdout.
   */
  success(message: string): void;

  /**
   * Writes a warning message to stderr.
   */
  warn(message: string): void;
}

export const logger: Logger = {
  error: logError,
  info: logInfo,
  success: logSuccess,
  warn: logWarning,
};

/**
 * Logs a successful operation in a consistent terminal style.
 */
function logSuccess(message: string): void {
  console.log(`${chalk.green("OK")} ${message}`);
}

/**
 * Logs an error message in a consistent terminal style.
 */
function logError(message: string): void {
  console.error(`${chalk.red("ERROR")} ${message}`);
}

/**
 * Logs a warning message in a consistent terminal style.
 */
function logWarning(message: string): void {
  console.warn(`${chalk.yellow("WARN")} ${message}`);
}

/**
 * Logs an informational message in a consistent terminal style.
 */
function logInfo(message: string): void {
  console.log(`${chalk.blue("INFO")} ${message}`);
}

/**
 * Creates a terminal spinner for long-running conversion work.
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}
