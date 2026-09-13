# GigScore — Synthetic Driver Earnings Statement Generator

Generate a **synthetic** GigScore "Driver Earnings & Ride Statement" PDF
that mirrors the structure of the reference statement — for testing
upload, parsing, feature-engineering, and ML pipelines.

> ⚠️ **This tool produces demo data only.** Generated PDFs must never be
> presented as real financial, employment, income, or credit documents.

---

## Contents

- [Overview](#overview)
- [Reference PDF Structure](#reference-pdf-structure)
- [Quick Start: Copy-Paste Prompt](#quick-start-copy-paste-prompt)
- [Example Input](#example-input)
- [Data Consistency Rules](#data-consistency-rules)
- [Expected PDF Layout](#expected-pdf-layout)
- [Why This Format Is Useful](#why-this-format-is-useful)
- [Safety / Demo Data Notice](#safety--demo-data-notice)

---

## Overview

This README documents how to generate a synthetic, one-page **GigScore
Driver Earnings & Ride Statement** PDF using Python and ReportLab. The
output is designed to exercise a backend pipeline that:

1. Extracts text from an uploaded PDF
2. Identifies driver and platform fields
3. Parses financial metrics
4. Extracts monthly earnings records
5. Converts extracted values into ML features
6. Runs those features through a downstream assessment model

All generated documents are clearly and repeatedly labeled as synthetic
so they can't be mistaken for genuine records.

---

## Reference PDF Structure

The reference PDF is a one-page statement containing, in order:

| # | Section |
|---|---------|
| 1 | Document title |
| 2 | Synthetic/demo-data disclaimer |
| 3 | Driver information |
| 4 | Summary metrics table |
| 5 | Monthly earnings summary table |
| 6 | Final synthetic-data disclaimer |

The summary table covers: period, completed rides, gross earnings,
platform fees, estimated fuel costs, estimated net earnings, average
monthly net income, cancellation rate, and average rating.

The monthly table contains one row per month — the reference example
spans **March 2026 through August 2026** (six months).

---

## Quick Start: Copy-Paste Prompt

Paste the block below into ChatGPT (or another code-generation
assistant) whenever you need a new synthetic statement. Replace the
bracketed placeholders with your own synthetic values.

```text
Create a one-page PDF named [FILENAME].pdf using Python and ReportLab.

The PDF must be a synthetic/demo document for testing a GigScore upload, parsing, feature-engineering, and ML workflow. It must NOT represent real earnings, employment, financial history, or a real financial statement.

Use this exact document structure and headers:

[DOCUMENT HEADER]
Title: GigScore - Driver Earnings & Ride Statement
Disclaimer: DEMO / SYNTHETIC DATA - NOT A REAL FINANCIAL STATEMENT

[SUMMARY TABLE]
Use a two-column table with the exact headers:
Metric | Value

Include these rows:
Period | [START MONTH] - [END MONTH]
Completed rides | [TOTAL RIDES]
Gross earnings | INR [GROSS EARNINGS]
Platform fees | INR [PLATFORM FEES]
Estimated fuel costs | INR [FUEL COSTS]
Estimated net earnings | INR [NET EARNINGS]
Average monthly net income | INR [AVERAGE MONTHLY NET]
Cancellation rate | [CANCELLATION RATE]%
Average rating | [RATING] / 5

[MONTHLY EARNINGS SUMMARY]
Heading:
Monthly Earnings Summary

Use a seven-column table with these exact headers:
Month | Trips | Active Days | Gross | Fees | Fuel | Net

Add one row for each requested month:
[YYYY-MM] | [TRIPS] | [ACTIVE DAYS] | INR [GROSS] | INR [FEES] | INR [FUEL] | INR [NET]

[FINAL DISCLAIMER]
Add this exact text at the bottom:

Synthetic records created for testing the GigScore upload, parsing, feature-engineering and ML workflow. They do not represent real earnings, employment or financial history.

FORMATTING REQUIREMENTS:
1. Generate the PDF with ReportLab.
2. Keep it to one page if possible.
3. Make the title large and bold.
4. Put the demo/synthetic disclaimer near the top in bold/italic styling.
5. Display driver information clearly.
6. Use bordered tables with readable column headings.
7. Use INR for all monetary values.
8. Keep the visual structure similar to a professional earnings statement.
9. Do not add extra sections, logos, signatures, bank details, tax information, credit scores, or claims that are not requested above.
10. Ensure all text is selectable/searchable in the PDF so a PDF parser/regex engine can extract it.
11. Use the exact field names and headings specified above.
12. Save the final file as [FILENAME].pdf and provide a download link.
13. Before finishing, verify that the PDF was successfully generated and contains all required sections.
```

---

## Example Input

To generate a statement for a different synthetic driver, swap in
values like:

```
Driver:    Ayan Kumar
Driver ID: GS-DEMO-AK002
Platform:  Uber
City:      Pune
Vehicle:   Car

Period:    Mar 2026 - Aug 2026
```

You can supply your own synthetic monthly figures as well — just follow
the consistency rules below.

---

## Data Consistency Rules

Keep generated values internally consistent so the output is realistic
enough to be useful for pipeline testing:

- **Net earnings** = Gross earnings − Platform fees − Estimated fuel costs
- **Average monthly net income** = Total net earnings ÷ number of months
- **Completed rides** = sum of monthly Trips
- **Monthly Net** = Monthly Gross − Monthly Fees − Monthly Fuel
- Use **INR** consistently for every monetary value
- Use a consistent month format, e.g. `YYYY-MM`

---

## Expected PDF Layout

```
GigScore - Driver Earnings & Ride Statement

DEMO / SYNTHETIC DATA - NOT A REAL FINANCIAL STATEMENT


┌──────────────────────────┬─────────────────────────┐
│ Metric                   │ Value                   │
├──────────────────────────┼─────────────────────────┤
│ Period                   │ ...                     │
│ Completed rides          │ ...                     │
│ Gross earnings           │ INR ...                 │
│ Platform fees            │ INR ...                 │
│ Estimated fuel costs     │ INR ...                 │
│ Estimated net earnings   │ INR ...                 │
│ Average monthly net      │ INR ...                 │
│ Cancellation rate        │ ...%                    │
│ Average rating           │ ... / 5                 │
└──────────────────────────┴─────────────────────────┘

Monthly Earnings Summary

┌─────────┬───────┬─────────────┬──────────┬──────────┬──────────┬──────────┐
│ Month   │ Trips │ Active Days │ Gross    │ Fees     │ Fuel     │ Net      │
├─────────┼───────┼─────────────┼──────────┼──────────┼──────────┼──────────┤
│ ...     │ ...   │ ...         │ INR ...  │ INR ...  │ INR ...  │ INR ...  │
└─────────┴───────┴─────────────┴──────────┴──────────┴──────────┴──────────┘

Synthetic records created for testing the GigScore upload,
parsing, feature-engineering and ML workflow. They do not
represent real earnings, employment or financial history.
```

---

## Why This Format Is Useful

This layout is designed for a pipeline where a user uploads a PDF and
the backend:

1. Extracts text from the PDF
2. Identifies driver and platform fields
3. Parses financial metrics
4. Extracts monthly earnings records
5. Converts extracted values into ML features
6. Runs the resulting features through a credit/earnings assessment model

Every generated PDF explicitly states that it is synthetic data created
for testing the GigScore upload, parsing, feature-engineering, and ML
workflow.

---

## Safety / Demo Data Notice

- Use **fictional** names, IDs, earnings, trips, and other values when
  generating test documents.
- Do **not** use a generated PDF as proof of income, employment,
  identity, or financial history.
- Keep both disclaimers (top and bottom) intact in every generated
  document — they are required, not optional decoration.

---

## Render Deployment & Anti-Sleep Keep-Alive Bot
If hosting the backend on Render's free tier, Render automatically sleeps instances after 15 minutes of inactivity. To prevent this, GigScore includes built-in UptimeRobot integration and self-ping keepalive.
See [RENDER_KEEPALIVE_UPTIMEROBOT_GUIDE.md](file:///d:/GigScore/RENDER_KEEPALIVE_UPTIMEROBOT_GUIDE.md) for 2-minute setup instructions.
