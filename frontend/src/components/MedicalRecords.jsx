import { useState, useEffect, useRef } from "react";
import API from "../api";

const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .mr-root { font-family:'DM Sans',sans-serif; background:#f0f2f8; min-height:100vh; padding:0 0 60px; }

  .mr-hero {
    position:relative; overflow:hidden;
    background:linear-gradient(120deg,#064e3b 0%,#065f46 35%,#059669 70%,#34d399 100%);
    padding:48px 48px 80px; margin-bottom:-48px;
  }
  .mr-hero-grid {
    position:absolute; inset:0;
    background-image:linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),
                     linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .mr-hero::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse 500px 300px at 80% 50%,rgba(52,211,153,0.3) 0%,transparent 70%);
  }
  .mr-hero-shape { position:absolute; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); }
  .mr-hero-content { position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; }
  .mr-hero-label {
    display:inline-flex; align-items:center; gap:6px;
    background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25);
    border-radius:100px; padding:5px 14px; font-size:12px; font-weight:600;
    color:rgba(255,255,255,0.9); letter-spacing:0.5px; text-transform:uppercase;
    margin-bottom:16px; backdrop-filter:blur(8px); width:fit-content;
  }
  .mr-hero-title { font-family:'Sora',sans-serif; font-size:clamp(24px,3.5vw,38px); font-weight:800; color:#fff; margin:0 0 8px; letter-spacing:-0.5px; }
  .mr-hero-sub   { color:rgba(255,255,255,0.65); font-size:15px; margin:0; }
  .mr-add-btn {
    background:#fff; color:#059669; border:none; border-radius:14px;
    padding:12px 24px; font-weight:700; font-size:14px; cursor:pointer;
    transition:all 0.2s; white-space:nowrap; flex-shrink:0;
    box-shadow:0 4px 16px rgba(0,0,0,0.15); font-family:'DM Sans',sans-serif;
  }
  .mr-add-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.2); }
  .mr-add-btn.cancel { background:rgba(255,255,255,0.15); color:#fff; border:1px solid rgba(255,255,255,0.3); box-shadow:none; }

  .mr-content { padding:0 40px; }

  /* ── Doctor Prescription Panel ── */
  .mr-search-panel {
    background:#fff; border-radius:24px; padding:28px 32px;
    box-shadow:0 8px 40px rgba(5,150,105,0.12); border:1px solid rgba(52,211,153,0.2);
    margin-bottom:24px; position:relative; z-index:3;
  }
  .mr-search-title { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:#0f172a; margin:0 0 20px; }
  .mr-search-row   { display:flex; gap:12px; align-items:flex-end; }
  .mr-uid-input {
    flex:1; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:12px;
    font-size:14px; font-family:'DM Sans',sans-serif; background:#f8fafc;
    outline:none; transition:border-color 0.2s;
  }
  .mr-uid-input:focus { border-color:#059669; }
  .mr-find-btn {
    padding:12px 24px; background:linear-gradient(135deg,#065f46,#059669);
    color:#fff; border:none; border-radius:12px; font-weight:700;
    font-size:14px; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.2s;
    white-space:nowrap;
  }
  .mr-find-btn:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(5,150,105,0.35); }

  /* Patient Banner after search */
  .mr-patient-found {
    background:linear-gradient(135deg,rgba(5,150,105,0.08),rgba(52,211,153,0.08));
    border:2px solid #059669; border-radius:16px; padding:18px 22px; margin-top:16px;
    display:flex; justify-content:space-between; align-items:center;
  }
  .mr-patient-avatar {
    width:48px; height:48px; border-radius:14px;
    background:linear-gradient(135deg,#059669,#34d399);
    display:flex; align-items:center; justify-content:center;
    font-size:22px; flex-shrink:0;
  }

  /* ── Prescription Document ── */
  .mr-prescription-wrap {
    background:#fff; border-radius:24px; padding:0;
    box-shadow:0 8px 40px rgba(5,150,105,0.12); border:1px solid rgba(52,211,153,0.2);
    margin-bottom:24px; overflow:hidden; position:relative; z-index:3;
  }
  .mr-doc-toolbar {
    background:#f8fafc; border-bottom:1px solid #e2e8f0;
    padding:14px 24px; display:flex; justify-content:space-between; align-items:center;
  }
  .mr-doc-toolbar-title { font-family:'Sora',sans-serif; font-size:14px; font-weight:700; color:#0f172a; }
  .mr-toolbar-btns { display:flex; gap:10px; }
  .mr-tool-btn {
    padding:7px 16px; border-radius:10px; border:1.5px solid #e2e8f0;
    background:#fff; color:#374151; cursor:pointer; font-weight:600;
    font-size:12px; font-family:'DM Sans',sans-serif; transition:all 0.15s;
    display:flex; align-items:center; gap:6px;
  }
  .mr-tool-btn:hover { border-color:#059669; color:#059669; }
  .mr-tool-btn.primary { background:linear-gradient(135deg,#065f46,#059669); border-color:transparent; color:#fff; }
  .mr-tool-btn.primary:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(5,150,105,0.3); }
  .mr-tool-btn.print-btn { background:linear-gradient(135deg,#1e3a5f,#1e40af); border-color:transparent; color:#fff; }
  .mr-tool-btn.print-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(30,64,175,0.3); }

  /* The actual printable document */
  .mr-doc {
    padding:40px 48px;
    font-family:'DM Sans',sans-serif;
  }

  /* Print styles */
  @media print {
    body * { visibility:hidden !important; }
    .mr-printable, .mr-printable * { visibility:visible !important; }
    .mr-printable {
      position:fixed !important; inset:0 !important;
      background:#fff !important; padding:40px !important;
      font-family:'Times New Roman',serif !important;
    }
    .mr-doc-toolbar { display:none !important; }
    .mr-no-print    { display:none !important; }
    .mr-doc-input, .mr-doc-textarea {
      border:none !important; background:transparent !important;
      padding:0 !important; resize:none !important;
    }
  }

  .mr-doc-header {
    display:flex; justify-content:space-between; align-items:flex-start;
    padding-bottom:20px; border-bottom:2px solid #059669; margin-bottom:24px;
  }
  .mr-doc-clinic  { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#064e3b; margin:0 0 4px; }
  .mr-doc-tagline { font-size:12px; color:#059669; font-weight:600; letter-spacing:0.5px; margin:0; }
  .mr-doc-rx      { font-size:64px; font-weight:900; color:#059669; opacity:0.15; line-height:1; font-family:serif; }

  .mr-doc-title {
    font-family:'Sora',sans-serif; font-size:16px; font-weight:800;
    color:#0f172a; text-align:center; text-transform:uppercase; letter-spacing:2px;
    margin-bottom:24px; padding:10px; background:#f0fdf4; border-radius:8px;
    border:1px solid #bbf7d0;
  }

  /* Patient info grid */
  .mr-doc-info-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:16px;
    background:#f8fafc; border-radius:12px; padding:20px; margin-bottom:24px;
    border:1px solid #e2e8f0;
  }
  .mr-doc-info-row { display:flex; align-items:center; gap:8px; }
  .mr-doc-info-label { font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; width:80px; flex-shrink:0; }
  .mr-doc-info-value { font-size:14px; color:#0f172a; font-weight:600; flex:1; }
  .mr-doc-info-input {
    font-size:14px; color:#0f172a; font-weight:600; flex:1;
    border:none; border-bottom:1.5px dashed #d1d5db; background:transparent;
    outline:none; padding:2px 4px; font-family:'DM Sans',sans-serif; width:100%;
  }
  .mr-doc-info-input:focus { border-bottom-color:#059669; }

  .mr-doc-section { margin-bottom:20px; }
  .mr-doc-section-label {
    font-family:'Sora',sans-serif; font-size:13px; font-weight:700; color:#064e3b;
    text-transform:uppercase; letter-spacing:0.5px; margin:0 0 8px;
    display:flex; align-items:center; gap:8px;
  }
  .mr-doc-section-label::after { content:''; flex:1; height:1px; background:#d1fae5; }
  .mr-doc-input {
    width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:10px;
    font-size:14px; font-family:'DM Sans',sans-serif; background:#f8fafc;
    outline:none; box-sizing:border-box; transition:border-color 0.2s; color:#0f172a;
  }
  .mr-doc-input:focus { border-color:#059669; background:#fff; }
  .mr-doc-textarea {
    width:100%; padding:12px 16px; border:1.5px solid #e2e8f0; border-radius:10px;
    font-size:14px; font-family:'DM Sans',sans-serif; background:#f8fafc;
    outline:none; box-sizing:border-box; resize:vertical; min-height:80px;
    transition:border-color 0.2s; color:#0f172a;
  }
  .mr-doc-textarea:focus { border-color:#059669; background:#fff; }

  .mr-doc-footer {
    margin-top:32px; padding-top:20px; border-top:1px solid #e2e8f0;
    display:flex; justify-content:space-between; align-items:flex-end;
  }
  .mr-doc-date-box { font-size:13px; color:#64748b; }
  .mr-doc-sign-box { text-align:right; }
  .mr-doc-sign-line { width:180px; border-top:1.5px solid #0f172a; padding-top:6px; font-size:12px; color:#64748b; text-align:center; }

  /* Records list */
  .mr-record-card {
    background:#fff; border-radius:20px; padding:24px;
    border:1px solid #f1f5f9; margin-bottom:14px;
    box-shadow:0 2px 12px rgba(0,0,0,0.04);
    transition:transform 0.2s, box-shadow 0.2s;
    position:relative; overflow:hidden;
  }
  .mr-record-card::before {
    content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
    background:linear-gradient(to bottom,#059669,#34d399);
    border-radius:4px 0 0 4px;
  }
  .mr-record-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(5,150,105,0.1); }
  .mr-record-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
  .mr-record-diag { font-family:'Sora',sans-serif; font-size:17px; font-weight:700; color:#0f172a; margin:0; }
  .mr-record-date { font-size:12px; color:#94a3b8; background:#f8fafc; border-radius:100px; padding:4px 12px; border:1px solid #e2e8f0; }
  .mr-record-body { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .mr-record-field-label { font-size:11px; font-weight:700; color:#059669; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px; }
  .mr-record-field-val   { font-size:13px; color:#374151; margin:0; line-height:1.5; }

  .mr-print-btn-wrap {
    display:flex; justify-content:flex-end; gap:10px; margin-top:14px;
  }
  .mr-record-print-btn {
    padding:7px 16px; border-radius:10px; font-size:12px; font-weight:600;
    font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s;
    display:flex; align-items:center; gap:6px; border:1.5px solid #e2e8f0;
    background:#fff; color:#374151;
  }
  .mr-record-print-btn:hover { border-color:#059669; color:#059669; }

  .mr-empty { text-align:center; padding:60px 20px; background:#fff; border-radius:20px; border:2px dashed #e2e8f0; }
  .mr-section-title { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:#0f172a; margin:0 0 16px; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .mr-anim   { animation:fadeUp 0.4s ease both; }
  .mr-anim-1 { animation-delay:0.05s; }
  .mr-anim-2 { animation-delay:0.10s; }
  .mr-anim-3 { animation-delay:0.15s; }
`;
document.head.appendChild(style);

export default function MedicalRecords({ user }) {
  const [records,     setRecords]     = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [uidInput,    setUidInput]    = useState("");
  const [foundPatient,setFoundPatient]= useState(null);
  const [findError,   setFindError]   = useState("");
  const [saving,      setSaving]      = useState(false);
  const [savedMsg,    setSavedMsg]    = useState("");
  const docRef = useRef(null);

  // Doctor fills prescription
  const [rx, setRx] = useState({
    sex:"", age:"", height:"", weight:"", blood_group:"",
    diagnosis:"", prescription:"", notes:"", date: new Date().toLocaleDateString("en-IN")
  });

  useEffect(() => { if (user.role==="patient") fetchRecords(user.id); }, []);

  const fetchRecords = async (pid) => {
    const res = await fetch(`${API}/api/records/${pid}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
  };

  const findPatient = async () => {
    setFindError(""); setFoundPatient(null);
    if (!uidInput.trim()) return setFindError("Enter a patient ID");
    try {
      const res  = await fetch(`${API}/api/user/find/${uidInput.trim()}`, { credentials:"include" });
      const data = await res.json();
      if (!res.ok) return setFindError(data.error || "Patient not found");
      setFoundPatient(data);
      // Pre-fill patient profile details
      const profRes  = await fetch(`${API}/api/profile/${data.id}`, { credentials:"include" });
      const profData = await profRes.json();
      setRx(prev => ({
        ...prev,
        sex:        profData.sex        || "",
        age:        profData.age        || "",
        height:     profData.height     || "",
        weight:     profData.weight     || "",
        blood_group:profData.blood_group|| "",
      }));
    } catch { setFindError("Network error. Try again."); }
  };

  const saveRecord = async () => {
    if (!foundPatient) return;
    if (!rx.diagnosis.trim()) return alert("Please enter a diagnosis");
    setSaving(true);
    await fetch(`${API}/api/records`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        patient_id:   foundPatient.id,
        doctor_id:    user.id,
        diagnosis:    rx.diagnosis,
        prescription: rx.prescription,
        notes:        rx.notes,
      })
    });
    setSaving(false); setSavedMsg("✅ Record saved to patient's history!");
    setTimeout(()=>setSavedMsg(""), 3000);
  };

  const printDoc = () => {
    const printWin = window.open("","_blank","width=800,height=1000");
    const docHTML  = docRef.current.innerHTML;
    printWin.document.write(`
      <html><head><title>Prescription — ${foundPatient?.name||""}</title>
      <style>
        body { font-family:'Times New Roman',serif; padding:40px; max-width:800px; margin:0 auto; color:#000; }
        .mr-doc-toolbar, .mr-no-print { display:none; }
        .mr-doc-header { display:flex; justify-content:space-between; border-bottom:2px solid #059669; padding-bottom:16px; margin-bottom:20px; }
        .mr-doc-clinic  { font-size:22px; font-weight:800; color:#064e3b; }
        .mr-doc-tagline { font-size:12px; color:#059669; }
        .mr-doc-rx      { font-size:64px; font-weight:900; color:#ccc; line-height:1; }
        .mr-doc-title   { font-size:15px; font-weight:800; text-align:center; text-transform:uppercase; letter-spacing:2px; border:1px solid #ccc; padding:8px; margin-bottom:20px; }
        .mr-doc-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; background:#f8f8f8; padding:16px; border:1px solid #ddd; border-radius:8px; margin-bottom:20px; }
        .mr-doc-info-label { font-size:11px; color:#666; font-weight:700; text-transform:uppercase; }
        .mr-doc-info-value, .mr-doc-info-input { font-size:14px; font-weight:600; border:none; background:transparent; width:100%; }
        .mr-doc-section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#064e3b; margin:16px 0 6px; border-bottom:1px solid #d1fae5; padding-bottom:4px; }
        .mr-doc-input, .mr-doc-textarea { border:none; border-bottom:1px solid #ddd; background:transparent; width:100%; font-size:13px; padding:4px; font-family:inherit; }
        .mr-doc-footer { display:flex; justify-content:space-between; margin-top:40px; border-top:1px solid #ddd; padding-top:16px; }
        .mr-doc-sign-line { width:160px; border-top:1px solid #000; padding-top:6px; font-size:11px; text-align:center; }
      </style></head>
      <body>${docHTML}</body></html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(()=>{ printWin.print(); printWin.close(); }, 500);
  };

  const printRecord = (r) => {
    const printWin = window.open("","_blank","width=800,height=1000");
    printWin.document.write(`
      <html><head><title>Medical Record</title>
      <style>
        body { font-family:'Times New Roman',serif; padding:40px; color:#000; }
        h1   { font-size:20px; border-bottom:2px solid #059669; padding-bottom:10px; }
        .grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f8f8f8; padding:14px; margin:16px 0; border:1px solid #ddd; }
        .lbl { font-size:11px; font-weight:700; text-transform:uppercase; color:#666; }
        .val { font-size:14px; font-weight:600; }
        .section { margin-top:16px; }
        .section h3 { font-size:13px; text-transform:uppercase; color:#064e3b; border-bottom:1px solid #d1fae5; padding-bottom:4px; }
        .section p  { font-size:13px; line-height:1.6; }
        .footer { margin-top:40px; border-top:1px solid #ddd; padding-top:16px; display:flex; justify-content:space-between; font-size:12px; color:#666; }
        .sign { width:160px; border-top:1px solid #000; padding-top:6px; text-align:center; font-size:11px; }
      </style></head>
      <body>
        <h1>💊 TeleMed AI — Medical Record</h1>
        <p style="font-size:13px;color:#666;">Generated on ${new Date().toLocaleDateString("en-IN")}</p>
        <div class="section"><h3>Diagnosis</h3><p><strong>${r.diagnosis}</strong></p></div>
        <div class="section"><h3>Prescription</h3><p>${r.prescription||"—"}</p></div>
        <div class="section"><h3>Notes</h3><p>${r.notes||"—"}</p></div>
        <div class="footer">
          <div>Date: ${new Date(r.created_at).toLocaleDateString("en-IN")}</div>
          <div class="sign">Doctor's Signature</div>
        </div>
      </body></html>
    `);
    printWin.document.close(); printWin.focus();
    setTimeout(()=>{ printWin.print(); printWin.close(); }, 400);
  };

  return (
    <div className="mr-root">
      {/* Hero */}
      <div className="mr-hero">
        <div className="mr-hero-grid" />
        <div className="mr-hero-shape" style={{width:200,height:200,right:-60,top:-60}} />
        <div className="mr-hero-shape" style={{width:100,height:100,right:200,bottom:-30}} />
        <div className="mr-hero-content">
          <div>
            <div className="mr-hero-label">
              <span style={{width:6,height:6,borderRadius:"50%",background:"#6ee7b7",display:"inline-block"}} />
              {user.role==="doctor" ? "Doctor Portal" : "Patient Portal"}
            </div>
            <h1 className="mr-hero-title">📋 Medical Records</h1>
            <p className="mr-hero-sub">
              {user.role==="doctor" ? "Search patient by ID and write prescriptions" : "Your health history and prescriptions"}
            </p>
          </div>
          {user.role==="doctor" && (
            <button className={`mr-add-btn ${showForm?"cancel":""}`} onClick={()=>{setShowForm(!showForm);setFoundPatient(null);setUidInput("");setFindError("");}}>
              {showForm ? "✕ Close" : "+ New Prescription"}
            </button>
          )}
        </div>
      </div>

      <div className="mr-content">

        {/* ── DOCTOR: Search + Prescription ── */}
        {user.role==="doctor" && showForm && (
          <>
            {/* Patient Search */}
            <div className="mr-search-panel mr-anim mr-anim-1">
              <p className="mr-search-title">🔍 Find Patient by Unique ID</p>
              <div className="mr-search-row">
                <input className="mr-uid-input" placeholder="Enter 5-digit patient ID (e.g. 48291)" value={uidInput}
                  onChange={e=>setUidInput(e.target.value.replace(/\D/g,"").slice(0,5))}
                  onKeyDown={e=>e.key==="Enter"&&findPatient()} maxLength={5} />
                <button className="mr-find-btn" onClick={findPatient}>Find Patient</button>
              </div>
              {findError && <p style={{color:"#dc2626",fontSize:"13px",margin:"10px 0 0",fontWeight:"600"}}>{findError}</p>}
              {foundPatient && (
                <div className="mr-patient-found">
                  <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                    <div className="mr-patient-avatar">🧑‍💼</div>
                    <div>
                      <p style={{margin:0,fontWeight:"700",fontSize:"16px",color:"#0f172a"}}>{foundPatient.name}</p>
                      <p style={{margin:"3px 0 0",fontSize:"13px",color:"#059669",fontWeight:"600"}}>ID: {foundPatient.unique_id} • Patient found ✓</p>
                    </div>
                  </div>
                  <span style={{background:"#dcfce7",color:"#059669",padding:"4px 14px",borderRadius:"100px",fontSize:"12px",fontWeight:"700"}}>Verified</span>
                </div>
              )}
            </div>

            {/* Prescription Document */}
            {foundPatient && (
              <div className="mr-prescription-wrap mr-anim mr-anim-2">
                <div className="mr-doc-toolbar">
                  <span className="mr-doc-toolbar-title">📄 Prescription Document — {foundPatient.name}</span>
                  <div className="mr-toolbar-btns">
                    <button className="mr-tool-btn print-btn" onClick={printDoc}>🖨️ Print / Download</button>
                    <button className="mr-tool-btn primary" onClick={saveRecord} disabled={saving}>
                      {saving ? "Saving..." : "💾 Save to Patient"}
                    </button>
                  </div>
                </div>
                {savedMsg && <div style={{background:"#dcfce7",color:"#059669",padding:"10px 24px",fontSize:"13px",fontWeight:"600",borderBottom:"1px solid #bbf7d0"}}>{savedMsg}</div>}

                <div className="mr-doc" ref={docRef}>
                  {/* Document Header */}
                  <div className="mr-doc-header">
                    <div>
                      <p className="mr-doc-clinic">💊 TeleMed AI</p>
                      <p className="mr-doc-tagline">AI-powered telemedicine workspace for modern virtual care</p>
                    </div>
                    <div className="mr-doc-rx">Rx</div>
                  </div>

                  <div className="mr-doc-title">MEDICAL PRESCRIPTION</div>

                  {/* Patient Info Grid */}
                  <div className="mr-doc-info-grid">
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Patient</span>
                      <span className="mr-doc-info-value">{foundPatient.name}</span>
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Patient ID</span>
                      <span className="mr-doc-info-value">{foundPatient.unique_id}</span>
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Sex</span>
                      <input className="mr-doc-info-input" placeholder="Enter" value={rx.sex} onChange={e=>setRx({...rx,sex:e.target.value})} />
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Age</span>
                      <input className="mr-doc-info-input" placeholder="Enter" value={rx.age} onChange={e=>setRx({...rx,age:e.target.value})} />
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Height</span>
                      <input className="mr-doc-info-input" placeholder="e.g. 170 cm" value={rx.height} onChange={e=>setRx({...rx,height:e.target.value})} />
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Weight</span>
                      <input className="mr-doc-info-input" placeholder="e.g. 65 kg" value={rx.weight} onChange={e=>setRx({...rx,weight:e.target.value})} />
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Blood</span>
                      <input className="mr-doc-info-input" placeholder="e.g. O+" value={rx.blood_group} onChange={e=>setRx({...rx,blood_group:e.target.value})} />
                    </div>
                    <div className="mr-doc-info-row">
                      <span className="mr-doc-info-label">Date</span>
                      <span className="mr-doc-info-value">{rx.date}</span>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="mr-doc-section">
                    <p className="mr-doc-section-label">Diagnosis</p>
                    <input className="mr-doc-input" placeholder="Enter diagnosis / condition"
                      value={rx.diagnosis} onChange={e=>setRx({...rx,diagnosis:e.target.value})} />
                  </div>

                  {/* Prescription */}
                  <div className="mr-doc-section">
                    <p className="mr-doc-section-label">Prescription / Medicines</p>
                    <textarea className="mr-doc-textarea" rows={4}
                      placeholder="e.g. Tab. Paracetamol 500mg — 1 tab TDS × 5 days&#10;Tab. Cetirizine 10mg — 1 tab OD × 3 days"
                      value={rx.prescription} onChange={e=>setRx({...rx,prescription:e.target.value})} />
                  </div>

                  {/* Notes */}
                  <div className="mr-doc-section">
                    <p className="mr-doc-section-label">Clinical Notes / Instructions</p>
                    <textarea className="mr-doc-textarea" rows={3}
                      placeholder="e.g. Take medicines after meals. Drink plenty of fluids. Follow-up after 7 days."
                      value={rx.notes} onChange={e=>setRx({...rx,notes:e.target.value})} />
                  </div>

                  {/* Footer */}
                  <div className="mr-doc-footer">
                    <div className="mr-doc-date-box">
                      <p style={{margin:"0 0 4px",fontSize:"12px",color:"#94a3b8"}}>Date of Consultation</p>
                      <p style={{margin:0,fontWeight:"600",color:"#374151"}}>{rx.date}</p>
                    </div>
                    <div className="mr-doc-sign-box">
                      <div className="mr-doc-sign-line">Doctor's Signature &amp; Stamp</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Records List ── */}
        <p className="mr-section-title mr-anim mr-anim-2">
          {user.role==="doctor" ? "Recently Saved Records" : "My Medical Records"}
        </p>

        {user.role==="patient" && records.length===0 && (
          <div className="mr-empty mr-anim mr-anim-3">
            <p style={{fontSize:"48px",margin:"0 0 12px"}}>📋</p>
            <p style={{fontSize:"16px",fontWeight:"700",color:"#374151",margin:"0 0 4px"}}>No records yet</p>
            <p style={{fontSize:"13px",color:"#94a3b8",margin:0}}>Your doctor will add records after consultation</p>
          </div>
        )}

        {records.map((r,i)=>(
          <div key={r.id} className={`mr-record-card mr-anim`} style={{animationDelay:`${i*0.05+0.1}s`}}>
            <div className="mr-record-header">
              <p className="mr-record-diag">📌 {r.diagnosis}</p>
              <span className="mr-record-date">{new Date(r.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
            </div>
            <div className="mr-record-body">
              <div>
                <p className="mr-record-field-label">Prescription</p>
                <p className="mr-record-field-val">{r.prescription||"—"}</p>
              </div>
              <div>
                <p className="mr-record-field-label">Notes</p>
                <p className="mr-record-field-val">{r.notes||"—"}</p>
              </div>
            </div>
            <div className="mr-print-btn-wrap">
              <button className="mr-record-print-btn" onClick={()=>printRecord(r)}>🖨️ Print / Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

