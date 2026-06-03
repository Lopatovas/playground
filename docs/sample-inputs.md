# Sample inputs

This folder contains CSV samples that can be uploaded through the web app or API.

## Files

| File | Purpose |
| --- | --- |
| [player-activity-risky.csv](sample-inputs/player-activity-risky.csv) | Messy gambling/iGaming-style activity export with PII, duplicates, missing values and ambiguous schema. |
| [player-activity-improved.csv](sample-inputs/player-activity-improved.csv) | Improved version for recurring comparison against the same dataset name. |
| [customer-export-minimal.csv](sample-inputs/customer-export-minimal.csv) | Small generic customer export for quickly exercising privacy findings. |

## Run with curl

Start the API first:

```bash
npm run dev:api
```

Or with Docker:

```bash
cp .env.sample .env
docker compose up --build
```

Upload the risky baseline scan:

```bash
curl -fsS \
  -H 'x-tenant-id: company-x' \
  -F 'datasetName=player_activity' \
  -F 'audience=mixed' \
  -F 'file=@docs/sample-inputs/player-activity-risky.csv;type=text/csv' \
  http://localhost:3000/scans/upload
```

Upload the improved recurring scan using the same dataset name:

```bash
curl -fsS \
  -H 'x-tenant-id: company-x' \
  -F 'datasetName=player_activity' \
  -F 'audience=mixed' \
  -F 'file=@docs/sample-inputs/player-activity-improved.csv;type=text/csv' \
  http://localhost:3000/scans/upload
```

The second response should include a `comparison` object because the dataset name matches the first scan.

## Expected findings for player-activity-risky.csv

The exact score can change as rules evolve, but this sample is designed to trigger:

- duplicate row finding for repeated `player_id=1002`
- PII findings for `email` and `phone`
- missing value findings for `signup_date`, `email`, `phone`, `status_old` or `notes`
- schema clarity finding for ambiguous `status_old`
- monitoring readiness warning if a stable timestamp is missing

## Expected improvements for player-activity-improved.csv

This sample removes direct email/phone values and adds clearer operational fields:

- `email_masked` instead of raw email
- `current_status` instead of `status_old`
- complete `created_at` timestamp
- no duplicate rows

It is not meant to be perfect; it is a compact demo for showing score movement and recurring comparison.

## XLSX samples

The API also accepts XLSX uploads. To create a manual XLSX sample, copy one of the CSV files into a spreadsheet and save it as `.xlsx`. The first row must contain headers.

## Data privacy note

These samples contain fake data only. Do not commit real customer exports, real player data, emails, phone numbers, IDs, addresses or regulated data into the repository.
