
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// DATA — edit prompts here; no other file needed
// ─────────────────────────────────────────────
const PROMPTS = [
  {
    id: 1,
    title: "Executive Meeting Summary",
    department: "Leadership",
    tags: ["meetings", "summary", "executive"],
    description: "Summarise a meeting transcript into clear action items and decisions for senior stakeholders.",
    prompt: `You are an executive assistant. Given the meeting transcript below, produce:
1. A 3-sentence executive summary
2. A bulleted list of decisions made
3. A table of action items (Owner | Task | Due Date)
4. Any open risks or blockers

Transcript:
[PASTE TRANSCRIPT HERE]`,
  },
  {
    id: 2,
    title: "Weekly Status Report",
    department: "Project Management",
    tags: ["reporting", "status", "weekly"],
    description: "Turn rough bullet notes into a polished weekly status report for your project.",
    prompt: `Act as a senior project manager. Convert the notes below into a structured weekly status report with these sections:
- Overall RAG status (Red / Amber / Green) with a one-line justification
- Accomplishments this week
- Planned work for next week
- Risks & issues (with mitigation)
- Decisions needed from leadership

Notes:
[PASTE NOTES HERE]`,
  },
  {
    id: 3,
    title: "Job Description Writer",
    department: "HR",
    tags: ["hiring", "JD", "recruitment"],
    description: "Generate an inclusive, compelling job description from a short role brief.",
    prompt: `You are an expert HR copywriter focused on inclusive hiring. Using the role brief below, write a job description that includes:
- Engaging role summary (2–3 sentences)
- Key responsibilities (6–8 bullets)
- Must-have requirements (keep it short — 4–5 max)
- Nice-to-have skills (2–3 bullets)
- A short "Why join us?" paragraph

Avoid gendered language. Use plain English. Keep total length under 400 words.

Role brief:
[PASTE BRIEF HERE]`,
  },
  {
    id: 4,
    title: "Customer Email Response",
    department: "Customer Success",
    tags: ["email", "customer", "support"],
    description: "Draft a professional, empathetic reply to a customer complaint or enquiry.",
    prompt: `You are a customer success specialist. Draft a reply to the customer email below.
Tone: warm, professional, solution-focused.
Structure:
1. Acknowledge the issue with empathy (1–2 sentences)
2. Explain what happened (if known) — be honest, not defensive
3. State the resolution or next steps clearly
4. Close with a confidence-building sentence and sign-off

Customer email:
[PASTE EMAIL HERE]`,
  },
  {
    id: 5,
    title: "Competitive Analysis Brief",
    department: "Strategy",
    tags: ["research", "competitive", "analysis"],
    description: "Structure raw competitive intelligence into a concise strategic brief.",
    prompt: `Act as a strategy consultant. Using the competitive data provided, produce a concise brief:
1. Market landscape snapshot (3–4 sentences)
2. Competitor comparison table: Company | Strengths | Weaknesses | Key differentiator
3. Identified gaps or opportunities for us
4. Recommended strategic moves (top 3, prioritised)
5. Risks to our position

Data:
[PASTE DATA HERE]`,
  },
  {
    id: 6,
    title: "Code Review Feedback",
    department: "Engineering",
    tags: ["code", "review", "engineering"],
    description: "Generate structured, constructive code review comments for a pull request.",
    prompt: `You are a senior software engineer conducting a code review. Review the code below and provide:
- Overall assessment (1–2 sentences)
- Critical issues (must fix before merge)
- Suggestions (nice-to-have improvements)
- Positive observations (what was done well)
- A recommended approval decision: Approve / Request Changes / Comment

Be specific, reference line numbers where possible, and keep feedback constructive.

Code:
[PASTE CODE HERE]`,
  },
  {
    id: 7,
    title: "Marketing Copy — Short Form",
    department: "Marketing",
    tags: ["copy", "marketing", "social"],
    description: "Write punchy short-form marketing copy for social posts, ads, or banners.",
    prompt: `You are a senior copywriter. Write 3 variations of short-form marketing copy for the brief below.
For each variation provide:
- Headline (max 8 words)
- Body copy (max 30 words)
- CTA (max 5 words)

Tone: [e.g. bold / friendly / professional — edit as needed]
Audience: [describe target audience]
Product/feature: [describe what you're promoting]

Brief:
[PASTE BRIEF HERE]`,
  },
  {
    id: 8,
    title: "Onboarding Welcome Message",
    department: "HR",
    tags: ["onboarding", "welcome", "new hire"],
    description: "Craft a warm, informative welcome message for a new team member joining.",
    prompt: `Write a warm and professional welcome message for a new employee joining the team.
Include:
- A genuine, personal-feeling welcome (not corporate boilerplate)
- 2–3 key things they should do in their first week
- Who to contact for common questions (use placeholders like [Manager Name])
- An encouraging closing line

New employee name: [NAME]
Role: [ROLE]
Team: [TEAM]
Start date: [DATE]`,
  },
];

