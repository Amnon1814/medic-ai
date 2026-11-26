# Medic.AI – Frontend Documentation

**AI-Powered Healthcare Intelligence & Patient Support System**

The Medic.AI frontend is a modern, responsive web application developed using React, TypeScript and Vite. It provides an interactive interface for patients to access AI-powered healthcare assistance, manage health information, analyse medical reports and monitor personal health metrics.

The frontend communicates with the FastAPI backend through REST APIs and provides a centralized interface for the different healthcare services offered by Medic.AI.

---

## 1. Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface development |
| TypeScript | Type-safe application development |
| Vite | Frontend development server and build tool |
| CSS3 | Application styling and responsive layouts |
| REST API | Communication with the backend |
| React Markdown | Rendering AI-generated Markdown responses |
| Local Storage | Session token and chat history persistence |
| Browser Speech API | Voice recognition and speech synthesis |

---

## 2. Frontend Features

### 2.1 Authentication
- User login interface.
- JWT-based authentication integration.
- Session validation.
- Secure authenticated API requests.
- Logout functionality.

### 2.2 Dashboard
- Centralized healthcare dashboard.
- Patient health information overview.
- Health data visualizations.
- Quick navigation to application modules.

### 2.3 AI Healthcare Assistant
- Interactive AI-powered chat interface.
- Healthcare information assistance.
- RAG-based backend integration.
- Conversation history.
- Voice input and speech output.
- Markdown-based response rendering.

### 2.4 Symptom Assessment
- Interactive symptom information form.
- Symptom assessment through backend APIs.
- Display of possible explanations.
- Urgency information and recommendations.
- Follow-up questions.

### 2.5 Medical Reports
- Medical document upload interface.
- Supported document formats: PDF, PNG and JPEG.
- Medical report analysis through backend APIs.
- Display of summaries and extracted findings.
- Simplified report explanations.

### 2.6 Vitals Monitoring
- Patient health vitals interface.
- Health data visualization.
- Historical health information.
- Interactive monitoring charts.

### 2.7 Medication Management
- Medication management interface.
- Medication information display.
- Medication scheduling.
- Medication tracking.

### 2.8 Medication Reminders
- Medication reminder interface.
- Medication schedule management.
- Reminder information display.

### 2.9 Health Records
- Health document upload interface.
- Health record management.
- Access to stored health documents.
- Record organization.

### 2.10 Settings
- User profile management.
- Account preferences.
- Application settings.
- Notification and privacy preferences.
- Logout functionality.

---

## 3. Project Structure

```text
frontend/
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   │
│   ├── assets/
│   │   └── hero.png
│   │
│   ├── components/
│   │   ├── AIChat.tsx
│   │   ├── AIChat.css
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard.css
│   │   ├── HealthCharts.tsx
│   │   ├── HealthCharts.css
│   │   ├── HealthRecords.tsx
│   │   ├── HealthRecords.css
│   │   ├── Login.tsx
│   │   ├── Login.css
│   │   ├── MedicalReports.tsx
│   │   ├── MedicalReports.css
│   │   ├── MedicationReminders.tsx
│   │   ├── MedicationReminders.css
│   │   ├── Medications.tsx
│   │   ├── Medications.css
│   │   ├── Settings.tsx
│   │   ├── Settings.css
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.css
│   │   ├── SymptomAssessment.tsx
│   │   ├── SymptomAssessment.css
│   │   ├── VitalsForm.tsx
│   │   ├── VitalsForm.css
│   │   ├── VitalsMonitor.tsx
│   │   └── VitalsMonitor.css
│   │
│   ├── api.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
└── README.md
```

---

## 4. Application Architecture

The frontend follows a component-based architecture.

```text
                 USER
                  |
                  v
             REACT APP
                  |
                  v
                App.tsx
                  |
          +-------+--------+
          |                |
          v                v
       LOGIN            SIDEBAR
          |                |
          |                v
          |          APPLICATION
          |             MODULES
          |                |
          |     +----------+----------+
          |     |          |          |
          |     v          v          v
          |  DASHBOARD  AI CHAT   HEALTHCARE
          |                        MODULES
          |                            |
          +-------------+--------------+
                        |
                        v
                    api.ts
                        |
                        v
                  REST API CALLS
                        |
                        v
                  FASTAPI BACKEND
```

### Main Application Files

**App.tsx**
- Controls the main application structure.
- Handles authentication state.
- Validates existing user sessions.
- Manages application navigation.
- Renders the selected application module.

**api.ts**
- Centralized API communication.
- Handles authentication headers.
- Sends requests to backend endpoints.
- Provides functions for healthcare services.
- Handles API responses and errors.

**main.tsx**
- Frontend application entry point.
- Initializes the React application.

**components/**
- Contains reusable application components.
- Separates healthcare modules into individual files.
- Maintains a modular frontend structure.

---

## 5. Installation and Setup

### Prerequisites

Install the following:

- Node.js
- npm
- Git
- A running Medic.AI backend server

### Step 1: Navigate to the Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start the Development Server

```bash
npm run dev
```

The frontend development server will be available at:

```text
http://localhost:5173
```

---

## 6. Backend Integration

The frontend communicates with the Medic.AI backend using REST APIs.

The API client is maintained in:

```text
src/api.ts
```

The backend API base URL is currently configured in the frontend API client.

Default backend URL:

```text
http://127.0.0.1:8000
```

Backend API documentation:

```text
http://127.0.0.1:8000/docs
```

### API Integration Includes

- User authentication.
- User profile retrieval.
- AI healthcare conversations.
- Symptom assessment.
- Medical report analysis.
- Medication management.
- Health records management.
- Patient vitals management.

The frontend uses authenticated requests where required and handles backend responses through centralized API functions.

---

## 7. Development Commands

Run these commands from the `frontend` directory.

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |

The available commands depend on the scripts configured in `package.json`.

---

## 8. Production Build

To generate the production frontend build:

```bash
npm run build
```

Vite generates optimized production files in:

```text
frontend/dist/
```

To preview the production build locally:

```bash
npm run preview
```

The generated `dist` directory is a build artifact and should not be committed to GitHub.

---

## 9. Frontend Security Considerations

The frontend incorporates security-related practices, including:

- JWT-based authentication integration.
- Authenticated API communication.
- Session validation.
- Centralized API request handling.
- Environment and configuration separation where applicable.
- Error handling for failed API requests.

Additional security measures are required before production deployment.

In particular, sensitive healthcare information should not be stored unnecessarily in browser storage, and production communication should use HTTPS.

---

## 10. Future Improvements

Potential frontend enhancements include:

- Improved responsive design for mobile devices.
- Advanced dashboard visualizations.
- Enhanced accessibility.
- Improved loading and error states.
- Real-time health monitoring interfaces.
- Multilingual user interface.
- Progressive Web App support.
- Improved frontend performance and code splitting.

---

## 11. Related Documentation

For complete project information, backend setup, system architecture, AI integration and Docker configuration, refer to the root project documentation.

**Main Project:** [Medic.AI – GitHub Repository](https://github.com/Amnon1814/medic-ai)

**Developer:** Amnon A. Pradeep

---

<p align="center">
  <strong>Medic.AI – Intelligent Healthcare Support Through Artificial Intelligence.</strong>
</p>