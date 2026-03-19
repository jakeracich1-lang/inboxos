import { useState, useCallback } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const GMAIL_CLIENT_ID = "783902322455-d0pcbf1ufbi0pd9gjj945lao1vassddj.apps.googleusercontent.com";
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.labels",
].join(" ");

const LABEL_FOLDERS = {
  Personal: "Label_1",
  Receipts: "Label_2",
  Work: "Label_4",
  "To Review (Claude)": "Label_10",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Geist:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c0c0e;--s1:#141417;--s2:#1c1c20;--s3:#242428;
  --b1:#28282e;--b2:#323238;--t1:#f0f0f4;--t2:#8888a0;--t3:#50506a;
  --ac:#7c6aff;--ac2:#a594ff;--gr:#22c55e;--re:#ef4444;--or:#f97316;--bl:#3b82f6;
}
body{background:var(--bg);color:var(--t1);font-family:'Geist',sans-serif;min-height:100vh}
.app{display:flex;flex-direction:column;min-height:100vh}

/* Header */
.hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:var(--s1);border-bottom:1px solid var(--b1);position:sticky;top:0;z-index:100}
.brand{display:flex;align-items:center;gap:10px}
.logo{width:32px;height:32px;background:linear-gradient(135deg,var(--ac),#c084fc);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px}
.title{font-family:'Instrument Serif',serif;font-size:20px;letter-spacing:-.3px}
.title em{font-style:italic;color:var(--ac2)}
.accts{display:flex;gap:8px}
.abtn{display:flex;align-items:center;gap:6px;padding:6px 13px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--b2);background:var(--s2);color:var(--t2);transition:all .15s;font-family:'Geist',sans-serif}
.abtn.on{border-color:#1e3a1e;background:#0f200f;color:var(--gr)}
.abtn:hover{opacity:.8}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}

/* Main */
.main{flex:1;max-width:1100px;margin:0 auto;width:100%;padding:24px}

/* Phase cards */
.phases{display:flex;flex-direction:column;gap:16px}
.phase{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden}
.phase-hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;cursor:pointer;transition:background .12s}
.phase-hdr:hover{background:var(--s2)}
.phase-hdr.active{background:var(--s2)}
.phase-left{display:flex;align-items:center;gap:12px}
.phase-num{width:28px;height:28px;border-radius:50%;background:var(--ac);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;font-family:'DM Mono',monospace;flex-shrink:0}
.phase-num.done{background:var(--gr)}
.phase-num.locked{background:var(--s3);color:var(--t3)}
.phase-title{font-size:14px;font-weight:600}
.phase-sub{font-size:11px;color:var(--t3);margin-top:2px}
.phase-body{padding:0 20px 20px}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;font-family:'Geist',sans-serif;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-p{background:var(--ac);color:#fff}.btn-p:hover:not(:disabled){background:#6a58e8}
.btn-g{background:transparent;color:var(--t2);border:1px solid var(--b2)}.btn-g:hover:not(:disabled){background:var(--s3);color:var(--t1)}
.btn-d{background:transparent;color:var(--re);border:1px solid #3a1515}.btn-d:hover:not(:disabled){background:#1f0a0a}
.btn-gr{background:transparent;color:var(--gr);border:1px solid #1a3a1a}.btn-gr:hover:not(:disabled){background:#0f200f}
.btn-sm{padding:5px 10px;font-size:11px}

/* Connect */
.connect-area{display:flex;flex-direction:column;align-items:center;padding:40px 20px;text-align:center;gap:24px}
.c-hero{font-family:'Instrument Serif',serif;font-size:32px;line-height:1.2}
.c-hero em{font-style:italic;color:var(--ac2)}
.c-cards{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.c-card{background:var(--s2);border:1px solid var(--b2);border-radius:12px;padding:20px;width:170px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:all .2s}
.c-card:hover{border-color:var(--ac);transform:translateY(-2px)}
.c-card.on{border-color:#1e3a1e;background:#0f200f;cursor:default}
.c-ico{font-size:28px}
.c-name{font-size:13px;font-weight:600}
.c-email{font-size:10px;color:var(--t3);font-family:'DM Mono',monospace}
.c-status{font-size:10px;color:var(--gr);font-weight:600}

/* Loading */
.loading{display:flex;flex-direction:column;align-items:center;gap:12px;padding:32px;color:var(--t3)}
.spinner{width:24px;height:24px;border:2px solid var(--b2);border-top-color:var(--ac);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.pbar{width:200px;height:3px;background:var(--b2);border-radius:2px;overflow:hidden}
.pfill{height:100%;background:linear-gradient(90deg,var(--ac),var(--ac2));animation:prog 1.8s ease-in-out infinite}
@keyframes prog{0%{width:0%;margin-left:0}50%{width:60%}100%{width:0%;margin-left:100%}}

/* Tabs (mailbox segments) */
.tab-bar{display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--b1);padding-bottom:0}
.tab{padding:8px 14px;font-size:12px;font-weight:500;color:var(--t3);cursor:pointer;border-bottom:2px solid transparent;transition:all .12s;white-space:nowrap}
.tab:hover{color:var(--t2)}
.tab.active{color:var(--ac2);border-bottom-color:var(--ac)}
.tab .cnt{font-family:'DM Mono',monospace;font-size:10px;background:var(--s3);padding:1px 5px;border-radius:6px;margin-left:4px}

/* Email table */
.etable{display:flex;flex-direction:column;gap:2px;margin-bottom:14px}
.erow{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:9px;border:1px solid transparent;transition:all .12s;cursor:pointer}
.erow:hover{background:var(--s2);border-color:var(--b1)}
.erow.flagged{background:#1a1520;border-color:#3a2550}
.erow.sel{background:var(--s2);border-color:var(--b2)}
.erow input[type=checkbox]{width:14px;height:14px;accent-color:var(--ac);flex-shrink:0;margin-top:3px;cursor:pointer}
.erow-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;font-family:'DM Mono',monospace}
.erow-body{flex:1;min-width:0}
.erow-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px}
.erow-from{font-size:12px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
.erow-time{font-size:10px;color:var(--t3);font-family:'DM Mono',monospace;flex-shrink:0}
.erow-subj{font-size:12px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.erow-snip{font-size:11px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.flag-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:#2d1a40;color:#c084fc;font-family:'DM Mono',monospace;white-space:nowrap;flex-shrink:0}
.cat-badge{font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;font-family:'DM Mono',monospace;white-space:nowrap;flex-shrink:0}

/* Detail drawer */
.drawer{background:var(--s2);border:1px solid var(--b2);border-radius:10px;padding:18px;margin-top:10px}
.drawer-subj{font-family:'Instrument Serif',serif;font-size:16px;margin-bottom:8px}
.drawer-meta{font-size:11px;color:var(--t3);font-family:'DM Mono',monospace;margin-bottom:12px;display:flex;flex-direction:column;gap:3px}
.drawer-meta span{color:var(--t2)}
.drawer-body{font-size:12px;color:var(--t2);line-height:1.6;white-space:pre-wrap;word-break:break-word;margin-bottom:14px;max-height:200px;overflow-y:auto}
.drawer-actions{display:flex;gap:8px;flex-wrap:wrap}
.ai-box{background:#1a1730;border:1px solid #2d2550;border-radius:9px;padding:14px;margin-bottom:14px}
.ai-lbl{font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--ac2);text-transform:uppercase;margin-bottom:6px;font-family:'DM Mono',monospace}
.ai-txt{font-size:12px;color:var(--t2);line-height:1.5;white-space:pre-wrap}

/* Draft area */
.draft-area{margin-top:12px;background:var(--s3);border:1px solid var(--b2);border-radius:9px;padding:14px}
.draft-lbl{font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--ac2);text-transform:uppercase;margin-bottom:10px;font-family:'DM Mono',monospace;display:flex;align-items:center;justify-content:space-between}
.draft-tones{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.tone-btn{padding:3px 10px;border-radius:5px;font-size:10px;cursor:pointer;border:1px solid var(--b2);background:transparent;color:var(--t3);font-family:'Geist',sans-serif;transition:all .12s}
.tone-btn.active{border-color:var(--ac);background:#1a1730;color:var(--ac2)}
.dta{width:100%;min-height:120px;background:var(--s2);border:1px solid var(--b2);border-radius:7px;padding:10px 12px;font-size:12px;color:var(--t1);font-family:'Geist',sans-serif;resize:vertical;outline:none;line-height:1.5}
.dta:focus{border-color:var(--ac)}
.draft-btns{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}

/* Plan review */
.plan-box{background:#0f1a0f;border:1px solid #1e3a1e;border-radius:9px;padding:16px;margin-bottom:14px}
.plan-title{font-size:11px;font-weight:700;color:var(--gr);margin-bottom:10px;font-family:'DM Mono',monospace;letter-spacing:.05em}
.plan-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e2a1e;font-size:12px}
.plan-row:last-child{border-bottom:none}
.plan-action{color:var(--t3);font-size:10px;font-family:'DM Mono',monospace}

/* New folder modal */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:200}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:14px;padding:24px;width:380px;max-width:90vw}
.modal-title{font-family:'Instrument Serif',serif;font-size:18px;margin-bottom:6px}
.modal-sub{font-size:12px;color:var(--t3);margin-bottom:16px;line-height:1.5}
.modal-input{width:100%;background:var(--s2);border:1px solid var(--b2);border-radius:7px;padding:9px 12px;font-size:13px;color:var(--t1);font-family:'Geist',sans-serif;outline:none;margin-bottom:12px}
.modal-input:focus{border-color:var(--ac)}
.modal-btns{display:flex;gap:8px;justify-content:flex-end}
.folder-suggestion{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;cursor:pointer;border:1px solid var(--b2);background:var(--s2);margin-bottom:6px;transition:all .12s}
.folder-suggestion:hover{border-color:var(--ac);background:#1a1730}
.folder-suggestion-name{font-size:12px;font-weight:600}
.folder-suggestion-reason{font-size:10px;color:var(--t3)}

/* Bulk action bar */
.bulk-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--s3);border:1px solid var(--b2);border-radius:9px;margin-bottom:12px}
.bulk-count{font-size:12px;color:var(--t2);font-family:'DM Mono',monospace}

/* Summary stats */
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
.stat-chip{display:flex;align-items:center;gap:6px;padding:5px 10px;background:var(--s2);border:1px solid var(--b1);border-radius:20px;font-size:11px;cursor:pointer;transition:all .12s}
.stat-chip:hover{border-color:var(--b2)}
.stat-chip.active{border-color:var(--ac);background:#1a1730}
.stat-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.stat-num{font-family:'DM Mono',monospace;font-weight:600}

/* Toast */
.toast{position:fixed;bottom:20px;right:20px;background:var(--s3);border:1px solid var(--b2);border-radius:10px;padding:11px 15px;font-size:12px;color:var(--t1);z-index:300;animation:slideup .2s ease;max-width:300px}
@keyframes slideup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Accordion chevron */
.chev{font-size:12px;color:var(--t3);transition:transform .2s}
.chev.open{transform:rotate(180deg)}

/* Empty */
.empty-msg{text-align:center;padding:28px;color:var(--t3);font-size:12px}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function timeAgo(d) {
  const s = (Date.now() - new Date(d || Date.now())) / 1000;
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}
function avatarBg(s) {
  const c = ["linear-gradient(135deg,#7c6aff,#c084fc)", "linear-gradient(135deg,#06b6d4,#3b82f6)", "linear-gradient(135deg,#10b981,#06b6d4)", "linear-gradient(135deg,#f97316,#ef4444)", "linear-gradient(135deg,#ec4899,#8b5cf6)"];
  let h = 0;
  for (let i = 0; i < (s || "").length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xfffffff;
  return c[h % c.length];
}

async function gmailGet(token, path) {
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + path, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || "Gmail API error " + r.status);
  }
  return r.json();
}
async function gmailPost(token, path, body) {
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/" + path, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || "Gmail API error " + r.status);
  }
  return r.json();
}

async function callClaude(prompt, systemPrompt) {
  const messages = [{ role: "user", content: prompt }];
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (systemPrompt) body.system = systemPrompt;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

// ─── Memory / Learning System ─────────────────────────────────────────────────
const MEMORY_KEY = "inboxos_memory";

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : { rules: {}, decisions: [], folderMap: {} };
  } catch { return { rules: {}, decisions: [], folderMap: {} }; }
}

function saveMemory(mem) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch {}
}

function recordDecision(email, action, folder) {
  const mem = loadMemory();
  const domain = email.fromEmail.split("@")[1]?.toLowerCase() || "";
  const sender = email.fromEmail.toLowerCase();

  // Track per-sender and per-domain rules
  const key = sender || domain;
  if (!mem.rules[key]) mem.rules[key] = { trash: 0, keep: 0, move: {}, total: 0 };
  mem.rules[key].total++;

  if (action === "trash") {
    mem.rules[key].trash++;
  } else if (action === "keep") {
    mem.rules[key].keep++;
  } else if (action === "move" && folder) {
    mem.rules[key].move[folder] = (mem.rules[key].move[folder] || 0) + 1;
  }

  // Also track by domain
  if (domain && domain !== sender) {
    if (!mem.rules[domain]) mem.rules[domain] = { trash: 0, keep: 0, move: {}, total: 0 };
    mem.rules[domain].total++;
    if (action === "trash") mem.rules[domain].trash++;
    else if (action === "keep") mem.rules[domain].keep++;
    else if (action === "move" && folder) mem.rules[domain].move[folder] = (mem.rules[domain].move[folder] || 0) + 1;
  }

  // Keep last 200 decisions
  mem.decisions.unshift({ sender, domain, action, folder, subject: email.subject, ts: Date.now() });
  if (mem.decisions.length > 200) mem.decisions = mem.decisions.slice(0, 200);

  saveMemory(mem);
}

function getLearnedAction(email) {
  const mem = loadMemory();
  const sender = email.fromEmail.toLowerCase();
  const domain = email.fromEmail.split("@")[1]?.toLowerCase() || "";

  for (const key of [sender, domain]) {
    const rule = mem.rules[key];
    if (!rule || rule.total < 2) continue;
    const pTrash = rule.trash / rule.total;
    const pKeep = rule.keep / rule.total;
    const topFolder = Object.entries(rule.move || {}).sort((a, b) => b[1] - a[1])[0];
    if (pTrash >= 0.7) return { action: "trash", confidence: pTrash, source: key };
    if (pKeep >= 0.7) return { action: "keep", confidence: pKeep, source: key };
    if (topFolder && topFolder[1] / rule.total >= 0.7) return { action: "move", folder: topFolder[0], confidence: topFolder[1] / rule.total, source: key };
  }
  return null;
}

function getMemoryContext() {
  const mem = loadMemory();
  const rules = Object.entries(mem.rules)
    .filter(([, v]) => v.total >= 2)
    .map(([k, v]) => {
      const topAction = v.trash > v.keep ? "trash" : v.keep > v.trash ? "keep" : "move";
      const topFolder = Object.entries(v.move || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
      return `${k}: usually ${topAction}${topFolder ? " → " + topFolder : ""} (${v.total} times)`;
    }).slice(0, 30);
  return rules.length > 0 ? "\n\nPast behavior for reference:\n" + rules.join("\n") : "";
}



// ─── Main App ─────────────────────────────────────────────────────────────────
function MemoryBadge() {
  const mem = loadMemory();
  const ruleCount = Object.values(mem.rules).filter(r => r.total >= 2).length;
  if (ruleCount === 0) return null;
  return (
    <div style={{fontSize:10,color:"var(--gr)",fontFamily:"'DM Mono',monospace",background:"#0f200f",border:"1px solid #1e3a1e",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:5}}>
      <span>●</span> {ruleCount} learned rule{ruleCount !== 1 ? "s" : ""}
    </div>
  );
}

export default function App() {
  const [accounts, setAccounts] = useState(() => {
    const def = {
      gmail1: { on: false, token: null, email: null, label: "Gmail (Personal)" },
      gmail2: { on: false, token: null, email: null, label: "Gmail (Work)" },
    };
    try {
      ["gmail1", "gmail2"].forEach(k => {
        const s = sessionStorage.getItem("inboxos_" + k);
        if (s) { const p = JSON.parse(s); if (p.token) def[k] = p; }
      });
    } catch {}
    return def;
  });

  const [activeAcc, setActiveAcc] = useState(null);
  const [phase, setPhase] = useState(1); // 1=connect,2=cleanup,3=primary,4=reply
  const [openPhase, setOpenPhase] = useState(null);

  // Phase 2: promo/updates/social emails
  const [noiseEmails, setNoiseEmails] = useState({});  // { tab: [emails] }
  const [noiseTab, setNoiseTab] = useState("Promotions");
  const [flagged, setFlagged] = useState([]);  // email ids flagged to keep
  const [noiseLoading, setNoiseLoading] = useState(false);
  const [noiseAnalyzed, setNoiseAnalyzed] = useState(false);
  const [noisePlan, setNoisePlan] = useState(null);

  // Phase 3: primary emails
  const [primaryEmails, setPrimaryEmails] = useState([]);
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [primaryAnalyzed, setPrimaryAnalyzed] = useState(false);
  const [primaryPlan, setPrimaryPlan] = useState(null);  // [{ id, action, folder, reason }]
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);

  // Phase 4: drafts
  const [drafts, setDrafts] = useState({});  // { emailId: { text, tone, loading } }
  const [replyEmails, setReplyEmails] = useState([]);

  // Folder creation
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderSuggestions, setFolderSuggestions] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");

  const [toast, setToast] = useState(null);
  const [labels, setLabels] = useState({});

  function showToast(msg, dur = 3000) {
    setToast(msg);
    setTimeout(() => setToast(null), dur);
  }

  // ─── OAuth ───────────────────────────────────────────────────────────────────
  function connectGmail(key) {
    const params = new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      redirect_uri: window.location.origin,
      response_type: "token",
      scope: GMAIL_SCOPES,
      prompt: "select_account",
    });
    const popup = window.open("https://accounts.google.com/o/oauth2/v2/auth?" + params, "_blank", "width=500,height=600");
    const poll = setInterval(() => {
      try {
        if (popup && popup.closed) { clearInterval(poll); return; }
        const hash = popup?.location?.hash;
        if (hash && hash.includes("access_token")) {
          clearInterval(poll);
          const p = new URLSearchParams(hash.replace("#", ""));
          const token = p.get("access_token");
          popup.close();
          fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: "Bearer " + token } })
            .then(r => r.json())
            .then(info => {
              const updated = { on: true, token, email: info.email, label: key === "gmail1" ? "Gmail (Personal)" : "Gmail (Work)" };
              try { sessionStorage.setItem("inboxos_" + key, JSON.stringify(updated)); } catch {}
              setAccounts(prev => ({ ...prev, [key]: updated }));
              setPhase(2);
              setOpenPhase(2);
              showToast("✓ Connected " + info.email);
            });
        }
      } catch {}
    }, 500);
  }

  // ─── Load Labels ──────────────────────────────────────────────────────────────
  async function loadLabels(token) {
    try {
      const data = await gmailGet(token, "labels");
      const map = {};
      (data.labels || []).forEach(l => { map[l.name] = l.id; map[l.id] = l.name; });
      setLabels(map);
      return map;
    } catch { return {}; }
  }

  // ─── Phase 2: Load & Analyze Noise ───────────────────────────────────────────
  async function loadNoiseEmails() {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    if (!token) { showToast("Please connect an account first"); return; }
    setNoiseLoading(true);
    setNoiseAnalyzed(false);
    setFlagged([]);

    try {
      const tabs = {
        Promotions: "category:promotions",
        Updates: "category:updates",
        Social: "category:social",
      };
      const results = {};
      for (const [tab, query] of Object.entries(tabs)) {
        const q = encodeURIComponent("in:inbox " + query);
        const data = await gmailGet(token, `messages?maxResults=40&q=${q}`);
        const msgs = data.messages || [];
        if (msgs.length === 0) { results[tab] = []; continue; }
        const details = await Promise.all(
          msgs.slice(0, 40).map(m =>
            gmailGet(token, `messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
          )
        );
        results[tab] = details.map(msg => {
          const hdrs = msg.payload?.headers || [];
          const get = n => hdrs.find(h => h.name === n)?.value || "";
          const fromRaw = get("From");
          const fromName = fromRaw.includes("<") ? fromRaw.split("<")[0].trim().replace(/"/g, "") : fromRaw.split("@")[0];
          return { id: msg.id, threadId: msg.threadId, from: fromName, fromEmail: fromRaw, subject: get("Subject") || "(no subject)", snippet: msg.snippet || "", date: get("Date") || "" };
        });
      }
      setNoiseEmails(results);

      // AI: flag anything worth keeping
      setNoiseLoading(true);
      const allForAI = Object.values(results).flat().map(e => ({ id: e.id, from: e.from, fromEmail: e.fromEmail, subject: e.subject, snippet: e.snippet.slice(0, 100) }));
      if (allForAI.length > 0) {
        const raw = await callClaude(
          `Review these emails from Promotions/Updates/Social tabs. Flag any that seem worth keeping - NOT basic spam/promo.
Flag if: sent by a real person (not automated), references something the user signed up for personally, has a deadline or action item, is genuinely useful (not generic marketing).
DO NOT flag: mass marketing, newsletters, Facebook/social notifications, automated receipts, promotional offers.
Return ONLY JSON: { "flagged": ["id1", "id2"] }

Emails: ${JSON.stringify(allForAI)}`,
          "You are an email analyst. Return only valid JSON."
        );
        try {
          const clean = raw.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(clean);
          setFlagged(parsed.flagged || []);
        } catch { setFlagged([]); }
      }
      setNoiseAnalyzed(true);
    } catch (e) {
      showToast("⚠ Error loading emails: " + e.message);
    }
    setNoiseLoading(false);
  }

  async function executeNoisePlan() {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    if (!token) return;
    const allEmails = Object.values(noiseEmails).flat();
    const toDelete = allEmails.filter(e => !flagged.includes(e.id));
    const toReview = allEmails.filter(e => flagged.includes(e.id));

    showToast(`Processing ${allEmails.length} emails…`, 5000);

    // Move flagged to To Review (Claude)
    if (toReview.length > 0) {
      await Promise.all(toReview.map(e => {
        recordDecision(e, "keep", "To Review (Claude)");
        return gmailPost(token, `messages/${e.id}/modify`, { addLabelIds: ["Label_10"], removeLabelIds: ["INBOX"] });
      }));
    }
    // Trash the rest
    if (toDelete.length > 0) {
      await Promise.all(toDelete.map(e => {
        recordDecision(e, "trash", null);
        return gmailPost(token, `messages/${e.id}/modify`, { addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] });
      }));
    }

    setNoiseEmails({});
    setFlagged([]);
    setNoisePlan(null);
    setPhase(3);
    setOpenPhase(3);
    showToast(`✓ Done — ${toReview.length} moved to review, ${toDelete.length} deleted`);
  }

  // ─── Phase 3: Primary Triage ──────────────────────────────────────────────────
  async function loadPrimaryEmails() {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    if (!token) { showToast("Please connect an account first"); return; }
    setPrimaryLoading(true);
    setPrimaryAnalyzed(false);
    setPrimaryPlan(null);

    try {
      const lblMap = await loadLabels(token);
      const data = await gmailGet(token, "messages?maxResults=50&q=" + encodeURIComponent("in:inbox category:primary"));
      const msgs = data.messages || [];
      if (msgs.length === 0) { setPrimaryEmails([]); setPrimaryLoading(false); setPrimaryAnalyzed(true); return; }

      const details = await Promise.all(
        msgs.slice(0, 50).map(m =>
          gmailGet(token, `messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`)
        )
      );
      const emails = details.map(msg => {
        const hdrs = msg.payload?.headers || [];
        const get = n => hdrs.find(h => h.name === n)?.value || "";
        const fromRaw = get("From");
        const fromName = fromRaw.includes("<") ? fromRaw.split("<")[0].trim().replace(/"/g, "") : fromRaw.split("@")[0];
        return { id: msg.id, threadId: msg.threadId, from: fromName, fromEmail: fromRaw, to: get("To"), subject: get("Subject") || "(no subject)", snippet: msg.snippet || "", date: get("Date") || "", unread: (msg.labelIds || []).includes("UNREAD") };
      });
      setPrimaryEmails(emails);

      // AI triage
      const forAI = emails.map(e => ({ id: e.id, from: e.from, fromEmail: e.fromEmail, subject: e.subject, snippet: e.snippet.slice(0, 150) }));
      const memCtx = getMemoryContext();
      const raw = await callClaude(
        `Triage these Primary inbox emails. For each, decide the best action.
Available folders: Personal, Work, Receipts, "To Review (Claude)", Trash, Keep in Inbox.
Return ONLY JSON array: [{"id":"...","category":"urgent|reply|fyi|receipt|noise","action":"keep|move|trash","folder":"folder name or null","summary":"1 sentence","needsReply":true/false,"reason":"why","learnedRule":true/false}]

Rules:
- urgent: deadline, time-sensitive, critical
- reply: someone expects a response, personal message, question
- fyi: informational, no action needed
- receipt: transaction, booking, payment confirmation
- noise: irrelevant, can be trashed

If past behavior shows a clear pattern for a sender/domain, follow it and set learnedRule:true.${memCtx}

Emails: ${JSON.stringify(forAI)}`,
        "You are an expert email triage assistant. Return only valid JSON."
      );
      try {
        const clean = raw.replace(/```json|```/g, "").trim();
        const plan = JSON.parse(clean);
        setPrimaryPlan(plan);
        setReplyEmails(emails.filter(e => plan.find(p => p.id === e.id && p.needsReply)));
      } catch { setPrimaryPlan(null); }

      // AI folder suggestions
      suggestFolders(emails, lblMap);
      setPrimaryAnalyzed(true);
    } catch (e) {
      showToast("⚠ Error: " + e.message);
    }
    setPrimaryLoading(false);
  }

  async function suggestFolders(emails, lblMap) {
    const existingFolders = Object.keys(lblMap).filter(k => !k.startsWith("CATEGORY_") && !["INBOX","SENT","SPAM","TRASH","DRAFT","CHAT","UNREAD","STARRED","IMPORTANT","YELLOW_STAR"].includes(k));
    const emailSummary = emails.slice(0, 20).map(e => ({ from: e.fromEmail, subject: e.subject }));
    try {
      const raw = await callClaude(
        `Based on these inbox emails, suggest 1-3 new Gmail folders that would help organize them better.
Only suggest folders that DON'T already exist.
Existing folders: ${existingFolders.join(", ")}
Emails: ${JSON.stringify(emailSummary)}
Return ONLY JSON: [{"name":"folder name","reason":"why it would help","emailCount":3}]`,
        "You are an email organization expert. Return only valid JSON."
      );
      const clean = raw.replace(/```json|```/g, "").trim();
      const suggestions = JSON.parse(clean);
      setFolderSuggestions(suggestions || []);
    } catch { setFolderSuggestions([]); }
  }

  async function executePrimaryPlan(approvedIds) {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    if (!token || !primaryPlan) return;

    const approved = primaryPlan.filter(p => approvedIds.includes(p.id));
    showToast(`Executing plan for ${approved.length} emails…`, 5000);

    for (const item of approved) {
      try {
        const email = primaryEmails.find(e => e.id === item.id);
        if (item.action === "trash") {
          await gmailPost(token, `messages/${item.id}/modify`, { addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] });
          if (email) recordDecision(email, "trash", null);
        } else if (item.action === "move" && item.folder) {
          const labelId = LABEL_FOLDERS[item.folder] || labels[item.folder];
          if (labelId) {
            await gmailPost(token, `messages/${item.id}/modify`, { addLabelIds: [labelId], removeLabelIds: ["INBOX"] });
            if (email) recordDecision(email, "move", item.folder);
          }
        } else if (item.action === "keep") {
          if (email) recordDecision(email, "keep", null);
        }
      } catch {}
    }

    const doneIds = approved.map(p => p.id);
    setPrimaryEmails(prev => prev.filter(e => !doneIds.includes(e.id)));
    setPrimaryPlan(prev => prev ? prev.filter(p => !doneIds.includes(p.id)) : null);
    setCheckedIds([]);
    setSelectedEmail(null);
    showToast(`✓ Done — ${approved.length} emails organized`);

    if (replyEmails.length > 0) { setPhase(4); setOpenPhase(4); }
  }

  // ─── Phase 4: AI Draft ────────────────────────────────────────────────────────
  async function generateDraft(email, tone = "natural") {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    setDrafts(prev => ({ ...prev, [email.id]: { text: "", tone, loading: true } }));

    // Read full email for context
    let fullBody = email.snippet;
    try {
      const full = await gmailGet(token, `messages/${email.id}?format=full`);
      const parts = full.payload?.parts || [full.payload];
      for (const part of parts) {
        if (part?.mimeType === "text/plain" && part.body?.data) {
          fullBody = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          break;
        }
      }
    } catch {}

    const systemPrompt = `You are drafting an email reply on behalf of Jake Racich (surfman445@gmail.com / jakeracich1@gmail.com).
Write exactly as Jake would — adapt your tone to match the sender and context.
- If the email is casual/personal (family, friends, teammates): be warm and casual
- If it's professional: be clear and professional but not stiff  
- If it's a quick request: be brief and direct
- Match the energy and formality of the incoming email
Never include a subject line. Just the reply body.
Sign off as "Jake" for casual emails, "Jake Racich" for professional ones.`;

    const prompt = `Write a reply to this email.

From: ${email.from} <${email.fromEmail}>
Subject: ${email.subject}
Full message:
${fullBody}

Tone preference: ${tone}

Write a complete, natural reply that Jake would actually send. Be genuine, not generic.`;

    try {
      const text = await callClaude(prompt, systemPrompt);
      setDrafts(prev => ({ ...prev, [email.id]: { text, tone, loading: false } }));
    } catch {
      setDrafts(prev => ({ ...prev, [email.id]: { text: "Sorry, could not generate draft. Please try again.", tone, loading: false } }));
    }
  }

  async function saveDraftToGmail(email) {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    const draftData = drafts[email.id];
    if (!draftData?.text || !token) return;

    try {
      const raw = [
        `To: ${email.fromEmail}`,
        `Subject: Re: ${email.subject}`,
        `In-Reply-To: ${email.id}`,
        `References: ${email.id}`,
        "",
        draftData.text,
      ].join("\n");
      const encoded = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_");
      await gmailPost(token, "drafts", { message: { threadId: email.threadId, raw: encoded } });
      showToast("✓ Draft saved to Gmail");
      setReplyEmails(prev => prev.filter(e => e.id !== email.id));
    } catch {
      showToast("⚠ Could not save draft");
    }
  }

  // ─── Create Folder ────────────────────────────────────────────────────────────
  async function createFolder(name) {
    const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
    if (!token || !name.trim()) return;
    try {
      await gmailPost(token, "labels", { name: name.trim(), labelListVisibility: "labelShow", messageListVisibility: "show" });
      showToast("✓ Folder '" + name + "' created in Gmail");
      setShowFolderModal(false);
      setNewFolderName("");
      loadLabels(token);
    } catch {
      showToast("⚠ Could not create folder");
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────
  const anyConnected = Object.values(accounts).some(a => a.on);
  const noiseAll = Object.values(noiseEmails).flat();
  const noiseCounts = Object.fromEntries(Object.entries(noiseEmails).map(([k, v]) => [k, v.length]));

  function getCatColor(cat) {
    const m = { urgent: "#ef4444", reply: "#f97316", fyi: "#3b82f6", receipt: "#8b5cf6", noise: "#6b7280" };
    return m[cat] || "#6b7280";
  }
  function getCatBg(cat) {
    const m = { urgent: "#2d1010", reply: "#2d1a0a", fyi: "#0a1a2d", receipt: "#1a0a2d", noise: "#1a1a1a" };
    return m[cat] || "#1a1a1a";
  }

  const primaryByAction = primaryPlan ? {
    keep: primaryPlan.filter(p => p.action === "keep"),
    move: primaryPlan.filter(p => p.action === "move"),
    trash: primaryPlan.filter(p => p.action === "trash"),
  } : null;

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* Header */}
        <header className="hdr">
          <div className="brand">
            <div className="logo">✉</div>
            <div className="title">Inbox<em>OS</em></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="accts">
              {Object.entries(accounts).map(([k, a]) => (
                <button key={k} className={"abtn" + (a.on ? " on" : "")} onClick={() => !a.on && connectGmail(k)}>
                  <span className="dot" />
                  {a.on ? a.email?.split("@")[0] : a.label}
                </button>
              ))}
            </div>
            {anyConnected && (
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <MemoryBadge />
                <button className="btn btn-g btn-sm" onClick={() => setShowFolderModal(true)}>
                  + New Folder
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="main">
          {!anyConnected ? (
            <div className="connect-area">
              <div className="c-hero">Your inbox,<br /><em>finally under control.</em></div>
              <div style={{ fontSize: 13, color: "var(--t2)", maxWidth: 400, lineHeight: 1.6, textAlign: "center" }}>
                Connect your Gmail accounts to run AI-powered triage, bulk cleanup, and smart reply drafting.
              </div>
              <div className="c-cards">
                {Object.entries(accounts).map(([k, a]) => (
                  <div key={k} className={"c-card" + (a.on ? " on" : "")} onClick={() => !a.on && connectGmail(k)}>
                    <div className="c-ico">📨</div>
                    <div className="c-name">{a.label}</div>
                    {a.on ? (
                      <>
                        <div className="c-status">✓ Connected</div>
                        <div className="c-email">{a.email}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: "var(--t3)", textAlign: "center" }}>Click to connect</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="phases">

              {/* Phase 2: Cleanup */}
              <div className="phase">
                <div className={"phase-hdr" + (openPhase === 2 ? " active" : "")} onClick={() => setOpenPhase(openPhase === 2 ? null : 2)}>
                  <div className="phase-left">
                    <div className={"phase-num" + (phase > 2 ? " done" : "")}>{phase > 2 ? "✓" : "1"}</div>
                    <div>
                      <div className="phase-title">Promotions / Updates / Social Cleanup</div>
                      <div className="phase-sub">AI flags anything worth keeping — bulk delete the rest</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {noiseAll.length > 0 && <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>{noiseAll.length} emails</span>}
                    <span className={"chev" + (openPhase === 2 ? " open" : "")}>▾</span>
                  </div>
                </div>
                {openPhase === 2 && (
                  <div className="phase-body">
                    {noiseLoading ? (
                      <div className="loading">
                        <div className="spinner" />
                        <div style={{ fontSize: 12 }}>Loading and analyzing emails…</div>
                        <div className="pbar"><div className="pfill" /></div>
                      </div>
                    ) : !noiseAnalyzed ? (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-p" onClick={loadNoiseEmails}>
                          ⚡ Load & Analyze
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Tab bar */}
                        <div className="tab-bar">
                          {["Promotions", "Updates", "Social"].map(tab => (
                            <div key={tab} className={"tab" + (noiseTab === tab ? " active" : "")} onClick={() => setNoiseTab(tab)}>
                              {tab}
                              <span className="cnt">{noiseCounts[tab] || 0}</span>
                            </div>
                          ))}
                        </div>

                        {/* Flagged summary */}
                        {flagged.length > 0 && (
                          <div className="plan-box" style={{ marginBottom: 12 }}>
                            <div className="plan-title">✦ AI FLAGGED {flagged.length} EMAIL{flagged.length !== 1 ? "S" : ""} TO REVIEW</div>
                            {noiseAll.filter(e => flagged.includes(e.id)).map(e => (
                              <div key={e.id} className="plan-row">
                                <span>{e.from} — {e.subject}</span>
                                <span className="plan-action">→ To Review (Claude)</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Email list for current tab */}
                        <div className="etable">
                          {(noiseEmails[noiseTab] || []).map(e => (
                            <div key={e.id} className={"erow" + (flagged.includes(e.id) ? " flagged" : "")}>
                              <div className="erow-av" style={{ background: avatarBg(e.from) }}>{initials(e.from)}</div>
                              <div className="erow-body">
                                <div className="erow-top">
                                  <div className="erow-from">{e.from}</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    {flagged.includes(e.id) && <span className="flag-badge">KEEP</span>}
                                    <span className="erow-time">{timeAgo(e.date)}</span>
                                  </div>
                                </div>
                                <div className="erow-subj">{e.subject}</div>
                                <div className="erow-snip">{e.snippet}</div>
                              </div>
                              <button
                                className={"btn btn-sm " + (flagged.includes(e.id) ? "btn-d" : "btn-gr")}
                                onClick={() => setFlagged(prev => prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id])}
                              >
                                {flagged.includes(e.id) ? "✕ Unflag" : "+ Keep"}
                              </button>
                            </div>
                          ))}
                          {(noiseEmails[noiseTab] || []).length === 0 && (
                            <div className="empty-msg">No emails in {noiseTab}</div>
                          )}
                        </div>

                        {/* Action bar */}
                        <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--b1)" }}>
                          <div style={{ flex: 1, fontSize: 12, color: "var(--t3)" }}>
                            {flagged.length} kept for review · {noiseAll.length - flagged.length} will be deleted
                          </div>
                          <button className="btn btn-g" onClick={loadNoiseEmails}>↺ Re-analyze</button>
                          <button className="btn btn-d" onClick={executeNoisePlan}>
                            🗑 Execute — Delete {noiseAll.length - flagged.length} emails
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Phase 3: Primary */}
              <div className="phase">
                <div className={"phase-hdr" + (openPhase === 3 ? " active" : "")} onClick={() => setOpenPhase(openPhase === 3 ? null : 3)}>
                  <div className="phase-left">
                    <div className={"phase-num" + (phase > 3 ? " done" : "")}>{phase > 3 ? "✓" : "2"}</div>
                    <div>
                      <div className="phase-title">Primary Inbox Triage</div>
                      <div className="phase-sub">AI reads every email, categorizes, and suggests where it goes</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {primaryEmails.length > 0 && <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>{primaryEmails.length} emails</span>}
                    <span className={"chev" + (openPhase === 3 ? " open" : "")}>▾</span>
                  </div>
                </div>
                {openPhase === 3 && (
                  <div className="phase-body">
                    {primaryLoading ? (
                      <div className="loading">
                        <div className="spinner" />
                        <div style={{ fontSize: 12 }}>Loading and triaging primary inbox…</div>
                        <div className="pbar"><div className="pfill" /></div>
                      </div>
                    ) : !primaryAnalyzed ? (
                      <button className="btn btn-p" onClick={loadPrimaryEmails}>⚡ Load & Triage Primary</button>
                    ) : primaryEmails.length === 0 ? (
                      <div className="empty-msg">🎉 Primary inbox is clear!</div>
                    ) : (
                      <>
                        {/* AI Plan Summary */}
                        {primaryByAction && (
                          <div className="plan-box">
                            <div className="plan-title">✦ AI TRIAGE PLAN — {primaryEmails.length} EMAILS</div>
                            {primaryByAction.keep.length > 0 && <div className="plan-row"><span>Keep in inbox</span><span className="plan-action">{primaryByAction.keep.length} emails</span></div>}
                            {primaryByAction.move.length > 0 && <div className="plan-row"><span>Move to folders</span><span className="plan-action">{primaryByAction.move.length} emails</span></div>}
                            {primaryByAction.trash.length > 0 && <div className="plan-row"><span>Move to trash</span><span className="plan-action">{primaryByAction.trash.length} emails</span></div>}
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                              <button className="btn btn-p" onClick={() => {
                                const autoIds = primaryPlan.filter(p => p.action !== "keep").map(p => p.id);
                                executePrimaryPlan(autoIds);
                              }}>
                                ✓ Approve & Execute Plan
                              </button>
                              <button className="btn btn-g" onClick={loadPrimaryEmails}>↺ Re-analyze</button>
                            </div>
                          </div>
                        )}

                        {/* Email list */}
                        <div className="etable">
                          {primaryEmails.map(email => {
                            const plan = primaryPlan?.find(p => p.id === email.id);
                            const isSelected = selectedEmail?.id === email.id;
                            return (
                              <div key={email.id}>
                                <div
                                  className={"erow" + (isSelected ? " sel" : "")}
                                  onClick={() => setSelectedEmail(isSelected ? null : email)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checkedIds.includes(email.id)}
                                    onChange={e => {
                                      e.stopPropagation();
                                      setCheckedIds(prev => prev.includes(email.id) ? prev.filter(id => id !== email.id) : [...prev, email.id]);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  />
                                  <div className="erow-av" style={{ background: avatarBg(email.from) }}>{initials(email.from)}</div>
                                  <div className="erow-body">
                                    <div className="erow-top">
                                      <div className="erow-from">{email.from}</div>
                                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        {plan && (
                                          <span className="cat-badge" style={{ background: getCatBg(plan.category), color: getCatColor(plan.category) }}>
                                            {plan.category}
                                          </span>
                                        )}
                                        {plan?.learnedRule && <span className="flag-badge" style={{background:"#1a2d1a",color:"var(--gr)"}}>LEARNED</span>}
                                        {plan?.action === "move" && <span className="plan-action">→ {plan.folder}</span>}
                                        {plan?.action === "trash" && <span className="plan-action" style={{ color: "var(--re)" }}>→ Trash</span>}
                                        <span className="erow-time">{timeAgo(email.date)}</span>
                                      </div>
                                    </div>
                                    <div className="erow-subj">{email.subject}</div>
                                    {plan?.summary ? (
                                      <div className="erow-snip" style={{ color: "var(--ac2)" }}>AI: {plan.summary}</div>
                                    ) : (
                                      <div className="erow-snip">{email.snippet}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Expanded detail */}
                                {isSelected && (
                                  <div className="drawer">
                                    <div className="drawer-subj">{email.subject}</div>
                                    <div className="drawer-meta">
                                      <div>From <span>{email.from}</span> · {email.fromEmail}</div>
                                    </div>
                                    {plan && (
                                      <div className="ai-box">
                                        <div className="ai-lbl">✦ AI Analysis</div>
                                        <div className="ai-txt">{plan.summary}{plan.reason ? "\n\n" + plan.reason : ""}</div>
                                      </div>
                                    )}
                                    <div className="drawer-body">{email.snippet}</div>
                                    <div className="drawer-actions">
                                      {plan?.action === "move" && (
                                        <button className="btn btn-p btn-sm" onClick={() => executePrimaryPlan([email.id])}>
                                          ✓ Move to {plan.folder}
                                        </button>
                                      )}
                                      {plan?.action === "trash" && (
                                        <button className="btn btn-d btn-sm" onClick={() => executePrimaryPlan([email.id])}>
                                          🗑 Move to Trash
                                        </button>
                                      )}
                                      <button className="btn btn-g btn-sm" onClick={() => {
                                        executePrimaryPlan([email.id]);
                                        // Override to keep
                                      }}>
                                        Keep in Inbox
                                      </button>
                                      {plan?.needsReply && (
                                        <button className="btn btn-gr btn-sm" onClick={() => {
                                          setPhase(4);
                                          setOpenPhase(4);
                                          if (!replyEmails.find(e => e.id === email.id)) {
                                            setReplyEmails(prev => [...prev, email]);
                                          }
                                        }}>
                                          ✦ Draft Reply
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Bulk action bar */}
                        {checkedIds.length > 0 && (
                          <div className="bulk-bar">
                            <span className="bulk-count">{checkedIds.length} selected</span>
                            <button className="btn btn-p btn-sm" onClick={() => executePrimaryPlan(checkedIds)}>✓ Execute AI Plan</button>
                            <button className="btn btn-d btn-sm" onClick={async () => {
                              const token = accounts[activeAcc || "gmail1"]?.token || accounts.gmail1?.token || accounts.gmail2?.token;
                              await Promise.all(checkedIds.map(id => gmailPost(token, `messages/${id}/modify`, { addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] })));
                              setPrimaryEmails(prev => prev.filter(e => !checkedIds.includes(e.id)));
                              setCheckedIds([]);
                              showToast(`✓ Deleted ${checkedIds.length} emails`);
                            }}>🗑 Delete Selected</button>
                            <button className="btn btn-g btn-sm" onClick={() => setCheckedIds([])}>Clear</button>
                          </div>
                        )}

                        {/* Folder suggestions */}
                        {folderSuggestions.length > 0 && (
                          <div style={{ marginTop: 14, padding: 14, background: "var(--s2)", borderRadius: 9, border: "1px solid var(--b1)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "var(--ac2)", textTransform: "uppercase", fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>
                              ✦ AI FOLDER SUGGESTIONS
                            </div>
                            {folderSuggestions.map((s, i) => (
                              <div key={i} className="folder-suggestion" onClick={() => createFolder(s.name)}>
                                <span style={{ fontSize: 16 }}>📁</span>
                                <div>
                                  <div className="folder-suggestion-name">{s.name}</div>
                                  <div className="folder-suggestion-reason">{s.reason}</div>
                                </div>
                                <button className="btn btn-gr btn-sm" style={{ marginLeft: "auto" }}>+ Create</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Phase 4: Replies */}
              <div className="phase">
                <div className={"phase-hdr" + (openPhase === 4 ? " active" : "")} onClick={() => setOpenPhase(openPhase === 4 ? null : 4)}>
                  <div className="phase-left">
                    <div className="phase-num">3</div>
                    <div>
                      <div className="phase-title">Draft Replies</div>
                      <div className="phase-sub">AI writes replies with full context — just like Claude chat</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {replyEmails.length > 0 && <span style={{ fontSize: 11, color: "var(--or)", fontFamily: "'DM Mono',monospace" }}>{replyEmails.length} need reply</span>}
                    <span className={"chev" + (openPhase === 4 ? " open" : "")}>▾</span>
                  </div>
                </div>
                {openPhase === 4 && (
                  <div className="phase-body">
                    {replyEmails.length === 0 ? (
                      <div className="empty-msg">No emails flagged for reply yet. Run Primary Triage first, or click "Draft Reply" on any email.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {replyEmails.map(email => {
                          const d = drafts[email.id];
                          return (
                            <div key={email.id} style={{ background: "var(--s2)", border: "1px solid var(--b2)", borderRadius: 10, padding: 16 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{email.subject}</div>
                                  <div style={{ fontSize: 11, color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>From {email.from} · {email.fromEmail}</div>
                                </div>
                                {!d && (
                                  <button className="btn btn-p btn-sm" onClick={() => generateDraft(email)}>
                                    ✦ Generate Draft
                                  </button>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 12, fontStyle: "italic" }}>"{email.snippet}"</div>

                              {d?.loading ? (
                                <div className="loading" style={{ padding: 16 }}>
                                  <div className="spinner" />
                                  <div style={{ fontSize: 12 }}>Claude is drafting your reply…</div>
                                </div>
                              ) : d?.text ? (
                                <div className="draft-area">
                                  <div className="draft-lbl">
                                    <span>✦ AI Draft</span>
                                    <button className="btn btn-g btn-sm" onClick={() => generateDraft(email, d.tone)}>↺ Regenerate</button>
                                  </div>
                                  <div className="draft-tones">
                                    {["natural", "professional", "friendly", "brief", "assertive"].map(t => (
                                      <button
                                        key={t}
                                        className={"tone-btn" + ((d.tone || "natural") === t ? " active" : "")}
                                        onClick={() => generateDraft(email, t)}
                                      >
                                        {t}
                                      </button>
                                    ))}
                                  </div>
                                  <textarea
                                    className="dta"
                                    value={d.text}
                                    onChange={e => setDrafts(prev => ({ ...prev, [email.id]: { ...prev[email.id], text: e.target.value } }))}
                                  />
                                  <div className="draft-btns">
                                    <button className="btn btn-d btn-sm" onClick={() => setReplyEmails(prev => prev.filter(e => e.id !== email.id))}>
                                      Skip
                                    </button>
                                    <button className="btn btn-p btn-sm" onClick={() => saveDraftToGmail(email)}>
                                      Save to Gmail Drafts →
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* New Folder Modal */}
        {showFolderModal && (
          <div className="modal-bg" onClick={() => setShowFolderModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-title">Create New Folder</div>
              <div className="modal-sub">Add a new label/folder to your Gmail account. It will appear in your Gmail sidebar immediately.</div>
              {folderSuggestions.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "var(--ac2)", textTransform: "uppercase", fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>
                    AI SUGGESTIONS
                  </div>
                  {folderSuggestions.map((s, i) => (
                    <div key={i} className="folder-suggestion" onClick={() => setNewFolderName(s.name)}>
                      <span>📁</span>
                      <div>
                        <div className="folder-suggestion-name">{s.name}</div>
                        <div className="folder-suggestion-reason">{s.reason}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ height: 12 }} />
                </>
              )}
              <input
                className="modal-input"
                placeholder="Folder name…"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createFolder(newFolderName)}
                autoFocus
              />
              <div className="modal-btns">
                <button className="btn btn-g" onClick={() => setShowFolderModal(false)}>Cancel</button>
                <button className="btn btn-p" onClick={() => createFolder(newFolderName)} disabled={!newFolderName.trim()}>
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
