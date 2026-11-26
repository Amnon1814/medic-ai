"""
Symptom assessment:
Safety rules first, followed by structured LLM output
grounded in RAG.
"""

import json

from .safety import check_emergency, EMERGENCY_MESSAGE
from .rag import ask_llm


URGENCY = [
    "emergency",
    "urgent_care_today",
    "see_doctor_soon",
    "self_care"
]

VALID_SEVERITIES = [
    "Mild",
    "Moderate",
    "Severe"
]


PROMPT = """
You are Medic.AI, an AI-powered healthcare information assistant.

Patient information:

Symptoms: {symptoms}
Age: {age}
Sex: {sex}
Duration: {duration}
Symptom severity: {severity}

Instructions:

1. Consider the reported symptoms and their severity.
2. Consider the patient's age, sex and symptom duration.
3. Do not provide a definitive medical diagnosis.
4. Possible explanations must not be presented as confirmed diseases.
5. Recommend an appropriate medical specialty when necessary.
6. Provide up to three relevant follow-up questions.
7. Provide safe and practical next steps.
8. Consider urgent medical attention when symptoms indicate
   potentially serious conditions.
9. Never prescribe medicines or dosages.
10. Use simple language.

Return ONLY valid JSON in this format:

{{
    "urgency": "one of {urg}",
    "possible_explanations": [
        "short explanation"
    ],
    "specialty": "appropriate doctor type",
    "follow_up_questions": [
        "question"
    ],
    "advice": "short next steps"
}}
"""


def assess(
    symptoms: str,
    age: int,
    sex: str,
    duration: str,
    severity: str,
    lang: str
) -> dict:

    # Validate severity.
    if severity not in VALID_SEVERITIES:
        severity = "Moderate"

    # ------------------------------------------------
    # EMERGENCY SAFETY CHECK
    # ------------------------------------------------

    if check_emergency(symptoms):

        emergency_advice = EMERGENCY_MESSAGE.get(
            lang,
            EMERGENCY_MESSAGE.get(
                "en",
                "Seek emergency medical attention immediately."
            )
        )

        return {
            "urgency": "emergency",
            "possible_explanations": [],
            "specialty": "Emergency medicine",
            "follow_up_questions": [],
            "advice": emergency_advice,
            "sources": []
        }

    # ------------------------------------------------
    # LLM ASSESSMENT
    # ------------------------------------------------

    prompt = PROMPT.format(
        symptoms=symptoms,
        age=age,
        sex=sex,
        duration=duration,
        severity=severity,
        urg=URGENCY
    )

    out = ask_llm(prompt, lang)

    # ------------------------------------------------
    # PARSE STRUCTURED RESPONSE
    # ------------------------------------------------

    try:

        answer = out.get("answer", "")

        txt = (
            answer.strip()
            .removeprefix("```json")
            .removesuffix("```")
            .strip()
        )

        data = json.loads(txt)

        if data.get("urgency") not in URGENCY:
            data["urgency"] = "see_doctor_soon"

        if not isinstance(
            data.get("possible_explanations"),
            list
        ):
            data["possible_explanations"] = []

        if not isinstance(
            data.get("follow_up_questions"),
            list
        ):
            data["follow_up_questions"] = []

        if not isinstance(data.get("specialty"), str):
            data["specialty"] = "General physician"

        if not isinstance(data.get("advice"), str):
            data["advice"] = "Please consult a healthcare professional."

    except Exception:

        data = {
            "urgency": "see_doctor_soon",
            "possible_explanations": [],
            "specialty": "General physician",
            "follow_up_questions": [],
            "advice": (
                out.get("answer", "")
                if isinstance(out, dict)
                else str(out)
            )
        }

    data["sources"] = (
        out.get("sources", [])
        if isinstance(out, dict)
        else []
    )

    return data