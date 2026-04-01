import { useState, useEffect } from "react";
import API from "../api";

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .dd-root { font-family:'DM Sans',sans-serif; background:#f0f2f8; min-height:100vh; padding:0 0 60px; }

  .dd-hero {
    position:relative; overflow:hidden;
    background:linear-gradient(120deg,#0f172a 0%,#1e3a5f 35%,#1e40af 70%,#3b82f6 100%);
    padding:48px 48px 80px; margin-bottom:-48px;
  }
  .dd-hero-grid {
    position:absolute; inset:0;
    background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .dd-hero::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 600px 400px at 80% 50%,rgba(59,130,246,0.25) 0%,transparent 70%);
  }
  .dd-hero-shape { position:absolute; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
  .dd-hero-content { position:relative; z-index:2; }
  .dd-hero-label {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
    border-radius:100px; padding:5px 14px; font-size:12px; font-weight:600;
    color:rgba(255,255,255,0.85); letter-spacing:0.5px; text-transform:uppercase;
    margin-bottom:16px; backdrop-filter:blur(8px);
  }
  .dd-hero-title { font-family:'Sora',sans-serif; font-size:clamp(24px,3.5vw,40px); font-weight:800; color:#fff; margin:0 0 8px; letter-spacing:-0.5px; }
  .dd-hero-sub   { color:rgba(255,255,255,0.55); font-size:15px; margin:0; }

  /* Stats */
  .dd-stats {
    display:grid; grid-template-columns:repeat(4,1fr);
    gap:16px; padding:0 40px;
    position:relative; z-index:3; margin-bottom:28px;
  }
  .dd-stat-card {
    background:#fff; border-radius:20px; padding:20px 22px;
    box-shadow:0 4px 24px rgba(30,64,175,0.1); border:1px solid rgba(255,255,255,0.9);
    transition:transform 0.2s, box-shadow 0.2s; cursor:default;
  }
  .dd-stat-card:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(30,64,175,0.15); }
  .dd-stat-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
  .dd-stat-label { font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
  .dd-stat-icon  { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; }
  .dd-stat-num   { font-family:'Sora',sans-serif; font-size:32px; font-weight:800; color:#0f172a; line-height:1; }

  /* Main grid */
  .dd-main { padding:0 40px; display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px; }
  .dd-panel { background:#fff; border-radius:24px; padding:24px; box-shadow:0 2px 16px rgba(0,0,0,0.05); border:1px solid #f1f5f9; }
  .dd-panel-title { font-family:'Sora',sans-serif; font-size:16px; font-weight:700; color:#0f172a; margin:0 0 18px; }

  /* Quick action cards */
  .dd-actions { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .dd-action-card {
    border-radius:16px; padding:18px; cursor:pointer;
    border:1.5px solid #e2e8f0; background:#fff;
    transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.04);
    position:relative; overflow:hidden;
  }
  .dd-action-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    opacity:0; transition:opacity 0.2s;
  }
  .dd-action-card:hover { transform:translateY(-3px); }
  .dd-action-card:hover::before { opacity:1; }
  .dd-action-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-bottom:10px; }
  .dd-action-title { font-weight:700; font-size:13px; color:#0f172a; margin:0 0 3px; }
  .dd-action-desc  { font-size:11px; color:#94a3b8; line-height:1.4; margin:0; }

  /* Recent appointments */
  .dd-apt-item {
    display:flex; justify-content:space-between; align-items:center;
    padding:12px 0; border-bottom:1px solid #f1f5f9;
  }
  .dd-apt-item:last-child { border-bottom:none; }
  .dd-apt-avatar {
    width:36px; height:36px; border-radius:10px;
    background:linear-gradient(135deg,#1e40af,#3b82f6);
    display:flex; align-items:center; justify-content:center;
    color:#fff; font-weight:700; font-size:14px;
  }
  .dd-apt-name { font-weight:600; font-size:13px; color:#0f172a; margin:0; }
  .dd-apt-meta { font-size:11px; color:#94a3b8; margin:2px 0 0; }
  .dd-status-badge { padding:3px 10px; border-radius:100px; font-size:11px; font-weight:700; }
  .dd-status-badge.pending   { background:#fef3c7; color:#d97706; }
  .dd-status-badge.confirmed { background:#dcfce7; color:#059669; }
  .dd-status-badge.cancelled { background:#fee2e2; color:#dc2626; }

  /* Bottom HIPAA banner */
  .dd-bottom { padding:0 40px; }
  .dd-hipaa {
    background:linear-gradient(135deg,#0f172a,#1e3a5f);
    border-radius:20px; padding:22px 28px;
    display:flex; align-items:center; gap:16px;
  }
  .dd-hipaa-icon { font-size:36px; }
  .dd-hipaa-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#fff; margin:0 0 4px; }
  .dd-hipaa-text  { font-size:13px; color:rgba(255,255,255,0.55); margin:0; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .dd-anim   { animation:fadeUp 0.4s ease both; }
  .dd-anim-1 { animation-delay:0.05s; }
  .dd-anim-2 { animation-delay:0.10s; }
  .dd-anim-3 { animation-delay:0.15s; }
  .dd-anim-4 { animation-delay:0.20s; }
`;
document.head.appendChild(style);

export default function DoctorDashboard({ user, setPage }) {
  const [stats,     setStats]     = useState({ pending:0, confirmed:0, total:0, today:0 });
  const [recentApts,setRecentApts]= useState([]);

  useEffect(()=>{
    fetch(`${API}/api/appointments?user_id=${user.id}&role=doctor`)
      .then(r=>r.json()).then(data=>{
        const appointments = Array.isArray(data) ? data : [];
        const today = new Date().toISOString().split("T")[0];
        setStats({
          pending:   appointments.filter(a=>a.status==="pending").length,
          confirmed: appointments.filter(a=>a.status==="confirmed").length,
          total:     appointments.length,
          today:     appointments.filter(a=>a.date===today).length,
        });
        setRecentApts(appointments.slice(0,5));
      }).catch(()=>{});
  },[user.id]);

  const statCards = [
    { label:"Today", value:stats.today,     icon:"📆", color:"#3b82f6", light:"#dbeafe" },
    { label:"Pending",   value:stats.pending,   icon:"⏳", color:"#d97706", light:"#fef3c7" },
    { label:"Confirmed", value:stats.confirmed, icon:"✅", color:"#059669", light:"#dcfce7" },
    { label:"Total",     value:stats.total,     icon:"📊", color:"#7c3aed", light:"#ede9fe" },
  ];

  const actions = [
    { icon:"📅", title:"Appointments",    desc:"View & manage patient bookings",    page:"appointments", color:"#3b82f6", light:"#dbeafe",  grad:"linear-gradient(90deg,#1e40af,#3b82f6)" },
    { icon:"📋", title:"Medical Records", desc:"Write prescriptions, add records",  page:"records",      color:"#059669", light:"#dcfce7",  grad:"linear-gradient(90deg,#059669,#34d399)" },
    { icon:"📞", title:"Call History",    desc:"Past video consultation logs",      page:"calls",  color:"#7c3aed", light:"#ede9fe",  grad:"linear-gradient(90deg,#7c3aed,#a855f7)" },
    { icon:"🔍", title:"Find Patient",    desc:"Search by unique patient ID",       page:"records",      color:"#dc2626", light:"#fee2e2",  grad:"linear-gradient(90deg,#dc2626,#ef4444)" },
    { icon:"📹", title:"Video Consult",   desc:"Start or join a video session",     page:"appointments", color:"#d97706", light:"#fef3c7",  grad:"linear-gradient(90deg,#d97706,#f59e0b)" },
    { icon:"📊", title:"Analytics",       desc:"Overview of patient activity",      page:"appointments", color:"#0891b2", light:"#cffafe",  grad:"linear-gradient(90deg,#0891b2,#06b6d4)" },
  ];

  return (
    <div className="dd-root">
      {/* Hero */}
      <div className="dd-hero">
        <div className="dd-hero-grid" />
        <div className="dd-hero-shape" style={{width:240,height:240,right:-80,top:-80}} />
        <div className="dd-hero-shape" style={{width:120,height:120,right:220,bottom:-40}} />
        <div className="dd-hero-shape" style={{width:60, height:60, right:380, top:20}} />
        <div className="dd-hero-content">
          <div className="dd-hero-label">
            <span style={{width:6,height:6,borderRadius:"50%",background:"#93c5fd",display:"inline-block"}} />
            Doctor Portal
          </div>
          <h1 className="dd-hero-title">Welcome, Dr. {user?.name?.replace("Dr.","").trim().split(" ")[0]} 👋</h1>
          <p className="dd-hero-sub">Here's your practice overview for today</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dd-stats dd-anim dd-anim-1">
        {statCards.map(s=>(
          <div key={s.label} className="dd-stat-card">
            <div className="dd-stat-top">
              <span className="dd-stat-label">{s.label}</span>
              <div className="dd-stat-icon" style={{background:s.light}}>{s.icon}</div>
            </div>
            <div className="dd-stat-num">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="dd-main">
        {/* Quick Actions */}
        <div className="dd-panel dd-anim dd-anim-2">
          <p className="dd-panel-title">Quick Actions</p>
          <div className="dd-actions">
            {actions.map(c=>(
              <div key={c.title} className="dd-action-card" onClick={()=>setPage(c.page)}
                style={{"--hover-shadow":`0 10px 28px ${c.color}20`}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color;e.currentTarget.style.boxShadow=`0 10px 28px ${c.color}20`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.04)";}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:c.grad,opacity:0,transition:"opacity 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity="1"} />
                <div className="dd-action-icon" style={{background:c.light}}>{c.icon}</div>
                <p className="dd-action-title">{c.title}</p>
                <p className="dd-action-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="dd-panel dd-anim dd-anim-3">
          <p className="dd-panel-title">Recent Appointments</p>
          {recentApts.length===0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>
              <p style={{fontSize:"36px",margin:"0 0 8px"}}>📭</p>
              <p style={{margin:0,fontSize:"14px"}}>No appointments yet</p>
            </div>
          ) : (
            <>
              {recentApts.map((a,i)=>(
                <div key={a.id} className="dd-apt-item">
                  <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div className="dd-apt-avatar">{a.patient_name?.charAt(0)||"P"}</div>
                    <div>
                      <p className="dd-apt-name">{a.patient_name}</p>
                      <p className="dd-apt-meta">{a.date} • {a.time}</p>
                    </div>
                  </div>
                  <span className={`dd-status-badge ${a.status}`}>{a.status}</span>
                </div>
              ))}
              <div style={{textAlign:"center",marginTop:"14px"}}>
                <button onClick={()=>setPage("appointments")}
                  style={{background:"none",border:"none",color:"#3b82f6",fontWeight:"600",fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  View all appointments →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* HIPAA Banner */}
      <div className="dd-bottom dd-anim dd-anim-4">
        <div className="dd-hipaa">
          <div className="dd-hipaa-icon">🔒</div>
          <div>
            <p className="dd-hipaa-title">HIPAA Compliant & Secure</p>
            <p className="dd-hipaa-text">All patient data is encrypted. Video calls are peer-to-peer via WebRTC — no server recording, ever.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
