# API usage

Base URL in local Docker setup:

```text
http://localhost:3000
```

## Health

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

## Upload and scan a dataset

```http
POST /scans/upload
Content-Type: multipart/form-data
```

Form fields:

| Field | Required | Description |
| --- | --- | --- |
| `file` | yes | CSV or XLSX file |
| `datasetName` | no | Logical dataset name. Used for recurring comparison. |
| `audience` | no | Report audience: `mixed`, `executive`, `technical`, `compliance`, `ai-implementation`. |

Example:

```bash
curl -fsS \
  -F 'datasetName=player_activity' \
  -F 'audience=mixed' \
  -F 'file=@docs/sample-inputs/player-activity-risky.csv;type=text/csv' \
  http://localhost:3000/scans/upload
```

Response shape:

```ts
interface ScanReport {
  scanId: string;
  datasetName: string;
  status: "completed";
  createdAt: string;
  completedAt: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown[];
  summary: ReportSummary;
  actionPlan: ActionItem[];
  profiles: TableProfile[];
  findings: ScanFinding[];
  comparison?: ScanComparison;
}
```

## List scans

```http
GET /scans
```

Returns lightweight scan history items from the current API process memory.

## Get a report

```http
GET /scans/:scanId/report
```

Returns the same `ScanReport` shape produced by upload.

## Recurring comparison behavior

A scan is compared with the most recent previous scan where `datasetName` matches case-insensitively. In the current prototype, this comparison only works while the API process remains alive because persistence is in memory.
