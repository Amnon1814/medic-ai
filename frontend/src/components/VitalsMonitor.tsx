import { useEffect, useMemo, useState } from "react";
import {
    HeartPulse,
    Activity,
    Droplets,
    Thermometer,
    Plus,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus,
    CalendarDays
} from "lucide-react";

import VitalsForm from "./VitalsForm";
import "./VitalsMonitor.css";

interface VitalReading {
    id: number;
    kind: string;
    value: number;
    value2: number | null;
    created_at: string;
}

interface VitalsData {
    heartRate: number;
    systolic: number;
    diastolic: number;
    oxygen: number;
    temperature: number;
}

type Period = "7" | "30" | "all";

interface SelectedPoint {
    value: number;
    label: string;
    created_at: string;
}

const API = "http://127.0.0.1:8000/api/vitals";

// General adult resting reference ranges for orientation only.
function getStatus(kind: string, value: number) {
    const ranges: Record<string, [number, number]> = {
        heart_rate: [60, 100],
        spo2: [95, 100],
        temp: [36.1, 37.2],
        systolic: [90, 119],
        diastolic: [60, 79]
    };

    const range = ranges[kind];

    if (!range) return "Unknown";
    if (value < range[0]) return "Low";
    if (value > range[1]) return "High";

    return "Within reference";
}

function formatDate(date: string) {
    return new Date(date).toLocaleString();
}

