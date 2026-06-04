import { describe, expect, it } from "vitest";
import { ProfilingService } from "../profiling.service.js";

describe("ProfilingService", () => {
  it("profiles row counts, duplicate rows, missing values and inferred types", () => {
    const service = new ProfilingService();

    const [profile] = service.profileTables([
      {
        name: "customers",
        rows: [
          { customer_id: "1", email: "a@example.com", created_at: "2026-01-01", revenue: "10" },
          { customer_id: "2", email: "", created_at: "2026-01-02", revenue: "20" },
          { customer_id: "2", email: "", created_at: "2026-01-02", revenue: "20" },
        ],
      },
    ]);

    expect(profile).toMatchObject({
      name: "customers",
      rowCount: 3,
      columnCount: 4,
      duplicateRows: 1,
      duplicateRowsPercent: 33.33,
    });

    expect(profile?.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "email", inferredType: "email", missingCount: 2, missingPercent: 66.67, piiTypes: ["email"] }),
        expect.objectContaining({ name: "created_at", inferredType: "date" }),
        expect.objectContaining({ name: "revenue", inferredType: "number" }),
      ]),
    );
  });
});
