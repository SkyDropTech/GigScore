GigScore --- Synthetic Driver Earnings Statement Generator

This README explains how to generate a synthetic GigScore Driver
Earnings & Ride Statement PDF that matches the structure of the
reference statement.

Important: The generated statement is synthetic/demo data only. It
must not be presented as a real financial, employment, income, or
credit document.

Reference PDF Structure

The reference PDF is a one-page "GigScore - Driver Earnings & Ride
Statement" containing:

A document title

A synthetic/demo-data disclaimer

Driver information

A summary metrics table

A monthly earnings summary table

A final synthetic-data disclaimer

The reference contains driver/platform details followed by metrics such
as period, completed rides, gross earnings, platform fees, estimated
fuel costs, estimated net earnings, average monthly net income,
cancellation rate, and average rating. It also contains six monthly
records from March 2026 through August 2026.

Copy-Paste Prompt for ChatGPT

Copy the prompt below into ChatGPT whenever you want to generate a new
synthetic statement.

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

Example Input

For example, to create a statement for another synthetic driver, replace
the placeholders with:

Driver: Ayan Kumar
Driver ID: GS-DEMO-AK002
Platform: Uber
City: Pune
Vehicle: Car

Period: Mar 2026 - Aug 2026

You can also provide your own synthetic monthly values.

Data Consistency Rules

When supplying values, keep the calculations internally consistent:

Net earnings = Gross earnings − Platform fees − Estimated fuel
costs

Average monthly net income = Total net earnings ÷ number of
months

Completed rides = sum of monthly Trips

Monthly Net should equal Gross − Fees − Fuel.

Use the same currency notation throughout: INR.

Use a consistent month format such as YYYY-MM.

These rules make the generated PDF more useful for testing parsing and
ML feature-engineering pipelines.

Expected PDF Layout

The resulting PDF should visually follow this order:

GigScore - Driver Earnings & Ride Statement

DEMO / SYNTHETIC DATA - NOT A REAL FINANCIAL STATEMENT

Driver: ...
Driver ID: ...
Platform: ...
City: ...
Vehicle: ...

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

Why This Format Is Useful

This format is designed for a project pipeline where a user uploads a
PDF and the backend can:

1.Extract text from the PDF.

2.Identify driver and platform fields.

3.Parse financial metrics.

4.Extract monthly earnings records.

5.Convert the extracted values into ML features.

6.Run the resulting features through a credit/earnings assessment
model.

The reference PDF explicitly describes itself as synthetic data created
for testing the GigScore upload, parsing, feature-engineering, and ML
workflow.

Safety / Demo Data Notice

Use fictional names, IDs, earnings, trips, and other values when
generating test documents. Do not use the generated PDF as proof of
income, employment, identity, or financial history.