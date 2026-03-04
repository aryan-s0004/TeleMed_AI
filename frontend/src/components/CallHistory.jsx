import { useState, useEffect } from "react";
import API from "../api";

export default function CallHistory({ user }) {
  const [calls, setCalls]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/calls/${user.id}?role=${user.role}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setCalls(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.id, user.role]);

  const formatDate = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const getDuration = (started, ended) => {
    if (!started || !ended) return "—";
    const diff = Math.floor((new Date(ended) - new Date(started)) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  if (loading) return (
    <div className="page-container">
      <p style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading call history...</p>
    </div>
  );

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ margin: 0, fontSize: "24px", color: "#1e293b", fontWeight: "700" }}>📞 Call History</h2>
        <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
          Your past video consultations
        </p>
      </div>

      {calls.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "#f8fafc", borderRadius: "16px",
          border: "2px dashed #e2e8f0"
        }}>
          <p style={{ fontSize: "48px", margin: "0 0 12px 0" }}>📹</p>
          <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>No call history yet</p>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "6px 0 0 0" }}>
            Your video consultations will appear here
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {calls.map((call, i) => (
            <div key={i} style={{
              background: "#fff", borderRadius: "14px",
              padding: "18px 20px", border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: "12px"
            }}>
              {/* Left side */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "12px",
                  background: call.ended_at ? "linear-gradient(135deg, #667eea, #764ba2)" : "linear-gradient(135deg, #f59e0b, #ef4444)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px", flexShrink: 0
                }}>
                  {call.ended_at ? "✅" : "🔴"}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#1e293b" }}>
                    {user.role === "doctor"
                      ? `Patient: ${call.patient_name || "Unknown"}`
                      : `Doctor: ${call.doctor_name || "Unknown"}`}
                  </p>
                  <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                    Room: <span style={{ fontFamily: "monospace", color: "#6366f1" }}>{call.room}</span>
                  </p>
                </div>
              </div>

              {/* Right side */}
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      {formatDate(call.started_at)}
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Time</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      {formatTime(call.started_at)}
                    </p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Duration</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                      {getDuration(call.started_at, call.ended_at)}
                    </p>
                  </div>
                  <div>
                    <span style={{
                      padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                      background: call.ended_at ? "#dcfce7" : "#fef3c7",
                      color: call.ended_at ? "#16a34a" : "#d97706"
                    }}>
                      {call.ended_at ? "Completed" : "Missed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}