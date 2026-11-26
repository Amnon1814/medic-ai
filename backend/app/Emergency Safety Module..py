import re

# =========================================================
# MEDIC.AI - EMERGENCY SAFETY MODULE
# =========================================================

# ---------------------------------------------------------
# 1. GENERAL EMERGENCY MESSAGE
# ---------------------------------------------------------

EMERGENCY_MESSAGE = (
    "This may be a medical emergency. "
    "Please call your local emergency services or go to the nearest "
    "emergency department immediately. Do not delay medical care."
)

DISCLAIMER = {
    "en": (
        "Medic.AI provides educational information and is not a substitute "
        "for professional medical advice, diagnosis, or treatment."
    ),
    "ml": (
        "Medic.AI ആരോഗ്യ വിവരങ്ങൾ നൽകുന്നതിനുള്ള ഒരു സഹായിയാണ്. "
        "ഇത് ഡോക്ടറുടെ ഉപദേശം, രോഗനിർണയം, ചികിത്സ എന്നിവയ്ക്ക് പകരമല്ല."
    ),
}

# ---------------------------------------------------------
# 2. EMERGENCY DETECTION PATTERNS
# ---------------------------------------------------------

EMERGENCY_PATTERNS = [

    # CHEST PAIN
    r"chest pain",
    r"chest pressure",
    r"chest tightness",
    r"chest squeezing",
    r"crushing chest pain",
    r"heavy chest",
    r"pain in (my )?chest",

    # BREATHING EMERGENCIES
    r"can't breathe",
    r"cannot breathe",
    r"unable to breathe",
    r"difficulty breathing",
    r"trouble breathing",
    r"struggling to breathe",
    r"shortness of breath",
    r"not getting enough air",
    r"gasping for air",

    # UNCONSCIOUSNESS
    r"unconscious",
    r"not responding",
    r"passed out",
    r"fainted",
    r"fainting",
    r"won't wake up",
    r"cannot wake",
    r"can't wake",
    r"loss of consciousness",

    # STROKE
    r"face droop",
    r"facial droop",
    r"slurred speech",
    r"sudden weakness",
    r"one side.{0,20}(weak|numb)",
    r"(weak|numb).{0,20}one side",
    r"can't speak properly",
    r"cannot speak properly",
    r"suddenly unable to speak",

    # SEVERE BLEEDING
    r"severe bleeding",
    r"uncontrolled bleeding",
    r"bleeding heavily",
    r"heavy bleeding",
    r"vomiting blood",
    r"coughing blood",
    r"blood coming out",
    r"won't stop bleeding",

    # SEIZURES
    r"seizure",
    r"convulsion",
    r"convulsions",
    r"shaking uncontrollably",

    # POISONING / OVERDOSE
    r"overdose",
    r"poisoning",
    r"poison",
    r"took too many pills",
    r"took too many tablets",
    r"took too much medication",
    r"accidental overdose",

    # ALLERGIC REACTION
    r"anaphylaxis",
    r"anaphylactic",
    r"severe allergic reaction",
    r"throat swelling",
    r"throat is swelling",
    r"swelling.{0,20}(tongue|lips|throat)",
    r"(tongue|lips|throat).{0,20}swelling",

    # SELF-HARM
    r"suicid",
    r"kill myself",
    r"end my life",
    r"want to die",
    r"hurt myself",
    r"harm myself",

    # MALAYALAM
    r"നെഞ്ചുവേദന",
    r"നെഞ്ച് വേദന",
    r"ശ്വാസം മുട്ട",
    r"ശ്വാസം കിട്ടുന്നില്ല",
    r"ബോധം പോയ",
    r"ബോധക്ഷയം",
    r"രക്തസ്രാവം",
    r"വിഷം",
    r"അമിതമായി മരുന്ന്",
]

# ---------------------------------------------------------
# 3. EDUCATIONAL QUESTION PATTERNS
# ---------------------------------------------------------

EDUCATIONAL_QUERY_PATTERNS = [

    # Stroke
    r"^what are the common warning signs of (a )?stroke\??$",
    r"^what are the warning signs of (a )?stroke\??$",
    r"^what are the symptoms of (a )?stroke\??$",
    r"^what are the signs of (a )?stroke\??$",
    r"^what is (a )?stroke\??$",
    r"^explain (a )?stroke\??$",
    r"^tell me about (a )?stroke\??$",
    r"^what causes (a )?stroke\??$",

    # Chest pain
    r"^what causes chest pain\??$",
    r"^what is chest pain\??$",

    # Seizure
    r"^what is a seizure\??$",
    r"^what causes seizures\??$",

    # Overdose
    r"^what is an overdose\??$",
    r"^what does overdose mean\??$",

    # Allergies
    r"^what is anaphylaxis\??$",
    r"^what is a severe allergic reaction\??$",
]

