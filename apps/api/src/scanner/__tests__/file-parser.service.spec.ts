import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { FileParserService } from "../file-parser.service.js";

function csvBuffer(contents: string): Buffer {
  return Buffer.from(contents.trim() + String.fromCharCode(10), "utf8");
}

describe("FileParserService", () => {
  it("parses CSV files into normalized table rows", async () => {
    const service = new FileParserService();

    const tables = await service.parseFile(
      "players.csv",
      csvBuffer([
        " player_id , email , status ",
        "1, a@example.com , active ",
        "2, , blocked",
      ].join(String.fromCharCode(10))),
    );

    expect(tables).toEqual([
      {
        name: "players",
        rows: [
          { player_id: "1", email: "a@example.com", status: "active" },
          { player_id: "2", email: "", status: "blocked" },
        ],
      },
    ]);
  });

  it("rejects unsupported file formats", async () => {
    const service = new FileParserService();

    await expect(service.parseFile("players.json", Buffer.from("{}"))).rejects.toBeInstanceOf(BadRequestException);
  });
});
