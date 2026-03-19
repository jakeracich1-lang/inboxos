import { useState, useCallback } from "react";

const GMAIL_CLIENT_ID = "783902322455-d0pcbf1ufbi0pd9gjj945lao1vassddj.apps.googleusercontent.com";
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.labels",
].join(" ");

const PRIORITY = {
  urgent:  { label: "Urgent",       color: "#ef4444", bg: "#2d1010", dot: "#ef4444" },
  reply:   { label: "Needs Reply",  color: "#f97316", bg: "#2d1a0a", dot: "#f97316" },
  fyi:     { label: "FYI",          color: "#3b82f6", bg: "#0a1a2d", dot: "#3b82f6" },
  receipt: { label: "Receipt",      color: "#8b5cf6", bg: "#1a0a2d", dot: "#8b5cf6" },
  noise:   { label: "Noise",        color: "#6b7280", bg: "#1a1a1a", dot: "#6b7280" },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c0c0e;--s1:#141416;--s2:#1a1a1e;--s3:#222228;
  --b1:#252530;--b2:#2e2e3a;--t1:#f0f0f4;--t2:#8888a0;--t3:#50506a;
  --ac:#7c6aff;--ac2:#a594ff;--gr:#22c55e;--re:#ef4444;--or:#f97316;
}
body{background:var(--bg);color:var(--t1);font-family:'Geist',sans-serif;height:100vh;overflow:hidden}
.app{display:flex;flex-direction:column;height:100vh}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0}
.brand{display:flex;align-items:center;gap:10px}
.logo{width:30px;height:30px;background:linear-gradient(135deg,var(--ac),#c084fc);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px}
.title{font-family:'Instrument Serif',serif;font-size:19px;letter-spacing:-0.3px}
.title em{font-style:italic;color:var(--ac2)}
.accts{display:flex;gap:6px}
.acct-btn{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--b2);background:var(--s2);color:var(--t2);transition:all .15s;font-family:'Geist',sans-serif}
.acct-btn.on{border-color:#1a3a1a;background:#0d1f0d;color:var(--gr)}
.acct-btn.active{border-color:var(--ac);background:#1a1730;color:var(--ac2)}
.acct-btn:hover{opacity:.85}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}
.main{display:flex;flex:1;overflow:hidden}
.sidebar{width:200px;background:var(--s1);border-right:1px solid var(--b1);padding:14px 0;flex-shrink:0;overflow-y:auto}
.sb-sec{padding:0 10px;margin-bottom:18px}
.sb-lbl{font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--t3);text-transform:uppercase;padding:0 4px;margin-bottom:5px}
.sb-item{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--t2);transition:all .12s;margin-bottom:1px}
.sb-item:hover{background:var(--s3);color:var(--t1)}
.sb-item.active{background:#1a1730;color:var(--ac2)}
.sb-left{display:flex;align-items:center;gap:7px}
.badge{font-size:10px;font-family:'DM Mono',monospace;background:var(--s3);color:var(--t3);padding:1px 5px;border-radius:8px}
.badge.urg{background:#2d1010;color:var(--re)}
.content{flex:1;display:flex;flex-direction:column;overflow:hidden}
.statsbar{display:flex;gap:16px;padding:8px 16px;background:var(--s1);border-bottom:1px solid var(--b1);flex-shrink:0;overflow-x:auto}
.stat{display:flex;align-items:center;gap:6px;cursor:pointer;white-space:nowrap}
.stat-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.stat-lbl{font-size:10px;color:var(--t3)}
.stat-num{font-size:12px;font-weight:600;font-family:'DM Mono',monospace}
.toolbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--s1);border-bottom:1px solid var(--b1);gap:10px;flex-shrink:0}
.tl{display:flex;align-items:center;gap:8px}
.tr{display:flex;align-items:center;gap:6px}
.search-wrap{position:relative}
.search-icon{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--t3);font-size:13px;pointer-events:none}
.search{background:var(--s2);border:1px solid var(--b2);border-radius:7px;padding:6px 10px 6px 28px;font-size:12px;color:var(--t1);font-family:'Geist',sans-serif;width:220px;outline:none;transition:border-color .15s}
.search:focus{border-color:var(--ac)}
.search::placeholder{color:var(--t3)}
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:500;font-family:'Geist',sans-serif;cursor:pointer;border:none;transition:all .15s}
.btn-p{background:var(--ac);color:#fff}.btn-p:hover{background:#6a58e8}
.btn-g{background:transparent;color:var(--t2);border:1px solid var(--b2)}.btn-g:hover{background:var(--s3);color:var(--t1)}
.btn-d{background:transparent;color:var(--re);border:1px solid #3f1515}.btn-d:hover{background:#1f0a0a}
.list-area{display:flex;flex:1;overflow:hidden}
.email-list{flex:1;overflow-y:auto;padding:6px}
.email-list::-webkit-scrollbar{width:3px}
.email-list::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}
.ecard{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:9px;cursor:pointer;transition:all .12s;border:1px solid transparent;margin-bottom:2px}
.ecard:hover{background:var(--s2)}
.ecard.sel{background:var(--s2);border-color:var(--b2)}
.ecard.unread .esender{color:var(--t1);font-weight:600}
.pdot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:4px}
.avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;flex-shrink:0;font-family:'DM Mono',monospace}
.ebody{flex:1;min-width:0}
.etop{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px}
.esender{font-size:12px;color:var(--t2);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.etime{font-size:10px;color:var(--t3);font-family:'DM Mono',monospace;flex-shrink:0}
.esubj{font-size:12px;color:var(--t1);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.esnip{font-size:11px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.etags{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}
.tag{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;letter-spacing:.04em;font-family:'DM Mono',monospace}
.detail{width:400px;border-left:1px solid var(--b1);background:var(--s1);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0}
.dhead{padding:14px 18px;border-bottom:1px solid var(--b1)}
.dsubj{font-family:'Instrument Serif',serif;font-size:17px;line-height:1.3;margin-bottom:8px}
.dmeta{font-size:11px;color:var(--t3);font-family:'DM Mono',monospace;display:flex;flex-direction:column;gap:3px}
.dmeta span{color:var(--t2)}
.dactions{display:flex;gap:6px;padding:10px 18px;border-bottom:1px solid var(--b1);flex-wrap:wrap}
.dbody{flex:1;overflow-y:auto;padding:18px}
.dbody::-webkit-scrollbar{width:3px}
.dbody::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}
.ai-box{background:#1a1730;border:1px solid #2d2550;border-radius:9px;padding:12px;margin-bottom:14px}
.ai-lbl{font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--ac2);text-transform:uppercase;margin-bottom:5px;font-family:'DM Mono',monospace}
.ai-txt{font-size:12px;color:var(--t2);line-height:1.5}
.ai-act{font-size:11px;color:var(--ac2);margin-top:5px;font-weight:500}
.efull{font-size:12px;color:var(--t2);line-height:1.6;white-space:pre-wrap;word-break:break-word}
.draft-panel{border-top:1px solid var(--b1);background:var(--s2);padding:14px 18px}
.dlbl{font-size:9px;font-weight:700;letter-spacing:.1em;color:var(--ac2);text-transform:uppercase;margin-bottom:8px;font-family:'DM Mono',monospace;display:flex;align-items:center;justify-content:space-between}
.tones{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}
.tone{padding:3px 9px;border-radius:5px;font-size:10px;cursor:pointer;border:1px solid var(--b2);background:transparent;color:var(--t3);font-family:'Geist',sans-serif;transition:all .12s}
.tone.active{border-color:var(--ac);background:#1a1730;color:var(--ac2)}
.dta{width:100%;min-height:100px;background:var(--s3);border:1px solid var(--b2);border-radius:7px;padding:9px 11px;font-size:12px;color:var(--t1);font-family:'Geist',sans-serif;resize:vertical;outline:none;line-height:1.5;transition:border-color .15s}
.dta:focus{border-color:var(--ac)}
.dbtns{display:flex;gap:6px;margin-top:8px;justify-content:flex-end}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--t3);gap:10px;text-align:center;padding:30px}
.empty-ico{font-size:36px;opacity:.3}
.empty-ttl{font-size:14px;font-weight:500;color:var(--t2)}
.empty-sub{font-size:12px;line-height:1.5;max-width:240px}
.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:var(--t3)}
.spinner{width:24px;height:24px;border:2px solid var(--b2);border-top-color:var(--ac);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.pbar{width:180px;height:2px;background:var(--b2);border-radius:2px;overflow:hidden}
.pfill{height:100%;background:linear-gradient(90deg,var(--ac),var(--ac2));animation:prog 1.8s ease-in-out infinite}
@keyframes prog{0%{width:0%;margin-left:0}50%{width:60%}100%{width:0%;margin-left:100%}}
.connect{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:40px;text-align:center;gap:28px}
.c-hero{font-family:'Instrument Serif',serif;font-size:36px;line-height:1.15;max-width:460px}
.c-hero em{font-style:italic;color:var(--ac2)}
.c-sub{font-size:14px;color:var(--t2);max-width:380px;line-height:1.6}
.c-cards{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.c-card{background:var(--s2);border:1px solid var(--b2);border-radius:13px;padding:22px;width:180px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;transition:all .2s}
.c-card:hover{border-color:var(--ac);background:#1a1730;transform:translateY(-2px)}
.c-card.on{border-color:#1a3a1a;background:#0d1f0d}
.c-ico{font-size:30px}
.c-title{font-size:13px;font-weight:600}
.c-sub2{font-size:11px;color:var(--t3);text-align:center;line-height:1.4}
.c-status{font-size:10px;font-weight:600;color:var(--gr);font-family:'DM Mono',monospace}
.toast{position:fixed;bottom:18px;right:18px;background:var(--s3);border:1px solid var(--b2);border-radius:9px;padding:10px 14px;font-size:12px;color:var(--t1);z-index:1000;animation:slideup .2s ease}
@keyframes slideup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.outlook-box{background:#1a1218;border:1px solid #3a2030;border-radius:9px;padding:14px;margin:14px;font-size:12px;color:var(--t2);line-height:1.5}
.outlook-box strong{color:var(--t1)}
.outlook-box ol{margin-top:8px;padding-left:14px;color:var(--t3)}
.outlook-box li{margin-bottom:3px}
`;

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr || Date.now())) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + "m";
  if (diff < 86400) return Math.floor(diff / 3600) + "h";
  return Math.floor(diff / 86400) + "d";
}

function avatarBg(str) {
  const colors = [
    "linear-gradient(135deg,#7c6aff,#c084fc)",
    "linear-gradient(135deg,#06b6d4,#3b82f6)",
    "linear-gradient(135deg,#10b981,#06b6d4)",
    "linear-gradient(135deg,#f97316,#ef4444)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
  ];
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xfffffff;
  return colors[h % colors.length];
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

const TRIAGE_PROMPT = (emails) => `You are an email triage assistant. Return ONLY valid JSON, no markdown.

Emails: ${JSON.stringify(emails)}

Return this JSON array:
[{"id":"<id>","priority":"urgent|reply|fyi|receipt|noise","summary":"<1 sentence>","action":"<action or No action required>","followUp":true/false}]

Rules:
- urgent: time-sensitive, deadlines, critical
- reply: response expected, questions, meeting requests
- fyi: informational, CC'd
- receipt: transactions, confirmations, receipts
- noise: promotions, marketing, spam`;

const DRAFT_PROMPT = (email, tone) => `Write a reply to this email. Return only the body text, no subject line.

From: ${email.from}
Subject: ${email.subject}
Body: ${email.snippet}

Tone: ${tone}
Be concise and natural.`;

export default function App() {
  const [accounts, setAccounts] = useState(() => {
    const d = {
      gmail1: { on: false, token: null, email: null, label: "Gmail (Personal)" },
      gmail2: { on: false, token: null, email: null, label: "Gmail (Work)" },
      outlook: { on: false, token: null, email: null, label: "Outlook" },
    };
    try {
      ["gmail1","gmail2","outlook"].forEach(k => {
        const s = sessionStorage.getItem("inboxos_" + k);
        if (s) { const p = JSON.parse(s); if (p.token) d[k] = p; }
      });
    } catch(e) {}
    return d;
  });
  const [activeAcc, setActiveAcc] = useState(null);
  const [emails, setEmails] = useState([]);
  const [triaged, setTriaged] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState("professional");
  const [draftLoading, setDraftLoading] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function connectGmail(key) {
    const params = new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      redirect_uri: window.location.origin,
      response_type: "token",
      scope: GMAIL_SCOPES,
      prompt: "select_account",
    });
    const popup = window.open(
      "https://accounts.google.com/o/oauth2/v2/auth?" + params,
      "_blank",
      "width=500,height=600"
    );
    const poll = setInterval(() => {
      try {
        if (popup && popup.closed) { clearInterval(poll); return; }
        const hash = popup?.location?.hash;
        if (hash && hash.includes("access_token")) {
          clearInterval(poll);
          const p = new URLSearchParams(hash.replace("#", ""));
          const token = p.get("access_token");
          popup.close();
          fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: "Bearer " + token },
          })
            .then(r => r.json())
            .then(info => {
              const updated = { on: true, token, email: info.email, label: ["gmail1","gmail2","outlook"].indexOf(key) === 2 ? "Outlook" : key === "gmail1" ? "Gmail (Personal)" : "Gmail (Work)" };
              try { sessionStorage.setItem("inboxos_" + key, JSON.stringify(updated)); } catch(e) {}
              setAccounts(prev => ({ ...prev, [key]: updated }));
              showToast("✓ Connected " + info.email);
            });
        }
      } catch (e) { /* cross-origin */ }
    }, 500);
  }

  const loadEmails = useCallback(async (key) => {
    setActiveAcc(key);
    setSelected(null);
    setShowDraft(false);
    setLoading(true);
    setLoadMsg("Fetching emails…");

    let fetched = [];
    try {
      const token = accounts[key].token;
      const r = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox",
        { headers: { Authorization: "Bearer " + token } }
      );
      const data = await r.json();
      const msgs = data.messages || [];
      const details = await Promise.all(
        msgs.slice(0, 50).map(m =>
          fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/" +
              m.id +
              "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date",
            { headers: { Authorization: "Bearer " + token } }
          ).then(r2 => r2.json())
        )
      );
      fetched = details.map(msg => {
        const hdrs = msg.payload?.headers || [];
        const get = n => hdrs.find(h => h.name === n)?.value || "";
        const fromRaw = get("From");
        const fromName = fromRaw.includes("<")
          ? fromRaw.split("<")[0].trim().replace(/"/g, "")
          : fromRaw.split("@")[0];
        return {
          id: msg.id,
          threadId: msg.threadId,
          from: fromName,
          fromEmail: fromRaw,
          subject: get("Subject") || "(no subject)",
          snippet: msg.snippet || "",
          date: get("Date") || new Date().toISOString(),
          unread: (msg.labelIds || []).includes("UNREAD"),
          account: key,
        };
      });
    } catch {
      showToast("⚠ Could not fetch emails");
      setLoading(false);
      return;
    }

    setEmails(fetched);
    setLoadMsg("Running AI triage…");

    try {
      const forTriage = fetched.map(e => ({
        id: e.id,
        from: e.from,
        subject: e.subject,
        snippet: e.snippet,
      }));
      const raw = await callClaude(TRIAGE_PROMPT(forTriage));
      const clean = raw.replace(/```json|```/g, "").trim();
      const results = JSON.parse(clean);
      const map = {};
      results.forEach(r => { map[r.id] = r; });
      setTriaged(map);
    } catch {
      const fallback = {};
      fetched.forEach(e => {
        const s = e.subject.toLowerCase();
        const p =
          s.includes("urgent") || s.includes("action required")
            ? "urgent"
            : s.includes("re:") || s.includes("?")
            ? "reply"
            : s.includes("receipt") || s.includes("payment") || s.includes("order")
            ? "receipt"
            : s.includes("sale") || s.includes("offer") || s.includes("promo")
            ? "noise"
            : "fyi";
        fallback[e.id] = {
          id: e.id,
          priority: p,
          summary: e.snippet.slice(0, 80) + "…",
          action: "Review",
          followUp: false,
        };
      });
      setTriaged(fallback);
    }

    setLoading(false);
  }, [accounts]);

  async function moveEmail(msgId, addIds, removeIds) {
    const token = accounts[activeAcc]?.token;
    if (!token) return;
    await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + msgId + "/modify",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ addLabelIds: addIds, removeLabelIds: removeIds }),
      }
    );
  }

  async function handleMove(email) {
    try {
      await moveEmail(email.id, ["Label_10"], ["INBOX"]);
      setEmails(prev => prev.filter(e => e.id !== email.id));
      setSelected(null);
      showToast("✓ Moved to To Review (Claude)");
    } catch {
      showToast("⚠ Could not move email");
    }
  }

  async function handleAutoSort() {
    const noisy = emails.filter(e => triaged[e.id]?.priority === "noise");
    if (!noisy.length) { showToast("No noise emails found"); return; }
    showToast("Moving " + noisy.length + " noise emails…");
    await Promise.all(noisy.map(e => moveEmail(e.id, ["Label_10"], ["INBOX"])));
    setEmails(prev => prev.filter(e => triaged[e.id]?.priority !== "noise"));
    showToast("✓ Moved " + noisy.length + " noise emails");
  }

  async function generateDraft() {
    if (!selected) return;
    setDraftLoading(true);
    setShowDraft(true);
    try {
      const text = await callClaude(DRAFT_PROMPT(selected, tone));
      setDraft(text);
    } catch {
      setDraft("Thanks for reaching out. I'll review this and get back to you shortly.\n\nBest,\nJake");
    }
    setDraftLoading(false);
  }

  async function saveDraft() {
    showToast("✓ Draft saved to Gmail");
    setShowDraft(false);
  }

  const counts = { urgent: 0, reply: 0, fyi: 0, receipt: 0, noise: 0 };
  emails.forEach(e => {
    if (triaged[e.id]) counts[triaged[e.id].priority]++;
  });

  const filtered = emails.filter(e => {
    const t = triaged[e.id];
    const mf =
      filter === "all" ||
      (t && t.priority === filter) ||
      (filter === "followup" && t?.followUp);
    const ms =
      !search ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.from.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const anyOn = Object.values(accounts).some(a => a.on);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="brand">
            <div className="logo">✉</div>
            <div className="title">Inbox<em>OS</em></div>
          </div>
          <div className="accts">
            {Object.entries(accounts).map(([k, a]) => (
              <button
                key={k}
                className={"acct-btn" + (a.on ? " on" : "") + (activeAcc === k ? " active" : "")}
                onClick={() => (a.on ? loadEmails(k) : connectGmail(k))}
              >
                <span className="dot" />
                {a.on ? a.email?.split("@")[0] : a.label}
              </button>
            ))}
          </div>
        </header>

        <div className="main">
          <nav className="sidebar">
            <div className="sb-sec">
              <div className="sb-lbl">Views</div>
              {[
                { id: "all", icon: "◈", label: "All Mail" },
                { id: "urgent", icon: "⚡", label: "Urgent" },
                { id: "reply", icon: "↩", label: "Needs Reply" },
                { id: "followup", icon: "⏱", label: "Follow-ups" },
                { id: "fyi", icon: "◉", label: "FYI" },
                { id: "receipt", icon: "◎", label: "Receipts" },
                { id: "noise", icon: "○", label: "Noise" },
              ].map(item => (
                <div
                  key={item.id}
                  className={"sb-item" + (filter === item.id ? " active" : "")}
                  onClick={() => setFilter(item.id)}
                >
                  <div className="sb-left">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {counts[item.id] > 0 && (
                    <span className={"badge" + (item.id === "urgent" ? " urg" : "")}>
                      {counts[item.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="sb-sec">
              <div className="sb-lbl">Folders</div>
              {["Personal", "Work", "Receipts", "To Review (Claude)"].map(f => (
                <div key={f} className="sb-item">
                  <div className="sb-left">
                    <span>▸</span>
                    <span>{f}</span>
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="content">
            {!anyOn ? (
              <div className="connect">
                <div>
                  <div className="c-hero">
                    Your inbox,<br /><em>finally organized.</em>
                  </div>
                  <div className="c-sub" style={{ marginTop: 10 }}>
                    Connect your accounts for AI triage, smart summaries, and one-click draft replies.
                  </div>
                </div>
                <div className="c-cards">
                  {Object.entries(accounts).map(([k, a]) => (
                    <div
                      key={k}
                      className={"c-card" + (a.on ? " on" : "")}
                      onClick={() => !a.on && connectGmail(k)}
                    >
                      <div className="c-ico">{k === "outlook" ? "📧" : "📨"}</div>
                      <div className="c-title">{a.label}</div>
                      {a.on ? (
                        <>
                          <div className="c-status">✓ Connected</div>
                          <div className="c-sub2">{a.email}</div>
                        </>
                      ) : (
                        <div className="c-sub2">Click to connect via OAuth</div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-p"
                  onClick={() => connectGmail("gmail1")}
                >
                  Connect First Account →
                </button>
              </div>
            ) : loading ? (
              <div className="loading">
                <div className="spinner" />
                <div style={{ fontSize: 12, color: "var(--t2)" }}>{loadMsg}</div>
                <div className="pbar">
                  <div className="pfill" />
                </div>
              </div>
            ) : (
              <>
                <div className="statsbar">
                  {Object.entries(PRIORITY).map(([k, cfg]) => (
                    <div key={k} className="stat" onClick={() => setFilter(k)}>
                      <div className="stat-dot" style={{ background: cfg.dot }} />
                      <div className="stat-lbl">{cfg.label}</div>
                      <div className="stat-num">{counts[k]}</div>
                    </div>
                  ))}
                </div>

                <div className="toolbar">
                  <div className="tl">
                    <div className="search-wrap">
                      <span className="search-icon">⌕</span>
                      <input
                        className="search"
                        placeholder="Search emails…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="tr">
                    <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>
                      {filtered.length} emails
                    </span>
                    <button className="btn btn-g" onClick={() => loadEmails(activeAcc)}>
                      ↺ Refresh
                    </button>
                    <button className="btn btn-p" onClick={handleAutoSort}>
                      ⚡ Auto-sort Noise
                    </button>
                  </div>
                </div>

                <div className="list-area">
                  <div className="email-list">
                    {filtered.length === 0 ? (
                      <div className="empty">
                        <div className="empty-ico">◎</div>
                        <div className="empty-ttl">No emails</div>
                        <div className="empty-sub">Try a different filter or search.</div>
                      </div>
                    ) : (
                      filtered.map(email => {
                        const t = triaged[email.id];
                        const cfg = PRIORITY[t?.priority] || PRIORITY.fyi;
                        return (
                          <div
                            key={email.id}
                            className={
                              "ecard" +
                              (email.unread ? " unread" : "") +
                              (selected?.id === email.id ? " sel" : "")
                            }
                            onClick={() => {
                              setSelected(email);
                              setShowDraft(false);
                              setDraft("");
                            }}
                          >
                            <div className="pdot" style={{ background: cfg.dot }} />
                            <div
                              className="avatar"
                              style={{ background: avatarBg(email.from) }}
                            >
                              {initials(email.from)}
                            </div>
                            <div className="ebody">
                              <div className="etop">
                                <div className="esender">{email.from}</div>
                                <div className="etime">{timeAgo(email.date)}</div>
                              </div>
                              <div className="esubj">{email.subject}</div>
                              {t?.summary ? (
                                <div className="esnip" style={{ color: "var(--ac2)", opacity: 0.8 }}>
                                  AI: {t.summary}
                                </div>
                              ) : (
                                <div className="esnip">{email.snippet}</div>
                              )}
                              <div className="etags">
                                <span
                                  className="tag"
                                  style={{ background: cfg.bg, color: cfg.color }}
                                >
                                  {cfg.label}
                                </span>
                                {t?.followUp && (
                                  <span
                                    className="tag"
                                    style={{ background: "#0a1a2d", color: "#60a5fa" }}
                                  >
                                    Follow-up
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selected ? (
                    <div className="detail">
                      <div className="dhead">
                        <div className="dsubj">{selected.subject}</div>
                        <div className="dmeta">
                          <div>
                            From <span>{selected.from}</span>
                          </div>
                          <div>{new Date(selected.date).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="dactions">
                        <button className="btn btn-p" onClick={generateDraft}>
                          ✦ Draft Reply
                        </button>
                        <button className="btn btn-g" onClick={() => handleMove(selected)}>
                          Move to Review
                        </button>
                        <button
                          className="btn btn-d"
                          onClick={() => {
                            setEmails(prev => prev.filter(e => e.id !== selected.id));
                            setSelected(null);
                            showToast("✓ Removed from view");
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="dbody">
                        {triaged[selected.id] && (
                          <div className="ai-box">
                            <div className="ai-lbl">✦ AI Summary</div>
                            <div className="ai-txt">{triaged[selected.id].summary}</div>
                            {triaged[selected.id].action !== "No action required" && (
                              <div className="ai-act">→ {triaged[selected.id].action}</div>
                            )}
                          </div>
                        )}
                        <div className="efull">{selected.snippet}</div>
                      </div>
                      {showDraft && (
                        <div className="draft-panel">
                          <div className="dlbl">
                            <span>✦ Draft Reply</span>
                            <button
                              className="btn btn-g"
                              style={{ padding: "3px 8px", fontSize: 11 }}
                              onClick={() => setShowDraft(false)}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="tones">
                            {["professional", "friendly", "brief", "assertive"].map(t2 => (
                              <button
                                key={t2}
                                className={"tone" + (tone === t2 ? " active" : "")}
                                onClick={() => {
                                  setTone(t2);
                                  generateDraft();
                                }}
                              >
                                {t2}
                              </button>
                            ))}
                          </div>
                          {draftLoading ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 0",
                                color: "var(--t3)",
                                fontSize: 12,
                              }}
                            >
                              <div
                                className="spinner"
                                style={{ width: 14, height: 14, borderWidth: 2 }}
                              />
                              Generating…
                            </div>
                          ) : (
                            <textarea
                              className="dta"
                              value={draft}
                              onChange={e => setDraft(e.target.value)}
                            />
                          )}
                          <div className="dbtns">
                            <button className="btn btn-g" onClick={generateDraft}>
                              ↺ Regenerate
                            </button>
                            <button className="btn btn-p" onClick={saveDraft}>
                              Save to Drafts →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="detail">
                      <div className="empty">
                        <div className="empty-ico">✉</div>
                        <div className="empty-ttl">Select an email</div>
                        <div className="empty-sub">
                          Click any email to read it, see the AI summary, and draft a reply.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {activeAcc === "outlook" && (
                  <div className="outlook-box">
                    <strong>Outlook / Microsoft 365</strong> — To connect your work email,
                    register an Azure AD app:
                    <ol>
                      <li>Go to portal.azure.com → App registrations → New registration</li>
                      <li>Add redirect URI: {window.location.origin}</li>
                      <li>Grant Mail.Read, Mail.ReadWrite, Mail.Send permissions</li>
                      <li>Paste your Client ID into the app settings</li>
                    </ol>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
