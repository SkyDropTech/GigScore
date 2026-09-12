"""
PDF Statement Parser Service.
Extracts driver identity, monthly earnings, deductions, trip telemetry,
and ML feature summaries from uploaded PDF statements using pypdf.
"""
import re
import io
from typing import Dict, Any, List, Optional
from pypdf import PdfReader

class PdfParserService:
    @staticmethod
    def _clean_num(val_str: str) -> float:
        """Strips currency symbols, commas, spaces and converts to float."""
        if not val_str:
            return 0.0
        cleaned = re.sub(r'[^\d.-]', '', val_str)
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @classmethod
    def parse_pdf(cls, file_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Parses text from PDF bytes and extracts driver profile and monthly telemetry records.
        """
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            full_text = "\n".join([page.extract_text() or "" for page in reader.pages])
        except Exception as e:
            raise ValueError(f"Could not read PDF structure: {str(e)}")

        if not full_text.strip():
            raise ValueError("Uploaded PDF appears to be empty or contains scanned images without text.")

        return cls.parse_text(full_text, filename)

    @classmethod
    def parse_text(cls, text: str, filename: str = "") -> Dict[str, Any]:
        """Extracts metadata and monthly records from extracted statement text."""
        result: Dict[str, Any] = {
            "driver_info": {},
            "ml_summary": {},
            "monthly_records": [],
            "raw_text_length": len(text)
        }

        # 1. Driver Metadata Extraction
        driver_m = re.search(r'Driver:\s*([A-Za-z\s\.\-]+?)(?:\s+(?:ID|Platform|City|Vehicle)|\n|$)', text, re.I)
        if driver_m:
            result["driver_info"]["name"] = driver_m.group(1).strip()

        id_m = re.search(r'(?:Driver\s*ID|ID):\s*([A-Za-z0-9_\-]+)', text, re.I)
        if id_m:
            result["driver_info"]["driver_id"] = id_m.group(1).strip()

        plat_m = re.search(r'Platform:\s*([A-Za-z0-9\s&]+?)(?:\s+(?:City|Vehicle|Period)|\n|$)', text, re.I)
        if plat_m:
            result["driver_info"]["platform"] = plat_m.group(1).strip()

        city_m = re.search(r'City:\s*([A-Za-z\s]+?)(?:\s+(?:Vehicle|Period)|\n|$)', text, re.I)
        if city_m:
            result["driver_info"]["city"] = city_m.group(1).strip()

        veh_m = re.search(r'Vehicle:\s*([A-Za-z0-9\s\(\)]+?)(?:\s+(?:Period)|\n|$)', text, re.I)
        if veh_m:
            result["driver_info"]["vehicle"] = veh_m.group(1).strip()

        period_m = re.search(r'Period:\s*([A-Za-z0-9\s–\-]+?)(?:\n|$)', text, re.I)
        if period_m:
            result["driver_info"]["period"] = period_m.group(1).strip()

        # 2. Extract ML Feature Summary if present
        ml_patterns = {
            "avg_monthly_net_income": r'avg_monthly_net_income\s+[^\d]*([\d,.]+)',
            "income_std": r'income_std\s+[^\d]*([\d,.]+)',
            "coefficient_of_variation": r'coefficient_of_variation\s+([\d,.]+)',
            "min_income": r'min_income\s+[^\d]*([\d,.]+)',
            "income_slope_3m": r'income_slope_3m\s+[^\d]*([\d,.]+)',
            "recent_vs_historical_income": r'recent_vs_historical_income\s+([\d,.]+)',
            "estimated_disposable_income": r'estimated_disposable_income\s+[^\d]*([\d,.]+)',
            "active_days_monthly": r'active_days_monthly\s+([\d,.]+)',
            "trips_per_month": r'trips_per_month\s+([\d,.]+)',
            "trips_per_day": r'trips_per_day\s+([\d,.]+)',
            "completion_rate": r'completion_rate\s+([\d,.]+)%?',
            "cancellation_rate": r'cancellation_rate\s+([\d,.]+)%?',
            "avg_rating": r'avg_rating\s+([\d,.]+)(?:/5)?'
        }
        for feat, pat in ml_patterns.items():
            m = re.search(pat, text, re.I)
            if m:
                val = cls._clean_num(m.group(1))
                if feat in ["completion_rate", "cancellation_rate"] and val > 1.0:
                    val = val / 100.0
                result["ml_summary"][feat] = val

        # Fallback rate checks from general summary header (e.g. Cancellation rate: 3.6%, Average rating: 4.78)
        if "cancellation_rate" not in result["ml_summary"]:
            canc_m = re.search(r'Cancellation rate\s*[:\s]+([\d.]+)%?', text, re.I)
            if canc_m:
                result["ml_summary"]["cancellation_rate"] = float(canc_m.group(1)) / 100.0

        if "avg_rating" not in result["ml_summary"]:
            rat_m = re.search(r'Average rating\s*[:\s]+([\d.]+)(?:\s*/\s*5)?', text, re.I)
            if rat_m:
                result["ml_summary"]["avg_rating"] = float(rat_m.group(1))

        default_trips_month = result["ml_summary"].get("trips_per_month", 0.0)
        default_active_days = int(round(result["ml_summary"].get("active_days_monthly", 0.0)))
        default_comp_rate = result["ml_summary"].get("completion_rate", 0.0)
        default_canc_rate = result["ml_summary"].get("cancellation_rate", 0.0)
        default_rating = result["ml_summary"].get("avg_rating", 0.0)

        records: List[Dict[str, Any]] = []

        # Pattern 1: YYYY-MM Trips Active_Days Gross Fees Fuel Net
        p1 = re.compile(
            r'(\d{4}-\d{2})[\s\n]+(\d+)[\s\n]+(\d+)[\s\n]+(?:INR\s*)?([\d,]+(?:\.\d+)?)[\s\n]+(?:INR\s*)?([\d,]+(?:\.\d+)?)[\s\n]+(?:INR\s*)?([\d,]+(?:\.\d+)?)[\s\n]+(?:INR\s*)?([\d,]+(?:\.\d+)?)',
            re.I
        )
        for m in p1.finditer(text):
            records.append({
                "month": m.group(1),
                "trips": int(m.group(2)),
                "active_days": int(m.group(3)),
                "gross_income": cls._clean_num(m.group(4)),
                "platform_fee": cls._clean_num(m.group(5)),
                "other_costs": cls._clean_num(m.group(6)),
                "net_income": cls._clean_num(m.group(7)),
                "completion_rate": default_comp_rate,
                "cancellation_rate": default_canc_rate,
                "avg_rating": default_rating,
                "peak_hour_share": 0.0,
                "weekend_share": 0.0
            })

        # If Pattern 1 did not find records, try Pattern 2 (Abhishek Shedge format)
        if not records:
            month_map = {
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            }
            p2 = re.compile(
                r'([A-Za-z]{3}[-\s]\d{4})[^\d\w]*([\d,]+(?:\.\d+)?)[^\d\w]*([\d,]+(?:\.\d+)?)[^\d\w]*([\d,]+(?:\.\d+)?)[^\d\w]*([\d,]+(?:\.\d+)?)[^\d\w]*([\d,]+(?:\.\d+)?)[^\d\w]*([\d.]+)%?',
                re.I
            )
            for m in p2.finditer(text):
                raw_m = m.group(1).strip()
                clean_m = raw_m.replace(" ", "-")
                parts = clean_m.split("-")
                if len(parts) == 2:
                    mon_name = parts[0].lower()[:3]
                    yr = parts[1]
                    if mon_name in month_map:
                        month_val = f"{yr}-{month_map[mon_name]}"
                    else:
                        month_val = clean_m
                else:
                    month_val = clean_m

                gross_val = cls._clean_num(m.group(2))
                work_net_val = cls._clean_num(m.group(3))
                living_val = cls._clean_num(m.group(4))
                tot_exp_val = cls._clean_num(m.group(5))
                savings_val = cls._clean_num(m.group(6))

                diff_deductions = max(0.0, gross_val - work_net_val)
                platform_fee = round(diff_deductions * 0.70, 2)
                other_costs = round(diff_deductions * 0.30, 2)

                trips_calc = int(round(default_trips_month))
                days_calc = int(round(default_active_days))

                records.append({
                    "month": month_val,
                    "gross_income": gross_val,
                    "platform_fee": platform_fee,
                    "other_costs": other_costs,
                    "net_income": work_net_val,
                    "living_expenses": living_val,
                    "total_expenses": tot_exp_val,
                    "savings": savings_val,
                    "active_days": days_calc,
                    "trips": trips_calc,
                    "completion_rate": default_comp_rate,
                    "cancellation_rate": default_canc_rate,
                    "avg_rating": default_rating,
                    "peak_hour_share": 0.0,
                    "weekend_share": 0.0
                })

        records.sort(key=lambda r: r.get("month", ""))
        result["monthly_records"] = records
        return result
