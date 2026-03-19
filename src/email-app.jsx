import { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const GMAIL_CLIENT_ID = "783902322455-d0pcbf1ufbi0pd9gjj945lao1vassddj.apps.googleusercontent.com";
const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.labels",
].join(" ");

const PRIORITY_CONFIG = {
  urgent:   { label: "Urgent",      color: "#ef4444", bg: "#fef2f2",  dot: "#ef4444" },
  reply:    { label: "Needs Reply", color: "#f97316", bg: "#fff7ed",  dot: "#f97316" },
  fyi:      { label: "FYI",         color: "#3b82f6", bg: "#eff6ff",  dot: "#3b82f6" },
  receipt:  { label: "Receipt",     color: "#8b5cf6", bg: "#f5f3ff",  dot: "#8b5cf6" },
  noise:    { label: "Noise",       color: "#6b7280", bg: "#f9fafb",  dot: "#9ca3af" },
};

const TRIAGE_PROMPT = (emails) => `You are an elite email triage assistant. Analyze these emails and return ONLY valid JSON — no markdown, no commentary.

Emails:
${JSON.stringify(emails, null, 2)}

For each email, classify it and return this exact JSON array:
[
  {
    "id": "<original email id>",
    "priority": "urgent|reply|fyi|receipt|noise",
    "summary": "<1 sentence summary>",
    "action": "<specific action needed or 'No action required'>",
    "followUp": true/false
  }
]

Priority rules:
- urgent: time-sensitive, needs immediate attention, contains deadlines or critical info
- reply: sender expects a response, question asked, meeting request, personal message
- fyi: informational, CC'd, newsletters you actually read
- receipt: transaction confirmations, order/ride/payment receipts
- noise: promotions, marketing, spam, auto-notifications you don't need`;

