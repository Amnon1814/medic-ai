import { useState } from "react";
import { X, HeartPulse, Save } from "lucide-react";
import "./VitalsForm.css";

interface VitalsFormProps {
    onSave: (data: {
        heartRate: number;
        systolic: number;
        diastolic: number;
        oxygen: number;
        temperature: number;
    }) => void;
    onClose: () => void;
}

export default function VitalsForm({ onSave, onClose }: VitalsFormProps) {
    const [heartRate, setHeartRate] = useState("");
    const [systolic, setSystolic] = useState("");
    const [diastolic, setDiastolic] = useState("");
    const [oxygen, setOxygen] = useState("");
    const [temperature, setTemperature] = useState("");

    const [errors, setErrors] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: string[] = [];

        const hr = Number(heartRate);
        const sys = Number(systolic);
        const dia = Number(diastolic);
        const oxy = Number(oxygen);
        const temp = Number(temperature);

        // Heart rate validation
        if (!heartRate || hr < 30 || hr > 220) {
            newErrors.push("Heart rate must be between 30 and 220 bpm.");
        }

        // Systolic blood pressure validation
        if (!systolic || sys < 70 || sys > 250) {
            newErrors.push("Systolic pressure must be between 70 and 250 mmHg.");
        }

        // Diastolic blood pressure validation
        if (!diastolic || dia < 40 || dia > 150) {
            newErrors.push("Diastolic pressure must be between 40 and 150 mmHg.");
        }

        // Blood oxygen validation
        if (!oxygen || oxy < 50 || oxy > 100) {
            newErrors.push("Blood oxygen must be between 50% and 100%.");
        }

        // Temperature validation
        if (!temperature || temp < 30 || temp > 45) {
            newErrors.push("Temperature must be between 30°C and 45°C.");
        }

        // Stop saving if errors exist
        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors([]);

        // Save validated data
        onSave({
            heartRate: hr,
            systolic: sys,
            diastolic: dia,
            oxygen: oxy,
            temperature: temp,
        });

        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="vitals-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <div className="modal-icon">
                            <HeartPulse size={20} />
                        </div>

                        <div>
                            <h2>Record Health Measurements</h2>
                            <p>Enter your latest measurements</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">

                        {/* Heart Rate */}
                        <div className="form-group">
                            <label>Heart Rate</label>

                            <div className="input-wrapper">
                                <input
                                    type="number"
                                    min="30"
                                    max="220"
                                    placeholder="72"
                                    value={heartRate}
                                    onChange={(e) => setHeartRate(e.target.value)}
                                    required
                                />
                                <span>bpm</span>
                            </div>
                        </div>

                        {/* Blood Oxygen */}
                        <div className="form-group">
                            <label>Blood Oxygen (SpO₂)</label>

                            <div className="input-wrapper">
                                <input
                                    type="number"
                                    min="50"
                                    max="100"
                                    placeholder="98"
                                    value={oxygen}
                                    onChange={(e) => setOxygen(e.target.value)}
                                    required
                                />
                                <span>%</span>
                            </div>
                        </div>

                        {/* Systolic Pressure */}
                        <div className="form-group">
                            <label>Systolic Pressure</label>

                            <div className="input-wrapper">
                                <input
                                    type="number"
                                    min="70"
                                    max="250"
                                    placeholder="120"
                                    value={systolic}
                                    onChange={(e) => setSystolic(e.target.value)}
                                    required
                                />
                                <span>mmHg</span>
                            </div>
                        </div>

                        {/* Diastolic Pressure */}
                        <div className="form-group">
                            <label>Diastolic Pressure</label>

                            <div className="input-wrapper">
                                <input
                                    type="number"
                                    min="40"
                                    max="150"
                                    placeholder="80"
                                    value={diastolic}
                                    onChange={(e) => setDiastolic(e.target.value)}
                                    required
                                />
                                <span>mmHg</span>
                            </div>
                        </div>

                        {/* Temperature */}
                        <div className="form-group full-width">
                            <label>Body Temperature</label>

                            <div className="input-wrapper">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="30"
                                    max="45"
                                    placeholder="36.8"
                                    value={temperature}
                                    onChange={(e) => setTemperature(e.target.value)}
                                    required
                                />
                                <span>°C</span>
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {errors.length > 0 && (
                        <div className="validation-errors">
                            <strong>Please correct the following:</strong>

                            <ul>
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button type="submit" className="save-button">
                            <Save size={16} />
                            Save Measurements
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}