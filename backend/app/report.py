import re
import os
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

# ==========================================
# 1. MEDICAL REFERENCE RANGES
# ==========================================

REFERENCE_RANGES = {
    "hemoglobin": (12.0, 17.5, "g/dL"),
    "glucose": (70, 140, "mg/dL"),
    "total cholesterol": (0, 200, "mg/dL"),
    "hdl": (40, 60, "mg/dL"),
    "ldl": (0, 100, "mg/dL"),
    "triglycerides": (0, 150, "mg/dL"),
    "creatinine": (0.6, 1.3, "mg/dL"),
    "urea": (7, 20, "mg/dL"),
    "uric acid": (3.5, 7.2, "mg/dL"),
}


# ==========================================
# 2. PDF TEXT EXTRACTION
# ==========================================

def extract_pdf_text(file_path: str) -> str:
    """Extract text from a medical PDF report."""

    try:
        document = fitz.open(file_path)
        extracted_text = ""

        for page in document:
            extracted_text += page.get_text() + "\n"

        document.close()
        return extracted_text.strip()

    except Exception as e:
        raise ValueError(f"Unable to extract PDF text: {str(e)}")


# ==========================================
# 3. IMAGE TEXT EXTRACTION
# ==========================================

def extract_text(file_path: str) -> str:
    """Extract text from a medical report image using OCR."""

    try:
        image = Image.open(file_path)
        extracted_text = pytesseract.image_to_string(image)

        return extracted_text.strip()

    except Exception as e:
        raise ValueError(f"Unable to extract image text: {str(e)}")


# ==========================================
# 4. MEDICAL VALUE DETECTION
# ==========================================

def extract_medical_values(text: str) -> list:
    """Extract recognized medical parameters and numeric values."""

    findings = []

    for parameter, ranges in REFERENCE_RANGES.items():

        minimum, maximum, unit = ranges

        pattern = rf"{re.escape(parameter)}\s*[:\-]?\s*(\d+\.?\d*)"

        matches = re.findall(pattern, text, re.IGNORECASE)

        for match in matches:

            value = float(match)

            if value < minimum:
                status = "Low"

            elif value > maximum:
                status = "High"

            else:
                status = "Normal"

            findings.append({
                "parameter": parameter.title(),
                "value": value,
                "unit": unit,
                "normal_range": f"{minimum}-{maximum}",
                "status": status
            })

    return findings


# ==========================================
# 5. REPORT ANALYSIS
# ==========================================

def analyze(text: str) -> list:
    """Analyze extracted medical report text."""

    if not text or not text.strip():
        return []

    findings = extract_medical_values(text)

    return findings


# ==========================================
# 6. REPORT SUMMARY
# ==========================================

def generate_summary(findings: list) -> str:
    """Generate a simple summary of report findings."""

    if not findings:
        return "No recognizable medical parameters were detected in this report."

    abnormal = [
        finding for finding in findings
        if finding["status"] != "Normal"
    ]

    if not abnormal:
        return "All recognized parameters are within the configured reference ranges."

    summary = "The following parameters require attention:\n"

    for finding in abnormal:
        summary += (
            f"- {finding['parameter']}: "
            f"{finding['value']} {finding['unit']} "
            f"({finding['status']})\n"
        )

    return summary