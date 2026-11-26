# 🏥 Medic.AI – AI-Powered Healthcare Intelligence & Patient Support System

<p align="center">
  <strong>Intelligent Healthcare Assistance | AI-Powered Insights | Patient-Centric Management</strong>
</p>

<p align="center">
  A full-stack AI-powered healthcare platform integrating conversational AI, medical knowledge retrieval, symptom assessment, medical report analysis and patient health management.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-TypeScript-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Python-FastAPI-green?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/AI-RAG-purple" alt="RAG">
  <img src="https://img.shields.io/badge/Database-SQLite-blue" alt="SQLite">
  <img src="https://img.shields.io/badge/Vector%20Database-ChromaDB-orange" alt="ChromaDB">
</p>

---

## 📌 Overview

**Medic.AI** is an AI-integrated healthcare intelligence and patient support application designed to make healthcare information more accessible through Artificial Intelligence, Machine Learning, Deep Learning and Generative AI technologies.

The platform combines intelligent conversational assistance with patient health management capabilities, enabling users to interact with an AI assistant, assess symptoms, analyse medical reports, monitor health metrics, manage medications and organize personal health records.

By incorporating Retrieval-Augmented Generation (RAG), the system can retrieve relevant information from its medical knowledge base to support context-aware responses.

Medic.AI provides a centralized and interactive environment for healthcare information assistance and patient support.

## ✨ Key Features

### 🤖 1. AI Healthcare Assistant
- AI-powered conversational healthcare assistance.
- Retrieval-Augmented Generation (RAG) integration.
- Context-aware responses using medical knowledge retrieval.
- Conversation history management.
- Voice-based interaction.

### 🩺 2. Intelligent Symptom Assessment
- Interactive symptom information collection.
- AI-assisted symptom assessment.
- Possible health explanations.
- Urgency-related guidance.
- Follow-up questions and recommendations.

### 📄 3. Medical Report Analysis
- Upload supported medical reports.
- AI-powered medical report interpretation.
- Automated report summaries.
- Important findings extraction.
- Simplified explanations of medical information.

### ❤️ 4. Patient Health Monitoring
- Health vitals management.
- Patient health data visualization.
- Interactive charts and monitoring.
- Historical health information tracking.

### 💊 5. Medication Management
- Medication information management.
- Medication schedule organization.
- Medication reminders.
- Medication tracking.

### 📁 6. Health Records Management
- Upload and organize health documents.
- Store and access patient health records.
- Manage personal healthcare information.

### 📊 7. Interactive Healthcare Dashboard
- Centralized patient dashboard.
- Health monitoring visualizations.
- Quick access to application modules.
- Health insights and information summaries.

### 🔐 8. Authentication and User Settings
- User authentication.
- JWT-based session management.
- Password hashing.
- User profile management.
- Application preferences and settings.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Database | SQLite |
| AI Integration | AI Language Model API |
| AI Architecture | Retrieval-Augmented Generation (RAG) |
| Vector Database | ChromaDB |
| Authentication | JSON Web Tokens (JWT) |
| API Communication | REST API |
| Data Visualization | React-based charts |
| Version Control | Git and GitHub |

---

## 🏗️ System Architecture

Medic.AI follows a full-stack architecture that connects the frontend, backend, database and AI processing components.

```text
                 PATIENT / USER
                       |
                       v
             REACT + TYPESCRIPT
                  FRONTEND
                       |
                       v
                 FASTAPI
                  BACKEND
                       |
          +------------+------------+
          |            |            |
          v            v            v
      AI MODULE    DATABASE    HEALTHCARE
          |         SQLITE       MODULES
          |                         |
          v                         v
       RAG SYSTEM              PATIENT SERVICES
          |
          v
       CHROMADB
          |
          v
   CONTEXTUAL INFORMATION
          |
          v
      AI RESPONSE
          |
          v
     USER INTERFACE
```

---

## 📂 Project Structure

