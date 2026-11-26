import "./HealthCharts.css";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

interface VitalsRecord {
    id: number;
    vitals: {
        heartRate: number | null;
        systolic: number | null;
        diastolic: number | null;
        oxygen: number | null;
        temperature: number | null;
    };
    recordedAt: string;
}

interface HealthChartsProps {
    history: VitalsRecord[];
}

export default function HealthCharts({ history }: HealthChartsProps) {
    const chartData = [...history]
        .reverse()
        .filter(
            (record) =>
                record.vitals.heartRate !== null &&
                Number.isFinite(record.vitals.heartRate)
        )
        .map((record) => {
            const date = new Date(record.recordedAt);

            return {
                date: record.recordedAt,
                displayDate: Number.isNaN(date.getTime())
                    ? record.recordedAt
                    : date.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                    }),
                heartRate: record.vitals.heartRate,
            };
        });

    return (
        <div className="dashboard-panel health-chart-panel">
            {/* CHART HEADER */}

            <div className="panel-header">
                <div>
                    <h2>Heart Rate Trends</h2>
                    <p>
                        Track your recorded heart rate measurements over time.
                    </p>
                </div>

                <div className="chart-status-badge">
                    <span className="chart-status-dot"></span>
                    Health Monitoring
                </div>
            </div>

            {/* EMPTY STATE */}

            {chartData.length === 0 ? (
                <div className="activity-placeholder">
                    <div className="chart-empty-icon">📈</div>

                    <h3>No heart rate data available</h3>

                    <p>
                        Record your heart rate measurements to view your
                        health trends here.
                    </p>
                </div>
            ) : (
                <>
                    {/* CHART SUMMARY */}

                    <div className="chart-summary">
                        <div>
                            <span className="chart-summary-label">
                                Latest Heart Rate
                            </span>

                            <strong>
                                {chartData[chartData.length - 1].heartRate}
                                <small> BPM</small>
                            </strong>
                        </div>

                        <div className="chart-summary-indicator">
                            <span className="chart-line-indicator"></span>
                            Recorded Measurements
                        </div>
                    </div>

                    {/* HEART RATE CHART */}

                    <div className="health-chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 15,
                                    right: 15,
                                    left: 0,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    stroke="#E5EEE7"
                                    strokeDasharray="4 4"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="displayDate"
                                    tick={{
                                        fontSize: 11,
                                        fill: "#64748B",
                                    }}
                                    axisLine={{
                                        stroke: "#DCE9DF",
                                    }}
                                    tickLine={false}
                                    minTickGap={20}
                                />

                                <YAxis
                                    tick={{
                                        fontSize: 11,
                                        fill: "#64748B",
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={["auto", "auto"]}
                                    width={45}
                                />

                                <Tooltip
                                    cursor={{
                                        stroke: "#86C99B",
                                        strokeDasharray: "4 4",
                                    }}
                                    contentStyle={{
                                        backgroundColor: "#FFFFFF",
                                        border: "1px solid #DCE9DF",
                                        borderRadius: "12px",
                                        padding: "12px 15px",
                                        boxShadow:
                                            "0 6px 20px rgba(22, 101, 52, 0.08)",
                                    }}
                                    labelStyle={{
                                        color: "#14532D",
                                        fontWeight: 700,
                                        marginBottom: "6px",
                                    }}
                                    itemStyle={{
                                        color: "#16A34A",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                    }}
                                    formatter={(value) => [
                                        `${value} BPM`,
                                        "Heart Rate",
                                    ]}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="heartRate"
                                    stroke="#16A34A"
                                    strokeWidth={3}
                                    dot={{
                                        r: 4,
                                        fill: "#FFFFFF",
                                        stroke: "#16A34A",
                                        strokeWidth: 2,
                                    }}
                                    activeDot={{
                                        r: 7,
                                        fill: "#16A34A",
                                        stroke: "#FFFFFF",
                                        strokeWidth: 3,
                                    }}
                                    name="Heart Rate"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-footer">
                        Showing {chartData.length} recorded measurement
                        {chartData.length !== 1 ? "s" : ""}
                    </div>
                </>
            )}
        </div>
    );
}