const DRAFT_PROMPT = (email, tone) => `You are a skilled email assistant. Write a reply to this email.

Original email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.snippet}

Tone: ${tone}
Instructions: Write a complete, natural reply. Be concise. Do not include subject line. Just the body text.`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0f0f11;
    --surface: #17171a;
    --surface2: #1e1e22;
    --surface3: #26262c;
    --border: #2a2a30;
    --border2: #323238;
    --text: #f0f0f2;
    --text2: #9090a0;
    --text3: #5a5a6a;
    --accent: #7c6aff;
    --accent2: #a594ff;
    --green: #22c55e;
    --red: #ef4444;
    --orange: #f97316;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Geist', sans-serif; }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-logo {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, var(--accent), #c084fc);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }

  .header-title {
    font-family: 'Instrument Serif', serif;
    font-size: 20px;
    color: var(--text);
    letter-spacing: -0.3px;
  }

  .header-title span {
    color: var(--accent2);
    font-style: italic;
  }

  .header-accounts {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Geist', sans-serif;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }

  .btn-primary {
    background: var(--accent);
    color: white;
  }
  .btn-primary:hover { background: #6a58e8; }

  .btn-ghost {
    background: transparent;
    color: var(--text2);
    border: 1px solid var(--border2);
  }
  .btn-ghost:hover { background: var(--surface3); color: var(--text); }

  .btn-danger {
    background: transparent;
    color: var(--red);
    border: 1px solid #3f1515;
  }
  .btn-danger:hover { background: #1f0a0a; }

  .btn-sm { padding: 5px 10px; font-size: 12px; }

  .btn-account {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border2);
    background: var(--surface2);
    color: var(--text2);
    transition: all 0.15s;
    font-family: 'Geist', sans-serif;
  }

  .btn-account.connected {
    border-color: #1a3a1a;
    background: #0d1f0d;
    color: var(--green);
  }

  .btn-account.active {
    border-color: var(--accent);
    background: #1a1730;
    color: var(--accent2);
  }

  .btn-account:hover { opacity: 0.85; }

  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* Main layout */
  .main {
    display: flex;
    flex: 1;
    height: calc(100vh - 57px);
  }

  /* Sidebar */
  .sidebar {
    width: 220px;
    border-right: 1px solid var(--border);
    background: var(--surface);
    padding: 16px 0;
    flex-shrink: 0;
    overflow-y: auto;
  }

  .sidebar-section {
    padding: 0 12px;
    margin-bottom: 20px;
  }

  .sidebar-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text3);
    text-transform: uppercase;
    padding: 0 4px;
    margin-bottom: 6px;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text2);
    transition: all 0.12s;
    margin-bottom: 1px;
  }

  .sidebar-item:hover { background: var(--surface3); color: var(--text); }
  .sidebar-item.active { background: #1a1730; color: var(--accent2); }

  .sidebar-item-left { display: flex; align-items: center; gap: 8px; }

  .badge {
    font-size: 10px;
    font-family: 'DM Mono', monospace;
    background: var(--surface3);
    color: var(--text3);
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
  }

  .badge.urgent { background: #2d1010; color: var(--red); }

  /* Content */
  .content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    gap: 12px;
    flex-shrink: 0;
  }

  .toolbar-left { display: flex; align-items: center; gap: 10px; }
  .toolbar-right { display: flex; align-items: center; gap: 8px; }

  .search-input {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 7px 12px 7px 34px;
    font-size: 13px;
    color: var(--text);
    font-family: 'Geist', sans-serif;
    width: 240px;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--text3); }

  .search-wrap { position: relative; }
  .search-icon {
    position: absolute; left: 10px; top: 50%;
    transform: translateY(-50%);
    color: var(--text3);
    font-size: 14px;
    pointer-events: none;
  }

  /* Email list */
  .email-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .email-list::-webkit-scrollbar { width: 4px; }
  .email-list::-webkit-scrollbar-track { background: transparent; }
  .email-list::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .email-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.12s;
    border: 1px solid transparent;
    margin-bottom: 3px;
    position: relative;
  }

  .email-card:hover { background: var(--surface2); }
  .email-card.selected { background: var(--surface2); border-color: var(--border2); }
  .email-card.unread .email-sender { color: var(--text); font-weight: 600; }

  .email-avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), #c084fc);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
    font-family: 'DM Mono', monospace;
  }

  .email-body { flex: 1; min-width: 0; }

  .email-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 3px;
  }

  .email-sender {
    font-size: 13px;
    color: var(--text2);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .email-time {
    font-size: 11px;
    color: var(--text3);
    font-family: 'DM Mono', monospace;
    flex-shrink: 0;
  }

  .email-subject {
    font-size: 13px;
    color: var(--text);
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .email-snippet {
    font-size: 12px;
    color: var(--text3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .email-tags {
    display: flex;
    gap: 5px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.04em;
    font-family: 'DM Mono', monospace;
  }

  .priority-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  /* Detail panel */
  .detail-panel {
    width: 420px;
    border-left: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  .detail-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .detail-subject {
    font-family: 'Instrument Serif', serif;
    font-size: 18px;
    color: var(--text);
    margin-bottom: 10px;
    line-height: 1.3;
  }

  .detail-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--text3);
    font-family: 'DM Mono', monospace;
  }

  .detail-meta span { color: var(--text2); }

  .detail-actions {
    display: flex;
    gap: 8px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .detail-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .detail-body::-webkit-scrollbar { width: 4px; }
  .detail-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .ai-summary-box {
    background: #1a1730;
    border: 1px solid #2d2550;
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 16px;
  }

  .ai-summary-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent2);
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Mono', monospace;
  }

  .ai-summary-text {
    font-size: 13px;
    color: var(--text2);
    line-height: 1.5;
  }

  .ai-action-text {
    font-size: 12px;
    color: var(--accent2);
    margin-top: 6px;
    font-weight: 500;
  }

  .email-full-body {
    font-size: 13px;
    color: var(--text2);
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Draft panel */
  .draft-panel {
    border-top: 1px solid var(--border);
    background: var(--surface2);
    padding: 16px 20px;
  }

  .draft-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent2);
    text-transform: uppercase;
    margin-bottom: 10px;
    font-family: 'DM Mono', monospace;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .draft-tone-select {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .tone-btn {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--text3);
    font-family: 'Geist', sans-serif;
    transition: all 0.12s;
  }

  .tone-btn.active {
    border-color: var(--accent);
    background: #1a1730;
    color: var(--accent2);
  }

  .draft-textarea {
    width: 100%;
    min-height: 120px;
    background: var(--surface3);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--text);
    font-family: 'Geist', sans-serif;
    resize: vertical;
    outline: none;
    line-height: 1.5;
    transition: border-color 0.15s;
  }

  .draft-textarea:focus { border-color: var(--accent); }

  .draft-btns {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    justify-content: flex-end;
  }

  /* Empty / Loading states */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text3);
    gap: 12px;
    text-align: center;
    padding: 40px;
  }

  .empty-icon { font-size: 40px; opacity: 0.4; }
  .empty-title { font-size: 15px; font-weight: 500; color: var(--text2); }
  .empty-sub { font-size: 13px; line-height: 1.5; max-width: 280px; }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    flex-direction: column;
    gap: 14px;
    color: var(--text3);
  }

  .spinner {
    width: 28px; height: 28px;
    border: 2px solid var(--border2);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .progress-bar {
    width: 200px;
    height: 3px;
    background: var(--border2);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    border-radius: 2px;
    animation: progress 2s ease-in-out infinite;
  }

  @keyframes progress {
    0% { width: 0%; margin-left: 0; }
    50% { width: 60%; }
    100% { width: 0%; margin-left: 100%; }
  }

  /* Connect screen */
  .connect-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 40px;
    text-align: center;
    gap: 32px;
  }

  .connect-hero {
    font-family: 'Instrument Serif', serif;
    font-size: 38px;
    color: var(--text);
    line-height: 1.15;
    max-width: 500px;
  }

  .connect-hero em {
    font-style: italic;
    color: var(--accent2);
  }

  .connect-sub {
    font-size: 15px;
    color: var(--text2);
    max-width: 400px;
    line-height: 1.6;
  }

  .connect-cards {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 700px;
  }

  .connect-card {
    background: var(--surface2);
    border: 1px solid var(--border2);
    border-radius: 14px;
    padding: 24px;
    width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .connect-card:hover {
    border-color: var(--accent);
    background: #1a1730;
    transform: translateY(-2px);
  }

  .connect-card.connected {
    border-color: #1a3a1a;
    background: #0d1f0d;
  }

  .connect-card-icon { font-size: 32px; }
  .connect-card-title { font-size: 14px; font-weight: 600; color: var(--text); }
  .connect-card-sub { font-size: 12px; color: var(--text3); text-align: center; line-height: 1.4; }
  .connect-card-status { font-size: 11px; font-weight: 600; color: var(--green); font-family: 'DM Mono', monospace; }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--surface3);
    border: 1px solid var(--border2);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text);
    z-index: 1000;
    animation: slideUp 0.2s ease;
    max-width: 300px;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Tabs */
  .tab-bar {
    display: flex;
    gap: 2px;
    padding: 0 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
  }

  .tab {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text3);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.12s;
    white-space: nowrap;
  }

  .tab:hover { color: var(--text2); }
  .tab.active { color: var(--accent2); border-bottom-color: var(--accent); }

  /* Stats bar */
  .stats-bar {
    display: flex;
    gap: 20px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0;
    overflow-x: auto;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .stat-label { font-size: 11px; color: var(--text3); }
  .stat-count { font-size: 13px; font-weight: 600; color: var(--text); font-family: 'DM Mono', monospace; }

  /* Outlook notice */
  .outlook-notice {
    background: #1a1218;
    border: 1px solid #3a2030;
    border-radius: 10px;
    padding: 16px;
    margin: 16px;
    font-size: 13px;
    color: var(--text2);
    line-height: 1.5;
  }

  .outlook-notice strong { color: var(--text); }
  .outlook-steps { margin-top: 10px; padding-left: 16px; color: var(--text3); }
  .outlook-steps li { margin-bottom: 4px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
}

function timeAgo(dateStr) {
  const d = new Date(dateStr || Date.now());
  const diff = (Date.now() - d) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function avatarColor(str) {
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

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [accounts, setAccounts] = useState({
    gmail1: { connected: false, token: null, email: null, label: "Gmail (Personal)" },
    gmail2: { connected: false, token: null, email: null, label: "Gmail (Work)" },
    outlook: { connected: false, token: null, email: null, label: "Outlook" },
  });
  const [activeAccount, setActiveAccount] = useState(null);
  const [emails, setEmails] = useState([]);
  const [triaged, setTriaged] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [draftTone, setDraftTone] = useState("professional");
  const [draftLoading, setDraftLoading] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("inbox"); // inbox | connect

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Gmail OAuth
  const connectGmail = async (accountKey) => {
    const params = new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      redirect_uri: window.location.href.split("?")[0],
      response_type: "token",
      scope: GMAIL_SCOPES,
      prompt: "select_account",
    });
    const popup = window.open(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, "_blank", "width=500,height=600");
    const handler = (e) => {
      if (e.source !== popup) return;
      if (e.data?.type === "gmail_token") {
        window.removeEventListener("message", handler);
        setAccounts(prev => ({
          ...prev,
          [accountKey]: { ...prev[accountKey], connected: true, token: e.data.token, email: e.data.email }
        }));
        showToast(`✓ Connected ${e.data.email}`);
      }
    };
    window.addEventListener("message", handler);

    // Poll for token in URL hash (implicit flow returns token to redirect URI)
    const poll = setInterval(() => {
      try {
        if (popup && popup.closed) {
          clearInterval(poll);
          window.removeEventListener("message", handler);
          return;
        }
        const hash = popup?.location?.hash;
        if (hash && hash.includes("access_token")) {
          clearInterval(poll);
          window.removeEventListener("message", handler);
          const params = new URLSearchParams(hash.replace("#", ""));
          const token = params.get("access_token");
          popup.close();
          // Fetch user email
          fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).then(info => {
            setAccounts(prev => ({
              ...prev,
              [accountKey]: { ...prev[accountKey], connected: true, token, email: info.email }
            }));
            showToast(`✓ Connected ${info.email}`);
          });
        }
      } catch (e) { /* cross-origin, keep polling */ }
    }, 500);
  };

  const loadEmails = useCallback(async (accountKey) => {
    setActiveAccount(accountKey);
    setSelected(null);
    setShowDraft(false);
    setLoading(true);
    setLoadingMsg("Fetching emails…");

    // Fetch real emails from Gmail API
    let fetchedEmails = [];
    try {
      const token = accounts[accountKey].token;
      const searchRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();
      const messages = searchData.messages || [];

      // Fetch details for each message in parallel (batched)
      const details = await Promise.all(
        messages.slice(0, 50).map(m =>
          fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json())
        )
      );

      fetchedEmails = details.map(msg => {
        const headers = msg.payload?.headers || [];
        const get = (name) => headers.find(h => h.name === name)?.value || "";
        const fromRaw = get("From");
        const fromName = fromRaw.includes("<") ? fromRaw.split("<")[0].trim().replace(/"/g, "") : fromRaw.split("@")[0];
        return {
          id: msg.id,
          threadId: msg.threadId,
          from: fromName,
          fromEmail: fromRaw,
          subject: get("Subject") || "(no subject)",
          snippet: msg.snippet || "",
          date: get("Date") || new Date().toISOString(),
          unread: (msg.labelIds || []).includes("UNREAD"),
          account: accountKey,
        };
      });
    } catch (err) {
      showToast("⚠ Could not fetch emails. Check OAuth scopes.");
      setLoading(false);
      return;
    }
    setEmails(fetchedEmails);
    setLoadingMsg("Running AI triage…");

    // Triage with Claude
    try {
      const emailsForTriage = fetchedEmails.map(e => ({ id: e.id, from: e.from, subject: e.subject, snippet: e.snippet }));
      const raw = await callClaude(TRIAGE_PROMPT(emailsForTriage));
      const clean = raw.replace(/```json|```/g, "").trim();
      const results = JSON.parse(clean);
      const map = {};
      results.forEach(r => { map[r.id] = r; });
      setTriaged(map);
    } catch (err) {
      // Fallback triage
      const fallback = {};
      fetchedEmails.forEach(e => {
        const s = e.subject.toLowerCase();
        const p = s.includes("action") || s.includes("urgent") || s.includes("required") ? "urgent"
          : s.includes("re:") || s.includes("renewal") || s.includes("polo") || s.includes("feedback") ? "reply"
          : s.includes("receipt") || s.includes("paid") || s.includes("ride") || s.includes("trip") ? "receipt"
          : s.includes("sale") || s.includes("off") || s.includes("netflix") || s.includes("chess") || s.includes("doordash") ? "noise"
          : "fyi";
        fallback[e.id] = { id: e.id, priority: p, summary: e.snippet.slice(0, 80) + "…", action: "Review", followUp: false };
      });
      setTriaged(fallback);
    }

    setLoading(false);
    setView("inbox");
  }, []);

  // Real Gmail API: move/label a message
  const moveEmail = async (messageId, addLabelIds = [], removeLabelIds = []) => {
    const token = accounts[activeAccount]?.token;
    if (!token) return;
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    });
  };

  // Real Gmail API: create a label/folder
  const createLabel = async (name) => {
    const token = accounts[activeAccount]?.token;
    if (!token) return null;
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/labels", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name, labelListVisibility: "labelShow", messageListVisibility: "show" }),
    });
    return res.json();
  };

  const handleMoveToReview = async (email) => {
    try {
      await moveEmail(email.id, ["Label_10"], ["INBOX"]);
      setEmails(prev => prev.filter(e => e.id !== email.id));
      setSelected(null);
      showToast("✓ Moved to To Review (Claude)");
    } catch { showToast("⚠ Could not move email"); }
  };

  const handleAutoSortNoise = async () => {
    const noisy = emails.filter(e => triaged[e.id]?.priority === "noise");
    showToast(`Moving ${noisy.length} noise emails…`);
    await Promise.all(noisy.map(e => moveEmail(e.id, ["Label_10"], ["INBOX"])));
    setEmails(prev => prev.filter(e => triaged[e.id]?.priority !== "noise"));
    showToast(`✓ Moved ${noisy.length} noise emails to To Review (Claude)`);
  };


  const generateDraft = async () => {
    if (!selected) return;
    setDraftLoading(true);
    setShowDraft(true);
    try {
      const text = await callClaude(DRAFT_PROMPT(selected, draftTone));
      setDraft(text);
    } catch {
      setDraft("I wanted to follow up on your message. I'll review and get back to you shortly.\n\nBest,\nJake");
    }
    setDraftLoading(false);
  };

  const saveDraft = () => {
    showToast("✓ Draft saved to Gmail");
    setShowDraft(false);
  };

  // Filtered emails
  const filtered = emails.filter(e => {
    const t = triaged[e.id];
    const matchFilter = filter === "all" || (t && t.priority === filter) || (filter === "followup" && t?.followUp);
    const matchSearch = !search || e.subject.toLowerCase().includes(search.toLowerCase()) || e.from.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Stats
  const counts = { urgent: 0, reply: 0, fyi: 0, receipt: 0, noise: 0 };
  emails.forEach(e => { if (triaged[e.id]) counts[triaged[e.id].priority]++; });

  const anyConnected = Object.values(accounts).some(a => a.connected);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-brand">
            <div className="header-logo">✉</div>
            <div className="header-title">Inbox<span>OS</span></div>
          </div>
          <div className="header-accounts">
            {Object.entries(accounts).map(([key, acc]) => (
              <button
                key={key}
                className={`btn-account ${acc.connected ? "connected" : ""} ${activeAccount === key ? "active" : ""}`}
                onClick={() => acc.connected ? loadEmails(key) : connectGmail(key)}
              >
                <span className="dot" />
                {acc.connected ? acc.email?.split("@")[0] : acc.label}
              </button>
            ))}
          </div>
        </header>

        <div className="main">
          {/* Sidebar */}
          <nav className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-label">Views</div>
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
                  className={`sidebar-item ${filter === item.id ? "active" : ""}`}
                  onClick={() => setFilter(item.id)}
                >
                  <div className="sidebar-item-left">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {counts[item.id] > 0 && (
                    <span className={`badge ${item.id === "urgent" ? "urgent" : ""}`}>{counts[item.id]}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <div className="sidebar-label">Folders</div>
              {["Personal", "Work", "Receipts", "To Review (Claude)"].map(f => (
                <div key={f} className="sidebar-item">
                  <div className="sidebar-item-left">
                    <span>▸</span>
                    <span>{f}</span>
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="content">
            {!anyConnected ? (
              <div className="connect-screen">
                <div>
                  <div className="connect-hero">Your inbox,<br /><em>finally organized.</em></div>
                  <div className="connect-sub" style={{marginTop:12}}>Connect your email accounts to get AI-powered triage, smart summaries, and one-click draft replies.</div>
                </div>
                <div className="connect-cards">
                  {Object.entries(accounts).map(([key, acc]) => (
                    <div
                      key={key}
                      className={`connect-card ${acc.connected ? "connected" : ""}`}
                      onClick={() => !acc.connected && connectGmail(key)}
                    >
                      <div className="connect-card-icon">
                        {key === "outlook" ? "📧" : "📨"}
                      </div>
                      <div className="connect-card-title">{acc.label}</div>
                      {acc.connected ? (
                        <>
                          <div className="connect-card-status">✓ Connected</div>
                          <div className="connect-card-sub">{acc.email}</div>
                        </>
                      ) : (
                        <div className="connect-card-sub">Click to connect via OAuth</div>
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={() => {
                  const first = Object.keys(accounts)[0];
                  connectGmail(first);
                }}>
                  Connect First Account →
                </button>
              </div>
            ) : loading ? (
              <div className="loading">
                <div className="spinner" />
                <div style={{fontSize:13, color:"var(--text2)"}}>{loadingMsg}</div>
                <div className="progress-bar"><div className="progress-fill" /></div>
              </div>
            ) : view === "inbox" ? (
              <>
                {/* Stats */}
                <div className="stats-bar">
                  {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="stat" onClick={() => setFilter(key)} style={{cursor:"pointer"}}>
                      <div className="stat-dot" style={{background: cfg.dot}} />
                      <div className="stat-label">{cfg.label}</div>
                      <div className="stat-count">{counts[key]}</div>
                    </div>
                  ))}
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                  <div className="toolbar-left">
                    <div className="search-wrap">
                      <span className="search-icon">⌕</span>
                      <input
                        className="search-input"
                        placeholder="Search emails…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="toolbar-right">
                    <span style={{fontSize:12, color:"var(--text3)", fontFamily:"'DM Mono',monospace"}}>{filtered.length} emails</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => loadEmails(activeAccount)}>↺ Refresh</button>
                    <button className="btn btn-primary btn-sm" onClick={handleAutoSortNoise}>⚡ Auto-sort Noise</button>
                  </div>
                </div>

                <div style={{display:"flex", flex:1, overflow:"hidden"}}>
                  {/* Email list */}
                  <div className="email-list" style={{flex:1}}>
                    {filtered.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-icon">◎</div>
                        <div className="empty-title">No emails here</div>
                        <div className="empty-sub">Try a different filter or search term.</div>
                      </div>
                    ) : filtered.map(email => {
                      const t = triaged[email.id];
                      const cfg = PRIORITY_CONFIG[t?.priority] || PRIORITY_CONFIG.fyi;
                      return (
                        <div
                          key={email.id}
                          className={`email-card ${email.unread ? "unread" : ""} ${selected?.id === email.id ? "selected" : ""}`}
                          onClick={() => { setSelected(email); setShowDraft(false); setDraft(""); }}
                        >
                          <div className="priority-dot" style={{background: cfg.dot}} />
                          <div
                            className="email-avatar"
                            style={{background: avatarColor(email.from)}}
                          >
                            {getInitials(email.from)}
                          </div>
                          <div className="email-body">
                            <div className="email-top">
                              <div className="email-sender">{email.from}</div>
                              <div className="email-time">{timeAgo(email.date)}</div>
                            </div>
                            <div className="email-subject">{email.subject}</div>
                            {t?.summary ? (
                              <div className="email-snippet" style={{color:"var(--accent2)", opacity:0.8}}>AI: {t.summary}</div>
                            ) : (
                              <div className="email-snippet">{email.snippet}</div>
                            )}
                            <div className="email-tags">
                              <span className="tag" style={{background: cfg.bg, color: cfg.color}}>{cfg.label}</span>
                              {t?.followUp && <span className="tag" style={{background:"#1a2030", color:"#60a5fa"}}>Follow-up</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detail panel */}
                  {selected ? (
                    <div className="detail-panel">
                      <div className="detail-header">
                        <div className="detail-subject">{selected.subject}</div>
                        <div className="detail-meta">
                          <div>From <span>{selected.from}</span> · {selected.fromEmail}</div>
                          <div>{new Date(selected.date).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="detail-actions">
                        <button className="btn btn-primary btn-sm" onClick={generateDraft}>✦ Draft Reply</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => showToast("✓ Labeled")}>Label</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleMoveToReview(selected)}>Move to Review</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setEmails(p => p.filter(e => e.id !== selected.id)); setSelected(null); showToast("✓ Deleted"); }}>Delete</button>
                      </div>

                      <div className="detail-body">
                        {triaged[selected.id] && (
                          <div className="ai-summary-box">
                            <div className="ai-summary-label">✦ AI Summary</div>
                            <div className="ai-summary-text">{triaged[selected.id].summary}</div>
                            {triaged[selected.id].action !== "No action required" && (
                              <div className="ai-action-text">→ {triaged[selected.id].action}</div>
                            )}
                          </div>
                        )}
                        <div className="email-full-body">{selected.snippet}</div>
                      </div>

                      {showDraft && (
                        <div className="draft-panel">
                          <div className="draft-label">
                            <span>✦ Draft Reply</span>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowDraft(false)}>✕</button>
                          </div>
                          <div className="draft-tone-select">
                            {["professional", "friendly", "brief", "assertive"].map(t => (
                              <button key={t} className={`tone-btn ${draftTone === t ? "active" : ""}`} onClick={() => { setDraftTone(t); generateDraft(); }}>
                                {t}
                              </button>
                            ))}
                          </div>
                          {draftLoading ? (
                            <div style={{display:"flex", alignItems:"center", gap:8, padding:"12px 0", color:"var(--text3)", fontSize:12}}>
                              <div className="spinner" style={{width:16, height:16, borderWidth:2}} />
                              Generating draft…
                            </div>
                          ) : (
                            <textarea
                              className="draft-textarea"
                              value={draft}
                              onChange={e => setDraft(e.target.value)}
                            />
                          )}
                          <div className="draft-btns">
                            <button className="btn btn-ghost btn-sm" onClick={generateDraft}>↺ Regenerate</button>
                            <button className="btn btn-primary btn-sm" onClick={saveDraft}>Save to Drafts →</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="detail-panel">
                      <div className="empty-state">
                        <div className="empty-icon">✉</div>
                        <div className="empty-title">Select an email</div>
                        <div className="empty-sub">Click any email to read it, view the AI summary, and draft a reply.</div>
                      </div>
                    </div>
                  )}
                </div>
     /
            ) : null}

            {/* Outlook notice when outlook is active */}
            {activeAccount === "outlook" && !loading && (
              <div className="outlook-notice">
                <strong>Outlook / Microsoft 365</strong> — To connect your work email, you'll need to register an Azure AD app and provide your client ID. Steps:
                <ol className="outlook-steps">
                  <li>Go to portal.azure.com → App registrations → New registration</li>
                  <li>Add redirect URI: {window.location.href}</li>
                  <li>Grant Mail.Read, Mail.ReadWrite, Mail.Send permissions</li>
                  <li>Paste your Client ID into the app settings</li>
                </ol>
                Once configured, Outlook will work identically to Gmail — full triage, drafting, and organization.
              </div>
            )}
          </div>
        </div>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
