import { useEffect, useState } from "react";
import { logoutMedicAI } from "../api";
import "./Settings.css";

const API_URL = "http://127.0.0.1:8000/api";
const TOKEN_KEY = "medic_ai_token";

interface UserProfile {
    id?: number;
    full_name?: string;
    email?: string;
    age?: number | null;
    sex?: string;
    language?: string;
    consent?: boolean;
    allergies?: string;
    emergency_contact?: string;
}

interface Preferences {
    theme: "light" | "dark";
    language: string;
    notifications: boolean;
    medicationReminders: boolean;
    emailNotifications: boolean;
}

const defaultPreferences: Preferences = {
    theme: "light",
    language: "en",
    notifications: true,
    medicationReminders: true,
    emailNotifications: false,
};

const languages = [
    { value: "en", label: "English" },
    { value: "ml", label: "Malayalam" },
    { value: "ta", label: "Tamil" },
    { value: "hi", label: "Hindi" },
];

function normalizeLanguage(value: string | undefined): string {
    const legacyLanguages: Record<string, string> = {
        English: "en",
        Malayalam: "ml",
        Tamil: "ta",
        Hindi: "hi",
    };

    if (!value) return "en";

    return legacyLanguages[value] || value;
}

export default function Settings() {
    const [profile, setProfile] = useState<UserProfile>({});
    const [form, setForm] = useState<UserProfile>({});

    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [preferences, setPreferences] = useState<Preferences>(() => {
        try {
            const saved = localStorage.getItem("medic_ai_preferences");

            if (saved) {
                const parsed = JSON.parse(saved);

                return {
                    ...defaultPreferences,
                    ...parsed,
                    language: normalizeLanguage(parsed.language),
                };
            }

            return defaultPreferences;
        } catch {
            return defaultPreferences;
        }
    });

    const [message, setMessage] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "medic_ai_preferences",
            JSON.stringify(preferences)
        );

        document.documentElement.classList.toggle(
            "medic-dark-mode",
            preferences.theme === "dark"
        );
    }, [preferences]);

    // FETCH PROFILE

    async function fetchProfile() {
        const token = localStorage.getItem(TOKEN_KEY);

        setLoading(true);
        setProfileError("");
        setMessage("");

        if (!token) {
            setLoading(false);
            setProfileError(
                "Your login session could not be found. Please log in again."
            );
            return;
        }

        const controller = new AbortController();

        const timeoutId = window.setTimeout(() => {
            controller.abort();
        }, 12000);

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal: controller.signal,
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Your session has expired. Please log in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    `Unable to load your profile. Server returned ${response.status}.`
                );
            }

            const data = await response.json();

            if (!data || typeof data !== "object") {
                throw new Error(
                    "The server returned invalid profile information."
                );
            }

            setProfile(data);
            setForm(data);

            if (data.language) {
                setPreferences((previous) => ({
                    ...previous,
                    language: normalizeLanguage(data.language),
                }));
            }

            setProfileError("");
        } catch (error) {
            console.error("Profile loading error:", error);

            if (error instanceof Error && error.name === "AbortError") {
                setProfileError(
                    "The server is taking too long to respond. Please check your backend and try again."
                );
            } else {
                setProfileError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load your profile."
                );
            }
        } finally {
            window.clearTimeout(timeoutId);
            setLoading(false);
        }
    }

    // PROFILE FORM

    function updateProfileField(
        field: keyof UserProfile,
        value: string | number | null
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function saveProfile() {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            setMessage("Please log in again.");
            return;
        }

        if (!form.full_name?.trim() || !form.email?.trim()) {
            setMessage("Full name and email are required.");
            return;
        }

        if (
            form.age !== null &&
            form.age !== undefined &&
            (Number(form.age) < 1 || Number(form.age) > 120)
        ) {
            setMessage("Please enter a valid age.");
            return;
        }

        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    full_name: form.full_name.trim(),
                    email: form.email.trim(),
                    age:
                        form.age === null || form.age === undefined
                            ? null
                            : Number(form.age),
                    sex: form.sex || "",
                    language: normalizeLanguage(form.language),
                    allergies: form.allergies || "",
                    emergency_contact: form.emergency_contact || "",
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    typeof data.detail === "string"
                        ? data.detail
                        : "Profile update failed."
                );
            }

            const updatedProfile = data.user || data;

            setProfile(updatedProfile);
            setForm(updatedProfile);

            setPreferences((previous) => ({
                ...previous,
                language: normalizeLanguage(updatedProfile.language),
            }));

            setEditing(false);
            setMessage("Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);

            setMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    }

    function cancelEditing() {
        setForm(profile);
        setEditing(false);
        setMessage("");
    }

    // PREFERENCES

    function updatePreference<K extends keyof Preferences>(
        key: K,
        value: Preferences[K]
    ) {
        setPreferences((previous) => ({
            ...previous,
            [key]: value,
        }));

        setMessage("Settings saved successfully.");

        window.setTimeout(() => {
            setMessage("");
        }, 2500);
    }

    // NOTIFICATIONS

    async function enableNotifications() {
        if (!("Notification" in window)) {
            setMessage("Browser notifications are not supported.");
            return;
        }

        if (preferences.notifications) {
            updatePreference("notifications", false);
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            updatePreference("notifications", true);
        } else {
            setMessage("Notification permission was not granted.");
        }
    }

    // PASSWORD MANAGEMENT

    async function handleChangePassword(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!currentPassword) {
            setMessage("Please enter your current password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("New password and confirmation do not match.");
            return;
        }

        if (newPassword.length < 8 || newPassword.length > 72) {
            setMessage("Password must contain between 8 and 72 characters.");
            return;
        }

        if (currentPassword === newPassword) {
            setMessage(
                "Your new password must be different from your current password."
            );
            return;
        }

        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            setMessage("Please log in again.");
            return;
        }

        setPasswordLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/auth/change-password`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    typeof data.detail === "string"
                        ? data.detail
                        : "Unable to change password."
                );
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setMessage(
                data.message || "Password changed successfully!"
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setPasswordLoading(false);
        }
    }

    // UPDATED LOGOUT

    function handleLogout() {
        const confirmed = window.confirm(
            "Are you sure you want to log out of Medic.AI?"
        );

        if (!confirmed) return;

        logoutMedicAI();
        window.location.reload();
    }

    // PROFILE LOADING UI

    function ProfileLoading() {
        return (
            <div className="settings-profile-loading">
                <div className="settings-loading-avatar"></div>

                <div className="settings-loading-info">
                    <div className="settings-skeleton settings-skeleton-title"></div>
                    <div className="settings-skeleton settings-skeleton-text"></div>
                </div>

                <div className="settings-loading-grid">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div
                            className="settings-loading-field"
                            key={item}
                        >
                            <div className="settings-skeleton settings-skeleton-label"></div>
                            <div className="settings-skeleton settings-skeleton-input"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // SETTINGS UI

    return (
        <div className="settings-page">

            {/* HEADER */}

            <div className="settings-header">
                <div>
                    <span className="settings-label">
                        PERSONAL PREFERENCES
                    </span>

                    <h1>Settings</h1>

                    <p>
                        Manage your account, privacy and application preferences.
                    </p>
                </div>

                <div className="settings-header-icon">⚙️</div>
            </div>

            {/* MESSAGES */}

            {message && (
                <div
                    className={
                        message.toLowerCase().includes("successfully")
                            ? "settings-message settings-success-message"
                            : "settings-message settings-error-message"
                    }
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </div>
            )}

            {/* PROFILE SETTINGS */}

            <section className="settings-section">

                <div className="settings-section-title">
                    <span className="settings-icon">👤</span>

                    <div>
                        <h2>Profile Settings</h2>
                        <p>Your personal information</p>
                    </div>
                </div>

                {loading ? (
                    <ProfileLoading />
                ) : profileError ? (
                    <div className="settings-profile-error">
                        <div className="settings-error-icon">!</div>

                        <h3>Unable to load your profile</h3>

                        <p>{profileError}</p>

                        <button
                            className="settings-save-btn"
                            type="button"
                            onClick={fetchProfile}
                        >
                            ↻ Try Again
                        </button>
                    </div>
                ) : (
                    <div className="settings-profile">

                        <div className="settings-profile-top">

                            <div className="settings-avatar">
                                {(profile.full_name || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="settings-profile-info">
                                <h3>{profile.full_name || "User"}</h3>
                                <span>{profile.email || "Email unavailable"}</span>
                                <small>Medic.AI Account</small>
                            </div>

                            {!editing && (
                                <span className="settings-profile-badge">
                                    ✓ Profile Loaded
                                </span>
                            )}
                        </div>

                        <div className="settings-profile-grid">

                            <div className="settings-field">
                                <label>Full Name</label>

                                <input
                                    type="text"
                                    value={
                                        editing
                                            ? form.full_name || ""
                                            : profile.full_name || ""
                                    }
                                    readOnly={!editing}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "full_name",
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-field">
                                <label>Email Address</label>

                                <input
                                    type="email"
                                    value={
                                        editing
                                            ? form.email || ""
                                            : profile.email || ""
                                    }
                                    readOnly={!editing}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "email",
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-field">
                                <label>Age</label>

                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={
                                        editing
                                            ? form.age ?? ""
                                            : profile.age ?? ""
                                    }
                                    readOnly={!editing}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "age",
                                            event.target.value === ""
                                                ? null
                                                : Number(event.target.value)
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-field">
                                <label>Sex</label>

                                <select
                                    value={
                                        editing
                                            ? form.sex || ""
                                            : profile.sex || ""
                                    }
                                    disabled={!editing}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "sex",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">
                                        Prefer not to say
                                    </option>
                                </select>
                            </div>

                            <div className="settings-field">
                                <label>Preferred Language</label>

                                <select
                                    value={
                                        editing
                                            ? normalizeLanguage(form.language)
                                            : normalizeLanguage(profile.language)
                                    }
                                    disabled={!editing}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "language",
                                            event.target.value
                                        )
                                    }
                                >
                                    {languages.map((language) => (
                                        <option
                                            key={language.value}
                                            value={language.value}
                                        >
                                            {language.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="settings-field">
                                <label>Emergency Contact</label>

                                <input
                                    type="text"
                                    value={
                                        editing
                                            ? form.emergency_contact || ""
                                            : profile.emergency_contact || ""
                                    }
                                    readOnly={!editing}
                                    placeholder="Enter emergency contact"
                                    onChange={(event) =>
                                        updateProfileField(
                                            "emergency_contact",
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="settings-field settings-full-width">
                                <label>Allergies</label>

                                <textarea
                                    value={
                                        editing
                                            ? form.allergies || ""
                                            : profile.allergies || ""
                                    }
                                    readOnly={!editing}
                                    placeholder="Enter your allergies"
                                    rows={3}
                                    onChange={(event) =>
                                        updateProfileField(
                                            "allergies",
                                            event.target.value
                                        )
                                    }
                                />
                            </div>

                        </div>

                        <div className="settings-profile-actions">

                            {!editing ? (
                                <button
                                    type="button"
                                    className="settings-edit-btn"
                                    onClick={() => {
                                        setForm(profile);
                                        setEditing(true);
                                        setMessage("");
                                    }}
                                >
                                    ✏️ Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="settings-save-btn"
                                        onClick={saveProfile}
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>

                                    <button
                                        type="button"
                                        className="settings-cancel-btn"
                                        onClick={cancelEditing}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}

                        </div>

                        {!editing && (
                            <p className="settings-note">
                                Your personal information is managed through
                                your authenticated Medic.AI account.
                            </p>
                        )}

                    </div>
                )}

            </section>

            {/* ACCOUNT SETTINGS */}

            <section className="settings-section">

                <div className="settings-section-title">
                    <span className="settings-icon">🔐</span>

                    <div>
                        <h2>Account Settings</h2>
                        <p>Manage your account security</p>
                    </div>
                </div>

                <div className="settings-password">

                    <div className="settings-password-heading">
                        <h3>Change Password</h3>

                        <p>
                            Choose a new password with at least 8 characters.
                        </p>
                    </div>

                    <form
                        className="settings-password-form"
                        onSubmit={handleChangePassword}
                    >

                        <div className="settings-field">
                            <label htmlFor="current-password">
                                Current Password
                            </label>

                            <input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(event.target.value)
                                }
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="new-password">
                                New Password
                            </label>

                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(event.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={72}
                                required
                            />
                        </div>

                        <div className="settings-field">
                            <label htmlFor="confirm-password">
                                Confirm New Password
                            </label>

                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                maxLength={72}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="settings-save-btn settings-password-submit"
                            disabled={passwordLoading}
                        >
                            {passwordLoading
                                ? "Changing Password..."
                                : "Change Password"}
                        </button>

                    </form>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Account Status</h3>
                        <p>Your Medic.AI account information.</p>
                    </div>

                    <span className="settings-active">Active</span>
                </div>

            </section>

            {/* APPEARANCE */}

            <section className="settings-section">

                <div className="settings-section-title">
                    <span className="settings-icon">🎨</span>

                    <div>
                        <h2>Appearance</h2>
                        <p>Customize your application theme</p>
                    </div>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Light Mode</h3>
                        <p>Use the default light appearance.</p>
                    </div>

                    <input
                        type="radio"
                        name="theme"
                        checked={preferences.theme === "light"}
                        onChange={() =>
                            updatePreference("theme", "light")
                        }
                    />
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Dark Mode</h3>
                        <p>Use a darker application appearance.</p>
                    </div>

                    <input
                        type="radio"
                        name="theme"
                        checked={preferences.theme === "dark"}
                        onChange={() =>
                            updatePreference("theme", "dark")
                        }
                    />
                </div>

            </section>

            {/* LANGUAGE */}

            <section className="settings-section">

                <div className="settings-section-title">
                    <span className="settings-icon">🌐</span>

                    <div>
                        <h2>Language Settings</h2>
                        <p>Choose your preferred language</p>
                    </div>
                </div>

                <div className="settings-language">
                    <label>Application Language</label>

                    <select
                        value={preferences.language}
                        onChange={(event) =>
                            updatePreference(
                                "language",
                                event.target.value
                            )
                        }
                    >
                        {languages.map((language) => (
                            <option
                                key={language.value}
                                value={language.value}
                            >
                                {language.label}
                            </option>
                        ))}
                    </select>

                    <p>
                        Your preference is saved locally. Full application
                        translation requires language integration.
                    </p>
                </div>

            </section>

            {/* PRIVACY */}

            <section className="settings-section">

                <div className="settings-section-title">
                    <span className="settings-icon">🛡️</span>

                    <div>
                        <h2>Privacy & Security</h2>
                        <p>Manage your privacy preferences</p>
                    </div>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Data Processing Consent</h3>
                        <p>
                            Your consent status for processing personal
                            information.
                        </p>
                    </div>

                    <span
                        className={
                            profile.consent
                                ? "settings-active"
                                : "settings-status"
                        }
                    >
                        {profile.consent
                            ? "Consent Given"
                            : "Not Confirmed"}
                    </span>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Authentication</h3>
                        <p>
                            Medic.AI uses token-based authentication.
                        </p>
                    </div>

                    <span className="settings-active">Enabled</span>
                </div>

                <div className="settings-security-note">
                    Your medical information should only be accessed
                    through your authenticated account. Do not share your
                    login credentials with others.
                </div>

            </section>

            {/* NOTIFICATIONS */}

            <section className="settings-section">

                <div className="settings-section-title">
                    <span className="settings-icon">🔔</span>

                    <div>
                        <h2>Notifications</h2>
                        <p>Control your notification preferences</p>
                    </div>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Browser Notifications</h3>
                        <p>Allow notifications from Medic.AI.</p>
                    </div>

                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={preferences.notifications}
                            onChange={enableNotifications}
                        />
                        <span className="settings-slider"></span>
                    </label>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Medication Reminders</h3>
                        <p>Enable medication reminder preferences.</p>
                    </div>

                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={preferences.medicationReminders}
                            onChange={(event) =>
                                updatePreference(
                                    "medicationReminders",
                                    event.target.checked
                                )
                            }
                        />
                        <span className="settings-slider"></span>
                    </label>
                </div>

                <div className="settings-option">
                    <div>
                        <h3>Email Notifications</h3>
                        <p>Save your preference for email notifications.</p>
                    </div>

                    <label className="settings-switch">
                        <input
                            type="checkbox"
                            checked={preferences.emailNotifications}
                            onChange={(event) =>
                                updatePreference(
                                    "emailNotifications",
                                    event.target.checked
                                )
                            }
                        />
                        <span className="settings-slider"></span>
                    </label>
                </div>

            </section>

            {/* LOGOUT */}

            <section className="settings-section settings-logout-section">

                <div className="settings-section-title">
                    <span className="settings-icon">🚪</span>

                    <div>
                        <h2>Logout</h2>
                        <p>Sign out from your Medic.AI account.</p>
                    </div>
                </div>

                <button
                    className="settings-logout-btn"
                    onClick={handleLogout}
                >
                    Log Out
                </button>

            </section>

            {/* FOOTER */}

            <footer className="settings-footer">

                <div className="settings-footer-logo">
                    Medic<span>.AI</span>
                </div>

                <p>
                    AI-Powered Healthcare Intelligence & Patient Support System
                </p>

                <div className="settings-footer-line"></div>

                <p className="settings-developer">
                    Developed by <strong>Amnon.A.Pradeep</strong>
                </p>

                <span>
                    © {new Date().getFullYear()} Medic.AI. All rights reserved.
                </span>

            </footer>

        </div>
    );
}