"""Medicine interactions. DEMO DATA ONLY: replace with a verified source (RxNav, DrugBank, CDSCO)."""
INTERACTIONS = {
    frozenset({"warfarin", "aspirin"}): "Increased bleeding risk. Ask your doctor.",
    frozenset({"ibuprofen", "aspirin"}): "May reduce aspirin's heart protection and irritate the stomach.",
    frozenset({"metformin", "alcohol"}): "Raises risk of lactic acidosis.",
}

def check_interactions(meds: list[str]) -> list[dict]:
    meds = [m.strip().lower() for m in meds]
    out = []
    for i, a in enumerate(meds):
        for b in meds[i + 1:]:
            note = INTERACTIONS.get(frozenset({a, b}))
            if note:
                out.append({"pair": [a, b], "warning": note})
    return out