# ---------------------------------------------------------
# 4. CHECK WHETHER THE QUESTION IS EDUCATIONAL
# ---------------------------------------------------------

def is_educational_query(text: str) -> bool:

    text = text.lower().strip()

    for pattern in EDUCATIONAL_QUERY_PATTERNS:
        if re.search(pattern, text):
            return True

    return False

# ---------------------------------------------------------
# 5. EMERGENCY DETECTION
# ---------------------------------------------------------

def check_emergency(text: str):

    if not text:
        return []

    text = text.lower().strip()

    # Ignore clearly educational questions
    if is_educational_query(text):
        return []

    matches = []

    for pattern in EMERGENCY_PATTERNS:
        if re.search(pattern, text):
            matches.append(pattern)

    return matches

# ---------------------------------------------------------
# 6. EMERGENCY RESPONSE GENERATOR
# ---------------------------------------------------------

def get_emergency_response(text: str, language: str = "en"):

    text = text.lower()

    # -----------------------------------------------------
    # UNCONSCIOUSNESS
    # -----------------------------------------------------

    if re.search(
        r"unconscious|not responding|passed out|"
        r"won't wake up|cannot wake|can't wake|"
        r"loss of consciousness|fainted",
        text
    ):

        if language == "ml":
            return (
                "ഇത് അടിയന്തരാവസ്ഥയായിരിക്കാം. "
                "ഉടൻ 112-ൽ വിളിക്കുക. "
                "ബോധമില്ലാത്ത വ്യക്തിക്ക് ഭക്ഷണമോ വെള്ളമോ നൽകരുത്. "
                "ശ്വാസമുണ്ടോ പരിശോധിക്കുക. ഉടൻ മെഡിക്കൽ സഹായം തേടുക."
            )

        return (
            "This may be a medical emergency. Call 112 immediately. "
            "Check whether the person is breathing normally. "
            "Do not give food, drink, or medication by mouth. "
            "Follow emergency dispatcher instructions."
        )

    # -----------------------------------------------------
    # CHEST PAIN
    # -----------------------------------------------------

    elif re.search(
        r"chest pain|chest pressure|chest tightness|"
        r"crushing|heavy chest|നെഞ്ചുവേദന|നെഞ്ച് വേദന",
        text
    ):

        if language == "ml":
            return (
                "നെഞ്ചുവേദന ഗുരുതരമായ പ്രശ്നത്തിന്റെ ലക്ഷണമാകാം. "
                "ഉടൻ 112-ൽ വിളിക്കുക. പ്രവർത്തനം നിർത്തി വിശ്രമിക്കുക. "
                "സ്വയം വാഹനം ഓടിക്കരുത്. മെഡിക്കൽ സഹായം വൈകിക്കരുത്."
            )

        return (
            "Severe or unexplained chest pain can be a medical emergency. "
            "Call 112 immediately, stop physical activity, rest, and do not "
            "drive yourself to the hospital. Follow emergency instructions."
        )

    # -----------------------------------------------------
    # SEVERE ALLERGIC REACTION
    # IMPORTANT: CHECK THIS BEFORE BREATHING EMERGENCY
    # -----------------------------------------------------

    elif re.search(
        r"allerg|anaphyl|throat swelling|throat is swelling|"
        r"tongue swelling|lips swelling|"
        r"swelling.{0,20}(tongue|lips|throat)|"
        r"(tongue|lips|throat).{0,20}swelling",
        text
    ):

        if language == "ml":
            return (
                "🚨 ഗുരുതരമായ അലർജി പ്രതികരണമായിരിക്കാം. "
                "തൊണ്ട വീക്കം അല്ലെങ്കിൽ ശ്വാസതടസ്സം ജീവന് ഭീഷണിയായേക്കാം. "
                "ഉടൻ 112-ൽ വിളിക്കുക. "
                "ഡോക്ടർ നിർദേശിച്ച epinephrine auto-injector ഉണ്ടെങ്കിൽ "
                "നിർദ്ദേശപ്രകാരം ഉപയോഗിക്കുക. "
                "ലക്ഷണങ്ങൾ കുറഞ്ഞാലും ആശുപത്രിയിലെത്തുക."
            )

        return (
            "🚨 EMERGENCY: POSSIBLE SEVERE ALLERGIC REACTION\n\n"
            "Throat swelling or difficulty breathing after exposure to an "
            "allergen may be life-threatening.\n\n"
            "• Call 112 immediately.\n"
            "• If the person has a prescribed epinephrine auto-injector, "
            "use it according to its instructions immediately.\n"
            "• Do not make the person stand or walk.\n"
            "• Do not delay emergency medical care, even if symptoms improve."
        )

    # -----------------------------------------------------
    # BREATHING EMERGENCY
    # -----------------------------------------------------

    elif re.search(
        r"can't breathe|cannot breathe|unable to breathe|"
        r"difficulty breathing|trouble breathing|"
        r"struggling to breathe|shortness of breath|"
        r"gasping|not getting enough air|ശ്വാസം മുട്ട|ശ്വാസം കിട്ടുന്നില്ല",
        text
    ):

        if language == "ml":
            return (
                "ശ്വാസതടസ്സം അടിയന്തരാവസ്ഥയായിരിക്കാം. "
                "ഉടൻ 112-ൽ വിളിക്കുക. ശ്വസിക്കാൻ സൗകര്യമുള്ള "
                "സ്ഥാനത്ത് ഇരിക്കാൻ സഹായിക്കുക. "
                "ഭക്ഷണമോ വെള്ളമോ നൽകരുത്. "
                "ഉടൻ എമർജൻസി ചികിത്സ തേടുക."
            )

        return (
            "Difficulty breathing can be life-threatening. "
            "Call 112 immediately. Help the person sit in a comfortable "
            "position and avoid exertion. Do not delay emergency medical care."
        )

    # -----------------------------------------------------
    # STROKE
    # -----------------------------------------------------

    elif re.search(
        r"stroke|face droop|facial droop|slurred speech|"
        r"sudden weakness|one side weakness|one side numb|"
        r"can't speak|cannot speak",
        text
    ):

        if language == "ml":
            return (
                "ഇത് സ്ട്രോക്കിന്റെ ലക്ഷണങ്ങളാകാം. ഉടൻ 112-ൽ വിളിക്കുക. "
                "മുഖം ഒരു വശത്തേക്ക് താഴുക, കൈയിലെ ബലക്കുറവ്, "
                "സംസാരിക്കാൻ ബുദ്ധിമുട്ട് എന്നിവ ശ്രദ്ധിക്കുക. "
                "ലക്ഷണങ്ങൾ ആരംഭിച്ച സമയം രേഖപ്പെടുത്തുക. "
                "ആശുപത്രിയിലെത്തുന്നത് വൈകിക്കരുത്."
            )

        return (
            "These may be signs of a stroke. Call 112 immediately. "
            "Warning signs include facial drooping, arm weakness, and "
            "speech difficulty. Note when symptoms began and do not delay "
            "emergency medical care."
        )

    # -----------------------------------------------------
    # SEVERE BLEEDING
    # -----------------------------------------------------

    elif re.search(
        r"severe bleeding|uncontrolled bleeding|bleeding heavily|"
        r"heavy bleeding|vomiting blood|coughing blood|"
        r"blood coming out|won't stop bleeding|blood loss|രക്തസ്രാവം",
        text
    ):

        if language == "ml":
            return (
                "ഗുരുതരമായ രക്തസ്രാവം അടിയന്തരാവസ്ഥയാണ്. "
                "ഉടൻ 112-ൽ വിളിക്കുക. സുരക്ഷിതമാണെങ്കിൽ ശുദ്ധമായ "
                "തുണികൊണ്ട് മുറിവിൽ നേരിട്ട് സമ്മർദ്ദം നൽകുക. "
                "ഉടൻ മെഡിക്കൽ സഹായം തേടുക."
            )

        return (
            "Severe bleeding requires urgent medical attention. Call 112. "
            "If safe, apply firm, direct pressure to the wound using "
            "a clean cloth and seek emergency medical care immediately."
        )

    # -----------------------------------------------------
    # SEIZURE
    # -----------------------------------------------------

    elif re.search(
        r"seizure|convulsion|convulsions|shaking uncontrollably",
        text
    ):

        if language == "ml":
            return (
                "ഇത് അപസ്മാര ആക്രമണമാകാം. വ്യക്തിയെ പരിക്കിൽ നിന്ന് "
                "സംരക്ഷിക്കുക, സമീപത്തുള്ള അപകടകരമായ വസ്തുക്കൾ മാറ്റുക. "
                "വ്യക്തിയെ ബലമായി പിടിച്ചുനിർത്തരുത്, വായിൽ ഒന്നും ഇടരുത്. "
                "ആക്രമണം 5 മിനിറ്റിലധികം നീണ്ടാൽ, ആവർത്തിച്ചാൽ, "
                "ആദ്യ ആക്രമണമാണെങ്കിൽ, അല്ലെങ്കിൽ ശ്വാസപ്രശ്നമുണ്ടെങ്കിൽ "
                "ഉടൻ 112-ൽ വിളിക്കുക."
            )

        return (
            "During a seizure, protect the person from nearby hazards. "
            "Move dangerous objects away and cushion their head if possible. "
            "Do not restrain them and do not put anything in their mouth. "
            "Time the seizure. Call 112 if it lasts 5 minutes or longer, "
            "repeats, breathing is affected, or it is a first seizure."
        )

    # -----------------------------------------------------
    # OVERDOSE / POISONING
    # -----------------------------------------------------

    elif re.search(
        r"overdose|poison|took too many pills|"
        r"took too many tablets|too much medication|"
        r"extra dose|extra pills|extra tablets|"
        r"recommended dose|prescribed dose",
        text
    ):

        if language == "ml":
            return (
                "അമിതമായി മരുന്ന് കഴിച്ചതോ വിഷബാധയോ ഉണ്ടായിരിക്കാം. "
                "ഉടൻ 112 വിളിക്കുക അല്ലെങ്കിൽ ആശുപത്രിയിലെ എമർജൻസി "
                "വിഭാഗത്തിൽ പോകുക. ഡോക്ടറുടെ നിർദേശം കൂടാതെ "
                "ഛർദ്ദിപ്പിക്കാൻ ശ്രമിക്കരുത്. മരുന്നിന്റെ പാക്കറ്റ് "
                "കൂടെ കൊണ്ടുപോകുക."
            )

        return (
            "🚨 POSSIBLE OVERDOSE OR POISONING\n\n"
            "A medication overdose or poisoning may be dangerous even "
            "if you feel okay.\n\n"
            "• Seek emergency medical help immediately.\n"
            "• Call 112 if severe symptoms occur.\n"
            "• Do not induce vomiting unless instructed by a medical professional.\n"
            "• Keep the medication packaging available for medical staff."
        )

    # -----------------------------------------------------
    # SELF-HARM
    # -----------------------------------------------------

    elif re.search(
        r"suicid|kill myself|end my life|want to die|"
        r"hurt myself|harm myself",
        text
    ):

        if language == "ml":
            return (
                "നിങ്ങളുടെ സുരക്ഷയാണ് ഇപ്പോൾ ഏറ്റവും പ്രധാനപ്പെട്ടത്. "
                "ഉടൻ അപകടമുണ്ടെങ്കിൽ 112-ൽ വിളിക്കുക. "
                "കഴിയുമെങ്കിൽ വിശ്വസിക്കുന്ന ഒരാളുടെ കൂടെ ഇരിക്കുക. "
                "അടുത്തുള്ള ആശുപത്രിയിലെ എമർജൻസി വിഭാഗത്തിലേക്ക് പോകുക. "
                "നിങ്ങൾ ഒറ്റയ്ക്ക് ഇത് നേരിടേണ്ടതില്ല."
            )

        return (
            "Your safety is the most important thing right now. "
            "If you may hurt yourself or are in immediate danger, "
            "call 112 or go to the nearest emergency department. "
            "If possible, stay with someone you trust and move away "
            "from anything you could use to hurt yourself. "
            "You do not have to face this alone."
        )

    # -----------------------------------------------------
    # GENERAL EMERGENCY
    # -----------------------------------------------------

    else:

        if language == "ml":
            return (
                "ഇത് അടിയന്തര മെഡിക്കൽ പ്രശ്നമായിരിക്കാം. "
                "ഉടൻ 112-ൽ വിളിക്കുക അല്ലെങ്കിൽ അടുത്തുള്ള ആശുപത്രിയിലെ "
                "എമർജൻസി വിഭാഗത്തിൽ ചികിത്സ തേടുക. "
                "മെഡിക്കൽ സഹായം വൈകിക്കരുത്."
            )

        return EMERGENCY_MESSAGE