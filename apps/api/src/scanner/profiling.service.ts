import { Injectable } from "@nestjs/common";
import type { ColumnProfile, TableProfile } from "@ai-readiness/shared";
import type { ParsedTable } from "./file-parser.service.js";

const missingTokens = new Set(["", "n/a", "na", "null", "undefined", "-", "--"]);

@Injectable()
export class ProfilingService {
  profileTables(tables: ParsedTable[]): TableProfile[] {
    return tables.map((table) => this.profileTable(table));
  }

  private profileTable(table: ParsedTable): TableProfile {
    const columns = [...new Set(table.rows.flatMap((row) => Object.keys(row)))];
    const duplicateRows = this.countDuplicateRows(table.rows);

    return {
      name: table.name,
      rowCount: table.rows.length,
      columnCount: columns.length,
      duplicateRows,
      duplicateRowsPercent: percentage(duplicateRows, table.rows.length),
      columns: columns.map((column) => this.profileColumn(column, table.rows)),
    };
  }

  private profileColumn(name: string, rows: Array<Record<string, unknown>>): ColumnProfile {
    const rawValues = rows.map((row) => row[name]);
    const normalizedValues = rawValues.map((value) => normalizeValue(value));
    const presentValues = normalizedValues.filter((value) => !isMissing(value));
    const uniqueValues = new Set(presentValues);

    return {
      name,
      inferredType: inferType(name, presentValues),
      totalRows: rows.length,
      missingCount: normalizedValues.length - presentValues.length,
      missingPercent: percentage(normalizedValues.length - presentValues.length, rows.length),
      uniqueCount: uniqueValues.size,
      uniquePercent: percentage(uniqueValues.size, rows.length),
      piiTypes: detectPiiTypes(name, presentValues),
      samplePatterns: detectSamplePatterns(presentValues),
    };
  }

  private countDuplicateRows(rows: Array<Record<string, unknown>>): number {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const row of rows) {
      const stable = JSON.stringify(
        Object.keys(row)
          .sort()
          .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = normalizeValue(row[key]);
            return acc;
          }, {}),
      );

      if (seen.has(stable)) {
        duplicates += 1;
      } else {
        seen.add(stable);
      }
    }

    return duplicates;
  }
}

export function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

export function isMissing(value: string): boolean {
  return missingTokens.has(value.trim().toLowerCase());
}

function inferType(name: string, values: string[]): string {
  const piiTypes = detectPiiTypes(name, values);

  if (piiTypes.includes("email")) {
    return "email";
  }

  if (piiTypes.includes("phone")) {
    return "phone";
  }

  if (values.length === 0) {
    return "empty";
  }

  const checks = {
    boolean: values.filter(isBooleanLike).length,
    number: values.filter(isNumberLike).length,
    date: values.filter(isDateLike).length,
    json: values.filter(isJsonLike).length,
  };

  const threshold = values.length * 0.8;
  const matching = Object.entries(checks).find(([, count]) => count >= threshold);

  return matching?.[0] ?? "string";
}

function detectPiiTypes(name: string, values: string[]): string[] {
  const lowerName = name.toLowerCase();
  const piiTypes = new Set<string>();

  const valueSample = values.slice(0, 1000);

  if (lowerName.includes("email") || ratio(valueSample, isEmailLike) > 0.2) {
    piiTypes.add("email");
  }

  if (lowerName.includes("phone") || lowerName.includes("mobile") || ratio(valueSample, isPhoneLike) > 0.2) {
    piiTypes.add("phone");
  }

  if (lowerName.includes("birth") || lowerName.includes("dob")) {
    piiTypes.add("date_of_birth");
  }

  if (lowerName.includes("address") || lowerName.includes("postcode") || lowerName.includes("zip")) {
    piiTypes.add("address");
  }

  if (lowerName.includes("ip") || ratio(valueSample, isIpLike) > 0.2) {
    piiTypes.add("ip_address");
  }

  if (lowerName.includes("passport") || lowerName.includes("national_id") || lowerName.includes("ssn")) {
    piiTypes.add("government_id");
  }

  if (lowerName.includes("first_name") || lowerName.includes("last_name") || lowerName === "name" || lowerName.endsWith("_name")) {
    piiTypes.add("person_name");
  }

  return [...piiTypes];
}

function detectSamplePatterns(values: string[]): string[] {
  const sample = values.slice(0, 1000);
  const patterns = new Set<string>();

  if (ratio(sample, isEmailLike) > 0.2) patterns.add("email");
  if (ratio(sample, isPhoneLike) > 0.2) patterns.add("phone");
  if (ratio(sample, isNumberLike) > 0.8) patterns.add("numeric");
  if (ratio(sample, isDateLike) > 0.8) patterns.add("date");
  if (ratio(sample, isJsonLike) > 0.5) patterns.add("json");
  if (ratio(sample, (value) => value.length > 80) > 0.5) patterns.add("long_text");

  return [...patterns];
}

function percentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return round((part / total) * 100);
}

function ratio(values: string[], predicate: (value: string) => boolean): number {
  if (values.length === 0) {
    return 0;
  }

  return values.filter(predicate).length / values.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhoneLike(value: string): boolean {
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(value)) {
    return false;
  }

  const digitCount = value.replace(/\D/g, "").length;
  return digitCount >= 7 && /^\+?[0-9][0-9\s().-]{6,}$/.test(value);
}

function isIpLike(value: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value);
}

function isNumberLike(value: string): boolean {
  return value !== "" && !Number.isNaN(Number(value.replace(/,/g, "")));
}

function isBooleanLike(value: string): boolean {
  return ["true", "false", "yes", "no", "0", "1"].includes(value.toLowerCase());
}

function isDateLike(value: string): boolean {
  const parsed = Date.parse(value);
  return value.length >= 6 && !Number.isNaN(parsed);
}

function isJsonLike(value: string): boolean {
  if (!value.startsWith("{") && !value.startsWith("[")) {
    return false;
  }

  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
