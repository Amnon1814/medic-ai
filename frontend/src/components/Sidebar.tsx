import type { Dispatch, SetStateAction } from "react";
import "./Sidebar.css";

// Sidebar properties
interface SidebarProps {
    activePage: string;
    setActivePage: Dispatch<SetStateAction<string>>;
}

// Navigation item type
interface NavigationItem {
    name: string;
    icon: string;
}

// Sidebar component
function Sidebar({ activePage, setActivePage }: SidebarProps) {

    // Main navigation
    const mainNavigation: NavigationItem[] = [
        {
            name: "Dashboard",
            icon: "🏠",
        },
        {
            name: "AI Assistant",
            icon: "🤖",
        },
    ];

    // Healthcare navigation
    const healthcareNavigation: NavigationItem[] = [
        {
            name: "Symptom Assessment",
            icon: "🩺",
        },
        {
            name: "Medical Reports",
            icon: "📄",
        },
        {
            name: "Vitals Monitor",
            icon: "❤️",
        },
        {
            name: "Medications",
            icon: "💊",
        },
        {
            name: "Medication Reminders",
            icon: "⏰",
        },
        {
            name: "Health Records",
            icon: "📁",
        },
    ];

    // Preferences navigation
    const preferencesNavigation: NavigationItem[] = [
        {
            name: "Settings",
            icon: "⚙️",
        },
    ];

    // Navigation button
    const renderNavigationItem = (item: NavigationItem) => {
        const isActive = activePage === item.name;

        return (
            <button
                key={item.name}
                type="button"
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActivePage(item.name)}
                aria-current={isActive ? "page" : undefined}
            >
                <span className="nav-icon">{item.icon}</span>

                <span className="nav-text">
                    {item.name}
                </span>

                {isActive && (
                    <span className="active-dot"></span>
                )}
            </button>
        );
    };

    return (
        <aside className="sidebar">

            {/* BRAND */}
            <div className="brand">
                <div className="brand-icon">
                    M
                </div>

                <div className="brand-text">
                    Medic<span>.AI</span>
                </div>
            </div>

            {/* NAVIGATION */}
            <nav className="navigation">

                {/* MAIN MENU */}
                <div className="nav-group">

                    <p className="sidebar-label">
                        MAIN MENU
                    </p>

                    {mainNavigation.map(renderNavigationItem)}

                </div>

                {/* HEALTHCARE */}
                <div className="nav-group">

                    <p className="sidebar-label">
                        HEALTHCARE
                    </p>

                    {healthcareNavigation.map(renderNavigationItem)}

                </div>

                {/* PREFERENCES */}
                <div className="nav-group">

                    <p className="sidebar-label">
                        PREFERENCES
                    </p>

                    {preferencesNavigation.map(renderNavigationItem)}

                </div>

            </nav>

            {/* SIDEBAR BOTTOM */}
            <div className="sidebar-bottom">

                {/* AI ASSISTANT CARD */}
                <div className="ai-card">

                    <div className="ai-card-icon">
                        ✨
                    </div>

                    <h3>Medic AI Assistant</h3>

                    <p>
                        Get intelligent healthcare assistance
                        and personalized health insights.
                    </p>

                    <button
                        type="button"
                        className="ai-card-button"
                        onClick={() => setActivePage("AI Assistant")}
                    >
                        Open AI Assistant →
                    </button>

                </div>

                {/* USER PROFILE */}
                <div className="profile">

                    <div className="profile-avatar">
                        M
                    </div>

                    <div className="profile-info">

                        <h4>Medic.AI User</h4>

                        <p>Patient Account</p>

                        <span className="profile-status">
                            Account Active
                        </span>

                    </div>

                </div>

            </div>

        </aside>
    );
}

export default Sidebar;