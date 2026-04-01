import { useState, useEffect } from "react";
import API from "../api";

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  .pd-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f8;
    min-height: 100vh;
    padding: 0 0 60px 0;
  }

  .pd-hero {
    position: relative; overflow: hidden;
    background: linear-gradient(120deg, #1a1060 0%, #3b2dbf 35%, #6d4fe0 65%, #a78bfa 100%);
    padding: 48px 48px 80px;
    margin-bottom: -48px;
  }
  .pd-hero::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 600px 400px at 80% 50%, rgba(167,139,250,0.25) 0%, transparent 70%),
      radial-gradient(ellipse 300px 300px at 20% 80%, rgba(99,102,241,0.3) 0%, transparent 60%);
  }
  .pd-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .pd-hero-content { position: relative; z-index: 2; }
  .pd-hero-label {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    border-radius: 100px; padding: 5px 14px;
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9);
    letter-spacing: 0.5px; text-transform: uppercase;
    margin-bottom: 16px; backdrop-filter: blur(8px);
  }
  .pd-hero-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(26px, 4vw, 42px); font-weight: 800;
    color: #fff; margin: 0 0 8px 0; line-height: 1.1; letter-spacing: -0.5px;
  }
  .pd-hero-sub {
    color: rgba(255,255,255,0.65); font-size: 15px; font-weight: 400; margin: 0;
  }
  .pd-hero-shape {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  }

  .pd-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 16px; padding: 0 40px;
    position: relative; z-index: 3; margin-bottom: 32px;
  }
  .pd-stat-card {
    background: #fff; border-radius: 20px; padding: 22px 24px;
    box-shadow: 0 4px 24px rgba(59,45,191,0.1), 0 1px 4px rgba(0,0,0,0.05);
    border: 1px solid rgba(255,255,255,0.8);
    display: flex; align-items: center; gap: 16px;
    transition: transform 0.2s, box-shadow 0.2s; cursor: default;
  }
  .pd-stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(59,45,191,0.15), 0 2px 8px rgba(0,0,0,0.06);
  }
  .pd-stat-icon {
    width: 52px; height: 52px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; flex-shrink: 0;
  }
  .pd-stat-num {
    font-family: 'Sora', sans-serif;
    font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 4px;
  }
  .pd-stat-label { font-size: 12px; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

  .pd-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 20px; padding: 0 40px; margin-bottom: 24px;
  }

  .pd-card {
    background: #fff; border-radius: 24px; padding: 28px;
    box-shadow: 0 2px 16px rgba(15,23,42,0.06), 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid rgba(241,245,249,1);
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
    position: relative; overflow: hidden;
  }
  .pd-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    border-radius: 24px 24px 0 0; transition: opacity 0.2s; opacity: 0;
  }
  .pd-card:hover { transform: translateY(-5px); }
  .pd-card:hover::before { opacity: 1; }
  .pd-card:hover .pd-card-arrow { transform: translateX(4px); opacity: 1; }

  .pd-card-appt::before  { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
  .pd-card-symp::before  { background: linear-gradient(90deg, #06b6d4, #0ea5e9); }
  .pd-card-rec::before   { background: linear-gradient(90deg, #10b981, #059669); }
  .pd-card-video::before { background: linear-gradient(90deg, #f59e0b, #ef4444); }
  .pd-card-hist::before  { background: linear-gradient(90deg, #ec4899, #a855f7); }

  .pd-card:hover.pd-card-appt  { box-shadow: 0 16px 48px rgba(99,102,241,0.18); }
  .pd-card:hover.pd-card-symp  { box-shadow: 0 16px 48px rgba(6,182,212,0.18); }
  .pd-card:hover.pd-card-rec   { box-shadow: 0 16px 48px rgba(16,185,129,0.18); }
  .pd-card:hover.pd-card-hist  { box-shadow: 0 16px 48px rgba(236,72,153,0.18); }

  .pd-card-icon-wrap {
    width: 56px; height: 56px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; margin-bottom: 20px;
  }
  .pd-card-title {
    font-family: 'Sora', sans-serif;
    font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0;
  }
  .pd-card-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px 0; }
  .pd-card-footer { display: flex; align-items: center; justify-content: space-between; }
  .pd-card-cta { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
  .pd-card-appt .pd-card-cta  { color: #6366f1; }
  .pd-card-symp .pd-card-cta  { color: #0ea5e9; }
  .pd-card-rec  .pd-card-cta  { color: #10b981; }
  .pd-card-hist .pd-card-cta  { color: #ec4899; }
  .pd-card-arrow { transition: transform 0.2s, opacity 0.2s; opacity: 0.5; }

  .pd-card-wide {
    grid-column: span 2;
    display: flex; align-items: center; gap: 32px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1e1b4b 100%);
    padding: 32px 36px;
  }
  .pd-card-wide .pd-card-title { color: #fff; }
  .pd-card-wide .pd-card-desc  { color: rgba(255,255,255,0.55); }
  .pd-card-wide .pd-card-cta   { color: #fbbf24; }
  .pd-card-wide::before        { background: linear-gradient(90deg, #f59e0b, #ef4444); }
  .pd-card-wide:hover          { box-shadow: 0 20px 60px rgba(15,23,42,0.35); }

  .pd-wide-visual {
    flex-shrink: 0; width: 120px; height: 90px;
    background: rgba(255,255,255,0.06); border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 48px; position: relative; overflow: hidden;
  }
  .pd-wide-visual::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%);
  }
  .pd-wide-pulse {
    position: absolute; width: 100%; height: 100%;
    border-radius: 16px; border: 2px solid rgba(245,158,11,0.3);
    animation: widePulse 2s ease-in-out infinite;
  }
  @keyframes widePulse {
    0%,100% { transform:scale(1); opacity:0.6; }
    50%     { transform:scale(1.06); opacity:0.2; }
  }

  .pd-badge {
    font-size: 11px; font-weight: 700; padding: 3px 10px;
    border-radius: 100px; letter-spacing: 0.3px;
  }
  .pd-badge-purple { background: #ede9fe; color: #7c3aed; }
  .pd-badge-cyan   { background: #e0f2fe; color: #0284c7; }
  .pd-badge-green  { background: #d1fae5; color: #059669; }
  .pd-badge-amber  { background: rgba(254,243,199,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
  .pd-badge-pink   { background: #fce7f3; color: #db2777; }

  .pd-bottom {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; padding: 0 40px;
  }
  .pd-privacy {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #bbf7d0; border-radius: 20px; padding: 24px 28px;
    display: flex; gap: 16px; align-items: flex-start;
  }
  .pd-privacy-icon {
    width: 44px; height: 44px; background: #16a34a; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .pd-privacy-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#14532d; margin:0 0 4px 0; }
  .pd-privacy-text  { font-size:13px; color:#166534; line-height:1.5; margin:0; }
  .pd-tip {
    background: linear-gradient(135deg, #fff7ed, #ffedd5);
    border: 1px solid #fed7aa; border-radius: 20px; padding: 24px 28px;
    display: flex; gap: 16px; align-items: flex-start;
  }
  .pd-tip-icon {
    width: 44px; height: 44px; background: #ea580c; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .pd-tip-title { font-family:'Sora',sans-serif; font-size:15px; font-weight:700; color:#7c2d12; margin:0 0 4px 0; }
  .pd-tip-text  { font-size:13px; color:#9a3412; line-height:1.5; margin:0; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .pd-anim   { animation: fadeUp 0.5s ease both; }
  .pd-anim-1 { animation-delay: 0.05s; }
  .pd-anim-2 { animation-delay: 0.10s; }
  .pd-anim-3 { animation-delay: 0.15s; }
  .pd-anim-4 { animation-delay: 0.20s; }
  .pd-anim-5 { animation-delay: 0.25s; }
  .pd-anim-6 { animation-delay: 0.30s; }
`;
document.head.appendChild(style);

export default function PatientDashboard({ user, setPage }) {
  const [stats, setStats] = useState({ upcoming: 0, calls: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [apptRes, callRes] = await Promise.all([
          fetch(`${API}/api/appointments?user_id=${user.id}`, { credentials: "include" }),
          fetch(`${API}/api/calls/${user.id}`, { credentials: "include" }),
        ]);
        const appts = await apptRes.json();
        const calls = await callRes.json();
        setStats({
          upcoming: Array.isArray(appts) ? appts.filter(a => a.status !== "cancelled").length : 0,
          calls: Array.isArray(calls) ? calls.length : 0,
        });
      } catch {}
    };
    fetchStats();
  }, [user]);

  const cards = [
    {
      cls: "pd-card-appt", icon: "📅", iconBg: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
      title: "Appointments", desc: "Book consultations with top specialists across 15+ categories.",
      badge: { text: `${stats.upcoming} Active`, cls: "pd-badge-purple" },
      cta: "View all", page: "appointments",
    },
    {
      cls: "pd-card-symp", icon: "🩺", iconBg: "linear-gradient(135deg,#e0f2fe,#bae6fd)",
      title: "AI Symptom Checker", desc: "Describe your symptoms and get AI-powered health insights instantly.",
      badge: { text: "AI Powered", cls: "pd-badge-cyan" },
      cta: "Check now", page: "symptoms",
    },
    {
      cls: "pd-card-rec", icon: "📋", iconBg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
      title: "Medical Records", desc: "Access your complete health history, prescriptions and diagnoses.",
      badge: { text: "Secure", cls: "pd-badge-green" },
      cta: "Open records", page: "records",
    },
    {
      cls: "pd-card-hist", icon: "📞", iconBg: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
      title: "Call History", desc: "Review past video consultations, durations and session notes.",
      badge: { text: `${stats.calls} Sessions`, cls: "pd-badge-pink" },
      cta: "View history", page: "calls",
    },
  ];

  return (
    <div className="pd-root">

      {/* Hero */}
      <div className="pd-hero">
        <div className="pd-hero-grid" />
        <div className="pd-hero-shape" style={{ width:200, height:200, right:-60,  top:-60 }} />
        <div className="pd-hero-shape" style={{ width:120, height:120, right:180, bottom:-40 }} />
        <div className="pd-hero-shape" style={{ width:60,  height:60,  right:320, top:20 }} />

        <div className="pd-hero-content">
          <div className="pd-hero-label">
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#86efac", display:"inline-block" }} />
            Patient Portal
          </div>
          <h1 className="pd-hero-title">Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="pd-hero-sub">Your health journey, all in one place — let's keep you at your best.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="pd-stats pd-anim pd-anim-1">
        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background:"linear-gradient(135deg,#ede9fe,#ddd6fe)" }}>📅</div>
          <div>
            <div className="pd-stat-num">{stats.upcoming}</div>
            <div className="pd-stat-label">Upcoming Visits</div>
          </div>
        </div>
        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background:"linear-gradient(135deg,#fce7f3,#fbcfe8)" }}>📞</div>
          <div>
            <div className="pd-stat-num">{stats.calls}</div>
            <div className="pd-stat-label">Total Consultations</div>
          </div>
        </div>
        <div className="pd-stat-card">
          <div className="pd-stat-icon" style={{ background:"linear-gradient(135deg,#d1fae5,#a7f3d0)" }}>🛡️</div>
          <div>
            <div className="pd-stat-num">100%</div>
            <div className="pd-stat-label">Data Encrypted</div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="pd-grid">
        {cards.slice(0, 3).map((c, i) => (
          <div key={c.page} className={`pd-card ${c.cls} pd-anim pd-anim-${i + 2}`} onClick={() => setPage(c.page)}>
            <div className="pd-card-icon-wrap" style={{ background: c.iconBg }}>{c.icon}</div>
            <h3 className="pd-card-title">{c.title}</h3>
            <p className="pd-card-desc">{c.desc}</p>
            <div className="pd-card-footer">
              <span className={`pd-badge ${c.badge.cls}`}>{c.badge.text}</span>
              <span className="pd-card-cta">{c.cta} <span className="pd-card-arrow">→</span></span>
            </div>
          </div>
        ))}

        {/* Video — wide */}
        <div className="pd-card pd-card-video pd-card-wide pd-anim pd-anim-5" onClick={() => setPage("appointments")}>
          <div className="pd-wide-visual">
            <div className="pd-wide-pulse" />
            📹
          </div>
          <div style={{ flex:1 }}>
            <h3 className="pd-card-title">Video Consultation</h3>
            <p className="pd-card-desc">Connect face-to-face with your doctor via encrypted, peer-to-peer WebRTC video. Works right in your browser.</p>
            <div className="pd-card-footer">
              <span className="pd-badge pd-badge-amber">Live & Secure</span>
              <span className="pd-card-cta">Start a call <span className="pd-card-arrow">→</span></span>
            </div>
          </div>
          <div style={{ position:"absolute", right:28, top:24, display:"flex", gap:4 }}>
            {[1,2,3].map(d => <div key={d} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.2)" }} />)}
          </div>
        </div>

        {/* Call History */}
        <div className={`pd-card ${cards[3].cls} pd-anim pd-anim-6`} onClick={() => setPage(cards[3].page)}>
          <div className="pd-card-icon-wrap" style={{ background: cards[3].iconBg }}>{cards[3].icon}</div>
          <h3 className="pd-card-title">{cards[3].title}</h3>
          <p className="pd-card-desc">{cards[3].desc}</p>
          <div className="pd-card-footer">
            <span className={`pd-badge ${cards[3].badge.cls}`}>{cards[3].badge.text}</span>
            <span className="pd-card-cta">{cards[3].cta} <span className="pd-card-arrow">→</span></span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="pd-bottom pd-anim pd-anim-6">
        <div className="pd-privacy">
          <div className="pd-privacy-icon">🔒</div>
          <div>
            <p className="pd-privacy-title">Privacy First</p>
            <p className="pd-privacy-text">All your data is encrypted at rest and in transit. Video calls are peer-to-peer via WebRTC — no server recording, ever.</p>
          </div>
        </div>
        <div className="pd-tip">
          <div className="pd-tip-icon">💡</div>
          <div>
            <p className="pd-tip-title">Quick Tip</p>
            <p className="pd-tip-text">Use the AI Symptom Checker before booking to find the right specialist for your needs. It takes under 60 seconds!</p>
          </div>
        </div>
      </div>

    </div>
  );
}
