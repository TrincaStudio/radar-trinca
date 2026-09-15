import React, { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Download, Flame, LayoutDashboard, Search, Star, Upload, Users, X } from "lucide-react";
import seed from "./leads.json";
import { commercialReading, formatDate, leadKey, leadScore, normalizePhone, translate } from "./leadUtils";
import "./FireLeadsPage.css";

const STAGES = ["Novo", "Em contato", "Reunião marcada", "Proposta", "Ganho", "Perdido"];
const PAGE_SIZE = 20;

function initials(name) {
  const clean = (name || "?").trim();
  return clean.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
}

function priorityClass(value) {
  const v = String(value || "");
  if (v.startsWith("P1")) return "p1";
  if (v.startsWith("P2")) return "p2";
  if (v.startsWith("P3")) return "p3";
  return "";
}

function ratingValue(override) {
  const rating = Number(override?.rating || 0);
  return Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
}

function suggestedScore(lead, override) {
  const ratingBoost = ratingValue(override) * 10;
  const commentBoost = override?.notes?.trim() ? 4 : 0;
  return Math.min(100, leadScore(lead) + ratingBoost + commentBoost);
}

function suggestedLabel(score) {
  if (score >= 85) return "Atacar agora";
  if (score >= 65) return "Priorizar";
  if (score >= 45) return "Conversar antes";
  return "Nutrir";
}

function Stars({ value, onChange, compact = false }) {
  return <div className={compact ? "fire-stars compact" : "fire-stars"} aria-label={`${value} estrelas`}>
    {[1, 2, 3, 4, 5].map((star) => {
      const active = star <= value;
      if (!onChange) return <Star key={star} size={compact ? 14 : 19} className={active ? "fire-star active" : "fire-star"} />;
      return <button key={star} type="button" className={active ? "fire-star-btn active" : "fire-star-btn"} onClick={() => onChange(star === value ? 0 : star)} title={`${star} estrela${star > 1 ? "s" : ""}`}>
        <Star size={compact ? 16 : 20} />
      </button>;
    })}
  </div>;
}

function normalizeImportedRow(row, index) {
  const lead = { ...row, _row: Date.now() + index, _imported: true };
  const rawKey = Object.keys(row).find((k) => /json|respost|answer|quiz/i.test(k));
  if (rawKey && typeof row[rawKey] === "string") {
    try {
      const parsed = JSON.parse(String(row[rawKey]));
      lead._rawQuiz = parsed;
      const source = parsed && typeof parsed === "object" ? parsed : {};
      const map = {
        "Maturidade": ["maturity", "maturidade"],
        "Dor principal": ["pain", "mainPain", "dor", "dorPrincipal"],
        "Status página": ["pageStatus", "statusPagina", "status_pagina"],
        "Papel no negócio": ["role", "papel", "papelNegocio"],
        "Automation fit": ["automationFit", "automation_fit", "fitAutomacao"],
        "Rota": ["route", "rota"],
        "Prioridade": ["priority", "prioridade"],
      };
      for (const [target, candidates] of Object.entries(map)) {
        if (lead[target] == null) {
          const found = candidates.find((c) => source[c] != null);
          if (found) lead[target] = source[found];
        }
      }
    } catch {
      // Keep imported row even when an optional raw JSON column is invalid.
    }
  }
  return lead;
}

