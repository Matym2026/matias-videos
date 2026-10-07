import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

export default function Auth() {
  const { saveSession } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") await api.register(form);
      const data = await api.login({ email: form.email, password: form.password });
      saveSession(data);
      window.location.hash = "#/";
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-box" onSubmit={submit}>
        <h1 className="brand big">▶ Matías<span>Videos</span></h1>
        <p className="muted">{mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}</p>
        {mode === "register" && (
          <input name="name" placeholder="Nombre" value={form.name} onChange={change} required />
        )}
        <input name="email" type="email" placeholder="Correo" value={form.email} onChange={change} required />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={change} required />
        {error && <p className="error">{error}</p>}
        <button className="btn">{mode === "login" ? "Entrar" : "Registrarme"}</button>
        <p className="muted">
          {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <a href="#/login" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </a>
        </p>
      </form>
    </div>
  );
}