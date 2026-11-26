import { useEffect, useState } from "react";
import "./Dashboard.css";
import VitalsForm from "./VitalsForm";
import HealthCharts from "./HealthCharts";

/* =====================================================
   TYPES
   ===================================================== */

interface Vitals {
    heartRate: number | null;
    systolic: number | null;
    diastolic: number | null;
    oxygen: number | null;
    temperature: number | null;
}

interface VitalsRecord {
    id: number;
    vitals: Vitals;
    recordedAt: string;
}

interface DashboardProps {
    setActivePage: (page: string) => void;
}

/* =====================================================
   STORAGE KEYS
   ===================================================== */

const STORAGE_KEY = "medic_ai_vitals";
const HISTORY_KEY = "medic_ai_vitals_history";

/* =====================================================
   INITIAL VITALS
   ===================================================== */

const initialVitals: Vitals = {
    heartRate: null,
    systolic: null,
    diastolic: null,
    oxygen: null,
    temperature: null,
};

/* =====================================================
   DATA NORMALIZATION
   ===================================================== */

const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeVitals = (data: any): Vitals => {
    const source = data?.vitals ?? data ?? {};

    return {
        heartRate: toNumber(
            source.heartRate ?? source.heart_rate ?? source.hr
        ),

        systolic: toNumber(
            source.systolic ?? source.systolicBP ?? source.systolic_bp
        ),

        diastolic: toNumber(
            source.diastolic ?? source.diastolicBP ?? source.diastolic_bp
        ),

        oxygen: toNumber(
            source.oxygen ??
            source.oxygenLevel ??
            source.spo2 ??
            source.SpO2
        ),

        temperature: toNumber(
            source.temperature ??
            source.bodyTemperature ??
            source.temp
        ),
    };
};

/* =====================================================
   NORMALIZE HEALTH RECORD
   ===================================================== */

const normalizeRecord = (
    record: any,
    index: number
): VitalsRecord => {
    const dateValue =
        record?.recordedAt ??
        record?.timestamp ??
        record?.date ??
        record?.createdAt ??
        record?.created_at ??
        null;

    let validDate = dateValue ? new Date(dateValue) : null;

    if (!validDate || isNaN(validDate.getTime())) {
        validDate = new Date();
    }

    return {
        id: Number(record?.id) || Date.now() + index,
        vitals: normalizeVitals(record),
        recordedAt: validDate.toISOString(),
    };
};

/* =====================================================
   DASHBOARD COMPONENT
   ===================================================== */

