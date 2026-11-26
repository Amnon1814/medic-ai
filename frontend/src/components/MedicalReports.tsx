import { useState } from "react";
import {
    FileText,
    Upload,
    Activity,
    AlertCircle,
    CheckCircle,
    Loader2,
    Trash2,
} from "lucide-react";

import { analyzeMedicalReport } from "../api";
import "./MedicalReports.css";

// ============================================================
// TYPES
// ============================================================

interface ReportFinding {
    [key: string]: unknown;
}

interface ReportResult {
    summary?: string;
    analysis?: string;
    explanation?: string;
    recommendations?: string[];
    findings?: ReportFinding[] | string[];
    extraction_note?: string;
    disclaimer?: string;
    [key: string]: unknown;
}

// ============================================================
// MEDICAL REPORT COMPONENT
// ============================================================

export default function MedicalReports() {

    const [file, setFile] = useState<File | null>(null);
    const [reportType, setReportType] = useState("Blood Test");
    const [result, setResult] = useState<ReportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ========================================================
    // REPORT TYPES
    // ========================================================

    const reportTypes = [
        "Blood Test",
        "Complete Blood Count (CBC)",
        "Lipid Profile",
        "Blood Glucose",
        "Liver Function Test",
        "Kidney Function Test",
        "Thyroid Test",
        "Urine Test",
        "X-Ray",
        "MRI",
        "CT Scan",
        "Other",
    ];

    // ========================================================
    // FILE VALIDATION
    // ========================================================

    const handleFileChange = (selectedFile?: File) => {

        if (!selectedFile) return;

        const allowedTypes = [
            "application/pdf",
            "image/png",
            "image/jpeg",
        ];

        if (!allowedTypes.includes(selectedFile.type)) {

            setError(
                "Please upload a PDF, PNG or JPEG medical report."
            );

            setFile(null);
            setResult(null);

            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {

            setError(
                "File size must not exceed 10 MB."
            );

            setFile(null);
            setResult(null);

            return;
        }

        if (selectedFile.size === 0) {

            setError(
                "The selected file is empty. Please choose another file."
            );

            setFile(null);
            setResult(null);

            return;
        }

        setFile(selectedFile);
        setError("");
        setResult(null);
    };

    // ========================================================
    // ANALYZE MEDICAL REPORT
    // ========================================================

    const handleAnalyze = async () => {

        if (!file) {

            setError(
                "Please upload a medical report first."
            );

            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {

            // Use central API service
            const data = await analyzeMedicalReport(
                file,
                reportType
            );

            setResult(data as ReportResult);

        } catch (err) {

            console.error(
                "Medical report analysis error:",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to analyze the medical report."
            );

        } finally {

            setLoading(false);

        }
    };

    // ========================================================
    // RESET REPORT
    // ========================================================

    const resetReport = () => {

        setFile(null);
        setResult(null);
        setError("");

    };

    // ========================================================
    // FORMAT FINDINGS
    // ========================================================

    const formatFinding = (finding: unknown): string => {

        if (typeof finding === "string") {
            return finding;
        }

        if (finding && typeof finding === "object") {
            return Object.entries(finding)
                .map(([key, value]) => `${key}: ${typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)
                    }`)
                .join(" | ");
        }

        return String(finding);
    };

    // ========================================================
    // USER INTERFACE
    // ========================================================

    return (

        <div className="medical-reports-page">

            {/* HEADER */}

            <div className="medical-reports-header">

                <div className="medical-reports-header-icon">
                    <FileText size={25} />
                </div>

                <div>
                    <h1>Medical Reports AI</h1>

                    <p>
                        Upload your medical reports and understand your health
                        results with AI-powered explanations.
                    </p>
                </div>

            </div>

            <div className="medical-reports-grid">

                {/* ================================================= */}
                {/* UPLOAD CARD */}
                {/* ================================================= */}

                <div className="medical-reports-card">

                    <div className="medical-reports-card-heading">

                        <Upload size={20} />

                        <h2>Upload Medical Report</h2>

                    </div>

                    {/* REPORT TYPE */}

                    <div className="medical-report-field">

                        <label>Report Type</label>

                        <select
                            value={reportType}
                            onChange={(e) =>
                                setReportType(e.target.value)
                            }
                        >

                            {reportTypes.map((type) => (

                                <option key={type} value={type}>
                                    {type}
                                </option>

                            ))}

                        </select>

                    </div>

                    {/* FILE UPLOAD */}

                    <label className="medical-report-upload-area">

                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                            onChange={(e) => {
                                handleFileChange(e.target.files?.[0]);
                                e.currentTarget.value = "";
                            }}
                            hidden
                        />

                        <div className="medical-report-upload-icon">
                            <Upload size={30} />
                        </div>

                        <h3>Upload your report</h3>

                        <p>
                            Click to browse and select your medical report
                        </p>

                        <span>
                            PDF, PNG and JPG files only · Maximum 10 MB
                        </span>

                    </label>

                    {/* SELECTED FILE */}

                    {file && (

                        <div className="medical-report-file">

                            <div className="medical-report-file-icon">
                                <FileText size={22} />
                            </div>

                            <div className="medical-report-file-details">

                                <strong>{file.name}</strong>

                                <span>
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </span>

                            </div>

                            <button
                                type="button"
                                onClick={resetReport}
                                title="Remove file"
                                aria-label="Remove selected file"
                            >
                                <Trash2 size={18} />
                            </button>

                        </div>

                    )}

                    {/* ERROR */}

                    {error && (

                        <div className="medical-report-error">

                            <AlertCircle size={18} />

                            <span>{error}</span>

                        </div>

                    )}

                    {/* ANALYZE BUTTON */}

                    <button
                        type="button"
                        className="medical-report-analyze-button"
                        onClick={handleAnalyze}
                        disabled={loading || !file}
                    >

                        {loading ? (

                            <>
                                <Loader2 size={18} />
                                Analyzing Report...
                            </>

                        ) : (

                            <>
                                <Activity size={18} />
                                Analyze Medical Report
                            </>

                        )}

                    </button>

                    <p className="medical-report-disclaimer">

                        AI-generated explanations are informational only and are
                        not a substitute for professional medical advice.

                    </p>

                </div>

                {/* ================================================= */}
                {/* RESULTS CARD */}
                {/* ================================================= */}

                <div className="medical-reports-result-card">

                    <div className="medical-reports-result-heading">

                        <div className="medical-reports-result-icon">
                            <Activity size={21} />
                        </div>

                        <div>

                            <h2>Analysis Results</h2>

                            <p>
                                Your report analysis will appear here.
                            </p>

                        </div>

                    </div>

                    {/* EMPTY STATE */}

                    {!result && !loading && !error && (

                        <div className="medical-reports-empty">

                            <FileText size={40} />

                            <h3>
                                Ready to analyze your report?
                            </h3>

                            <p>
                                Upload a medical report and click Analyze Medical
                                Report to receive an AI-powered explanation.
                            </p>

                        </div>

                    )}

                    {/* LOADING */}

                    {loading && (

                        <div className="medical-reports-loading">

                            <Loader2 size={35} />

                            <h3>
                                Analyzing your report
                            </h3>

                            <p>
                                AI is processing your document. Please wait.
                            </p>

                        </div>

                    )}

                    {/* ERROR */}

                    {error && !loading && (

                        <div className="medical-reports-empty">

                            <AlertCircle size={35} />

                            <h3>
                                Analysis unavailable
                            </h3>

                            <p>
                                {error}
                            </p>

                        </div>

                    )}

                    {/* RESULTS */}

                    {result && !loading && (

                        <div className="medical-reports-results">

                            <div className="medical-reports-success">

                                <CheckCircle size={18} />

                                <span>
                                    Analysis completed
                                </span>

                            </div>

                            {/* SUMMARY */}

                            <div className="medical-report-result-section">

                                <h3>Report Summary</h3>

                                <p>
                                    {result.summary ||
                                        result.analysis ||
                                        result.explanation ||
                                        "Analysis completed. Review the information below."
                                    }
                                </p>

                            </div>

                            {/* KEY FINDINGS */}

                            {Array.isArray(result.findings) &&
                                result.findings.length > 0 && (

                                    <div className="medical-report-result-section">

                                        <h3>Key Findings</h3>

                                        <ul>

                                            {result.findings.map(
                                                (finding, index) => (

                                                    <li key={index}>
                                                        {formatFinding(finding)}
                                                    </li>

                                                )
                                            )}

                                        </ul>

                                    </div>

                                )}

                            {/* AI EXPLANATION */}

                            {result.explanation && (

                                <div className="medical-report-result-section">

                                    <h3>AI Explanation</h3>

                                    <p>
                                        {result.explanation}
                                    </p>

                                </div>

                            )}

                            {/* RECOMMENDATIONS */}

                            {Array.isArray(result.recommendations) &&
                                result.recommendations.length > 0 && (

                                    <div className="medical-report-result-section">

                                        <h3>Recommendations</h3>

                                        <ul>

                                            {result.recommendations.map(
                                                (recommendation, index) => (

                                                    <li key={index}>
                                                        {recommendation}
                                                    </li>

                                                )
                                            )}

                                        </ul>

                                    </div>

                                )}

                            {/* EXTRACTION NOTE */}

                            {result.extraction_note && (

                                <div className="medical-report-result-section">

                                    <h3>Extraction Note</h3>

                                    <p>
                                        {result.extraction_note}
                                    </p>

                                </div>

                            )}

                            {/* RAW RESPONSE FALLBACK */}

                            {!result.summary &&
                                !result.analysis &&
                                !result.explanation &&
                                !result.findings && (

                                    <div className="medical-report-result-section">

                                        <h3>AI Analysis</h3>

                                        <pre>
                                            {JSON.stringify(result, null, 2)}
                                        </pre>

                                    </div>

                                )}

                            {/* DISCLAIMER */}

                            <div className="medical-report-result-warning">

                                <AlertCircle size={18} />

                                <p>
                                    {result.disclaimer ||
                                        "AI-generated analysis may contain inaccuracies. Always consult a qualified healthcare professional when interpreting medical results or making treatment decisions."
                                    }
                                </p>

                            </div>

                            {/* RESET */}

                            <button
                                type="button"
                                className="medical-report-analyze-button"
                                onClick={resetReport}
                            >

                                <Upload size={18} />

                                Analyze Another Report

                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}