import { BadRequestException, Injectable } from "@nestjs/common";
import { parse } from "csv-parse/sync";
import readXlsxFile from "read-excel-file/node";

export interface ParsedTable {
  name: string;
  rows: Array<Record<string, unknown>>;
}

@Injectable()
export class FileParserService {
  async parseFile(fileName: string, buffer: Buffer): Promise<ParsedTable[]> {
    const extension = fileName.toLowerCase().split(".").pop();

    if (extension === "csv") {
      return [this.parseCsv(fileName, buffer)];
    }

    if (extension === "xlsx") {
      return [await this.parseWorkbook(fileName, buffer)];
    }

    throw new BadRequestException("Only CSV and XLSX uploads are supported.");
  }

  private parseCsv(fileName: string, buffer: Buffer): ParsedTable {
    const rows = parse(buffer.toString("utf8"), {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, unknown>>;

    return {
      name: fileName.replace(/\.[^.]+$/, ""),
      rows: this.normalizeRows(rows),
    };
  }

  private async parseWorkbook(fileName: string, buffer: Buffer): Promise<ParsedTable> {
    const sheetRows = (await readXlsxFile(buffer)) as unknown as unknown[][];
    const [headerRow = [], ...dataRows] = sheetRows;
    const headers = headerRow.map((value: unknown, index: number) => normalizeHeader(value, index + 1));

    const rows = dataRows.map((row) => {
      const record: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        record[header] = normalizeCellValue(row[index]);
      });

      return record;
    });

    return {
      name: fileName.replace(/\.[^.]+$/, ""),
      rows: this.normalizeRows(rows),
    };
  }

  private normalizeRows(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    return rows.map((row) => {
      const normalized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.trim() || "unnamed_column";
        normalized[normalizedKey] = typeof value === "string" ? value.trim() : value;
      }

      return normalized;
    });
  }
}

function normalizeHeader(value: unknown, columnNumber: number): string {
  const normalized = normalizeCellValue(value).trim();
  return normalized || `unnamed_column_${columnNumber}`;
}

function normalizeCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}
