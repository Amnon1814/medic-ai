import re
from typing import Optional


# =========================================================
# EMERGENCY MESSAGES
# =========================================================

EMERGENCY_MESSAGE = {
    "en": (
        "🚨 THIS MAY BE AN EMERGENCY.\n\n"
        "If you are experiencing severe symptoms, please contact your local "
        "emergency services immediately or go to the nearest emergency "
        "department. Do not delay seeking professional medical help."
    ),
    "ml": (
        "🚨 ഇത് അടിയന്തര സാഹചര്യമാകാം.\n\n"
        "ഗുരുതരമായ ലക്ഷണങ്ങൾ അനുഭവപ്പെടുകയാണെങ്കിൽ ഉടൻ അടിയന്തര "
        "സേവനങ്ങളുമായി ബന്ധപ്പെടുക അല്ലെങ്കിൽ അടുത്തുള്ള ആശുപത്രിയിലെ "
        "എമർജൻസി വിഭാഗത്തിലേക്ക് പോകുക. വൈദ്യസഹായം തേടുന്നത് വൈകിക്കരുത്."
    ),
}


# =========================================================
# MENTAL HEALTH CRISIS MESSAGES
# =========================================================

CRISIS_MESSAGE = {
    "en": (
        "I'm really sorry that you're experiencing this. You don't have to "
        "face this alone, and your safety matters.\n\n"
        "If you think you might hurt yourself or are in immediate danger, "
        "please call emergency services now or go to the nearest emergency "
        "department.\n\n"
        "If possible, move away from anything you could use to hurt yourself "
        "and stay with someone you trust.\n\n"
        "If you're in India, call 112 for emergency assistance. You can also "
        "contact Tele-MANAS at 14416 for mental health support.\n\n"
        "Please reach out to a trusted friend, family member, or healthcare "
        "professional right now."
    ),
    "ml": (
        "നിങ്ങൾ അനുഭവിക്കുന്ന വിഷമത്തിൽ എനിക്ക് ഖേദമുണ്ട്. "
        "നിങ്ങൾ ഒറ്റയ്ക്കല്ല, നിങ്ങളുടെ സുരക്ഷ വളരെ പ്രധാനമാണ്.\n\n"
        "സ്വയം അപകടപ്പെടുത്താൻ തോന്നുകയോ ഉടൻ അപകടമുണ്ടാകുകയോ ചെയ്യുന്നുവെങ്കിൽ, "
        "ദയവായി അടിയന്തര സേവനങ്ങളെ വിളിക്കുക അല്ലെങ്കിൽ അടുത്ത ആശുപത്രിയിലെ "
        "എമർജൻസി വിഭാഗത്തിലേക്ക് പോകുക.\n\n"
        "കഴിയുമെങ്കിൽ അപകടകരമായ വസ്തുക്കളിൽ നിന്ന് അകന്ന് വിശ്വസിക്കുന്ന "
        "ഒരാളോടൊപ്പം ഇരിക്കുക.\n\n"
        "ഇന്ത്യയിൽ അടിയന്തര സഹായത്തിനായി 112 വിളിക്കാം. "
        "മാനസികാരോഗ്യ സഹായത്തിനായി Tele-MANAS 14416-ലും ബന്ധപ്പെടാം.\n\n"
        "ദയവായി ഇപ്പോൾ വിശ്വസിക്കുന്ന സുഹൃത്തിനെയോ കുടുംബാംഗത്തെയോ "
        "ആരോഗ്യപ്രവർത്തകനെയോ സമീപിക്കുക."
    ),
}


# =========================================================
# DISCLAIMER
# =========================================================

DISCLAIMER = {
    "en": (
        "Medic.AI is an educational health assistant and is not a substitute "
        "for professional medical advice, diagnosis, or treatment."
    ),
    "ml": (
        "Medic.AI ഒരു വിദ്യാഭ്യാസ ആവശ്യത്തിനുള്ള ആരോഗ്യ സഹായിയാണ്. "
        "ഇത് ഡോക്ടറുടെ ഉപദേശം, രോഗനിർണയം, ചികിത്സ എന്നിവയ്ക്ക് പകരമല്ല."
    ),
}