// Interactive trend chart
function TrendChart({
    title,
    unit,
    readings,
    kind,
    secondaryKind,
    secondaryValue2 = false
}: {
    title: string;
    unit: string;
    readings: VitalReading[];
    kind: string;
    secondaryKind?: string;
    secondaryValue2?: boolean;
}) {
    const [selected, setSelected] = useState<SelectedPoint | null>(null);

    const sortReadings = (items: VitalReading[]) =>
        items.slice().sort(
            (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
        );

    const primary = sortReadings(
        readings.filter(r => r.kind === kind)
    );

    const secondary = secondaryKind
        ? sortReadings(
            readings.filter(
                r =>
                    r.kind === secondaryKind &&
                    (!secondaryValue2 || r.value2 !== null)
            )
        )
        : [];

    const primaryValues = primary.map(r => r.value);

    const secondaryValues = secondary.map(r =>
        secondaryValue2 ? r.value2! : r.value
    );

    const values = [...primaryValues, ...secondaryValues];

    if (values.length === 0) {
        return (
            <div className="trend-card">
                <h3>{title}</h3>
                <div className="chart-empty">
                    No readings available for this period.
                </div>
            </div>
        );
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    const padding = Math.max((max - min) * 0.2, 2);

    const low = min - padding;
    const high = max + padding;

    const x = (index: number, count: number) =>
        count <= 1
            ? 200
            : 50 + (index / (count - 1)) * 300;

    const y = (value: number) =>
        150 - ((value - low) / (high - low)) * 120;

    const makePoints = (
        items: VitalReading[],
        useValue2 = false
    ) =>
        items
            .map((r, i) => {
                const value = useValue2 ? r.value2! : r.value;
                return `${x(i, items.length)},${y(value)}`;
            })
            .join(" ");

    const selectPrimary = (reading: VitalReading) => {
        setSelected({
            value: reading.value,
            label: title,
            created_at: reading.created_at
        });
    };

    const selectSecondary = (reading: VitalReading) => {
        setSelected({
            value: reading.value2!,
            label: "Diastolic",
            created_at: reading.created_at
        });
    };

    return (
        <div className="trend-card">
            <h3>{title}</h3>

            <p className="chart-description">
                Recorded readings over time ({unit})
            </p>

            <div className="chart-scroll">
                <svg
                    viewBox="0 0 400 190"
                    className="trend-svg"
                    role="img"
                    aria-label={`${title} historical trend chart`}
                >
                    {[30, 70, 110, 150].map(line => (
                        <line
                            key={line}
                            x1="45"
                            x2="355"
                            y1={line}
                            y2={line}
                            className="chart-grid-line"
                        />
                    ))}

                    {/* Primary line */}
                    <polyline
                        points={makePoints(primary)}
                        className="chart-line-primary"
                    />

                    {/* Secondary line: diastolic BP */}
                    {secondary.length > 0 && (
                        <polyline
                            points={makePoints(
                                secondary,
                                secondaryValue2
                            )}
                            className="chart-line-secondary"
                        />
                    )}

                    {/* Primary data points */}
                    {primary.map((r, i) => (
                        <circle
                            key={`primary-${r.id}`}
                            cx={x(i, primary.length)}
                            cy={y(r.value)}
                            r="5"
                            className="chart-point-primary"
                            tabIndex={0}
                            role="button"
                            aria-label={`${title}: ${r.value} ${unit}, ${formatDate(r.created_at)}`}
                            onClick={() => selectPrimary(r)}
                            onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                    selectPrimary(r);
                                }
                            }}
                        >
                            <title>
                                {`${r.value} ${unit} - ${formatDate(r.created_at)}`}
                            </title>
                        </circle>
                    ))}

                    {/* Secondary data points: diastolic BP */}
                    {secondary.map((r, i) => {
                        const value = secondaryValue2
                            ? r.value2!
                            : r.value;

                        return (
                            <circle
                                key={`secondary-${r.id}`}
                                cx={x(i, secondary.length)}
                                cy={y(value)}
                                r="5"
                                className="chart-point-secondary"
                                tabIndex={0}
                                role="button"
                                aria-label={`Diastolic: ${value} ${unit}, ${formatDate(r.created_at)}`}
                                onClick={() => selectSecondary(r)}
                                onKeyDown={e => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        selectSecondary(r);
                                    }
                                }}
                            >
                                <title>
                                    {`${value} ${unit} - ${formatDate(r.created_at)}`}
                                </title>
                            </circle>
                        );
                    })}

                    <text
                        x="45"
                        y="180"
                        className="chart-axis-label"
                    >
                        Earlier
                    </text>

                    <text
                        x="355"
                        y="180"
                        textAnchor="end"
                        className="chart-axis-label"
                    >
                        Latest
                    </text>
                </svg>
            </div>

            {secondaryKind && (
                <div className="chart-legend">
                    <span>
                        <i className="legend-primary" />
                        Systolic
                    </span>

                    <span>
                        <i className="legend-secondary" />
                        Diastolic
                    </span>
                </div>
            )}

            {selected && (
                <div className="chart-selected">
                    <strong>
                        {selected.label}: {selected.value} {unit}
                    </strong>

                    <span>
                        {formatDate(selected.created_at)}
                    </span>

                    <button onClick={() => setSelected(null)}>
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}

export default function VitalsMonitor() {
    const [readings, setReadings] = useState<VitalReading[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [period, setPeriod] = useState<Period>("7");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const token = localStorage.getItem("medic_ai_token");

    // Fetch measurements from backend
    const fetchVitals = async () => {
        try {
            setLoading(true);
            setError("");

            if (!token) {
                throw new Error("Please log in to view your measurements.");
            }

            const response = await fetch(API, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? "Session expired. Please log in again."
                        : "Unable to retrieve vital measurements."
                );
            }

            const data = await response.json();

            const sorted = (data.readings || [])
                .slice()
                .sort(
                    (a: VitalReading, b: VitalReading) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );

            setReadings(sorted);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load readings."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVitals();
    }, []);

    // Save measurements
    const handleSave = async (data: VitalsData) => {
        try {
            setSaving(true);
            setError("");

            if (!token) {
                throw new Error("Please log in again.");
            }

            const response = await fetch(API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || "Unable to save measurements."
                );
            }

            setShowForm(false);

            await fetchVitals();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to save readings."
            );
        } finally {
            setSaving(false);
        }
    };

    // Most recent reading for a measurement
    const latest = (kind: string) =>
        readings.find(r => r.kind === kind);

    // Previous reading for comparison
    const previous = (kind: string) =>
        readings.filter(r => r.kind === kind)[1];

    // Date and period filtering
    const filteredReadings = useMemo(() => {
        const now = new Date();

        return readings.filter(r => {
            const date = new Date(r.created_at);

            if (
                fromDate &&
                date < new Date(`${fromDate}T00:00:00`)
            ) {
                return false;
            }

            if (
                toDate &&
                date > new Date(`${toDate}T23:59:59.999`)
            ) {
                return false;
            }

            if (!fromDate && !toDate && period !== "all") {
                const days = Number(period);
                const start = new Date(now);

                start.setDate(start.getDate() - days);

                if (date < start) {
                    return false;
                }
            }

            return true;
        });
    }, [readings, period, fromDate, toDate]);

    // Measurement cards
    const cards = [
        {
            kind: "heart_rate",
            title: "Heart Rate",
            unit: "BPM",
            icon: HeartPulse,
            current: latest("heart_rate"),
            previous: previous("heart_rate")
        },
        {
            kind: "bp",
            title: "Blood Pressure",
            unit: "mmHg",
            icon: Activity,
            current: latest("bp"),
            previous: previous("bp")
        },
        {
            kind: "spo2",
            title: "Blood Oxygen",
            unit: "%",
            icon: Droplets,
            current: latest("spo2"),
            previous: previous("spo2")
        },
        {
            kind: "temp",
            title: "Temperature",
            unit: "°C",
            icon: Thermometer,
            current: latest("temp"),
            previous: previous("temp")
        }
    ];

    // Compare latest and previous measurements
    const renderChange = (
        current?: VitalReading,
        old?: VitalReading,
        bloodPressure = false
    ) => {
        if (!current || !old) {
            return (
                <span className="change-neutral">
                    No comparison
                </span>
            );
        }

        const difference = current.value - old.value;

        const label =
            difference === 0
                ? "No change"
                : `${difference > 0 ? "+" : ""}${difference.toFixed(1)} from previous`;

        return (
            <span className="change-neutral">
                {difference > 0 ? (
                    <TrendingUp size={14} />
                ) : difference < 0 ? (
                    <TrendingDown size={14} />
                ) : (
                    <Minus size={14} />
                )}

                {label}

                {bloodPressure &&
                    current.value2 !== null &&
                    old.value2 !== null &&
                    ` / ${current.value2 - old.value2 > 0 ? "+" : ""}${(
                        current.value2 - old.value2
                    ).toFixed(1)}`}
            </span>
        );
    };

    // Status for each measurement card
    const getCardStatus = (
        kind: string,
        item?: VitalReading
    ) => {
        if (!item) return "No reading";

        if (kind === "bp") {
            if (item.value2 === null) {
                return "Incomplete reading";
            }

            const systolic = getStatus("systolic", item.value);
            const diastolic = getStatus("diastolic", item.value2);

            return systolic === "Within reference" &&
                diastolic === "Within reference"
                ? "Within reference"
                : `${systolic} / ${diastolic}`;
        }

        return getStatus(kind, item.value);
    };

    return (
        <div className="vitals-page">

            {/* Header */}
            <div className="vitals-header">
                <div>
                    <h1>Vitals Monitor</h1>
                    <p>
                        Track and monitor your health measurements.
                    </p>
                </div>

                <div className="vitals-header-actions">
                    <button
                        className="refresh-vitals"
                        onClick={fetchVitals}
                        disabled={loading}
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>

                    <button
                        className="add-vitals"
                        onClick={() => setShowForm(true)}
                        disabled={saving}
                    >
                        <Plus size={18} />
                        Record Measurements
                    </button>
                </div>
            </div>

            {error && (
                <div className="vitals-error">
                    {error}
                </div>
            )}

            {/* Latest measurements */}
            <div className="vitals-section-heading">
                <h2>Latest Measurements</h2>
                <span>Most recent recorded values</span>
            </div>

            <div className="vitals-cards">
                {cards.map(card => {
                    const Icon = card.icon;
                    const item = card.current;
                    const status = getCardStatus(
                        card.kind,
                        item
                    );

                    const statusClass =
                        status === "Within reference"
                            ? "status-normal"
                            : status === "No reading"
                                ? "status-empty"
                                : "status-attention";

                    return (
                        <div
                            className="vital-card"
                            key={card.kind}
                        >
                            <div className="vital-card-top">
                                <div className="vital-icon">
                                    <Icon size={23} />
                                </div>

                                <span
                                    className={`status-badge ${statusClass}`}
                                >
                                    {status}
                                </span>
                            </div>

                            <h3>{card.title}</h3>

                            <div className="vital-value">
                                {item
                                    ? card.kind === "bp"
                                        ? `${item.value}/${item.value2 ?? "--"}`
                                        : item.value
                                    : "--"}

                                <span>{card.unit}</span>
                            </div>

                            <p>
                                {item
                                    ? `Recorded ${formatDate(item.created_at)}`
                                    : "No measurements recorded"}
                            </p>

                            <div className="latest-comparison">
                                {renderChange(
                                    item,
                                    card.previous,
                                    card.kind === "bp"
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Medical reference note */}
            <div className="clinical-note">
                Status indicators use general adult resting reference
                ranges for orientation only. They are not diagnoses
                and may not apply to every person. Seek professional
                medical advice for concerning readings or symptoms.
            </div>

            {/* Trend charts heading */}
            <div className="vitals-section-heading chart-heading">
                <div>
                    <h2>Vital Trends</h2>
                    <span>
                        Explore changes in your recorded measurements
                    </span>
                </div>

                <select
                    value={period}
                    onChange={e => {
                        setPeriod(e.target.value as Period);
                        setFromDate("");
                        setToDate("");
                    }}
                    aria-label="Chart date range"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="all">All records</option>
                </select>
            </div>

            {/* Interactive charts */}
            <div className="vitals-chart-grid">
                <TrendChart
                    title="Heart Rate"
                    unit="BPM"
                    readings={filteredReadings}
                    kind="heart_rate"
                />

                <TrendChart
                    title="Blood Pressure"
                    unit="mmHg"
                    readings={filteredReadings}
                    kind="bp"
                    secondaryKind="bp"
                    secondaryValue2={true}
                />

                <TrendChart
                    title="Blood Oxygen"
                    unit="%"
                    readings={filteredReadings}
                    kind="spo2"
                />

                <TrendChart
                    title="Body Temperature"
                    unit="°C"
                    readings={filteredReadings}
                    kind="temp"
                />
            </div>

            {/* Measurement history */}
            <div className="vitals-history-section">
                <div className="history-heading">
                    <div>
                        <h2>Measurement History</h2>
                        <span>
                            {filteredReadings.length} recorded measurements
                        </span>
                    </div>

                    <CalendarDays size={22} />
                </div>

                {/* Date filters */}
                <div className="history-filters">
                    <label>
                        From
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={e => setFromDate(e.target.value)}
                        />
                    </label>

                    <label>
                        To
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </label>

                    <button
                        onClick={() => {
                            setFromDate("");
                            setToDate("");
                            setPeriod("all");
                        }}
                    >
                        Clear filters
                    </button>
                </div>

                {loading ? (
                    <div className="vitals-empty">
                        Loading measurements...
                    </div>
                ) : filteredReadings.length === 0 ? (
                    <div className="vitals-empty">
                        No readings found for this date range.
                    </div>
                ) : (
                    <div className="vitals-table-wrapper">
                        <table className="vitals-table">
                            <thead>
                                <tr>
                                    <th>Measurement</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Date & Time</th>
                                    <th>Latest</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredReadings.map(item => {
                                    const labels: Record<string, string> = {
                                        heart_rate: "Heart Rate",
                                        bp: "Blood Pressure",
                                        spo2: "Blood Oxygen",
                                        temp: "Temperature"
                                    };

                                    const units: Record<string, string> = {
                                        heart_rate: "BPM",
                                        bp: "mmHg",
                                        spo2: "%",
                                        temp: "°C"
                                    };

                                    const status =
                                        item.kind === "bp"
                                            ? getCardStatus("bp", item)
                                            : getStatus(item.kind, item.value);

                                    const isLatest =
                                        latest(item.kind)?.id === item.id;

                                    const statusClass =
                                        status === "Within reference"
                                            ? "status-normal"
                                            : status === "No reading"
                                                ? "status-empty"
                                                : "status-attention";

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                {labels[item.kind] || item.kind}
                                            </td>

                                            <td>
                                                {item.kind === "bp"
                                                    ? `${item.value}/${item.value2 ?? "--"}`
                                                    : item.value}{" "}
                                                {units[item.kind]}
                                            </td>

                                            <td>
                                                <span
                                                    className={`status-badge ${statusClass}`}
                                                >
                                                    {status}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(item.created_at)}
                                            </td>

                                            <td>
                                                {isLatest ? (
                                                    <span className="latest-tag">
                                                        Latest
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Measurement form */}
            {showForm && (
                <VitalsForm
                    onSave={handleSave}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
}