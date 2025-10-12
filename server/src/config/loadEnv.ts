import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(process.cwd(), "../../.env")
];

for (const path of candidates) {
  if (!existsSync(path)) continue;

  try {
    const contents = readFileSync(path, "utf-8");
    contents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .forEach((line) => {
        const equalsIndex = line.indexOf("=");
        if (equalsIndex === -1) return;
        const key = line.slice(0, equalsIndex).trim();
        const value = line.slice(equalsIndex + 1).trim();

        if (!(key in process.env)) {
          process.env[key] = value;
        }
      });
    break;
  } catch (error) {
    console.warn(`Unable to read env file at ${path}:`, error);
  }
}
