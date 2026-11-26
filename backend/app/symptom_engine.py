from typing import List


EMERGENCY_SYMPTOMS = {
    "chest pain": "cardiac_warning",
    "difficulty breathing": "respiratory_warning",
    "shortness of breath": "respiratory_warning",
    "unconsciousness": "consciousness_warning",
    "severe bleeding": "bleeding_warning",
    "stroke symptoms": "neurological_warning",
    "seizure": "neurological_warning",
}


def assess_symptoms(symptoms: List[str]) -> dict:

    normalized_symptoms = [
        symptom.strip().lower() for symptom in symptoms
    ]

    for symptom in normalized_symptoms:
        for warning, category in EMERGENCY_SYMPTOMS.items():

            if warning in symptom:

                return {
                    "level": "emergency",
                    "category": category,
                    "matched_warning": warning,
                    "action": "seek_emergency_medical_help",
                    "message": (
                        "A potential emergency warning sign was detected. "
                        "Seek emergency medical assistance immediately."
                    ),
                    "diagnosis": None,
                }

    return {
        "level": "routine",
        "category": "general",
        "matched_warning": None,
        "action": "monitor_symptoms_and_seek_medical_advice_if_needed",
        "message": (
            "No emergency warning signs were detected by this basic screening. "
            "This does not rule out serious illness. Seek medical advice "
            "if symptoms persist or worsen."
        ),
        "diagnosis": None,
    }