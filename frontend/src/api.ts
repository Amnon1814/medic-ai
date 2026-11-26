// ============================================================
// MEDIC.AI - CENTRAL API SERVICE
// ============================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const TOKEN_KEY = "medic_ai_token";


// ============================================================
// AUTHENTICATION HEADERS
// ============================================================

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        throw new Error("Please log in to Medic.AI first.");
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}


// ============================================================
// AUTHENTICATION - CURRENT USER
// ============================================================

export async function getCurrentUser() {
    const response = await fetch(
        `${API_BASE_URL}/auth/me`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    return response.json();
}


// ============================================================
// AUTHENTICATION - LOGOUT
// ============================================================

export function logoutMedicAI() {
    localStorage.removeItem(TOKEN_KEY);
}


// ============================================================
// MEDICATION TYPES
// ============================================================

export interface Medication {
    id: number;
    medicine: string;
    dosage: string;
    frequency: string;
    times: string[];
    instructions: string;
    start_date: string;
    end_date: string | null;
    status: string;
    created_at: string;
}

export interface MedicationInput {
    medicine: string;
    dosage: string;
    frequency: string;
    times: string[];
    instructions: string;
    start_date: string;
    end_date: string | null;
}


// ============================================================
// LOGIN
// ============================================================

export async function loginMedicAI(
    email: string,
    password: string
) {
    const formData = new URLSearchParams();

    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail ||
            "Login failed. Check your email and password."
        );
    }

    const data = await response.json();

    if (!data.access_token) {
        throw new Error(
            "Login response did not contain an access token."
        );
    }

    localStorage.setItem(TOKEN_KEY, data.access_token);

    return data;
}


// ============================================================
// AI CHAT
// ============================================================

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface ChatResponse {
    answer: string;
    emergency?: boolean;
    sources?: unknown[];
    grounded?: boolean;
    disclaimer?: string;
}

export async function sendChatMessage(
    message: string,
    history: ChatMessage[] = []
): Promise<ChatResponse> {

    const response = await fetch(
        `${API_BASE_URL}/chat`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify({
                message,
                history,
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to get AI response."
        );
    }

    const data = await response.json();

    if (!data.answer) {
        throw new Error(
            "Medic.AI returned an empty response."
        );
    }

    return data;
}


// ============================================================
// ADD MEDICATION
// ============================================================

export async function addMedication(
    data: MedicationInput
) {
    const response = await fetch(
        `${API_BASE_URL}/medications`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to add medication."
        );
    }

    return response.json();
}


// ============================================================
// GET MEDICATIONS
// ============================================================

export async function getMedications(): Promise<Medication[]> {
    const response = await fetch(
        `${API_BASE_URL}/medications`,
        {
            method: "GET",
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to fetch medications."
        );
    }

    const data = await response.json();

    return Array.isArray(data)
        ? data
        : data.medications || [];
}


// ============================================================
// UPDATE MEDICATION
// ============================================================

export async function updateMedication(
    id: number,
    data: MedicationInput
) {
    const response = await fetch(
        `${API_BASE_URL}/medications/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to update medication."
        );
    }

    return response.json();
}


// ============================================================
// DELETE MEDICATION
// ============================================================

export async function deleteMedication(id: number) {
    const response = await fetch(
        `${API_BASE_URL}/medications/${id}`,
        {
            method: "DELETE",
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to delete medication."
        );
    }

    return response.json();
}


// ============================================================
// HEALTH RECORD TYPES
// ============================================================

export interface HealthRecord {
    id: number;
    category: string;
    title: string;
    content: string;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    has_file: boolean;
    created_at: string;
}

export interface HealthRecordInput {
    category: string;
    title: string;
    content: string;
}


// ============================================================
// GET HEALTH RECORDS
// ============================================================

export async function getHealthRecords(): Promise<HealthRecord[]> {
    const response = await fetch(
        `${API_BASE_URL}/records`,
        {
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to fetch health records."
        );
    }

    const data = await response.json();

    return data.records || [];
}


// ============================================================
// ADD HEALTH RECORD
// ============================================================

export async function addHealthRecord(
    record: HealthRecordInput
) {
    const response = await fetch(
        `${API_BASE_URL}/records`,
        {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(record),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to add health record."
        );
    }

    return response.json();
}


// ============================================================
// UPLOAD HEALTH RECORD
// ============================================================

export async function uploadHealthRecord(
    file: File,
    category: string,
    title: string,
    description: string
) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("category", category);
    formData.append("title", title);
    formData.append("description", description);

    const response = await fetch(
        `${API_BASE_URL}/records/upload`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to upload health record."
        );
    }

    return response.json();
}


// ============================================================
// VIEW OR DOWNLOAD HEALTH RECORD FILE
// ============================================================

export async function getHealthRecordFile(
    id: number
): Promise<Blob> {
    const response = await fetch(
        `${API_BASE_URL}/records/${id}/file`,
        {
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to retrieve medical document."
        );
    }

    return response.blob();
}


// ============================================================
// DELETE HEALTH RECORD
// ============================================================

export async function deleteHealthRecord(id: number) {
    const response = await fetch(
        `${API_BASE_URL}/records/${id}`,
        {
            method: "DELETE",
            headers: getAuthHeaders(),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
            errorData?.detail || "Failed to delete health record."
        );
    }

    return response.json();
}
// ============================================================
// SYMPTOM ASSESSMENT
// ============================================================

export interface SymptomAssessmentInput {
    symptoms: string;
    age: number;
    sex: string;
    duration: string;
    severity: string;
}

export interface SymptomAssessmentResponse {
    success: boolean;
    assessment: {
        urgency: string;
        possible_explanations: string[];
        specialty: string;
        follow_up_questions: string[];
        advice: string;
        sources: string[];
    };
    disclaimer: string;
}

export async function assessSymptoms(
    data: SymptomAssessmentInput
): Promise<SymptomAssessmentResponse> {
    const response = await fetch(
        `${API_BASE_URL}/symptoms/assess`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
        }
    );

    const errorData = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            typeof errorData.detail === "string"
                ? errorData.detail
                : `Assessment failed. Server returned ${response.status}.`
        );
    }

    if (!errorData.success || !errorData.assessment) {
        throw new Error("The server returned an invalid assessment.");
    }

    return errorData as SymptomAssessmentResponse;
}
// ============================================================
// MEDICAL REPORT ANALYSIS
// ============================================================

export async function analyzeMedicalReport(
    file: File,
    reportType: string
) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("report_type", reportType);

    const response = await fetch(
        `${API_BASE_URL}/reports/analyze`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData,
        }
    );

    const errorData = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            errorData?.detail ||
            `Report analysis failed (${response.status}).`
        );
    }

    return response.json();
}