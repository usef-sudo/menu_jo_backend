import { NODE_ENV } from "./env";

type LogFields = Record<string, unknown>;

function emit(
  level: "info" | "warn" | "error",
  message: string,
  fields?: LogFields,
): void {
  if (NODE_ENV === "production") {
    console.log(
      JSON.stringify({
        level,
        message,
        time: new Date().toISOString(),
        ...fields,
      }),
    );
    return;
  }
  const suffix = fields && Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : "";
  const line = `[${level}] ${message}${suffix}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, fields?: LogFields) => emit("info", message, fields),
  warn: (message: string, fields?: LogFields) => emit("warn", message, fields),
  error: (message: string, fields?: LogFields) => emit("error", message, fields),
};
