def flag_vital(kind: str, v: float, v2: float | None = None) -> str:
    if kind == "heart_rate": return "high" if v > 100 else "low" if v < 50 else "normal"
    if kind == "spo2":       return "low" if v < 94 else "normal"
    if kind == "temp":       return "fever" if v >= 38.0 else "low" if v < 35.5 else "normal"  # Celsius
    if kind == "bp":
        if v >= 180 or (v2 or 0) >= 120: return "crisis: seek care"
        if v >= 140 or (v2 or 0) >= 90:  return "high"
        if v >= 130 or (v2 or 0) >= 80:  return "elevated"
        return "normal"
    return "n/a"

def bmi(weight_kg: float, height_cm: float) -> dict:
    b = weight_kg / (height_cm / 100) ** 2
    cat = "underweight" if b < 18.5 else "normal" if b < 23 else "overweight" if b < 27.5 else "obese"  # Asian cutoffs
    return {"bmi": round(b, 1), "category": cat}
