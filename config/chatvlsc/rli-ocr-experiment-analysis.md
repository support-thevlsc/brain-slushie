# RLI OCR Experiment Analysis

## Decision

The local OCR path is suitable for a bounded pilot, not production ingestion. The synthetic benchmark met its field-accuracy target while preserving the privacy controls required for RLI records.

## Experiment

| Item | Value |
| --- | --- |
| Run date | 2026-07-13 |
| Inputs | 2 synthetic PDFs, 2 pages |
| Document types | One embedded-text PDF and one image-only PDF |
| Expected fields | 10 |
| Extraction order | PDF.js embedded text, then Tesseract.js fallback |
| Mean Tesseract confidence | 96.5% |
| Mean field accuracy | 100% (10/10) |
| Documents sent to review | 0 |
| Workbook formula errors | 0 |
| External OCR provider calls | 0 |

The benchmark uses generated fixtures only. It does not measure handwriting, damaged scans, rotated pages, multilingual content, dense tables, signatures, checkboxes, or real RLI document variation.

## Method

1. Generate one embedded-text PDF and one image-only PDF containing the same bounded field structure.
2. Inspect each page for usable embedded text.
3. Extract embedded text with PDF.js when the minimum character threshold is met.
4. Render and OCR image-only pages with local Tesseract.js.
5. Normalize approved fields into document and field records.
6. Compare normalized values with synthetic expected values.
7. Build the five-sheet Excel master database and inspect formula integrity.

## Findings

### Accuracy

Both extraction branches returned all expected values. This proves the routing and normalization logic for the fixture shape, but the two-document sample is too small to estimate production accuracy.

### Efficiency

Embedded text avoids OCR entirely. Image-only pages use local OCR, so no per-page provider request is required for the pilot. This keeps the critical path deterministic and reduces external data exposure.

### Privacy

- Source PDFs are not copied into output artifacts.
- Absolute source paths are not persisted.
- Page text is omitted by default.
- Production cloud ingestion is disabled.
- The workbook contains synthetic benchmark values only.

### Review Control

The review queue is empty for the benchmark because all expected values passed. Production thresholds must be calibrated on an approved, de-identified validation set before automated acceptance is enabled.

## Pilot Acceptance Gates

- Owner-approved retention period and storage jurisdiction.
- Private object storage binding with least-privilege access.
- De-identified validation corpus covering scan quality and document variation.
- Field-specific confidence thresholds and mandatory-review rules.
- D1 ingestion idempotency and duplicate-document tests.
- Human review audit trail for every corrected field.
- Verified server-side OpenAI binding before any Stage Three use.

## Changes

- Added a repeatable synthetic fixture generator, OCR runner, acceptance test, and workbook builder.
- Added a public-safe experiment status endpoint and homepage analytics view.
- Kept production ingestion and public source-document access disabled.

## User Impact

Reviewers can see measured benchmark evidence without seeing a source file, private path, credential, or RLI record. Operators get a repeatable baseline for deciding whether a larger controlled pilot is justified.

## App and Skill Usage

- Cloudflare Workers serves status and presentation surfaces.
- Local PDF.js and Tesseract.js perform extraction without a provider OCR call.
- Excel workbook generation consolidates document, field, review, rule, and dashboard records.
- GitHub receives sanitized configuration and documentation only.
- Notion remains the durable review and sign-off log.
