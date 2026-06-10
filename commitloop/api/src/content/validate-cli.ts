import { validateAllContent } from "./validate.js";

const issues = validateAllContent();

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`${issue.path}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("Content validation passed.");
