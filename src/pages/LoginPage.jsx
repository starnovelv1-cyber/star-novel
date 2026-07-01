import useSEO from "../hooks/useSEO";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function LoginPage() {
  useSEO({ title: 'เข้าสู่ระบบ' })
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("สมัครสำเร็จ! เช็คอีเมลเพื่อยืนยันตัวตนครับ");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else setMessage("เข้าสู่ระบบสำเร็จ!");
    }
  };

    const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "https://star-novel.com" },
  });
 };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d0d2b 0%, #1a1a4e 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(79,195,247,0.2)",
        borderRadius: "16px",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}>
        <h2 style={{ color: "white", textAlign: "center", marginBottom: "0.5rem" }}>
          ⭐ STAR NOVEL
        </h2>
        <h3 style={{ color: "#4fc3f7", textAlign: "center", marginTop: 0 }}>
          {isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
        </h3>

        <button
          onClick={handleGoogleLogin}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "white",
            color: "#333",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <img src="https://www.google.com/favicon.ico" width="20" height="20" />
          เข้าสู่ระบบด้วย Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
          <span style={{ color: "#78909c", fontSize: "0.85rem" }}>หรือ</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
        </div>

        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(79,195,247,0.3)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontSize: "1rem",
          }}
        />

        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(79,195,247,0.3)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontSize: "1rem",
          }}
        />

        {/* ปุ่มลืมรหัสผ่าน */}
        {!isSignUp && (
          <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
            <Link
              to="/forgot-password"
              style={{ color: "#4fc3f7", fontSize: "0.85rem", textDecoration: "none" }}
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
        )}

        <button
          onClick={handleSubmit}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            background: "linear-gradient(135deg, #4fc3f7, #0288d1)",
            color: "#0d0d2b",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {isSignUp ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
        </button>

        <p
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ color: "#4fc3f7", textAlign: "center", cursor: "pointer", margin: 0 }}
        >
          {isSignUp ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก"}
        </p>

        {message && (
          <p style={{ color: "#81d4fa", textAlign: "center", margin: 0 }}>{message}</p>
        )}
      </div>
    </div>
  );
}