# =========================================================
# MESSAGE NORMALIZATION
# =========================================================

def normalize_message(message: str) -> str:
    """
    Normalize user input for better emergency pattern detection.

    Handles:
    - Uppercase and lowercase
    - Contractions
    - Punctuation
    - Repeated letters
    - Common spelling variations
    """

    if not message:
        return ""

    text = message.lower().strip()

    # Normalize contractions
    text = text.replace("can't", "cant")
    text = text.replace("cannot", "cant")
    text = text.replace("won't", "wont")
    text = text.replace("don't", "dont")
    text = text.replace("didn't", "didnt")
    text = text.replace("i'm", "im")
    text = text.replace("i've", "ive")
    text = text.replace("i'll", "ill")

    # Remove punctuation
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Normalize excessive repeated letters
    # Example: pleeease -> please
    text = re.sub(r"(.)\1{2,}", r"\1", text)

    # Handle common misspellings
    text = re.sub(r"\btaak+e\b", "take", text)
    text = re.sub(r"\btaake\b", "take", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


# =========================================================
# EDUCATIONAL QUESTION PATTERNS
# =========================================================

EDUCATIONAL_PATTERNS = [
    r"\bwhat is\b",
    r"\bwhat are\b",
    r"\bdefine\b",
    r"\bdefinition of\b",
    r"\bexplain\b",
    r"\bhow does\b",
    r"\bhow do\b",
    r"\bcauses of\b",
    r"\bsymptoms of\b",
    r"\btreatment for\b",
    r"\bwrite about\b",
    r"\bdescribe\b",
    r"\bmeaning of\b",
]


def is_educational_query(message: str) -> bool:
    normalized = normalize_message(message)

    return any(
        re.search(pattern, normalized)
        for pattern in EDUCATIONAL_PATTERNS
    )


# =========================================================
# CRISIS / SELF-HARM DETECTION
# =========================================================

CRISIS_PATTERNS = [

    # Direct suicidal statements
    r"\bi want to die\b",
    r"\bi wanna die\b",
    r"\bi wish i was dead\b",
    r"\bi wish i were dead\b",
    r"\bi want to kill myself\b",
    r"\bi wanna kill myself\b",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\btake my own life\b",
    r"\bsuicid(e|al)\b",

    # Hopelessness
    r"\bi dont want to live\b",
    r"\bi dont wanna live\b",
    r"\bi have no reason to live\b",
    r"\bno reason to live\b",
    r"\blife is not worth living\b",
    r"\bbetter off dead\b",

    # Emotional distress
    r"\bi cant take it anymore\b",
    r"\bi cant take this anymore\b",
    r"\bcant take it anymore\b",
    r"\bi cannot take it anymore\b",
    r"\bcannot take it anymore\b",
    r"\bi cant go on\b",
    r"\bi cannot go on\b",
    r"\bi cant handle this anymore\b",
    r"\bi have nothing left\b",
    r"\bi am giving up\b",
    r"\bi give up\b",
    r"\bi am done with life\b",
    r"\bi dont want to be here\b",
    r"\bi dont want to exist\b",
    r"\bi am going to die\b",
    r"\bi will die\b",

    # Farewell / concerning messages
    r"\bgoodbye forever\b",
    r"\bthis is my last message\b",
    r"\byou wont see me again\b",
    r"\bi wont be here anymore\b",
]


def detect_crisis(message: str) -> bool:
    """
    Detect possible suicidal language or severe emotional distress.
    """

    normalized = normalize_message(message)

    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, normalized):
            return True

    return False


# =========================================================
# MEDICAL EMERGENCY PATTERNS
# =========================================================

