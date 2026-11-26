const BASE = "http://localhost:8000/api";
export async function sendChatMessage(message, history = []) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please log in to Medic.AI first.");
  }

  const res = await fetch(BASE + "/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      history,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to get AI response.");
  }

  return res.json();
}
export async function login(email, password) {
  const form = new URLSearchParams({
    username: email,
    password: password,
  });

  const res = await fetch(BASE + "/auth/login", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error("Wrong email or password");
  }

  const data = await res.json();
  localStorage.setItem("token", data.access_token);
}