import { useEffect, useState } from "react";
import {
    addMedication,
    getMedications,
    updateMedication,
    deleteMedication,
} from "../api";

import type { Medication, MedicationInput } from "../api";

import "./Medications.css";

const emptyForm: MedicationInput = {
    medicine: "",
    dosage: "",
    frequency: "",
    times: [""],
    instructions: "",
    start_date: "",
    end_date: null,
};

function Medications() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [form, setForm] = useState<MedicationInput>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        loadMedications();
    }, []);

    const loadMedications = async () => {
        try {
            setLoading(true);
            const data = await getMedications();
            setMedications(data);
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load medications.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleTimeChange = (index: number, value: string) => {
        const updatedTimes = [...form.times];
        updatedTimes[index] = value;

        setForm((previous) => ({
            ...previous,
            times: updatedTimes,
        }));
    };

    const addTimeField = () => {
        setForm((previous) => ({
            ...previous,
            times: [...previous.times, ""],
        }));
    };

    const removeTimeField = (index: number) => {
        if (form.times.length === 1) return;

        setForm((previous) => ({
            ...previous,
            times: previous.times.filter((_, i) => i !== index),
        }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validTimes = form.times.filter((time) => time.trim() !== "");

        if (validTimes.length === 0) {
            setError("Please enter at least one medication time.");
            return;
        }

        if (form.end_date && form.end_date < form.start_date) {
            setError("End date cannot be earlier than start date.");
            return;
        }

        const payload: MedicationInput = {
            ...form,
            times: validTimes,
            end_date: form.end_date || null,
        };

        try {
            setSaving(true);
            setError("");
            setMessage("");

            if (editingId !== null) {
                await updateMedication(editingId, payload);
                setMessage("Medication updated successfully.");
            } else {
                await addMedication(payload);
                setMessage("Medication added successfully.");
            }

            resetForm();
            await loadMedications();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (medication: Medication) => {
        setEditingId(medication.id);

        setForm({
            medicine: medication.medicine,
            dosage: medication.dosage,
            frequency: medication.frequency,
            times: medication.times.length ? medication.times : [""],
            instructions: medication.instructions || "",
            start_date: medication.start_date,
            end_date: medication.end_date,
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this medication?"
        );

        if (!confirmed) return;

        try {
            await deleteMedication(id);
            setMessage("Medication deleted successfully.");

            if (editingId === id) {
                resetForm();
            }

            await loadMedications();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete medication.");
        }
    };

    const activeCount = medications.filter(
        (medication) => medication.status === "active"
    ).length;

    return (
        <div className="medications-page">

            <div className="medications-header">
                <div>
                    <h1>Medication Management</h1>
                    <p>Manage your medications and daily schedules.</p>
                </div>

                <div className="medication-summary">
                    <span>Active Medications</span>
                    <strong>{activeCount}</strong>
                </div>
            </div>

            {message && <div className="medication-success">{message}</div>}
            {error && <div className="medication-error">{error}</div>}

            <div className="medication-form-card">

                <h2>{editingId ? "Edit Medication" : "Add New Medication"}</h2>

                <form onSubmit={handleSubmit}>

                    <div className="medication-form-grid">

                        <div className="medication-field">
                            <label>Medicine Name *</label>
                            <input
                                type="text"
                                name="medicine"
                                placeholder="Enter medicine name"
                                value={form.medicine}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="medication-field">
                            <label>Dosage *</label>
                            <input
                                type="text"
                                name="dosage"
                                placeholder="Example: 500 mg"
                                value={form.dosage}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="medication-field">
                            <label>Frequency *</label>
                            <input
                                type="text"
                                name="frequency"
                                placeholder="Example: Twice daily"
                                value={form.frequency}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="medication-field">
                            <label>Start Date *</label>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="medication-field">
                            <label>End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={form.end_date || ""}
                                onChange={handleChange}
                            />
                        </div>

                    </div>

                    <div className="medication-field medication-times">
                        <label>Medication Schedule *</label>

                        {form.times.map((time, index) => (
                            <div className="medication-time-row" key={index}>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => handleTimeChange(index, e.target.value)}
                                    required
                                />

                                {form.times.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-time-btn"
                                        onClick={() => removeTimeField(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            className="add-time-btn"
                            onClick={addTimeField}
                        >
                            + Add Another Time
                        </button>
                    </div>

                    <div className="medication-field">
                        <label>Instructions</label>
                        <textarea
                            name="instructions"
                            placeholder="Enter medication instructions"
                            value={form.instructions}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="medication-form-actions">
                        <button type="submit" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Update Medication"
                                    : "Save Medication"}
                        </button>

                        {editingId !== null && (
                            <button
                                type="button"
                                className="cancel-medication-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                </form>
            </div>

            <div className="medication-list-section">

                <h2>Your Medications</h2>

                {loading ? (
                    <p>Loading medications...</p>
                ) : medications.length === 0 ? (
                    <div className="medication-empty">
                        <h3>No medications found</h3>
                        <p>Add your first medication using the form above.</p>
                    </div>
                ) : (

                    <div className="medication-list">

                        {medications.map((medication) => (

                            <div className="medication-card" key={medication.id}>

                                <div className="medication-card-top">
                                    <div>
                                        <h3>{medication.medicine}</h3>
                                        <p>{medication.dosage}</p>
                                    </div>

                                    <span
                                        className={`medication-status ${medication.status}`}
                                    >
                                        {medication.status}
                                    </span>
                                </div>

                                <div className="medication-details">

                                    <p>
                                        <strong>Frequency:</strong> {medication.frequency}
                                    </p>

                                    <p>
                                        <strong>Schedule:</strong>{" "}
                                        {medication.times.join(", ")}
                                    </p>

                                    <p>
                                        <strong>Start:</strong> {medication.start_date}
                                    </p>

                                    <p>
                                        <strong>End:</strong>{" "}
                                        {medication.end_date || "Not specified"}
                                    </p>

                                    <p>
                                        <strong>Instructions:</strong>{" "}
                                        {medication.instructions || "No instructions"}
                                    </p>

                                </div>

                                <div className="medication-card-actions">

                                    <button
                                        className="edit-medication-btn"
                                        onClick={() => handleEdit(medication)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-medication-btn"
                                        onClick={() => handleDelete(medication.id)}
                                    >
                                        Delete
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default Medications;