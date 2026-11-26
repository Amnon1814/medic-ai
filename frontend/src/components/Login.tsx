import { useState, type FormEvent } from "react";
import { loginMedicAI as login } from "../api";
import "./Login.css";

interface LoginProps {
    onLoginSuccess: () => void;
}

function Login({ onLoginSuccess }: LoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            await login(email, password);
            onLoginSuccess();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                <div className="login-logo">
                    🩺
                </div>

                <h1>Medic.AI</h1>

                <p className="login-subtitle">
                    Your intelligent healthcare companion
                </p>

                <form onSubmit={handleLogin}>

                    <div className="login-input-group">
                        <label>Email Address</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-input-group">
                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

                <p className="login-footer">
                    Secure access to your healthcare assistant
                </p>

            </div>
        </div>
    );
}

export default Login;