EMERGENCY_PATTERNS = {

    "unconsciousness": [
        r"\bunconscious\b",
        r"\bpassed out\b",
        r"\bnot responding\b",
        r"\bnot waking up\b",
    ],

    "stroke": [
        r"\bface drooping\b",
        r"\bsudden weakness\b",
        r"\bslurred speech\b",
        r"\bsudden trouble speaking\b",
        r"\bsuspected stroke\b",
    ],

    "chest_pain": [
        r"\bsevere chest pain\b",
        r"\bcrushing chest pain\b",
        r"\bchest pressure\b",
        r"\bheart attack\b",
    ],

    "breathing": [
        r"\bcant breathe\b",
        r"\bstruggling to breathe\b",
        r"\bsevere breathing difficulty\b",
        r"\bchoking\b",
    ],

    "bleeding": [
        r"\bsevere bleeding\b",
        r"\bbleeding heavily\b",
        r"\bblood wont stop\b",
        r"\buncontrolled bleeding\b",
    ],

    "seizure": [
        r"\bhaving a seizure\b",
        r"\bseizure right now\b",
        r"\bconvulsions\b",
    ],

    "allergic_reaction": [
        r"\banaphylaxis\b",
        r"\bsevere allergic reaction\b",
        r"\bthroat swelling\b",
        r"\btongue swelling\b",
    ],

    "overdose": [
        r"\boverdose\b",
        r"\btook too many pills\b",
        r"\btook too much medication\b",
        r"\bpoisoning\b",
    ],

    "self_harm": [
        r"\bhurt myself\b",
        r"\bself harm\b",
        r"\bselfharm\b",
        r"\bcut myself\b",
    ],
}


# =========================================================
# MEDICAL EMERGENCY DETECTION
# =========================================================

def detect_medical_emergency(message: str) -> Optional[str]:
    """
    Returns the detected medical emergency category.
    Returns None if no emergency category matches.
    """

    normalized = normalize_message(message)

    for category, patterns in EMERGENCY_PATTERNS.items():

        for pattern in patterns:

            if re.search(pattern, normalized):
                return category

    return None


# =========================================================
# MAIN EMERGENCY CHECK
# =========================================================

def check_emergency(message: str) -> bool:
    """
    Main emergency detection function.

    Checks mental health crisis patterns first,
    then medical emergency patterns.
    """

    # Check possible mental health crisis
    if detect_crisis(message):
        return True

    # Check medical emergencies
    if detect_medical_emergency(message):
        return True

    return False


def should_skip_emergency_detection(message: str) -> bool:
    """
    Emergency detection should not be skipped
    for potentially dangerous messages.
    """

    return False


# =========================================================
# EMERGENCY RESPONSE GENERATOR
# =========================================================

def get_emergency_response(
    message: str,
    language: str = "en"
) -> str:

    language = language.lower().strip()

    if language not in ("en", "ml"):
        language = "en"

    # Mental health crisis response
    if detect_crisis(message):
        return CRISIS_MESSAGE[language]

    # Medical emergency response
    emergency_type = detect_medical_emergency(message)

    if emergency_type is not None:
        return EMERGENCY_MESSAGE[language]

    # Safe fallback
    return EMERGENCY_MESSAGE[language]


# =========================================================
# API EMERGENCY RESPONSE
# =========================================================

def create_emergency_response(
    message: str,
    language: str = "en"
) -> dict:

    response_text = get_emergency_response(
        message=message,
        language=language
    )

    return {
        "answer": response_text,
        "sources": [],
        "grounded": False,
        "emergency": True,
        "disclaimer": DISCLAIMER.get(language, DISCLAIMER["en"]),
    }


# =========================================================
# LOCAL TESTING
# =========================================================

if __name__ == "__main__":

    test_messages = [
        "i cant taake anymore i am going to die",
        "I can't take it anymore",
        "I cannot take it anymore",
        "I want to kill myself",
        "I have severe chest pain",
        "I am struggling to breathe",
        "I took too many pills",
        "How can I maintain healthy blood pressure?",
        "What are the symptoms of hypertension?",
    ]

    for msg in test_messages:

        print(f"Message: {msg}")
        print(f"Normalized: {normalize_message(msg)}")
        print(f"Crisis detected: {detect_crisis(msg)}")
        print(f"Medical emergency: {detect_medical_emergency(msg)}")
        print(f"Emergency detected: {check_emergency(msg)}")
        print("-" * 60)