function Dashboard({ setActivePage }: DashboardProps) {
    const [vitals, setVitals] = useState<Vitals>(initialVitals);

    const [history, setHistory] = useState<VitalsRecord[]>([]);

    const [showVitalsForm, setShowVitalsForm] = useState(false);

    /* =================================================
       DATE AND GREETING
       ================================================= */

    const currentDate = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const currentHour = new Date().getHours();

    const greeting =
        currentHour < 12
            ? "Good morning"
            : currentHour < 17
                ? "Good afternoon"
                : "Good evening";

    /* =================================================
       LOAD SAVED HEALTH DATA
       ================================================= */

    useEffect(() => {
        try {
            const savedVitals = localStorage.getItem(STORAGE_KEY);
            const savedHistory = localStorage.getItem(HISTORY_KEY);

            if (savedVitals) {
                const parsedVitals = JSON.parse(savedVitals);

                setVitals(normalizeVitals(parsedVitals));
            }

            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);

                if (Array.isArray(parsedHistory)) {
                    const normalizedHistory = parsedHistory
                        .map((record: any, index: number) =>
                            normalizeRecord(record, index)
                        )
                        .sort(
                            (a, b) =>
                                new Date(b.recordedAt).getTime() -
                                new Date(a.recordedAt).getTime()
                        );

                    setHistory(normalizedHistory);

                    localStorage.setItem(
                        HISTORY_KEY,
                        JSON.stringify(normalizedHistory)
                    );
                }
            }
        } catch (error) {
            console.error("Error loading health data:", error);
        }
    }, []);

    /* =================================================
       SAVE VITALS AND HISTORY
       ================================================= */

    const saveVitals = (newVitals: Vitals) => {
        const normalizedVitals = normalizeVitals(newVitals);

        setVitals(normalizedVitals);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(normalizedVitals)
        );

        const newRecord: VitalsRecord = {
            id: Date.now(),
            vitals: normalizedVitals,
            recordedAt: new Date().toISOString(),
        };

        const updatedHistory = [newRecord, ...history];

        setHistory(updatedHistory);

        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(updatedHistory)
        );

        setShowVitalsForm(false);
    };

    /* =================================================
       FORMAT RECORDED DATE
       ================================================= */

    const formatDate = (date: string) => {
        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /* =================================================
       HEALTH STATISTICS
       ================================================= */

    const healthStats = [
        {
            title: "Heart Rate",
            value:
                vitals.heartRate !== null
                    ? `${vitals.heartRate} BPM`
                    : "--",
            icon: "❤️",
            subtitle: "Beats per minute",
        },
        {
            title: "Blood Pressure",
            value:
                vitals.systolic !== null && vitals.diastolic !== null
                    ? `${vitals.systolic}/${vitals.diastolic}`
                    : "--",
            icon: "🩸",
            subtitle: "mmHg",
        },
        {
            title: "Oxygen Level",
            value:
                vitals.oxygen !== null
                    ? `${vitals.oxygen}%`
                    : "--",
            icon: "🫁",
            subtitle: "SpO₂",
        },
        {
            title: "Temperature",
            value:
                vitals.temperature !== null
                    ? `${vitals.temperature}°C`
                    : "--",
            icon: "🌡️",
            subtitle: "Body temperature",
        },
    ];

    /* =================================================
       DASHBOARD UI
       ================================================= */

    return (
        <div className="dashboard-container">

            {/* =========================================
                DASHBOARD HEADER
               ========================================= */}

            <header className="dashboard-header">

                <div>
                    <p className="dashboard-date">
                        {currentDate}
                    </p>

                    <h1>
                        {greeting}, welcome to Medic.AI
                    </h1>

                    <p>
                        Monitor your health information and stay informed
                        about your wellbeing.
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => setShowVitalsForm(true)}
                    aria-label="Add a new health measurement"
                >
                    + Add Vitals
                </button>

            </header>

            {/* =========================================
                HEALTH STATISTICS
               ========================================= */}

            <section className="health-stats-section">

                <div className="section-heading">
                    <div>
                        <h2>Health Overview</h2>
                        <p>Your latest recorded measurements</p>
                    </div>
                </div>

                <div className="health-stats-grid">

                    {healthStats.map((stat) => (
                        <div
                            className="health-stat-card"
                            key={stat.title}
                            aria-label={`${stat.title}: ${stat.value}`}
                        >
                            <div className="health-stat-icon">
                                {stat.icon}
                            </div>

                            <div className="health-stat-info">

                                <p className="health-stat-title">
                                    {stat.title}
                                </p>

                                <h3>{stat.value}</h3>

                                <span>{stat.subtitle}</span>

                            </div>
                        </div>
                    ))}

                </div>

            </section>

            {/* =========================================
                HEALTH ANALYTICS
               ========================================= */}

            <section className="quick-actions-section">

                <div className="section-heading">
                    <div>
                        <h2>Health Analytics</h2>

                        <p>
                            Visualize your health measurements over time
                        </p>
                    </div>
                </div>

                <HealthCharts history={history} />

            </section>

            {/* =========================================
                HEALTH HISTORY
               ========================================= */}

            <section className="health-history-section">

                <div className="section-heading">
                    <div>
                        <h2>Health History</h2>
                        <p>Your recently recorded measurements</p>
                    </div>
                </div>

                {history.length === 0 ? (

                    <div className="empty-history">

                        <div className="empty-history-icon">
                            📋
                        </div>

                        <h3>No health records yet</h3>

                        <p>
                            Add your first vital measurement to start tracking.
                        </p>

                        <button
                            className="primary-button"
                            onClick={() => setShowVitalsForm(true)}
                        >
                            Add First Record
                        </button>

                    </div>

                ) : (

                    <div className="health-history-list">

                        {history.slice(0, 5).map((record) => (

                            <div
                                className="health-history-card"
                                key={record.id}
                            >

                                <div className="health-history-header">

                                    <div>
                                        <h3>Health Record</h3>

                                        <p>
                                            {formatDate(record.recordedAt)}
                                        </p>
                                    </div>

                                    <span className="history-badge">
                                        Recorded
                                    </span>

                                </div>

                                <div className="health-history-values">

                                    <div>
                                        <span>❤️ Heart Rate</span>

                                        <strong>
                                            {record.vitals.heartRate !== null
                                                ? `${record.vitals.heartRate} BPM`
                                                : "--"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>🩸 Blood Pressure</span>

                                        <strong>
                                            {record.vitals.systolic !== null &&
                                                record.vitals.diastolic !== null
                                                ? `${record.vitals.systolic}/${record.vitals.diastolic} mmHg`
                                                : "--"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>🫁 Oxygen</span>

                                        <strong>
                                            {record.vitals.oxygen !== null
                                                ? `${record.vitals.oxygen}%`
                                                : "--"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>🌡️ Temperature</span>

                                        <strong>
                                            {record.vitals.temperature !== null
                                                ? `${record.vitals.temperature}°C`
                                                : "--"}
                                        </strong>
                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </section>

            {/* =========================================
                QUICK ACTIONS
               ========================================= */}

            <section className="quick-actions-section">

                <div className="section-heading">
                    <div>
                        <h2>Quick Actions</h2>
                        <p>Access your healthcare tools and services</p>
                    </div>
                </div>

                <div className="quick-actions-grid">

                    {/* ADD VITALS */}

                    <button
                        className="quick-action-card"
                        onClick={() => setShowVitalsForm(true)}
                        aria-label="Add health measurements"
                    >
                        <span className="quick-action-icon vitals-icon">
                            ❤️
                        </span>

                        <span className="quick-action-content">
                            <strong>Add Vitals</strong>
                            <small>
                                Record your health measurements
                            </small>
                        </span>

                        <span className="quick-action-arrow">
                            →
                        </span>
                    </button>

                    {/* AI ASSISTANT */}

                    <button
                        className="quick-action-card"
                        onClick={() => setActivePage("AI Assistant")}
                        aria-label="Open AI Assistant"
                    >
                        <span className="quick-action-icon assistant-icon">
                            🤖
                        </span>

                        <span className="quick-action-content">
                            <strong>AI Assistant</strong>
                            <small>
                                Get intelligent health assistance
                            </small>
                        </span>

                        <span className="quick-action-arrow">
                            →
                        </span>
                    </button>

                    {/* MEDICAL REPORTS */}

                    <button
                        className="quick-action-card"
                        onClick={() => setActivePage("Medical Reports")}
                        aria-label="Open Medical Reports"
                    >
                        <span className="quick-action-icon reports-icon">
                            📄
                        </span>

                        <span className="quick-action-content">
                            <strong>Medical Reports</strong>
                            <small>
                                Access your medical documents
                            </small>
                        </span>

                        <span className="quick-action-arrow">
                            →
                        </span>
                    </button>

                    {/* MEDICATIONS */}

                    <button
                        className="quick-action-card"
                        onClick={() => setActivePage("Medications")}
                        aria-label="Open Medications"
                    >
                        <span className="quick-action-icon medications-icon">
                            💊
                        </span>

                        <span className="quick-action-content">
                            <strong>Medications</strong>
                            <small>
                                Manage your medication records
                            </small>
                        </span>

                        <span className="quick-action-arrow">
                            →
                        </span>
                    </button>

                </div>

            </section>

            {/* =========================================
                MEDIC.AI INSIGHTS
               ========================================= */}

            <section className="ai-insights-section">

                <div className="ai-insights-card">

                    {/* INSIGHTS HEADER */}

                    <div className="ai-insights-header">

                        <div className="ai-insights-icon">
                            🤖
                        </div>

                        <div className="ai-insights-title">
                            <h2>Medic.AI Insights</h2>

                            <p>
                                Your intelligent healthcare companion
                            </p>
                        </div>

                        <span className="ai-insights-badge">
                            AI Assistant
                        </span>

                    </div>

                    {/* INSIGHTS MESSAGE */}

                    <div className="ai-insights-content">

                        <div className="insights-message-icon">
                            ✨
                        </div>

                        <div>
                            <h3>Your Health, Better Organized</h3>

                            <p>
                                Keep your health information organized by
                                recording your vital measurements regularly.
                                Review your health history and analytics to
                                understand changes over time. You can also
                                use Medic.AI to explore general healthcare
                                information and ask health-related questions.
                            </p>
                        </div>

                    </div>

                    {/* INSIGHTS FOOTER */}

                    <div className="ai-insights-footer">

                        <div className="ai-disclaimer">

                            <span>ⓘ</span>

                            <p>
                                Medic.AI is a software prototype that provides
                                general health information. It does not replace
                                professional medical advice, diagnosis, or
                                treatment.
                            </p>

                        </div>

                        <button
                            className="ai-insights-button"
                            onClick={() => setActivePage("AI Assistant")}
                            aria-label="Open Medic.AI Assistant"
                        >
                            Ask Medic.AI
                            <span>→</span>
                        </button>

                    </div>

                </div>

            </section>

            {/* =========================================
                VITALS FORM MODAL
               ========================================= */}

            {showVitalsForm && (
                <VitalsForm
                    onSave={saveVitals}
                    onClose={() => setShowVitalsForm(false)}
                />
            )}

        </div>
    );
}

export default Dashboard;