export default function FireLeadsPage({ onBack }) {
  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState(seed);
  const [overrides, setOverrides] = useState({});
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("Todos");
  const [source, setSource] = useState("Todos");
  const [role, setRole] = useState("Todos");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("fire-leads-overrides");
    const imported = localStorage.getItem("fire-leads-imported");
    if (saved) setOverrides(JSON.parse(saved));
    if (imported) setLeads([...seed, ...JSON.parse(imported)]);
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const fireLeads = useMemo(() => leads.filter((l) => String(l.Fontes || "").includes("FIRE")), [leads]);
  const decisionMakers = useMemo(() => fireLeads.filter((l) => l["Papel no negócio"] === "DECISION_MAKER").length, [fireLeads]);
  const p1 = useMemo(() => fireLeads.filter((l) => l.Prioridade === "P1_FIRE").length, [fireLeads]);
  const automationFit = useMemo(() => fireLeads.filter((l) => String(l["Automation fit"]) === "true" || l["Automation fit"] === true).length, [fireLeads]);

  const painCounts = useMemo(() => {
    const counts = {};
    fireLeads.forEach((l) => {
      const k = String(l["Dor principal"] || "Sem informação");
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [fireLeads]);

  const hotLeads = useMemo(() => [...fireLeads].sort((a, b) => suggestedScore(b, overrides[leadKey(b)]) - suggestedScore(a, overrides[leadKey(a)])).slice(0, 6), [fireLeads, overrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      const hay = [l.Nome, l.Email, l.Telefone, l.Empresa, l["Dor principal"], l.Maturidade].join(" ").toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (priority !== "Todos" && l.Prioridade !== priority) return false;
      if (source !== "Todos" && !String(l.Fontes || "").includes(source)) return false;
      if (role !== "Todos" && l["Papel no negócio"] !== role) return false;
      return true;
    }).sort((a, b) => suggestedScore(b, overrides[leadKey(b)]) - suggestedScore(a, overrides[leadKey(a)]));
  }, [leads, overrides, query, priority, source, role]);

  useEffect(() => setPage(1), [query, priority, source, role]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function saveOverride(lead, patch) {
    const key = leadKey(lead);
    const next = { ...overrides, [key]: { ...overrides[key], ...patch, updatedAt: new Date().toISOString() } };
    setOverrides(next);
    localStorage.setItem("fire-leads-overrides", JSON.stringify(next));
  }

  async function handleImport(file) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    const headerIndex = matrix.findIndex((r) => Array.isArray(r) && r.some((v) => String(v || "").trim().toLowerCase() === "nome"));
    if (headerIndex < 0) return showToast("Não encontrei a coluna Nome na planilha.");
    const headers = matrix[headerIndex].map((v) => String(v || "").trim());
    const objects = matrix.slice(headerIndex + 1).filter((r) => Array.isArray(r) && r.some(Boolean)).map((r, idx) => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? null; });
      return normalizeImportedRow(obj, idx);
    });
    const currentImported = leads.filter((l) => l._imported);
    const mergedImported = [...currentImported, ...objects];
    localStorage.setItem("fire-leads-imported", JSON.stringify(mergedImported));
    setLeads([...seed, ...mergedImported]);
    showToast(`${objects.length} leads importados.`);
  }

  function exportCsv() {
    const headers = ["Nome", "Email", "Telefone", "Empresa", "Fontes", "Prioridade", "Maturidade", "Dor principal", "Papel no negócio", "Ranking sugerido", "Score quiz", "Estrelas", "Etapa comercial", "Responsável", "Próxima ação", "Comentários"];
    const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const lines = [headers.join(",")];
    filtered.forEach((l) => {
      const o = overrides[leadKey(l)] || {};
      const score = suggestedScore(l, o);
      lines.push([l.Nome, l.Email, l.Telefone, l.Empresa, l.Fontes, l.Prioridade, l.Maturidade, l["Dor principal"], l["Papel no negócio"], suggestedLabel(score), leadScore(l), ratingValue(o), o.stage || "Novo", o.owner || "", o.nextAction || "", o.notes || ""].map(esc).join(","));
    });
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fire-leads-filtrados.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return <div className="fire-app">
    <aside className="fire-sidebar">
      <div className="fire-brand">trinca<span>.</span> <small>FIRE</small></div>
      <nav className="fire-nav">
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><LayoutDashboard size={17} /> Dashboard</button>
        <button className={view === "leads" ? "active" : ""} onClick={() => setView("leads")}><Users size={17} /> Leads</button>
        <button onClick={onBack}><BarChart3 size={17} /> Radar Trinca</button>
      </nav>
      <div className="fire-sidebar-bottom">Base inicial: {seed.length} leads<br />Persistência local ativa</div>
    </aside>

    <main className="fire-main">
      <div className="fire-topbar">
        <div className="fire-title">
          <h1>{view === "dashboard" ? "Radar comercial FIRE" : "Leads FIRE"}</h1>
          <p>{view === "dashboard" ? "Visão rápida de quem merece atenção agora." : `${filtered.length} leads encontrados na base.`}</p>
        </div>
        <div className="fire-actions">
          <input ref={fileRef} className="fire-file-input" type="file" accept=".xlsx,.xls" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); e.currentTarget.value = ""; }} />
          <button className="fire-btn" onClick={() => fileRef.current?.click()}><Upload size={16} /><span>Importar XLSX</span></button>
          <button className="fire-btn primary" onClick={exportCsv}><Download size={16} /><span>Exportar CSV</span></button>
        </div>
      </div>

      {view === "dashboard" ? <>
        <section className="fire-grid-kpis">
          <div className="fire-card fire-kpi"><div className="fire-kpi-label"><span>Leads totais</span><Users size={16} /></div><div className="fire-kpi-value">{leads.length}</div><div className="fire-kpi-sub">FIRE + manual</div></div>
          <div className="fire-card fire-kpi"><div className="fire-kpi-label"><span>Leads FIRE</span><Flame size={16} /></div><div className="fire-kpi-value">{fireLeads.length}</div><div className="fire-kpi-sub">com diagnóstico do quiz</div></div>
          <div className="fire-card fire-kpi"><div className="fire-kpi-label"><span>P1 agora</span><BarChart3 size={16} /></div><div className="fire-kpi-value">{p1}</div><div className="fire-kpi-sub">alta prioridade</div></div>
          <div className="fire-card fire-kpi"><div className="fire-kpi-label"><span>Decisores</span><Users size={16} /></div><div className="fire-kpi-value">{decisionMakers}</div><div className="fire-kpi-sub">{automationFit} com fit de automação</div></div>
        </section>
        <section className="fire-dashboard-grid">
          <div className="fire-card fire-panel">
            <h3>Principais dores</h3><div className="fire-sub">Distribuição dos leads que responderam o FIRE</div>
            {painCounts.map(([name, count]) => <div className="fire-bar-row" key={name}><span>{translate(name)}</span><div className="fire-bar-track"><div className="fire-bar-fill" style={{ width: `${Math.max(7, (count / Math.max(...painCounts.map(([, c]) => c))) * 100)}%` }} /></div><b>{count}</b></div>)}
          </div>
          <div className="fire-card fire-panel">
            <h3>Ranking sugerido</h3><div className="fire-sub">Combina o score do quiz com suas estrelas e comentários da conversa</div>
            <div className="fire-hot-list">{hotLeads.map((l, index) => { const ov = overrides[leadKey(l)] || {}; const score = suggestedScore(l, ov); return <button className="fire-hot-item" key={leadKey(l)} onClick={() => setSelected(l)}><div className="fire-rank">#{index + 1}</div><div style={{ textAlign: "left" }}><b>{l.Nome || "Sem nome"}</b><small>{suggestedLabel(score)} · quiz {leadScore(l)}/100</small><Stars value={ratingValue(ov)} compact /></div><div className="fire-score">{score}</div></button>; })}</div>
          </div>
        </section>
      </> : <>
        <div className="fire-toolbar">
          <div className="fire-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar nome, email, empresa, telefone ou dor..." /></div>
          <select className="fire-select" value={priority} onChange={(e) => setPriority(e.target.value)}><option>Todos</option><option value="P1_FIRE">P1</option><option value="P2_FOLLOW_UP">P2</option><option value="P3_NURTURE">P3</option></select>
          <select className="fire-select" value={source} onChange={(e) => setSource(e.target.value)}><option>Todos</option><option value="FIRE">FIRE</option><option value="Manual">Manual</option></select>
          <select className="fire-select" value={role} onChange={(e) => setRole(e.target.value)}><option>Todos</option><option value="DECISION_MAKER">Decisor</option><option value="LEADER">Liderança</option><option value="TEAM">Time</option></select>
        </div>
        <div className="fire-card fire-table-card"><div className="fire-table-wrap"><table className="fire-leads-table"><thead><tr><th>Lead</th><th>Origem</th><th>Prioridade</th><th>Diagnóstico</th><th>Papel</th><th>Ranking sugerido</th><th>Estrelas</th><th>Etapa</th></tr></thead><tbody>
          {visible.map((l) => { const ov = overrides[leadKey(l)] || {}; const score = suggestedScore(l, ov); return <tr key={leadKey(l)} onClick={() => setSelected(l)}><td><div className="fire-person"><div className="fire-avatar">{initials(l.Nome)}</div><div><strong>{l.Nome || "Sem nome"}</strong><small>{l.Email || normalizePhone(l.Telefone)}</small></div></div></td><td><span className={`fire-source-dot ${String(l.Fontes || "").includes("FIRE") ? "fire" : "manual"}`} />{l.Fontes || "—"}</td><td><span className={`fire-badge ${priorityClass(l.Prioridade)}`}>{translate(l.Prioridade)}</span></td><td>{translate(l["Dor principal"])}<br /><small>{translate(l.Maturidade)}</small></td><td>{translate(l["Papel no negócio"])}</td><td><div className="fire-suggested-cell"><b>{suggestedLabel(score)}</b><small>ranking {score}/100 · quiz {leadScore(l)}/100</small></div></td><td><Stars value={ratingValue(ov)} compact /></td><td><span className="fire-badge">{ov.stage || "Novo"}</span>{ov.notes?.trim() && <span className="fire-comment-dot" title="Tem comentários" />}</td></tr>; })}
        </tbody></table></div>{visible.length === 0 && <div className="fire-empty">Nenhum lead com esses filtros.</div>}<div className="fire-pagination"><span>Página {page} de {pageCount}</span><div><button className="fire-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button> <button className="fire-btn" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Próxima</button></div></div></div>
      </>}
    </main>

    {selected && <LeadDrawer lead={selected} override={overrides[leadKey(selected)] || {}} onClose={() => setSelected(null)} onSave={(patch) => { saveOverride(selected, patch); showToast("Lead atualizado."); }} />}
    {toast && <div className="fire-toast">{toast}</div>}
  </div>;
}

function LeadDrawer({ lead, override, onClose, onSave }) {
  const [stage, setStage] = useState(override.stage || "Novo");
  const [owner, setOwner] = useState(override.owner || "");
  const [nextAction, setNextAction] = useState(override.nextAction || "");
  const [notes, setNotes] = useState(override.notes || "");
  const [rating, setRating] = useState(ratingValue(override));
  const quizFacts = [["Maturidade", lead.Maturidade], ["Dor principal", lead["Dor principal"]], ["Status da página", lead["Status página"]], ["Papel no negócio", lead["Papel no negócio"]], ["Fit de automação", lead["Automation fit"]], ["Rota sugerida", lead.Rota]];
  const score = suggestedScore(lead, { ...override, rating, notes });
  return <div className="fire-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><aside className="fire-drawer"><header className="fire-drawer-head"><div className="fire-drawer-top"><div><span className={`fire-badge ${priorityClass(lead.Prioridade)}`}>{translate(lead.Prioridade)}</span><h2>{lead.Nome || "Lead sem nome"}</h2><div className="fire-muted">{lead.Empresa || lead.Email || "Sem empresa informada"}</div></div><button className="fire-close" onClick={onClose}><X size={18} /></button></div></header><div className="fire-drawer-content">
    <section className="fire-section fire-reading"><h4>Leitura comercial</h4>{commercialReading(lead)}</section>
    <section className="fire-section fire-rank-panel"><div><h4>Ranking sugerido</h4><div className="fire-rank-score">{suggestedLabel(score)} <b>{score}/100</b></div><p>Score do quiz: {leadScore(lead)}/100. Suas estrelas ajustam leads em que a conversa foi melhor que o formulário.</p></div><div><label>Feeling da conversa</label><Stars value={rating} onChange={setRating} /></div></section>
    <section className="fire-section"><h4>Contato e contexto</h4><div className="fire-facts"><div className="fire-fact"><span>Email</span><b>{lead.Email || "—"}</b></div><div className="fire-fact"><span>Telefone</span><b>{normalizePhone(lead.Telefone)}</b></div><div className="fire-fact"><span>Empresa</span><b>{lead.Empresa || "—"}</b></div><div className="fire-fact"><span>Origem</span><b>{lead.Fontes || "—"}</b></div><div className="fire-fact"><span>Entrada mais recente</span><b>{formatDate(lead["Data mais recente"])}</b></div><div className="fire-fact"><span>Score comercial</span><b>{leadScore(lead)}/100</b></div></div></section>
    <section className="fire-section"><h4>Diagnóstico do quiz</h4><div className="fire-quiz-grid">{quizFacts.map(([k, v]) => <div className="fire-quiz-line" key={k}><span>{k}</span><b>{translate(v)}</b></div>)}</div>{lead._rawQuiz != null && <details className="fire-details"><summary>Ver JSON original</summary><pre>{JSON.stringify(lead._rawQuiz, null, 2)}</pre></details>}</section>
    {lead["Observação manual"] && <section className="fire-section"><h4>Observação da coleta</h4><div className="fire-note">{String(lead["Observação manual"])}</div></section>}
    <section className="fire-section"><h4>Gestão comercial</h4><div className="fire-form-grid"><div className="fire-field"><label>Etapa</label><select value={stage} onChange={(e) => setStage(e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></div><div className="fire-field"><label>Responsável</label><input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Ex.: Mari" /></div><div className="fire-field full"><label>Próxima ação</label><input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Ex.: chamar no WhatsApp amanhã" /></div><div className="fire-field full"><label>Comentários da conversa</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contexto do papo, sinais bons, objeções, próximos passos..." /></div></div><div className="fire-save-row"><button className="fire-btn primary" onClick={() => onSave({ stage, owner, nextAction, notes, rating })}>Salvar alterações</button></div></section>
    <section className="fire-section"><h4>Integrações da base</h4><div className="fire-facts"><div className="fire-fact"><span>CRM / GHL</span><b>{translate(lead["CRM status"])}</b></div><div className="fire-fact"><span>Email</span><b>{translate(lead["Email status"])}</b></div><div className="fire-fact"><span>Scaneia Full</span><b>{translate(lead["Full status"])}</b></div><div className="fire-fact"><span>Lead ID</span><b className="fire-lead-id">{String(lead["Lead ID"] || "—")}</b></div></div></section>
  </div></aside></div>;
}
