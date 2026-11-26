import { useEffect, useState } from "react";

// API imports
import { getCurrentUser } from "./api";

// Component imports
import MedicationReminders from "./components/MedicationReminders";
import SymptomAssessment from "./components/SymptomAssessment";
import Settings from "./components/Settings";
import HealthRecords from "./components/HealthRecords";
import MedicalReports from "./components/MedicalReports";
import VitalsMonitor from "./components/VitalsMonitor";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Medications from "./components/Medications";
import AIChat from "./components/AIChat";
import Login from "./components/Login";

// CSS
import "./App.css";

function App() {

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentication loading state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Active navigation page
  const [activePage, setActivePage] = useState("Dashboard");


  // ============================================================
  // VALIDATE AUTHENTICATION WITH BACKEND
  // ============================================================

  useEffect(() => {

    const validateSession = async () => {

      const token = localStorage.getItem("medic_ai_token");

      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }

      try {

        // Verify JWT token with backend
        await getCurrentUser();

        setIsAuthenticated(true);

      } catch (error) {

        console.error("Session validation failed:", error);

        // Remove invalid or expired token
        localStorage.removeItem("medic_ai_token");

        setIsAuthenticated(false);

      } finally {

        setIsCheckingAuth(false);

      }
    };

    validateSession();

  }, []);


  // ============================================================
  // LOGIN SUCCESS HANDLER
  // ============================================================

  const handleLoginSuccess = () => {

    setIsAuthenticated(true);

    setActivePage("Dashboard");

  };


  // ============================================================
  // RENDER APPLICATION PAGES
  // ============================================================

  const renderActivePage = () => {

    switch (activePage) {

      case "Dashboard":
        return (
          <Dashboard setActivePage={setActivePage} />
        );

      case "AI Assistant":
        return <AIChat />;

      case "Symptom Assessment":
        return <SymptomAssessment />;

      case "Medical Reports":
        return <MedicalReports />;

      case "Vitals Monitor":
        return <VitalsMonitor />;

      case "Medications":
        return <Medications />;

      case "Medication Reminders":
        return <MedicationReminders />;

      case "Health Records":
        return <HealthRecords />;

      case "Settings":
        return <Settings />;

      default:
        return (
          <div className="page-placeholder">

            <h2>{activePage}</h2>

            <p>
              This feature is currently under development.
            </p>

          </div>
        );

    }

  };


  // ============================================================
  // AUTHENTICATION LOADING SCREEN
  // ============================================================

  if (isCheckingAuth) {

    return (
      <div className="auth-loading">

        <h2>Medic.AI</h2>

        <p>Verifying your secure session...</p>

      </div>
    );

  }


  // ============================================================
  // LOGIN PAGE
  // ============================================================

  if (!isAuthenticated) {

    return (
      <Login onLoginSuccess={handleLoginSuccess} />
    );

  }


  // ============================================================
  // MAIN APPLICATION LAYOUT
  // ============================================================

  return (

    <div className="app-layout">

      {/* SIDEBAR */}

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />


      {/* MAIN CONTENT */}

      <main className="main-content">

        {renderActivePage()}

      </main>

    </div>

  );

}

export default App;