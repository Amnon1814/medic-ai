import { useState } from "react";
import { assessSymptoms } from "../api";

import {
    Activity,
    AlertCircle,
    Clock,
    User,
    Search,
    Heart,
    CheckCircle,
    RefreshCw
} from "lucide-react";

import "./SymptomAssessment.css";

// ============================================================
// TYPES
// ============================================================

type SeverityLevel = "Mild" | "Moderate" | "Severe";

interface AssessmentResult {
    urgency: string;
    possible_explanations: string[];
    specialty: string;
    follow_up_questions: string[];
    advice: string;
    sources: string[];
}

interface ApiResponse {
    success: boolean;
    assessment: AssessmentResult;
    disclaimer: string;
}

// ============================================================
// COMMON SYMPTOMS
// ============================================================

const commonSymptoms = [
    "Headache",
    "Fever",
    "Cough",
    "Fatigue",
    "Nausea",
    "Vomiting",
    "Dizziness",
    "Chest Pain",
    "Shortness of Breath",
    "Stomach Pain",
    "Sore Throat",
    "Body Pain"
];

// ============================================================
// SYMPTOM ASSESSMENT COMPONENT
// ============================================================

export default function SymptomAssessment() {

    // Patient information
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");

    // Symptoms
    const [selectedSymptoms, setSelectedSymptoms] =
        useState<string[]>([]);

    // Duration and severity
    const [duration, setDuration] = useState("");
    const [severity, setSeverity] =
        useState<SeverityLevel | "">("");

    // Additional information
    const [description, setDescription] = useState("");

    // Assessment response
    const [result, setResult] =
        useState<ApiResponse | null>(null);

    // Loading and errors
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ========================================================
    // TOGGLE SYMPTOMS
    // ========================================================

    const toggleSymptom = (symptom: string) => {

        setSelectedSymptoms((previous) =>
            previous.includes(symptom)
                ? previous.filter((item) => item !== symptom)
                : [...previous, symptom]
        );

    };

    // ========================================================
    // RESET ASSESSMENT
    // ========================================================

    const resetAssessment = () => {

        setAge("");
        setSex("");
        setSelectedSymptoms([]);
        setDuration("");
        setSeverity("");
        setDescription("");

        setResult(null);
        setError("");

    };

    // ========================================================
    // SUBMIT ASSESSMENT
    // ========================================================

    const handleAssessment = async () => {

        // Validate required fields
        if (
            !age ||
            !sex ||
            selectedSymptoms.length === 0 ||
            !duration ||
            !severity
        ) {

            setError(
                "Please complete all required fields."
            );

            return;
        }

        // Validate age
        if (
            Number(age) < 1 ||
            Number(age) > 120 ||
            !Number.isInteger(Number(age))
        ) {

            setError(
                "Please enter a valid age between 1 and 120."
            );

            return;
        }

        setLoading(true);
        setResult(null);
        setError("");

        try {

            // Convert selected symptoms into a string
            const symptomText = [
                `Selected symptoms: ${selectedSymptoms.join(", ")}`,

                description
                    ? `Additional information: ${description}`
                    : ""
            ]
                .filter(Boolean)
                .join(". ");

            // Send assessment through central API service
            const data = await assessSymptoms({

                symptoms: symptomText,

                age: Number(age),

                sex: sex,

                duration: duration,

                severity: severity

            });

            // Store assessment results
            setResult(data);

        } catch (err) {

            console.error(
                "Symptom assessment error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to complete the assessment."
            );

        } finally {

            setLoading(false);

        }

    };

    // ========================================================
    // USER INTERFACE
    // ========================================================

    return (

        <div className="symptom-page">

            {/* HEADER */}

            <div className="symptom-header">

                <div className="symptom-header-icon">
                    <Heart size={25} />
                </div>

                <div>
                    <h1>Symptom Assessment</h1>

                    <p>
                        Understand your symptoms and receive
                        personalized health guidance.
                    </p>
                </div>

            </div>

            <div className="symptom-grid">

                {/* ================================================= */}
                {/* FORM CARD */}
                {/* ================================================= */}

                <div className="symptom-form-card">

                    <div className="symptom-card-heading">

                        <Activity size={20} />

                        <h2>Tell us how you're feeling</h2>

                    </div>

                    {/* AGE */}

                    <div className="symptom-field">

                        <label>
                            <User size={16} />
                            Age
                        </label>

                        <input
                            type="number"
                            placeholder="Enter your age"
                            value={age}
                            min="1"
                            max="120"
                            onChange={(e) =>
                                setAge(e.target.value)
                            }
                        />

                    </div>

                    {/* SEX */}

                    <div className="symptom-field">

                        <label>
                            Sex
                        </label>

                        <select
                            value={sex}
                            onChange={(e) =>
                                setSex(e.target.value)
                            }
                        >

                            <option value="">
                                Select sex
                            </option>

                            <option value="male">
                                Male
                            </option>

                            <option value="female">
                                Female
                            </option>

                            <option value="other">
                                Other
                            </option>

                            <option value="prefer_not_to_say">
                                Prefer not to say
                            </option>

                        </select>

                    </div>

                    {/* SYMPTOMS */}

                    <div className="symptom-field">

                        <label>
                            <Activity size={16} />
                            Select your symptoms
                        </label>

                        <div className="symptom-options">

                            {commonSymptoms.map((symptom) => (

                                <button
                                    key={symptom}
                                    type="button"

                                    className={`symptom-option ${selectedSymptoms.includes(symptom)
                                        ? "selected"
                                        : ""
                                        }`}

                                    onClick={() =>
                                        toggleSymptom(symptom)
                                    }
                                >

                                    {selectedSymptoms.includes(symptom) && (
                                        <CheckCircle size={14} />
                                    )}

                                    {symptom}

                                </button>

                            ))}

                        </div>

                    </div>

                    {/* DURATION */}

                    <div className="symptom-field">

                        <label>
                            <Clock size={16} />
                            How long have you experienced this?
                        </label>

                        <select
                            value={duration}
                            onChange={(e) =>
                                setDuration(e.target.value)
                            }
                        >

                            <option value="">
                                Select duration
                            </option>

                            <option value="Less than 24 hours">
                                Less than 24 hours
                            </option>

                            <option value="1-3 days">
                                1–3 days
                            </option>

                            <option value="4-7 days">
                                4–7 days
                            </option>

                            <option value="1-2 weeks">
                                1–2 weeks
                            </option>

                            <option value="More than 2 weeks">
                                More than 2 weeks
                            </option>

                        </select>

                    </div>

                    {/* SEVERITY */}

                    <div className="symptom-field">

                        <label>
                            <AlertCircle size={16} />
                            Symptom severity
                        </label>

                        <div className="severity-options">

                            {(
                                ["Mild", "Moderate", "Severe"] as SeverityLevel[]
                            ).map((level) => (

                                <button
                                    key={level}
                                    type="button"

                                    className={`severity-option ${level.toLowerCase()
                                        } ${severity === level
                                            ? "selected"
                                            : ""
                                        }`}

                                    aria-pressed={severity === level}

                                    onClick={() =>
                                        setSeverity(level)
                                    }
                                >

                                    {level}

                                </button>

                            ))}

                        </div>

                        <p className="severity-description">
                            Select the option that best describes
                            how your symptoms feel.
                        </p>

                    </div>

                    {/* ADDITIONAL INFORMATION */}

                    <div className="symptom-field">

                        <label>
                            Additional information (optional)
                        </label>

                        <textarea
                            placeholder="Describe any other symptoms, medical history, or details..."

                            value={description}

                            onChange={(e) =>
                                setDescription(e.target.value)
                            }

                            rows={4}
                        />

                    </div>

                    {/* ERROR */}

                    {error && (

                        <div className="symptom-error">

                            <AlertCircle size={18} />

                            <p>{error}</p>

                        </div>

                    )}

                    {/* SUBMIT BUTTON */}

                    <button
                        type="button"
                        className="symptom-submit-button"
                        onClick={handleAssessment}
                        disabled={loading}
                    >

                        {loading
                            ? <RefreshCw size={18} />
                            : <Search size={18} />
                        }

                        {loading
                            ? "Analyzing symptoms..."
                            : "Analyze Symptoms"
                        }

                    </button>

                    <p className="symptom-disclaimer">

                        This tool provides general health information
                        and is not a substitute for professional
                        medical advice.

                    </p>

                </div>

                {/* ================================================= */}
                {/* RESULTS CARD */}
                {/* ================================================= */}

                <div className="symptom-result-card">

                    <div className="symptom-result-heading">

                        <div className="result-icon">
                            <Heart size={21} />
                        </div>

                        <div>

                            <h2>Assessment Results</h2>

                            <p>
                                Your assessment will appear here
                            </p>

                        </div>

                    </div>

                    {/* EMPTY STATE */}

                    {!result && !loading && !error && (

                        <div className="symptom-result-empty">

                            <div className="result-empty-icon">
                                <Activity size={35} />
                            </div>

                            <h3>
                                Ready to assess your symptoms?
                            </h3>

                            <p>
                                Fill out the assessment form and
                                select Analyze Symptoms to receive
                                health guidance.
                            </p>

                        </div>

                    )}

                    {/* LOADING STATE */}

                    {loading && (

                        <div className="symptom-loading">

                            <Activity size={30} />

                            <h3>
                                Analyzing your symptoms
                            </h3>

                            <p>
                                Please wait while your assessment
                                is processed.
                            </p>

                        </div>

                    )}

                    {/* ERROR STATE */}

                    {error && !loading && (

                        <div className="symptom-result-empty">

                            <div className="result-empty-icon">
                                <AlertCircle size={35} />
                            </div>

                            <h3>
                                Assessment unavailable
                            </h3>

                            <p>
                                {error}
                            </p>

                        </div>

                    )}

                    {/* ASSESSMENT RESULTS */}

                    {result && !loading && (

                        <div className="symptom-result-content">

                            {/* URGENCY */}

                            <div className="urgency-box">

                                <span>
                                    Assessment urgency
                                </span>

                                <strong>
                                    {result.assessment.urgency
                                        .replace(/_/g, " ")
                                        .toUpperCase()
                                    }
                                </strong>

                            </div>

                            {/* POSSIBLE EXPLANATIONS */}

                            <div className="result-section">

                                <h3>
                                    Possible Explanations
                                </h3>

                                {result.assessment.possible_explanations.length > 0 ? (

                                    <ul>

                                        {result.assessment.possible_explanations.map(
                                            (item, index) => (

                                                <li key={index}>
                                                    {item}
                                                </li>

                                            )
                                        )}

                                    </ul>

                                ) : (

                                    <p>
                                        No possible explanations were returned.
                                    </p>

                                )}

                            </div>

                            {/* SPECIALTY */}

                            <div className="result-section">

                                <h3>
                                    Recommended Specialist
                                </h3>

                                <p>
                                    {result.assessment.specialty}
                                </p>

                            </div>

                            {/* FOLLOW-UP QUESTIONS */}

                            <div className="result-section">

                                <h3>
                                    Follow-up Questions
                                </h3>

                                {result.assessment.follow_up_questions.length > 0 ? (

                                    <ul>

                                        {result.assessment.follow_up_questions.map(
                                            (question, index) => (

                                                <li key={index}>
                                                    {question}
                                                </li>

                                            )
                                        )}

                                    </ul>

                                ) : (

                                    <p>
                                        No additional questions.
                                    </p>

                                )}

                            </div>

                            {/* ADVICE */}

                            <div className="result-section">

                                <h3>
                                    Recommended Next Steps
                                </h3>

                                <p>
                                    {result.assessment.advice}
                                </p>

                            </div>

                            {/* SOURCES */}

                            {result.assessment.sources?.length > 0 && (

                                <div className="result-section">

                                    <h3>
                                        Knowledge Sources
                                    </h3>

                                    <ul>

                                        {result.assessment.sources.map(
                                            (source, index) => (

                                                <li key={index}>
                                                    {source}
                                                </li>

                                            )
                                        )}

                                    </ul>

                                </div>

                            )}

                            {/* DISCLAIMER */}

                            <div className="result-warning">

                                <AlertCircle size={18} />

                                <p>
                                    {result.disclaimer}
                                </p>

                            </div>

                            {/* NEW ASSESSMENT */}

                            <button
                                type="button"
                                className="symptom-submit-button"
                                onClick={resetAssessment}
                            >

                                <Search size={18} />

                                New Assessment

                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}