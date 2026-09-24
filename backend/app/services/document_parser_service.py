"""
Document Parser Service for GigScore.
Unified document processor supporting PDF, DOCX, and CSV formats.
Extracts driver identity, monthly earnings telemetry, and ML summaries.
"""
import io
import re
import os
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
import pandas as pd

from app.services.pdf_parser_service import PdfParserService

class DocumentParserService:
    @classmethod
    def parse_document(cls, file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Routes the document to the corresponding parser based on file extension.
        Returns standard dictionary with keys:
        - driver_info: Dict[str, Any]
        - monthly_records: List[Dict[str, Any]]
        - ml_summary: Dict[str, Any]
        - raw_text_length: int
        """
        clean_filename = os.path.basename(filename).lower() if filename else ""
        _, ext = os.path.splitext(clean_filename)

        if ext == ".pdf":
            return cls.parse_pdf(file_bytes, filename)
        elif ext == ".docx":
            return cls.parse_docx(file_bytes, filename)
        elif ext == ".csv":
            return cls.parse_csv(file_bytes, filename)
        else:
            # Try to detect if it's PDF or DOCX or text based on header magic bytes
            if file_bytes.startswith(b"%PDF"):
                return cls.parse_pdf(file_bytes, filename)
            elif file_bytes.startswith(b"PK\x03\x04"):
                return cls.parse_docx(file_bytes, filename)
            
            # Default empty parsing
            return {
                "driver_info": {},
                "ml_summary": {},
                "monthly_records": [],
                "raw_text_length": len(file_bytes)
            }

    @classmethod
    def parse_pdf(cls, file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """Parses PDF statement using PdfParserService."""
        return PdfParserService.parse_pdf(file_bytes, filename)

    @classmethod
    def parse_docx(cls, file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Parses DOCX document text from paragraphs and tables using python-docx,
        with a pure Python zipfile/XML fallback.
        """
        text_lines: List[str] = []

        # 1. Try python-docx
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            for p in doc.paragraphs:
                if p.text and p.text.strip():
                    text_lines.append(p.text.strip())
            for t in doc.tables:
                for row in t.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        text_lines.append("\t".join(row_cells))
        except Exception as docx_err:
            # 2. Fallback: Parse word/document.xml directly from zip archive
            try:
                with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
                    xml_content = z.read("word/document.xml")
                    root = ET.fromstring(xml_content)
                    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                    for p in root.iter(f"{{{ns['w']}}}p"):
                        p_text = "".join(node.text for node in p.iter(f"{{{ns['w']}}}t") if node.text)
                        if p_text.strip():
                            text_lines.append(p_text.strip())
            except Exception as zip_err:
                print(f"[DocxParser Warning] Could not parse docx XML: {docx_err} / {zip_err}")

        combined_text = "\n".join(text_lines)
        if not combined_text.strip():
            return {
                "driver_info": {},
                "ml_summary": {},
                "monthly_records": [],
                "raw_text_length": 0
            }

        return PdfParserService.parse_text(combined_text, filename)

    @classmethod
    def parse_csv(cls, file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Parses CSV statement into driver info and monthly records.
        """
        result: Dict[str, Any] = {
            "driver_info": {},
            "ml_summary": {},
            "monthly_records": [],
            "raw_text_length": len(file_bytes)
        }

        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
        except Exception as e:
            print(f"[CsvParser Warning] Failed to read CSV: {e}")
            return result

        if df.empty:
            return result

        # Standardize column names (lowercase, stripped)
        col_map = {c: str(c).strip().lower().replace(" ", "_") for c in df.columns}
        df = df.rename(columns=col_map)

        # Look for month/date column
        month_col = next((c for c in df.columns if "month" in c or "date" in c or "period" in c), None)
        gross_col = next((c for c in df.columns if "gross" in c or "earnings" in c), None)
        net_col = next((c for c in df.columns if "net" in c or "payout" in c), None)
        fee_col = next((c for c in df.columns if "fee" in c or "commission" in c or "platform" in c), None)
        cost_col = next((c for c in df.columns if "fuel" in c or "cost" in c or "deduction" in c), None)
        trips_col = next((c for c in df.columns if "trip" in c or "rides" in c), None)
        days_col = next((c for c in df.columns if "day" in c or "active" in c), None)

        records: List[Dict[str, Any]] = []
        for _, row in df.iterrows():
            m_val = str(row[month_col]).strip() if month_col and pd.notna(row[month_col]) else "2024-01"
            # Extract standard YYYY-MM if present
            m_match = re.search(r'(\d{4}[-/]\d{2})', m_val)
            month_str = m_match.group(1).replace("/", "-") if m_match else m_val

            gross = float(row[gross_col]) if gross_col and pd.notna(row[gross_col]) else 0.0
            net = float(row[net_col]) if net_col and pd.notna(row[net_col]) else gross * 0.75
            fee = float(row[fee_col]) if fee_col and pd.notna(row[fee_col]) else gross * 0.20
            cost = float(row[cost_col]) if cost_col and pd.notna(row[cost_col]) else gross * 0.05
            trips = int(row[trips_col]) if trips_col and pd.notna(row[trips_col]) else 150
            days = int(row[days_col]) if days_col and pd.notna(row[days_col]) else 24

            records.append({
                "month": month_str,
                "trips": trips,
                "active_days": days,
                "gross_income": gross,
                "platform_fee": fee,
                "other_costs": cost,
                "net_income": net,
                "completion_rate": 0.95,
                "cancellation_rate": 0.04,
                "avg_rating": 4.8,
                "peak_hour_share": 0.45,
                "weekend_share": 0.35
            })

        result["monthly_records"] = records
        if records:
            net_incomes = [r["net_income"] for r in records]
            result["ml_summary"] = {
                "avg_monthly_net_income": sum(net_incomes) / len(net_incomes),
                "trips_per_month": sum(r["trips"] for r in records) / len(records),
                "active_days_monthly": sum(r["active_days"] for r in records) / len(records),
                "completion_rate": 0.95,
                "cancellation_rate": 0.04,
                "avg_rating": 4.8
            }

        return result
