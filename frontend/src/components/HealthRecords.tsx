import { useEffect, useMemo, useRef, useState } from "react";
import {
    addHealthRecord,
    getHealthRecords,
    uploadHealthRecord,
    getHealthRecordFile,
    deleteHealthRecord,
} from "../api";
import type { HealthRecord } from "../api";
import "./HealthRecords.css";

const categories = [
    "Lab Report",
    "Prescription",
    "Scan",
    "Diagnosis",
    "Discharge Summary",
    "Other",
];

export default function HealthRecords() {
    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<"manual" | "upload">("manual");

    const [category, setCategory] = useState("Lab Report");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadRecords();
    }, []);

    async function loadRecords() {
        try {
            setLoading(true);
            setError("");
            const data = await getHealthRecords();
            setRecords(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load health records."
            );
        } finally {
            setLoading(false);
        }
    }

    function resetForm() {
        setTitle("");
        setContent("");
        setCategory("Lab Report");
        setSelectedFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    function openForm(mode: "manual" | "upload") {
        resetForm();
        setFormMode(mode);
        setMessage("");
        setError("");
        setShowForm(true);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim()) {
            setError("Please enter a record title.");
            return;
        }

        if (formMode === "manual" && !content.trim()) {
            setError("Please enter the record details.");
            return;
        }

        if (formMode === "upload" && !selectedFile) {
            setError("Please select a PDF, JPG or PNG file.");
            return;
        }

        if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
            setError("File size must not exceed 10 MB.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            if (formMode === "manual") {
                await addHealthRecord({
                    category,
                    title: title.trim(),
                    content: content.trim(),
                });
            } else if (selectedFile) {
                await uploadHealthRecord(
                    selectedFile,
                    category,
                    title.trim(),
                    content.trim()
                );
            }

            setMessage("Health record saved successfully.");
            setShowForm(false);
            resetForm();
            await loadRecords();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to save health record."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(record: HealthRecord) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${record.title}"?`
        );

        if (!confirmed) return;

        try {
            setError("");
            await deleteHealthRecord(record.id);
            setRecords((previous) =>
                previous.filter((item) => item.id !== record.id)
            );
            setMessage("Health record deleted successfully.");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to delete health record."
            );
        }
    }

    async function handleViewFile(record: HealthRecord, download = false) {
        try {
            setError("");

            const blob = await getHealthRecordFile(record.id);
            const url = URL.createObjectURL(blob);

            if (download) {
                const link = document.createElement("a");
                link.href = url;
                link.download = record.file_name || `${record.title}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                const newWindow = window.open(url, "_blank");

                if (!newWindow) {
                    setError("Your browser blocked the document window. Allow pop-ups and try again.");
                }
            }

            window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to open document."
            );
        }
    }

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            const matchesSearch =
                record.title.toLowerCase().includes(search.toLowerCase()) ||
                record.category.toLowerCase().includes(search.toLowerCase()) ||
                record.content.toLowerCase().includes(search.toLowerCase());

            const matchesCategory =
                filter === "All" || record.category === filter;

            return matchesSearch && matchesCategory;
        });
    }, [records, search, filter]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatFileSize = (size: number | null) => {
        if (!size) return "";
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="health-records-page">
            <div className="health-records-header">
                <div>
                    <span className="health-records-label">MEDICAL INFORMATION</span>
                    <h1>Health Records</h1>
                    <p>Securely organize and manage your medical documents and records.</p>
                </div>

                <div className="health-records-actions">
                    <button
                        className="hr-secondary-btn"
                        onClick={() => openForm("manual")}
                    >
                        + Add Record
                    </button>

                    <button
                        className="hr-primary-btn"
                        onClick={() => openForm("upload")}
                    >
                        ↑ Upload Document
                    </button>
                </div>
            </div>

            {message && <div className="hr-success">{message}</div>}
            {error && <div className="hr-error">{error}</div>}

            <div className="hr-stats">
                <div className="hr-stat-card">
                    <div className="hr-stat-icon">📁</div>
                    <div>
                        <span>Total Records</span>
                        <h2>{records.length}</h2>
                    </div>
                </div>

                <div className="hr-stat-card">
                    <div className="hr-stat-icon">📄</div>
                    <div>
                        <span>Uploaded Documents</span>
                        <h2>{records.filter((record) => record.has_file).length}</h2>
                    </div>
                </div>

                <div className="hr-stat-card">
                    <div className="hr-stat-icon">📝</div>
                    <div>
                        <span>Manual Records</span>
                        <h2>{records.filter((record) => !record.has_file).length}</h2>
                    </div>
                </div>
            </div>

            <div className="hr-records-container">
                <div className="hr-records-toolbar">
                    <div>
                        <h2>Your Medical Records</h2>
                        <p>View and manage your saved health information.</p>
                    </div>

                    <div className="hr-filters">
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <select
                            value={filter}
                            onChange={(event) => setFilter(event.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="hr-empty-state">Loading health records...</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="hr-empty-state">
                        <div className="hr-empty-icon">📂</div>
                        <h3>No health records found</h3>
                        <p>Add a medical record or upload a document to get started.</p>
                        <button
                            className="hr-primary-btn"
                            onClick={() => openForm("manual")}
                        >
                            + Add Your First Record
                        </button>
                    </div>
                ) : (
                    <div className="hr-record-grid">
                        {filteredRecords.map((record) => (
                            <div className="hr-record-card" key={record.id}>
                                <div className="hr-record-top">
                                    <div className="hr-record-icon">
                                        {record.has_file ? "📄" : "📝"}
                                    </div>

                                    <span className="hr-category">
                                        {record.category}
                                    </span>
                                </div>

                                <h3>{record.title}</h3>

                                <p className="hr-record-description">
                                    {record.content || "No additional description provided."}
                                </p>

                                {record.has_file && (
                                    <div className="hr-file-info">
                                        <span>{record.file_name}</span>
                                        <small>{formatFileSize(record.file_size)}</small>
                                    </div>
                                )}

                                <div className="hr-record-date">
                                    Added {formatDate(record.created_at)}
                                </div>

                                <div className="hr-record-buttons">
                                    {record.has_file && (
                                        <>
                                            <button onClick={() => handleViewFile(record)}>
                                                View
                                            </button>
                                            <button onClick={() => handleViewFile(record, true)}>
                                                Download
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className="hr-delete-btn"
                                        onClick={() => handleDelete(record)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <div
                    className="hr-modal-overlay"
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="hr-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="hr-modal-header">
                            <div>
                                <h2>
                                    {formMode === "manual"
                                        ? "Add Health Record"
                                        : "Upload Medical Document"}
                                </h2>
                                <p>Enter the details of your medical record.</p>
                            </div>

                            <button
                                className="hr-close-btn"
                                onClick={() => setShowForm(false)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="hr-mode-switch">
                            <button
                                className={formMode === "manual" ? "active" : ""}
                                onClick={() => {
                                    setFormMode("manual");
                                    setError("");
                                    setSelectedFile(null);
                                }}
                            >
                                Manual Entry
                            </button>

                            <button
                                className={formMode === "upload" ? "active" : ""}
                                onClick={() => {
                                    setFormMode("upload");
                                    setError("");
                                }}
                            >
                                Upload Document
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>Record Title</label>
                            <input
                                type="text"
                                placeholder="e.g. Blood Test Report"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                required
                            />

                            <label>Category</label>
                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                            >
                                {categories.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            {formMode === "manual" ? (
                                <>
                                    <label>Record Details</label>
                                    <textarea
                                        rows={5}
                                        placeholder="Enter medical record details..."
                                        value={content}
                                        onChange={(event) => setContent(event.target.value)}
                                        required
                                    />
                                </>
                            ) : (
                                <>
                                    <label>Medical Document</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                        onChange={(event) =>
                                            setSelectedFile(event.target.files?.[0] || null)
                                        }
                                        required
                                    />

                                    <small className="hr-upload-help">
                                        Supported formats: PDF, JPG and PNG. Maximum size: 10 MB.
                                    </small>

                                    {selectedFile && (
                                        <div className="hr-selected-file">
                                            Selected: {selectedFile.name}
                                        </div>
                                    )}

                                    <label>Description (Optional)</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Add a short description..."
                                        value={content}
                                        onChange={(event) => setContent(event.target.value)}
                                    />
                                </>
                            )}

                            {error && <div className="hr-error">{error}</div>}

                            <div className="hr-modal-actions">
                                <button
                                    type="button"
                                    className="hr-cancel-btn"
                                    onClick={() => setShowForm(false)}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="hr-primary-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : formMode === "manual"
                                            ? "Save Record"
                                            : "Upload Document"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}