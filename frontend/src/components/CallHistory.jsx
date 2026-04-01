import { useState, useEffect } from "react";
import API from "../api";

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .ch-root { font-family:'DM Sans',sans-serif; background:#f0f2f8; min-height:100vh; padding:0 0 60px; }

  .ch-hero {
    position:relative; overflow:hidden;
    background:linear-gradient(120deg,#4a1d96 0%,#7c3aed 40%,#a855f7 75%,#ec4899 100%);
    padding:48px 48px 80px; margin-bottom:-48px;
  }
  .ch-hero-grid {
    position:absolute; inset:0;
    background-image:linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .ch-hero::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 500px 300px at 80% 50%,rgba(236,72,153,0.25) 0%,transparent 70%);
  }
  .ch-hero-shape { position:absolute; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); }
  .ch-hero-content { position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; }
  .ch-hero-label {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25);
    border-radius:100px; padding:5px 14px; font-size:12px; font-weight:600;
    color:rgba(255,255,255,0.9); letter-spacing:0.5px; text-transform:uppercase;
    margin-bottom:16px; backdrop-filter:blur(8px); width:fit-content;
  }
  .ch-hero-title { font-family:'Sora',sans-serif; font-size:clamp(24px,3.5vw,38px); font-weight:800; color:#fff; margin:0 0 8px; letter-spacing:-0.5px; }
  .ch-hero-sub   { color:rgba(255,255,255,0.65); font-size:15px; margin:0; }

  .ch-clear-btn {
    background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.25);
    color:#fff; border-radius:12px; padding:10px 20px;
    font-weight:700; font-size:13px; cursor:pointer;
    font-family:'DM Sans',sans-serif; transition:all 0.2s;
    display:flex; align-items:center; gap:8px; flex-shrink:0;
    backdrop-filter:blur(8px);
  }
  .ch-clear-btn:hover { background:rgba(239,68,68,0.3); border-color:rgba(239,68,68,0.5); }

  .ch-stats {
    display:grid; grid-template-columns:repeat(3,1fr);
    gap:16px; padding:0 40px;
    position:relative; z-index:3; margin-bottom:28px;
  }
  .ch-stat-card {
    background:#fff; border-radius:20px; padding:20px 22px;
    box-shadow:0 4px 24px rgba(124,58,237,0.1); border:1px solid rgba(255,255,255,0.8);
    display:flex; align-items:center; gap:14px;
    transition:transform 0.2s, box-shadow 0.2s;
  }
  .ch-stat-card:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(124,58,237,0.15); }
  .ch-stat-icon  { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
  .ch-stat-num   { font-family:'Sora',sans-serif; font-size:26px; font-weight:800; color:#0f172a; line-height:1; margin-bottom:4px; }
  .ch-stat-label { font-size:12px; color:#94a3b8; font-weight:500; text-transform:uppercase; letter-spacing:0.5px; }

  .ch-content { padding:0 40px; }
  .ch-list-header {
    display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;
  }
  .ch-section-title { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:#0f172a; margin:0; }

  .ch-item {
    background:#fff; border-radius:20px; padding:20px 24px;
    border:1px solid #f1f5f9; margin-bottom:12px;
    box-shadow:0 2px 12px rgba(0,0,0,0.04);
    display:flex; justify-content:space-between; align-items:center;
    flex-wrap:wrap; gap:16px;
    transition:transform 0.2s, box-shadow 0.2s;
    position:relative; overflow:hidden;
  }
  .ch-item::before {
    content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
    border-radius:4px 0 0 4px;
  }
  .ch-item.completed::before { background:linear-gradient(to bottom,#7c3aed,#a855f7); }
  .ch-item.missed::before    { background:linear-gradient(to bottom,#f59e0b,#ef4444); }
  .ch-item:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.08); }

  .ch-item-avatar {
    width:48px; height:48px; border-radius:14px;
    display:flex; align-items:center; justify-content:center;
    font-size:22px; flex-shrink:0;
  }
  .ch-item-name { font-weight:700; font-size:15px; color:#0f172a; margin:0; }
  .ch-item-room { font-size:12px; color:#94a3b8; margin:3px 0 0; font-family:monospace; }

  .ch-item-right { display:flex; gap:20px; align-items:center; flex-wrap:wrap; }
  .ch-meta-col   { text-align:center; }
  .ch-meta-label { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 3px; }
  .ch-meta-val   { font-size:13px; font-weight:700; color:#374151; margin:0; }

  .ch-status-badge { padding:5px 14px; border-radius:100px; font-size:12px; font-weight:700; }
  .ch-status-badge.completed { background:#ede9fe; color:#7c3aed; }
  .ch-status-badge.missed    { background:#fef3c7; color:#d97706; }

  .ch-delete-btn {
    width:34px; height:34px; border-radius:10px; border:1.5px solid #fee2e2;
    background:#fff; color:#dc2626; cursor:pointer; font-size:16px;
    display:flex; align-items:center; justify-content:center;
    transition:all 0.15s; flex-shrink:0;
  }
  .ch-delete-btn:hover { background:#dc2626; color:#fff; border-color:#dc2626; }

  .ch-empty {
    text-align:center; padding:80px 20px; background:#fff;
    border-radius:24px; border:2px dashed #e2e8f0;
  }
  .ch-empty-icon  { font-size:64px; margin:0 0 16px; }
  .ch-empty-title { font-family:'Sora',sans-serif; font-size:20px; font-weight:700; color:#374151; margin:0 0 8px; }
  .ch-empty-sub   { font-size:14px; color:#94a3b8; margin:0; }

  /* Confirm modal */
  .ch-modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.4);
    backdrop-filter:blur(4px); z-index:1000;
    display:flex; align-items:center; justify-content:center;
  }
  .ch-modal {
    background:#fff; border-radius:24px; padding:32px;
    max-width:400px; width:90%; box-shadow:0 24px 64px rgba(0,0,0,0.2);
    animation:modalIn 0.2s ease;
  }
  @keyframes modalIn { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }
  .ch-modal-icon  { font-size:48px; text-align:center; margin-bottom:16px; }
  .ch-modal-title { font-family:'Sora',sans-serif; font-size:20px; font-weight:800; color:#0f172a; text-align:center; margin:0 0 8px; }
  .ch-modal-sub   { font-size:14px; color:#64748b; text-align:center; margin:0 0 24px; line-height:1.6; }
  .ch-modal-btns  { display:flex; gap:12px; }
  .ch-modal-cancel {
    flex:1; padding:12px; border:1.5px solid #e2e8f0; border-radius:12px;
    background:#f8fafc; color:#374151; font-weight:700; font-size:14px;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s;
  }
  .ch-modal-cancel:hover { border-color:#94a3b8; }
  .ch-modal-confirm {
    flex:1; padding:12px; border:none; border-radius:12px;
    background:linear-gradient(135deg,#dc2626,#ef4444);
    color:#fff; font-weight:700; font-size:14px;
    cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
  }
  .ch-modal-confirm:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(220,38,38,0.35); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .ch-anim   { animation:fadeUp 0.4s ease both; }
  .ch-anim-1 { animation-delay:0.05s; }
  .ch-anim-2 { animation-delay:0.10s; }
`;
document.head.appendChild(style);

export default function CallHistory({ user }) {
  const [calls,      setCalls]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirmDel, setConfirmDel] = useState(null); // null | "all" | call_id
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => { fetchCalls(); }, [user.id, user.role]);

  const fetchCalls = () => {
    setLoading(true);
    fetch(`${API}/api/calls/${user.id}?role=${user.role}`, { credentials:"include" })
      .then(r => r.json())
      .then(d => { setCalls(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const deleteOne = async (callId) => {
    setDeleting(true);
    try {
      await fetch(`${API}/api/calls/${callId}`, { method:"DELETE", credentials:"include" });
      setCalls(prev => prev.filter(c => c.id !== callId));
    } catch {}
    setDeleting(false);
    setConfirmDel(null);
  };

  const deleteAll = async () => {
    setDeleting(true);
    try {
      await fetch(`${API}/api/calls/clear/${user.id}?role=${user.role}`, { method:"DELETE", credentials:"include" });
      setCalls([]);
    } catch {}
    setDeleting(false);
    setConfirmDel(null);
  };

  const fmtDate = (dt) => { if(!dt) return "—"; return new Date(dt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); };
  const fmtTime = (dt) => { if(!dt) return "—"; return new Date(dt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}); };
  const getDur  = (s,e) => {
    if(!s||!e) return "—";
    const d = Math.floor((new Date(e)-new Date(s))/1000);
    const m = Math.floor(d/60);
    return m===0 ? `${d%60}s` : `${m}m ${d%60}s`;
  };

  const completed  = calls.filter(c => c.ended_at).length;
  const totalMins  = calls.reduce((acc,c) => {
    if(!c.started_at||!c.ended_at) return acc;
    return acc + Math.floor((new Date(c.ended_at)-new Date(c.started_at))/60000);
  }, 0);

  if (loading) return (
    <div className="ch-root" style={{display:"flex",alignItems:"center",justifyContent:"center",paddingTop:"120px"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,borderRadius:"50%",border:"3px solid #e2e8f0",borderTopColor:"#7c3aed",animation:"spin 1s linear infinite",margin:"0 auto 16px"}} />
        <p style={{color:"#64748b",fontSize:"14px"}}>Loading call history...</p>
      </div>
    </div>
  );

  return (
    <div className="ch-root">

      {/* Confirm Modal */}
      {confirmDel && (
        <div className="ch-modal-overlay" onClick={()=>!deleting && setConfirmDel(null)}>
          <div className="ch-modal" onClick={e=>e.stopPropagation()}>
            <div className="ch-modal-icon">🗑️</div>
            <p className="ch-modal-title">
              {confirmDel==="all" ? "Clear All History?" : "Delete This Call?"}
            </p>
            <p className="ch-modal-sub">
              {confirmDel==="all"
                ? "This will permanently delete your entire call history. This action cannot be undone."
                : "This call record will be permanently deleted."}
            </p>
            <div className="ch-modal-btns">
              <button className="ch-modal-cancel" onClick={()=>setConfirmDel(null)} disabled={deleting}>Cancel</button>
              <button className="ch-modal-confirm"
                onClick={()=> confirmDel==="all" ? deleteAll() : deleteOne(confirmDel)}
                disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="ch-hero">
        <div className="ch-hero-grid" />
        <div className="ch-hero-shape" style={{width:200,height:200,right:-60,top:-60}} />
        <div className="ch-hero-shape" style={{width:100,height:100,right:200,bottom:-30}} />
        <div className="ch-hero-content">
          <div>
            <div className="ch-hero-label">
              <span style={{width:6,height:6,borderRadius:"50%",background:"#f9a8d4",display:"inline-block"}} />
              Consultation History
            </div>
            <h1 className="ch-hero-title">📞 Call History</h1>
            <p className="ch-hero-sub">All your past video consultations in one place</p>
          </div>
          {calls.length > 0 && (
            <button className="ch-clear-btn" onClick={()=>setConfirmDel("all")}>
              🗑️ Clear All History
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ch-stats ch-anim ch-anim-1">
        <div className="ch-stat-card">
          <div className="ch-stat-icon" style={{background:"linear-gradient(135deg,#ede9fe,#ddd6fe)"}}>📞</div>
          <div><div className="ch-stat-num">{calls.length}</div><div className="ch-stat-label">Total Calls</div></div>
        </div>
        <div className="ch-stat-card">
          <div className="ch-stat-icon" style={{background:"linear-gradient(135deg,#d1fae5,#a7f3d0)"}}>✅</div>
          <div><div className="ch-stat-num">{completed}</div><div className="ch-stat-label">Completed</div></div>
        </div>
        <div className="ch-stat-card">
          <div className="ch-stat-icon" style={{background:"linear-gradient(135deg,#fce7f3,#fbcfe8)"}}>⏱️</div>
          <div><div className="ch-stat-num">{totalMins}</div><div className="ch-stat-label">Total Minutes</div></div>
        </div>
      </div>

      <div className="ch-content">
        <div className="ch-list-header ch-anim ch-anim-2">
          <p className="ch-section-title">
            Recent Consultations
            <span style={{fontSize:"14px",fontWeight:"500",color:"#64748b",marginLeft:"10px"}}>({calls.length})</span>
          </p>
        </div>

        {calls.length === 0 ? (
          <div className="ch-empty ch-anim ch-anim-2">
            <p className="ch-empty-icon">📹</p>
            <p className="ch-empty-title">No call history yet</p>
            <p className="ch-empty-sub">Your video consultations will appear here once you've had a session with a doctor</p>
          </div>
        ) : calls.map((call, i) => (
          <div key={call.id || i} className={`ch-item ${call.ended_at?"completed":"missed"} ch-anim`} style={{animationDelay:`${i*0.05+0.1}s`}}>
            <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
              <div className="ch-item-avatar" style={{background:call.ended_at?"linear-gradient(135deg,#ede9fe,#ddd6fe)":"linear-gradient(135deg,#fef3c7,#fde68a)"}}>
                {call.ended_at ? "✅" : "🔴"}
              </div>
              <div>
                <p className="ch-item-name">
                  {user.role==="doctor"
                    ? `Patient: ${call.patient_name||"Unknown"}`
                    : `Dr. ${call.doctor_name||"Unknown"}`}
                </p>
                <p className="ch-item-room">Room: {call.room}</p>
              </div>
            </div>

            <div className="ch-item-right">
              <div className="ch-meta-col">
                <p className="ch-meta-label">Date</p>
                <p className="ch-meta-val">{fmtDate(call.started_at)}</p>
              </div>
              <div className="ch-meta-col">
                <p className="ch-meta-label">Time</p>
                <p className="ch-meta-val">{fmtTime(call.started_at)}</p>
              </div>
              <div className="ch-meta-col">
                <p className="ch-meta-label">Duration</p>
                <p className="ch-meta-val">{getDur(call.started_at, call.ended_at)}</p>
              </div>
              <span className={`ch-status-badge ${call.ended_at?"completed":"missed"}`}>
                {call.ended_at ? "Completed" : "Missed"}
              </span>
              <button className="ch-delete-btn" title="Delete this call" onClick={()=>setConfirmDel(call.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