// Derive unique departments for the filter dropdown
const ALL_DEPARTMENTS = ["All", ...Array.from(new Set(PROMPTS.map((p) => p.department))).sort()];

// Department colour map — add new departments here as the library grows
const DEPT_COLOURS = {
  "Leadership":         { bg: "#F0EBFF", text: "#6B21A8" },
  "HR":                 { bg: "#ECFDF5", text: "#166534" },
  "Engineering":        { bg: "#EEF2FF", text: "#3730A3" },
  "Marketing":          { bg: "#FFF7ED", text: "#C2410C" },
  "Strategy":           { bg: "#F0FDFA", text: "#0F766E" },
  "Customer Success":   { bg: "#FEFCE8", text: "#A16207" },
  "Project Management": { bg: "#FFF1F2", text: "#BE123C" },
};

// Fallback for any department not in the map above
const DEFAULT_DEPT_COLOUR = { bg: "#EEF5FC", text: "#0078D4" };

// ─────────────────────────────────────────────
// STYLES — single <style> block injected once
// ─────────────────────────────────────────────
const GLOBAL_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    background: #F5F6F8;
    color: #1A1A1A;
    min-height: 100vh;
    border-top: 24px solid #0078D4;
  }

  /* ── Page shell ── */
  .pl-page { max-width: 1400px; margin: 0 auto; padding: 0 24px 64px; }

  /* ── Header ── */
  .pl-header {
    padding: 20px 0 32px;
    border-bottom: 1px solid #E1E1E1;
    margin-bottom: 28px;
  }
  .pl-header-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .pl-header h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.3px; color: #1A1A1A; }
  .pl-header p  { font-size: 14px; color: #5A5A5A; margin-top: 4px; }

  /* ── Submit button ── */
  .btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    background: #0078D4; color: #fff;
    border: none; border-radius: 6px;
    padding: 9px 18px; font-size: 14px; font-weight: 600;
    cursor: pointer; text-decoration: none;
    transition: background 0.15s ease;
    white-space: nowrap;
  }
  .btn-primary:hover  { background: #106EBE; }
  .btn-primary:focus-visible { outline: 3px solid #0078D4; outline-offset: 3px; }

  .btn-secondary {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; color: #1A1A1A;
    border: 1px solid #E1E1E1; border-radius: 6px;
    padding: 9px 18px; font-size: 14px; font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }
  .btn-secondary:hover { background: #F0F0F0; border-color: #C8C8C8; }
  .btn-secondary:focus-visible { outline: 3px solid #0078D4; outline-offset: 3px; }

  /* ── Toolbar ── */
  .pl-toolbar {
    display: flex; gap: 12px; flex-wrap: wrap;
    align-items: center; margin-bottom: 24px;
  }
  .pl-search-wrap { position: relative; flex: 1 1 240px; }
  .pl-search-icon {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    color: #5A5A5A; pointer-events: none; display: flex;
  }
  .pl-search {
    width: 100%; padding: 9px 12px 9px 36px;
    border: 1px solid #E1E1E1; border-radius: 6px;
    font-size: 14px; font-family: inherit; color: #1A1A1A;
    background: #fff;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .pl-search::placeholder { color: #9E9E9E; }
  .pl-search:focus { outline: none; border-color: #0078D4; box-shadow: 0 0 0 3px rgba(0,120,212,0.15); }

  .pl-filter {
    padding: 9px 12px; border: 1px solid #E1E1E1; border-radius: 6px;
    font-size: 14px; font-family: inherit; color: #1A1A1A;
    background: #fff; cursor: pointer; min-width: 160px;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .pl-filter:focus { outline: none; border-color: #0078D4; box-shadow: 0 0 0 3px rgba(0,120,212,0.15); }

  /* ── Results count ── */
  .pl-count { font-size: 13px; color: #5A5A5A; }

  /* ── Card grid ── */
  .pl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  /* ── Card ── */
  .pl-card {
    background: #fff;
    border: 1px solid #E1E1E1;
    border-radius: 10px;
    padding: 20px;
    cursor: pointer;
    transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
    display: flex; flex-direction: column; gap: 10px;
    text-align: left;
    font-family: inherit; font-size: inherit; color: inherit;
    width: 100%;
  }
  .pl-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    border-color: #0078D4;
    transform: translateY(-2px);
  }
  .pl-card:focus-visible {
    outline: 3px solid #0078D4; outline-offset: 2px;
  }

  .pl-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .pl-card-title  { font-size: 15px; font-weight: 600; color: #1A1A1A; line-height: 1.3; }

  /* Base badge styles — colours are applied inline per department */
  .pl-card-dept {
    font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
    border-radius: 4px; padding: 3px 8px;
    white-space: nowrap; flex-shrink: 0;
  }
  .pl-card-desc   { font-size: 13px; color: #5A5A5A; line-height: 1.55; flex: 1; }
  .pl-card-footer { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }

  /* ── Tags ── */
  .pl-tag {
    font-size: 11px; color: #5A5A5A;
    background: #F0F0F0; border-radius: 4px;
    padding: 2px 7px;
  }

  /* ── Empty state ── */
  .pl-empty {
    grid-column: 1 / -1;
    text-align: center; padding: 64px 24px; color: #5A5A5A;
  }
  .pl-empty svg { margin-bottom: 12px; opacity: 0.35; }
  .pl-empty p   { font-size: 15px; }

  /* ── Modal overlay ── */
  .pl-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 24px;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── Modal panel ── */
  .pl-modal {
    background: #fff; border-radius: 12px;
    width: 100%; max-width: 640px; max-height: 85vh;
    display: flex; flex-direction: column;
    box-shadow: 0 20px 60px rgba(0,0,0,0.22);
    animation: slideUp 0.2s ease;
    overflow: hidden;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  .pl-modal-header {
    padding: 22px 24px 18px;
    border-bottom: 1px solid #E1E1E1;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  }
  .pl-modal-title { font-size: 18px; font-weight: 700; color: #1A1A1A; line-height: 1.3; }
  .pl-modal-tags  { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }

  .pl-modal-close {
    background: none; border: none; cursor: pointer;
    color: #5A5A5A; padding: 4px; border-radius: 4px;
    display: flex; align-items: center;
    transition: color 0.15s, background 0.15s;
    flex-shrink: 0;
  }
  .pl-modal-close:hover { color: #1A1A1A; background: #F0F0F0; }
  .pl-modal-close:focus-visible { outline: 3px solid #0078D4; outline-offset: 2px; }

  .pl-modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }
  .pl-modal-desc { font-size: 14px; color: #5A5A5A; margin-bottom: 16px; line-height: 1.6; }

  .pl-prompt-label { font-size: 12px; font-weight: 600; color: #5A5A5A; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
  .pl-prompt-block {
    background: #F5F6F8; border: 1px solid #E1E1E1;
    border-radius: 8px; padding: 16px;
    font-family: "Cascadia Code", "Consolas", "Courier New", monospace;
    font-size: 13px; line-height: 1.7; color: #1A1A1A;
    white-space: pre-wrap; word-break: break-word;
    max-height: 300px; overflow-y: auto;
  }

  .pl-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #E1E1E1;
    display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;
  }

  /* ── Toast ── */
  .pl-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #1A1A1A; color: #fff;
    padding: 10px 20px; border-radius: 8px;
    font-size: 14px; font-weight: 500;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    z-index: 2000;
    animation: toastIn 0.2s ease;
    white-space: nowrap;
  }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .pl-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .pl-grid { grid-template-columns: 1fr; }
    .pl-header-inner { flex-direction: column; align-items: flex-start; }
    .pl-modal { max-height: 95vh; border-radius: 12px 12px 0 0; align-self: flex-end; }
    .pl-overlay { padding: 0; align-items: flex-end; }
  }
`;

// ─────────────────────────────────────────────
// ICONS — inline SVG keeps zero dependencies
// ─────────────────────────────────────────────
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconClose  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCopy   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEmpty  = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// Helper — returns the colour object for a given department
const getDeptColour = (department) => DEPT_COLOURS[department] || DEFAULT_DEPT_COLOUR;

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function App() {
  const [search,     setSearch]     = useState("");
  const [department, setDepartment] = useState("All");
  const [selected,   setSelected]   = useState(null);
  const [toast,      setToast]      = useState(false);
  const [copied,     setCopied]     = useState(false);

  const closeButtonRef = useRef(null);
  const toastTimer     = useRef(null);

  // ── Filtered list (memoised) ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PROMPTS.filter((p) => {
      const matchesDept   = department === "All" || p.department === department;
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchesDept && matchesSearch;
    });
  }, [search, department]);

  // ── Open / close modal ──
  const openModal  = useCallback((prompt) => setSelected(prompt), []);
  const closeModal = useCallback(() => { setSelected(null); setCopied(false); }, []);

  // Move focus to close button when modal opens
  useEffect(() => {
    if (selected && closeButtonRef.current) closeButtonRef.current.focus();
  }, [selected]);

  // ESC closes modal
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && selected) closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, closeModal]);

  // ── Copy to clipboard ──
  const handleCopy = useCallback(async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.prompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = selected.prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2500);
  }, [selected]);

  // ── Inject global styles once ──
  useEffect(() => {
    const id = "pl-global-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = GLOBAL_STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  return (
    <>
      <div className="pl-page">

        {/* ── PAGE HEADER ── */}
        <header className="pl-header">
          <div className="pl-header-inner">
            <div>
              <h1>✦ Copilot Champions Prompt Library ✦</h1>
              <p>Ready-to-use Copilot prompts for every team — click any card to view and copy.</p>
            </div>
            <a
              href="https://github.com/stefibub/MS-Copilot-Prompt-Library/issues/new?template=submit-prompt.md"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              aria-label="Submit a new prompt"
            >
              <IconPlus /> Submit a Prompt
            </a>
          </div>
        </header>

        {/* ── TOOLBAR: Search + Filter ── */}
        <div className="pl-toolbar" role="search">
          <div className="pl-search-wrap">
            <span className="pl-search-icon" aria-hidden="true"><IconSearch /></span>
            <input
              type="search"
              className="pl-search"
              placeholder="Search by title, description or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search prompts"
            />
          </div>
          <select
            className="pl-filter"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by department"
          >
            {ALL_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
            ))}
          </select>
        </div>

        {/* ── CARD GRID ── */}
        <main>
          <div className="pl-grid">
            {filtered.length === 0 ? (
              <div className="pl-empty" role="status">
                <IconEmpty />
                <p>No prompts match your search. Try a different keyword or filter.</p>
              </div>
            ) : (
              filtered.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} onClick={openModal} />
              ))
            )}
          </div>

          {/* ── RESULTS COUNT ── */}
          <p className="pl-count" aria-live="polite" style={{ textAlign: "center", marginTop: "24px" }}>
            {filtered.length === PROMPTS.length
              ? `Showing all ${PROMPTS.length} prompts`
              : `Showing ${filtered.length} of ${PROMPTS.length} prompts`}
          </p>
        </main>

      </div>

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <PromptModal
          prompt={selected}
          copied={copied}
          onCopy={handleCopy}
          onClose={closeModal}
          closeButtonRef={closeButtonRef}
        />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="pl-toast" role="status" aria-live="polite">
          <IconCheck /> Prompt copied to clipboard!
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// CARD — individual prompt card
// ─────────────────────────────────────────────
function PromptCard({ prompt, onClick }) {
  const colour = getDeptColour(prompt.department);
  return (
    <button
      className="pl-card"
      onClick={() => onClick(prompt)}
      aria-label={`View prompt: ${prompt.title}`}
    >
      <div className="pl-card-header">
        <span className="pl-card-title">{prompt.title}</span>
        <span
          className="pl-card-dept"
          style={{ background: colour.bg, color: colour.text }}
        >
          {prompt.department}
        </span>
      </div>
      <p className="pl-card-desc">{prompt.description}</p>
      <div className="pl-card-footer">
        {prompt.tags.map((tag) => (
          <span key={tag} className="pl-tag">#{tag}</span>
        ))}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// MODAL — detail view with copy action
// ─────────────────────────────────────────────
function PromptModal({ prompt, copied, onCopy, onClose, closeButtonRef }) {
  const colour = getDeptColour(prompt.department);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="pl-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="pl-modal">

        {/* Modal header */}
        <div className="pl-modal-header">
          <div>
            <h2 className="pl-modal-title" id="modal-title">{prompt.title}</h2>
            <div className="pl-modal-tags">
              <span
                className="pl-card-dept"
                style={{ background: colour.bg, color: colour.text }}
              >
                {prompt.department}
              </span>
              {prompt.tags.map((tag) => (
                <span key={tag} className="pl-tag">#{tag}</span>
              ))}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            className="pl-modal-close"
            onClick={onClose}
            aria-label="Close prompt detail"
          >
            <IconClose />
          </button>
        </div>

        {/* Modal body */}
        <div className="pl-modal-body">
          <p className="pl-modal-desc">{prompt.description}</p>
          <p className="pl-prompt-label">Prompt</p>
          <pre className="pl-prompt-block">{prompt.prompt}</pre>
        </div>

        {/* Modal footer */}
        <div className="pl-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button
            className="btn-primary"
            onClick={onCopy}
            aria-label={copied ? "Prompt copied" : "Copy prompt to clipboard"}
          >
            {copied ? <><IconCheck /> Copied!</> : <><IconCopy /> Copy Prompt</>}
          </button>
        </div>

      </div>
    </div>
  );
}