```text
medic-ai/
│
├── backend/
│   ├── app/
│   │   ├── api.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── main.py
│   │   ├── medicine.py
│   │   ├── models.py
│   │   ├── rag.py
│   │   ├── report.py
│   │   ├── safety.py
│   │   ├── symptom.py
│   │   ├── symptom_engine.py
│   │   └── vitals_logic.py
│   │
│   ├── data/
│   ├── uploads/
│   ├── .env.example
│   ├── Dockerfile
│   ├── ingest.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ⚙️ Installation and Setup

Follow the instructions below to run Medic.AI locally.

### Prerequisites

Make sure the following software is installed:

- Python 3.10 or later.
- Node.js and npm.
- Git.
- Docker Desktop (optional).
- An API key for the configured AI provider.

### 1. Clone the Repository

```bash
git clone https://github.com/Amnon1814/medic-ai.git
cd medic-ai
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

**Activate the virtual environment:**

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create your environment configuration file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Open the newly created `.env` file and configure the required values.

The configuration includes:

- `DATABASE_URL`
- `SECRET_KEY`
- `ANTHROPIC_API_KEY`
- `LLM_MODEL`

Use the variable names and requirements defined in the supplied `.env.example` and backend configuration.

**Important:** Never commit your actual `.env` file, API keys or authentication secrets to GitHub.

### 4. Prepare the Medical Knowledge Base

Medic.AI supports medical knowledge ingestion through its ingestion script.

Add trusted `.txt` knowledge sources to:

```text
backend/data/knowledge/
```

Then execute:

```bash
python ingest.py
```

This prepares the knowledge base for the RAG functionality.

Use reliable, appropriately licensed medical information sources.

### 5. Start the Backend Server

From the `backend` directory:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### 6. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

The frontend and backend should both be running to use the complete application.

---

## 🐳 Docker Setup

Medic.AI includes a Docker Compose configuration for container-based setup.

Make sure Docker Desktop or Docker Engine is installed and running.

From the project root, execute:

```bash
docker compose up --build
```

The services will be built and started according to the repository's Docker Compose configuration.

---

## 🔒 Security and Privacy

Medic.AI incorporates security-related features, including:

- JWT-based authentication.
- Password hashing.
- Environment-based configuration.
- Authenticated API access.
- File upload validation.
- Separation of application configuration and sensitive credentials.

For production deployment, additional security measures should be implemented, including secure HTTPS communication, access controls, data encryption, upload scanning, backup procedures and privacy assessments.

Do not use real patient information in public demonstrations or testing environments.

---

## ⚠️ Medical Disclaimer

Medic.AI is an educational and informational healthcare support application.

- AI-generated responses may contain inaccurate or incomplete information.
- Symptom assessments are not medical diagnoses.
- Medical report interpretations must be verified by qualified healthcare professionals.
- The application does not replace professional medical advice, diagnosis or treatment.
- Emergency situations require immediate assistance from appropriate emergency services.

Medic.AI has not been clinically validated as a medical diagnostic device.

---

## 🚀 Future Enhancements

Potential future improvements include:

- Advanced patient risk prediction.
- Explainable AI (XAI) integration.
- Wearable health device integration.
- Multilingual healthcare assistance.
- Enhanced medical knowledge retrieval.
- Cloud deployment and scalability.
- Advanced patient analytics and reporting.

---

## 👨‍💻 Developer

**Amnon A. Pradeep**

Artificial Intelligence and Data Science | AI Engineering | Full-Stack Development

GitHub: [@Amnon1814](https://github.com/Amnon1814)

Project Repository: [Medic.AI](https://github.com/Amnon1814/medic-ai)

---

## 📜 License

No open-source license has been selected for this project yet. Licensing terms can be added when the distribution and usage permissions are decided.

---

<p align="center">
  <strong>Medic.AI — Bringing Artificial Intelligence into Healthcare Support.</strong>
</p>
