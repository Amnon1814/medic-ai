import { useState } from "react";
import { api, login, register, getToken } from "./api";


function Auth({ onDone }) {
  const [f, setF] = useState({ email: "", password: "", name: "", language: "en", consent: false, signup: false });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async () => {
    try {
      if (f.signup) { if (!f.consent) return setErr("Please accept consent"); await register(f.email, f.password, f.name, f.language); }
      else await login(f.email, f.password);
      onDone();
    } catch (e) { setErr(e.message); }
  };
  return (
    <div style={{ maxWidth: 360, margin: "60px auto", display: "grid", gap: 8 }}>
      <h2>Medic.AI</h2>
      {f.signup && <input placeholder="Full name" onChange={set("name")} />}
      <input placeholder="Email" onChange={set("email")} />
      <input placeholder="Password" type="password" onChange={set("password")} />
      {f.signup && <>
        <select onChange={set("language")}><option value="en">English</option><option value="ml">മലയാളം</option></select>
        <label><input type="checkbox" onChange={set("consent")} /> I consent to storing my health data</label></>}
      <button onClick={submit}>{f.signup ? "Sign up" : "Log in"}</button>
      <a href="#" onClick={() => setF({ ...f, signup: !f.signup })}>{f.signup ? "Have an account?" : "Create account"}</a>
      <p style={{ color: "crimson" }}>{err}</p>
    </div>
  );
}

function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const send = async () => {
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs([...msgs, { role: "user", content: text }]); setText("");
    const r = await api("/chat", { method: "POST", body: { message: text, history } });
    setMsgs((m) => [...m, { role: "assistant", content: r.answer, emergency: r.emergency }]);
  };
  return (
    <div style={{ maxWidth: 640, margin: "20px auto" }}>
      {msgs.map((m, i) => (
        <p key={i} style={{ background: m.emergency ? "#fee" : m.role === "user" ? "#eef" : "#efe", padding: 8, borderRadius: 6 }}>{m.content}</p>))}
      <input style={{ width: "80%" }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a health question..." />
      <button onClick={send}>Send</button>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  if (!authed) return <Auth onDone={() => setAuthed(true)} />;
  return <><button onClick={() => { localStorage.clear(); setAuthed(false); }}>Log out</button><Chat /></>;
}
