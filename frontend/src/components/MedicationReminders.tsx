import {
    useState,
    useEffect,
    type ChangeEvent,
    type FormEvent,
} from "react";

import {
    addMedication,
    getMedications,
    updateMedication,
    deleteMedication,
} from "../api";

import type { Medication, MedicationInput } from "../api";

import {
    Bell,
    Clock,
    CheckCircle,
    Pill,
    AlertCircle,
    RefreshCw,
    Plus,
    Edit,
    Trash2,
    X,
} from "lucide-react";

import "./MedicationReminders.css";

interface DoseRecord {
    taken: boolean;
    takenAt?: string;
}

// LOAD SAVED DOSE RECORDS
function readDoseRecords(date: string): Record<string, DoseRecord> {
    try {
        const saved = localStorage.getItem(
            `medic-ai-dose-records-${date}`
        );

        return saved
            ? (JSON.parse(saved) as Record<string, DoseRecord>)
            : {};
    } catch {
        return {};
    }
}

// EMPTY MEDICATION FORM
const emptyForm: MedicationInput = {
    medicine: "",
    dosage: "",
    frequency: "",
    times: [""],
    instructions: "",
    start_date: "",
    end_date: null,
};

// GET TODAY'S DATE
function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function MedicationReminders() {
    const [medications, setMedications] = useState<Medication[]>([]);
    const [form, setForm] = useState<MedicationInput>(emptyForm);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    const [doseRecords, setDoseRecords] = useState<
        Record<string, DoseRecord>
    >(() => readDoseRecords(getToday()));

    const [doseRecordsDate, setDoseRecordsDate] = useState(getToday());

    const [currentTime, setCurrentTime] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [notificationPermission, setNotificationPermission] =
        useState<NotificationPermission>(() =>
            typeof window !== "undefined" &&
                "Notification" in window
                ? Notification.permission
                : "denied"
        );

    const today = getToday();

    const storageKey = `medic-ai-dose-records-${today}`;
    const notificationKey = `medic-ai-notifications-${today}`;

    // LOAD DOSE RECORDS WHEN THE DATE CHANGES
    useEffect(() => {
        if (doseRecordsDate !== today) {
            setDoseRecords(readDoseRecords(today));
            setDoseRecordsDate(today);
        }
    }, [today, doseRecordsDate]);

    // SAVE DOSE RECORDS
    useEffect(() => {
        if (doseRecordsDate !== today) return;

        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(doseRecords)
            );
        } catch {
            setError(
                "Unable to save dose records in this browser."
            );
        }
    }, [doseRecords, doseRecordsDate, storageKey, today]);

    // FETCH MEDICATIONS FROM BACKEND
    const loadMedications = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMedications();

            setMedications(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load medications."
            );
        } finally {
            setLoading(false);
        }
    };

    // LOAD MEDICATIONS WHEN COMPONENT OPENS
    useEffect(() => {
        loadMedications();
    }, []);

    // UPDATE CLOCK EVERY 30 SECONDS
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // GENERATE UNIQUE DOSE KEY
    const getDoseKey = (id: number, time: string) => {
        return `${today}-${id}-${time}`;
    };

    // CHECK MEDICATION START AND END DATES
    const isWithinMedicationDates = (
        medication: Medication
    ) => {
        return (
            today >= medication.start_date &&
            (!medication.end_date ||
                today <= medication.end_date)
        );
    };

    // HANDLE FORM INPUT CHANGES
    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // HANDLE MEDICATION TIME CHANGES
    const handleTimeChange = (
        index: number,
        value: string
    ) => {
        const updatedTimes = [...form.times];

        updatedTimes[index] = value;

        setForm((previous) => ({
            ...previous,
            times: updatedTimes,
        }));
    };

    // ADD ANOTHER TIME FIELD
    const addTimeField = () => {
        setForm((previous) => ({
            ...previous,
            times: [...previous.times, ""],
        }));
    };

    // REMOVE TIME FIELD
    const removeTimeField = (index: number) => {
        if (form.times.length === 1) return;

        setForm((previous) => ({
            ...previous,
            times: previous.times.filter(
                (_, i) => i !== index
            ),
        }));
    };

    // RESET FORM
    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    };

    // ADD OR UPDATE MEDICATION
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const validTimes = form.times.filter(
            (time) => time.trim() !== ""
        );

        if (validTimes.length === 0) {
            setError(
                "Please enter at least one medication time."
            );
            return;
        }

        if (
            form.end_date &&
            form.end_date < form.start_date
        ) {
            setError(
                "End date cannot be earlier than start date."
            );
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

                setMessage(
                    "Medication updated successfully."
                );
            } else {
                await addMedication(payload);

                setMessage(
                    "Medication added successfully."
                );
            }

            resetForm();

            await loadMedications();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    // EDIT MEDICATION
    const handleEdit = (medication: Medication) => {
        setEditingId(medication.id);

        setForm({
            medicine: medication.medicine,
            dosage: medication.dosage,
            frequency: medication.frequency,

            times: medication.times.length
                ? medication.times
                : [""],

            instructions: medication.instructions || "",
            start_date: medication.start_date,
            end_date: medication.end_date,
        });

        setShowForm(true);

        setError("");
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // DELETE MEDICATION
    const handleDelete = async (id: number) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this medication?"
        );

        if (!confirmed) return;

        try {
            await deleteMedication(id);

            setMessage(
                "Medication deleted successfully."
            );

            if (editingId === id) {
                resetForm();
            }

            await loadMedications();

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete medication."
            );
        }
    };

    // ENABLE BROWSER NOTIFICATIONS
    const enableNotifications = async () => {
        if (!("Notification" in window)) {
            setError(
                "Your browser does not support notifications."
            );
            return;
        }

        const permission =
            await Notification.requestPermission();

        setNotificationPermission(permission);
    };

    // SEND MEDICATION NOTIFICATIONS
    useEffect(() => {
        if (
            !("Notification" in window) ||
            Notification.permission !== "granted"
        ) {
            return;
        }

        medications.forEach((medication) => {
            if (
                medication.status !== "active" ||
                !isWithinMedicationDates(medication)
            ) {
                return;
            }

            medication.times.forEach((time) => {
                const [hours, minutes] = time
                    .split(":")
                    .map(Number);

                const scheduledTime = new Date(currentTime);

                scheduledTime.setHours(
                    hours,
                    minutes,
                    0,
                    0
                );

                const millisecondsSinceScheduled =
                    currentTime.getTime() -
                    scheduledTime.getTime();

                // CHECK WITHIN THE FIRST 60 SECONDS
                if (
                    millisecondsSinceScheduled >= 0 &&
                    millisecondsSinceScheduled <= 60000
                ) {
                    const doseKey = getDoseKey(
                        medication.id,
                        time
                    );

                    if (doseRecords[doseKey]?.taken) {
                        return;
                    }

                    let sentNotifications: string[] = [];

                    try {
                        sentNotifications = JSON.parse(
                            localStorage.getItem(
                                notificationKey
                            ) || "[]"
                        ) as string[];
                    } catch {
                        sentNotifications = [];
                    }

                    if (
                        sentNotifications.includes(doseKey)
                    ) {
                        return;
                    }

                    new Notification(
                        "Medic.AI Medication Reminder",
                        {
                            body: `Time for ${medication.medicine} (${medication.dosage}).`,
                        }
                    );

                    localStorage.setItem(
                        notificationKey,
                        JSON.stringify([
                            ...sentNotifications,
                            doseKey,
                        ])
                    );
                }
            });
        });
    }, [
        currentTime,
        medications,
        doseRecords,
        notificationKey,
    ]);

    // MARK DOSE AS TAKEN
    const markAsTaken = (
        id: number,
        time: string
    ) => {
        const doseKey = getDoseKey(id, time);

        setDoseRecords((previous) => ({
            ...previous,

            [doseKey]: {
                taken: true,
                takenAt: new Date().toLocaleTimeString(),
            },
        }));
    };

    // UNDO TAKEN DOSE
    const undoTaken = (
        id: number,
        time: string
    ) => {
        const doseKey = getDoseKey(id, time);

        setDoseRecords((previous) => {
            const updated = { ...previous };

            delete updated[doseKey];

            return updated;
        });
    };

    // TODAY'S ACTIVE MEDICATION SCHEDULE
    const schedule = medications
        .filter(
            (medication) =>
                medication.status === "active" &&
                isWithinMedicationDates(medication)
        )
        .flatMap((medication) =>
            medication.times.map((time) => ({
                medication,
                time,
                key: getDoseKey(
                    medication.id,
                    time
                ),
            }))
        )
        .sort((a, b) =>
            a.time.localeCompare(b.time)
        );

    // COUNT TAKEN DOSES
    const takenCount = schedule.filter(
        (item) => doseRecords[item.key]?.taken
    ).length;

    // COUNT PENDING DOSES
    const pendingCount =
        schedule.length - takenCount;

    // COUNT ACTIVE MEDICATIONS
    const activeCount = medications.filter(
        (medication) =>
            medication.status === "active"
    ).length;

    // GET DOSE STATUS
    const getDoseStatus = (
        time: string,
        taken: boolean
    ) => {
        if (taken) return "taken";

        const [hours, minutes] = time
            .split(":")
            .map(Number);

        const scheduledTime = new Date();

        scheduledTime.setHours(
            hours,
            minutes,
            0,
            0
        );

        return currentTime >= scheduledTime
            ? "due"
            : "upcoming";
    };

    return (
        <div className="reminders-page">

            {/* HEADER */}
            <div className="reminders-header">

                <div>
                    <h1>Medication Management</h1>

                    <p>
                        Manage medications and stay on track
                        with your daily schedule.
                    </p>
                </div>

                <div className="reminders-header-actions">

                    <button
                        className="refresh-reminders"
                        onClick={loadMedications}
                        disabled={loading}
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>

                    <button
                        className="add-medication-main-btn"
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                    >
                        <Plus size={17} />
                        Add Medication
                    </button>

                </div>
            </div>

            {/* SUCCESS MESSAGE */}
            {message && (
                <div className="medication-success">
                    {message}
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="medication-error">
                    {error}
                </div>
            )}

            {/* OVERVIEW */}
            <div className="combined-summary">

                <div className="combined-summary-card">
                    <div className="combined-summary-icon blue">
                        <Pill size={23} />
                    </div>

                    <div>
                        <p>Total Medications</p>
                        <h2>{medications.length}</h2>
                    </div>
                </div>

                <div className="combined-summary-card">
                    <div className="combined-summary-icon green">
                        <CheckCircle size={23} />
                    </div>

                    <div>
                        <p>Active Medications</p>
                        <h2>{activeCount}</h2>
                    </div>
                </div>

                <div className="combined-summary-card">
                    <div className="combined-summary-icon purple">
                        <CheckCircle size={23} />
                    </div>

                    <div>
                        <p>Doses Taken Today</p>
                        <h2>{takenCount}</h2>
                    </div>
                </div>

                <div className="combined-summary-card">
                    <div className="combined-summary-icon orange">
                        <Clock size={23} />
                    </div>

                    <div>
                        <p>Pending Doses</p>
                        <h2>{pendingCount}</h2>
                    </div>
                </div>

            </div>

            {/* NOTIFICATIONS */}
            <div className="notification-banner">

                <div className="notification-banner-icon">
                    <Bell size={23} />
                </div>

                <div className="notification-banner-content">

                    <h3>Browser Notifications</h3>

                    <p>
                        {notificationPermission === "granted"
                            ? "Notifications are enabled."
                            : notificationPermission === "denied"
                                ? "Notifications are blocked in browser settings."
                                : "Enable notifications to receive medication alerts."}
                    </p>

                </div>

                {notificationPermission === "default" && (
                    <button onClick={enableNotifications}>
                        Enable Notifications
                    </button>
                )}

            </div>

            {/* ADD / EDIT MEDICATION FORM */}
            {showForm && (
                <div className="combined-form-card">

                    <div className="combined-form-heading">

                        <h2>
                            {editingId
                                ? "Edit Medication"
                                : "Add New Medication"}
                        </h2>

                        <button
                            type="button"
                            onClick={resetForm}
                            className="close-form-btn"
                        >
                            <X size={20} />
                        </button>

                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="medication-form-grid">

                            {/* MEDICINE NAME */}
                            <div className="medication-field">
                                <label>Medicine Name *</label>

                                <input
                                    name="medicine"
                                    value={form.medicine}
                                    onChange={handleChange}
                                    placeholder="Enter medicine name"
                                    required
                                />
                            </div>

                            {/* DOSAGE */}
                            <div className="medication-field">
                                <label>Dosage *</label>

                                <input
                                    name="dosage"
                                    value={form.dosage}
                                    onChange={handleChange}
                                    placeholder="Example: 500 mg"
                                    required
                                />
                            </div>

                            {/* FREQUENCY */}
                            <div className="medication-field">
                                <label>Frequency *</label>

                                <input
                                    name="frequency"
                                    value={form.frequency}
                                    onChange={handleChange}
                                    placeholder="Example: Twice daily"
                                    required
                                />
                            </div>

                            {/* START DATE */}
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

                            {/* END DATE */}
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

                        {/* MEDICATION SCHEDULE */}
                        <div className="medication-field">

                            <label>Medication Schedule *</label>

                            {form.times.map((time, index) => (
                                <div
                                    className="medication-time-row"
                                    key={index}
                                >

                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) =>
                                            handleTimeChange(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                    {form.times.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-time-btn"
                                            onClick={() =>
                                                removeTimeField(index)
                                            }
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

                        {/* INSTRUCTIONS */}
                        <div className="medication-field">

                            <label>Instructions</label>

                            <textarea
                                name="instructions"
                                value={form.instructions}
                                onChange={handleChange}
                                placeholder="Enter medication instructions"
                                rows={3}
                            />

                        </div>

                        {/* FORM BUTTONS */}
                        <div className="combined-form-actions">

                            <button
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Medication"
                                        : "Save Medication"}
                            </button>

                            <button
                                type="button"
                                className="cancel-form-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* TODAY'S MEDICATION SCHEDULE */}
            <div className="reminder-schedule-section">

                <div className="schedule-heading">

                    <div>
                        <h2>Today's Medication Schedule</h2>

                        <p>
                            {currentTime.toLocaleDateString(
                                "en-IN",
                                {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>

                    <span className="current-clock">
                        {currentTime.toLocaleTimeString()}
                    </span>

                </div>

                {loading ? (
                    <p>Loading schedule...</p>
                ) : schedule.length === 0 ? (

                    <div className="reminder-empty">
                        <Pill size={35} />

                        <h3>No medications scheduled</h3>

                        <p>
                            Add an active medication to create
                            your schedule.
                        </p>
                    </div>

                ) : (

                    <div className="reminder-list">

                        {schedule.map((item) => {

                            const taken =
                                !!doseRecords[item.key]?.taken;

                            const status = getDoseStatus(
                                item.time,
                                taken
                            );

                            return (
                                <div
                                    className={`reminder-card ${status}`}
                                    key={item.key}
                                >

                                    {/* TIME */}
                                    <div className="reminder-time">
                                        <Clock size={19} />

                                        <strong>
                                            {item.time}
                                        </strong>
                                    </div>

                                    {/* MEDICINE DETAILS */}
                                    <div className="reminder-medicine-info">

                                        <h3>
                                            {item.medication.medicine}
                                        </h3>

                                        <p>
                                            {item.medication.dosage}
                                        </p>

                                        <span>
                                            {item.medication.frequency}
                                        </span>

                                    </div>

                                    {/* DOSE STATUS */}
                                    <div className="reminder-status">

                                        <span
                                            className={`status-badge ${status}`}
                                        >
                                            {status === "taken"
                                                ? "Taken"
                                                : status === "due"
                                                    ? "Due"
                                                    : "Upcoming"}
                                        </span>

                                        {taken ? (

                                            <button
                                                className="undo-dose-btn"
                                                onClick={() =>
                                                    undoTaken(
                                                        item.medication.id,
                                                        item.time
                                                    )
                                                }
                                            >
                                                Undo
                                            </button>

                                        ) : (

                                            <button
                                                className="taken-dose-btn"
                                                onClick={() =>
                                                    markAsTaken(
                                                        item.medication.id,
                                                        item.time
                                                    )
                                                }
                                            >
                                                <CheckCircle size={15} />
                                                Mark as Taken
                                            </button>

                                        )}

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

            {/* MEDICATION LIST */}
            <div className="combined-medication-list">

                <div className="combined-list-heading">

                    <h2>My Medications</h2>

                    <span>
                        {medications.length} records
                    </span>

                </div>

                {loading ? (
                    <p>Loading medications...</p>
                ) : medications.length === 0 ? (

                    <div className="reminder-empty">

                        <Pill size={35} />

                        <h3>No medications found</h3>

                        <p>
                            Add your first medication to get started.
                        </p>

                    </div>

                ) : (

                    <div className="combined-medication-grid">

                        {medications.map((medication) => (

                            <div
                                className="combined-medication-card"
                                key={medication.id}
                            >

                                {/* MEDICATION HEADER */}
                                <div className="combined-medication-top">

                                    <div className="combined-medication-icon">
                                        <Pill size={22} />
                                    </div>

                                    <span
                                        className={`medication-status ${medication.status}`}
                                    >
                                        {medication.status}
                                    </span>

                                </div>

                                {/* MEDICATION NAME */}
                                <h3>
                                    {medication.medicine}
                                </h3>

                                <p className="combined-dosage">
                                    {medication.dosage}
                                </p>

                                {/* MEDICATION DETAILS */}
                                <div className="combined-medication-details">

                                    <p>
                                        <strong>Frequency:</strong>{" "}
                                        {medication.frequency}
                                    </p>

                                    <p>
                                        <strong>Times:</strong>{" "}
                                        {medication.times.join(", ")}
                                    </p>

                                    <p>
                                        <strong>Start:</strong>{" "}
                                        {medication.start_date}
                                    </p>

                                    <p>
                                        <strong>End:</strong>{" "}
                                        {medication.end_date ||
                                            "Not specified"}
                                    </p>

                                    <p>
                                        <strong>Instructions:</strong>{" "}
                                        {medication.instructions ||
                                            "No instructions"}
                                    </p>

                                </div>

                                {/* EDIT AND DELETE */}
                                <div className="combined-medication-actions">

                                    <button
                                        className="edit-medication-btn"
                                        onClick={() =>
                                            handleEdit(medication)
                                        }
                                    >
                                        <Edit size={15} />
                                        Edit
                                    </button>

                                    <button
                                        className="delete-medication-btn"
                                        onClick={() =>
                                            handleDelete(medication.id)
                                        }
                                    >
                                        <Trash2 size={15} />
                                        Delete
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

            {/* DISCLAIMER */}
            <div className="reminder-disclaimer">

                <AlertCircle size={18} />

                <p>
                    Medication reminders are informational only.
                    Follow your healthcare professional's instructions.
                    Marking a dose as taken does not verify actual
                    medication use.
                </p>

            </div>

        </div>
    );
}

export default MedicationReminders;