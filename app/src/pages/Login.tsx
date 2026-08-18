import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (localStorage.getItem("inci_ppwr_token")) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.authLogin(username.trim(), password);
      navigate("/", { replace: true });
    } catch (ex) {
      const msg = String(ex);
      if (msg.includes("404")) {
        setErr("Sunucuya bağlanılamıyor. Biraz sonra tekrar deneyin.");
      } else if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Network request failed")) {
        setErr("Sunucuya bağlanılamıyor. Biraz sonra tekrar deneyin.");
      } else {
        setErr("Giriş başarısız. Kullanıcı adı veya şifreyi kontrol edin.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <img className="login-logo" src="/inci-aku-logo.png" alt="İnci Akü" />
        <p className="eyebrow">PPWR Compliance Suite</p>
        <h1>Giriş</h1>
        <p className="lead">Yetkili hesabınızla giriş yapın.</p>
        <label className="block-label">
          Kullanıcı adı
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>
        <label className="block-label">
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {err && <p className="error">{err}</p>}
        <button type="submit" disabled={busy || !username.trim() || !password}>
          {busy ? "…" : "Oturum aç"}
        </button>
      </form>
    </div>
  );
}
