import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  X,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  ChevronRight,
  AlertCircle,
  Radar,
  Linkedin,
  Mail,
  MessageCircle,
  Upload,
  FileText,
} from "lucide-react";

const COMMERCIAL_STATUSES = ["Sem Full", "Aguardando análise", "Processando", "Aguardando revisão", "Revisada", "Erro no processamento"];

const STATUS_STYLES = {
  "Sem Full": { color: "#c9a8fb", bg: "rgba(138,56,245,.14)" },
  "Aguardando análise": { color: "#a1a1aa", bg: "rgba(161,161,170,.12)" },
  Processando: { color: "#7fd9ff", bg: "rgba(28,191,255,.12)" },
  "Aguardando revisão": { color: "#d9bc86", bg: "rgba(201,169,110,.14)" },
  Revisada: { color: "#4ade80", bg: "rgba(34,197,94,.12)" },
  "Erro no processamento": { color: "#ff6ba0", bg: "rgba(255,63,133,.12)" },
};

function whatsappUrl(phone) {
  const raw = String(phone || "").trim();
  let digits = raw.replace(/\D/g, "");
  const hasCountryCode = raw.startsWith("+") || digits.startsWith("00");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!hasCountryCode && (digits.length === 11 || digits.length === 12) && digits.startsWith("0")) {
    digits = `55${digits.slice(1)}`;
  } else if (!hasCountryCode && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return digits.length >= 10 ? `https://wa.me/${digits}` : "";
}

function WhatsAppLink({ phone }) {
  const href = whatsappUrl(phone);
  if (!phone) return <span style={{ color: "#65605a" }}>—</span>;
  if (!href) return <span>{phone}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Conversar com ${phone} pelo WhatsApp`}
      style={{ color: "#4ade80", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none" }}
    >
      <MessageCircle size={14} /> {phone}
    </a>
  );
}

function formatAnalysisDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= 0) return "—";
  return date.toLocaleDateString("pt-BR");
}

function firstMeaningfulLine(...values) {
  for (const value of values) {
    const line = String(value || "").split(/\r?\n/).map((item) => item.trim()).find(Boolean);
    if (line) return line;
  }
  return "—";
}

function inferAssetType(item) {
  if (item.tipoAtivo) return item.tipoAtivo;
  const text = `${item.empresa || ""} ${item.site || ""} ${item.produto || ""}`.toLowerCase();
  if (/e-?commerce|loja|shop/.test(text)) return "E-commerce";
  if (/landing/.test(text)) return "Landing page";
  if (/curso|infoproduto/.test(text)) return "Curso / infoproduto";
  if (/saas/.test(text)) return "SaaS";
  if (/plataforma|app/.test(text)) return "Plataforma";
  if (/portf[oó]lio/.test(text)) return "Portfólio";
  return "Não identificado";
}

const BLANK_ANALYSIS_FIELDS = {
  estagio: "Pré-mapeada",
  statusAnalise: "Não analisada",
  classificacao: "A validar",
  notaGeral: null,
  clareza: null,
  ux: null,
  copy: null,
  conversao: null,
  performance: null,
  seo: null,
  acessibilidade: null,
  pontosFortes: "",
  principaisOportunidades: "",
  resumoExecutivo: "",
  impactoNegocio: "",
  fitTrinca: "",
  sugestaoAbordagem: "",
  mensagemDM: "",
  responsavel: "",
  cargo: "",
  linkedin: "",
  email: "",
  proximoPasso: "",
  // Análise de produto — números vêm direto dos dados do Scaneia (upload), texto vem da IA
  scoreProdutoDesign: null,
  scoreProdutoTecnologia: null,
  criticalCount: null,
  confiancaScaneia: null,
  maturidadeProduto: "",
  sinaisProduto: "",
  analiseProduto: "",
  oportunidadesProduto: "",
  dataAnalise: "",
  statusComercial: "Aguardando análise",
  principalEvidencia: "",
  ofertaRecomendada: "",
  justificativaOferta: "",
  alertasComerciais: "",
  confiancaRadar: null,
  processadoEm: "",
  fullReportUrl: "",
  origemLead: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  landingPageUrl: "",
  referrerUrl: "",
  statusGhl: "Não sincronizado",
  tipoAtivo: "Não identificado",
  objetivoProvavel: "",
  nivelOportunidade: "MÉDIA",
  justificativaOportunidade: "",
  dorDominante: "",
  ganchoPrincipal: "",
  hipoteseDor: "",
  perguntasDescoberta: "",
  possivelExpansao: "",
};

// ---------------------------------------------------------------------------
// Seed data — importado da planilha "Radar_Comercial_Trinca_Saude"
// ---------------------------------------------------------------------------
const SEED_COMPANIES = [
  ["SAU-001", "Amplimed", "SaaS para gestão de clínicas", "B2B", "https://www.amplimed.com.br/", "Alta"],
  ["SAU-002", "Clínica nas Nuvens", "SaaS para clínicas e consultórios", "B2B", "https://clinicanasnuvens.com.br/", "Alta"],
  ["SAU-003", "Shosp", "Software médico para clínicas", "B2B", "https://www.shosp.com.br/", "Alta"],
  ["SAU-004", "Ninsaúde", "Gestão para clínicas e franquias de saúde", "B2B", "https://www.ninsaude.com.br/", "Alta"],
  ["SAU-005", "GestãoDS", "Software médico e gestão de clínicas", "B2B", "https://www.gestaods.com.br/", "Alta"],
  ["SAU-006", "SimDoctor", "Sistema modular para clínicas", "B2B", "https://www.simdoctor.com.br/", "Alta"],
  ["SAU-007", "OnDoctor", "Gestão de clínicas e consultórios", "B2B", "https://www.ondoctor.app/", "Alta"],
  ["SAU-008", "Salutho", "Prontuário e gestão em saúde", "B2B", "https://salutho.com/", "Alta"],
  ["SAU-009", "ProDoctor", "Software médico em nuvem", "B2B", "https://prodoctor.net/", "Alta"],
  ["SAU-010", "Feegow", "Gestão de clínicas e consultórios", "B2B", "https://feegowclinic.com.br/", "Média"],
  ["SAU-011", "iClinic", "Software médico e prontuário eletrônico", "B2B", "https://iclinic.com.br/", "Média"],
  ["SAU-012", "Portal Telemedicina", "Telemedicina e laudos a distância", "B2B", "https://portaltelemedicina.com.br/", "Alta"],
  ["SAU-013", "Doutor ao Vivo", "Plataforma SaaS de telemedicina white-label", "B2B", "https://doutoraovivo.com.br/", "Alta"],
  ["SAU-014", "Memed", "Prescrição digital e soluções para médicos", "B2B2C", "https://memed.com.br/", "Média"],
  ["SAU-015", "Nilo Saúde", "Plataforma de cuidado digital", "B2B2C", "https://nilosaude.com.br/", "Alta"],
  ["SAU-016", "Vittude", "Saúde mental corporativa", "B2B2C", "https://www.vittude.com/", "Alta"],
  ["SAU-017", "Zenklub", "Plataforma de saúde emocional", "B2B2C", "https://zenklub.com.br/", "Média"],
  ["SAU-018", "Psicologia Viva", "Psicologia online e benefício corporativo", "B2B2C", "https://www.psicologiaviva.com.br/", "Média"],
  ["SAU-019", "Carefy", "Auditoria e gestão em saúde suplementar", "B2B", "https://carefy.com.br/", "Alta"],
  ["SAU-020", "Pipo Saúde", "Benefícios e gestão de saúde corporativa", "B2B", "https://www.piposaude.com.br/", "Média"],
].map(([id, nome, produto, modelo, website, prioridade]) => ({
  id,
  nome,
  segmento: "Saúde",
  produto,
  modelo,
  website,
  pais: "Brasil",
  prioridade,
  ...BLANK_ANALYSIS_FIELDS,
}));

const API_STATUS_LABELS = {
  PENDING: "Aguardando análise",
  PROCESSING: "Processando",
  RETRY_SCHEDULED: "Processando",
  COMPLETED: "Aguardando revisão",
  FAILED: "Erro no processamento",
};

function mapRadarAnalysis(item) {
  const processedAt = item.processedAt || "";
  return {
    ...BLANK_ANALYSIS_FIELDS,
    id: String(item.id),
    reportJobId: item.reportJobId,
    leadId: item.leadId,
    nome: item.nome || item.empresa || "Lead sem nome",
    produto: item.empresa || item.site || "Relatório Full",
    website: item.site || "",
    email: item.email || "",
    telefone: item.telefone || "",
    statusComercial: item.humanReviewed ? "Revisada" : (API_STATUS_LABELS[item.status] || item.status || "Aguardando análise"),
    principalEvidencia: item.principalEvidencia || "",
    ofertaRecomendada: item.ofertaRecomendada || "",
    justificativaOferta: item.justificativaOferta || "",
    mensagemDM: item.mensagemSugerida || "",
    proximoPasso: item.proximoPasso || "",
    alertasComerciais: Array.isArray(item.alertas) ? item.alertas.join("\n") : (item.alertas || ""),
    confiancaRadar: item.confianca ?? null,
    fullReportUrl: item.fullReportUrl || "",
    ghlContactId: item.ghlContactId || "",
    statusGhl: item.ghlContactId ? "Contato vinculado" : "Não sincronizado",
    processadoEm: processedAt,
    humanReviewed: Boolean(item.humanReviewed),
    reviewedAt: item.reviewedAt || null,
    reviewedBy: item.reviewedBy || "",
    erroSanitizado: item.erroSanitizado || "",
    statusAnalise: item.status === "COMPLETED" ? "Analisada" : "Não analisada",
    origemLead: item.origemLead || "",
    utmSource: item.utmSource || "",
    utmMedium: item.utmMedium || "",
    utmCampaign: item.utmCampaign || "",
    utmTerm: item.utmTerm || "",
    utmContent: item.utmContent || "",
    landingPageUrl: item.landingPageUrl || "",
    referrerUrl: item.referrerUrl || "",
    classificacao: item.classificacao || "A validar",
    notaGeral: item.notaGeral ?? null,
    clareza: item.clareza ?? null,
    ux: item.ux ?? null,
    copy: item.copy ?? null,
    conversao: item.conversao ?? null,
    performance: item.performance ?? null,
    seo: item.seo ?? null,
    acessibilidade: item.acessibilidade ?? null,
    resumoExecutivo: item.resumoExecutivo || "",
    pontosFortes: item.pontosFortes || "",
    principaisOportunidades: item.principaisOportunidades || "",
    impactoNegocio: item.impactoNegocio || "",
    fitTrinca: item.fitTrinca || "",
    sugestaoAbordagem: item.sugestaoAbordagem || "",
    scoreProdutoDesign: item.scoreProdutoDesign ?? null,
    scoreProdutoTecnologia: item.scoreProdutoTecnologia ?? null,
    criticalCount: item.criticalCount ?? null,
    confiancaScaneia: item.confiancaScaneia ?? null,
    maturidadeProduto: item.maturidadeProduto || "",
    sinaisProduto: Array.isArray(item.sinaisProduto) ? item.sinaisProduto.join("\n") : (item.sinaisProduto || ""),
    analiseProduto: item.analiseProduto || "",
    oportunidadesProduto: item.oportunidadesProduto || "",
    dataAnalise: formatAnalysisDate(processedAt),
    tipoAtivo: item.tipoAtivo || inferAssetType(item),
    objetivoProvavel: item.objetivoProvavel || item.analiseProduto || "",
    nivelOportunidade: item.nivelOportunidade || ({ Verde: "ALTA", Amarelo: "MÉDIA", Vermelho: "BAIXA" }[item.classificacao] || "MÉDIA"),
    justificativaOportunidade: item.justificativaOportunidade || item.fitTrinca || "",
    dorDominante: item.dorDominante || firstMeaningfulLine(item.principaisOportunidades, item.principalEvidencia),
    ganchoPrincipal: item.ganchoPrincipal || firstMeaningfulLine(item.principalEvidencia, item.principaisOportunidades),
    hipoteseDor: item.hipoteseDor || item.impactoNegocio || "",
    perguntasDescoberta: Array.isArray(item.perguntasDescoberta) ? item.perguntasDescoberta.join("\n") : (item.perguntasDescoberta || ""),
    possivelExpansao: item.possivelExpansao || item.justificativaOferta || "",
    hasRadarAnalysis: true,
  };
}

function normalizedEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function mapGhlOnlyContact(contact) {
  return {
    ...BLANK_ANALYSIS_FIELDS,
    id: `ghl:${contact.id}`,
    ghlContactId: contact.id,
    nome: contact.name || contact.email || "Contato sem nome",
    produto: "Contato do GHL sem relatório Full",
    website: contact.website || "",
    email: contact.email || "",
    telefone: contact.phone || "",
    statusComercial: "Sem Full",
    statusAnalise: "Sem Full",
    statusGhl: "Contato existente no GHL",
    origemLead: contact.source || "",
    utmSource: contact.utmSource || "",
    utmMedium: contact.utmMedium || "",
    utmCampaign: contact.utmCampaign || "",
    utmContent: contact.utmContent || "",
    referrerUrl: contact.referrer || "",
    hasRadarAnalysis: false,
  };
}

const CLASS_STYLES = {
  "A validar": { dot: "#6b7280", text: "#a1a1aa", bg: "rgba(107,114,128,0.12)" },
  Verde: { dot: "#22c55e", text: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  Amarelo: { dot: "#C9A96E", text: "#d9bc86", bg: "rgba(201,169,110,0.14)" },
  Vermelho: { dot: "#FF3F85", text: "#ff6ba0", bg: "rgba(255,63,133,0.12)" },
};

const SCORE_FIELDS = [
  ["notaGeral", "Nota geral"],
  ["clareza", "Clareza"],
  ["ux", "UX"],
  ["copy", "Copy"],
  ["conversao", "Conversão"],
  ["performance", "Performance"],
  ["seo", "SEO"],
  ["acessibilidade", "Acessibilidade"],
];

function fontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body, .radar-root { font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
      .mono { font-family: 'DM Mono', ui-monospace, monospace; }
      .radar-root ::selection { background: #8A38F5; color: white; }
      .radar-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .radar-scroll::-webkit-scrollbar-thumb { background: #3a3733; border-radius: 4px; }
      .radar-scroll::-webkit-scrollbar-track { background: transparent; }
      @keyframes sweep {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .sweep { animation: sweep 3s linear infinite; transform-origin: center; }
      textarea, input, select { font-family: inherit; }
      @media (max-width: 640px) {
        .commercial-summary { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------
// Small UI atoms
// ---------------------------------------------------------------------------
function Badge({ classificacao }) {
  const s = CLASS_STYLES[classificacao] || CLASS_STYLES["A validar"];
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.3,
        color: s.text,
        background: s.bg,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {classificacao}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES["Aguardando análise"];
  return <span className="mono" style={{ display: "inline-flex", padding: "4px 8px", borderRadius: 999, fontSize: 10.5, color: style.color, background: style.bg, whiteSpace: "nowrap" }}>{status}</span>;
}

function SectionLabel({ title, source }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "18px 0 8px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#d4d0c9" }}>{title}</div>
      {source && <span className="mono" style={{ fontSize: 9, color: source === "Dado do Scaneia" ? "#7fd9ff" : "#c9a8fb", background: source === "Dado do Scaneia" ? "rgba(28,191,255,.1)" : "rgba(138,56,245,.1)", borderRadius: 999, padding: "3px 7px", whiteSpace: "nowrap" }}>{source}</span>}
    </div>
  );
}

function Field({ label, value, onChange, multiline, mono, placeholder, type = "text" }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
    placeholder: placeholder || "—",
    style: {
      width: "100%",
      background: "#211f1c",
      border: "1px solid #38352f",
      borderRadius: 8,
      padding: "8px 10px",
      color: "#ece8e1",
      fontSize: 13.5,
      outline: "none",
      resize: "vertical",
      fontFamily: mono ? "'DM Mono', monospace" : "inherit",
    },
  };
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#8f8a80", marginBottom: 5, letterSpacing: 0.2 }}>{label}</div>
      {multiline ? (
        <textarea rows={multiline === true ? 3 : multiline} {...common} onFocus={(e) => (e.target.style.borderColor = "#8A38F5")} onBlur={(e) => (e.target.style.borderColor = "#38352f")} />
      ) : (
        <input type={type} {...common} onFocus={(e) => (e.target.style.borderColor = "#8A38F5")} onBlur={(e) => (e.target.style.borderColor = "#38352f")} />
      )}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------
export default function RadarTrinca() {
  const [companies, setCompanies] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("Todas");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [loadError, setLoadError] = useState("");

  // Merge the GHL contact base with analyses generated by Scaneia.
  useEffect(() => {
    (async () => {
      try {
        const [radarResponse, ghlResponse] = await Promise.all([
          fetch("/api/radar/analyses", { cache: "no-store" }),
          fetch("/api/ghl/contacts", { cache: "no-store" }),
        ]);
        const radarData = await radarResponse.json().catch(() => ({}));
        const ghlData = await ghlResponse.json().catch(() => ({}));
        if (!radarResponse.ok) throw new Error(radarData.error || "Não foi possível carregar as análises.");

        const analyses = (radarData.items || []).map(mapRadarAnalysis);
        if (!ghlResponse.ok) {
          setCompanies(analyses);
          setLoadError(ghlData.error || "As análises foram carregadas, mas os contatos do GHL não puderam ser consultados.");
          return;
        }

        const byContactId = new Map(analyses.filter((item) => item.ghlContactId).map((item) => [item.ghlContactId, item]));
        const byEmail = new Map(analyses.filter((item) => normalizedEmail(item.email)).map((item) => [normalizedEmail(item.email), item]));
        const matchedAnalysisIds = new Set();
        const merged = (ghlData.contacts || []).map((contact) => {
          const analysis = byContactId.get(contact.id) || byEmail.get(normalizedEmail(contact.email));
          if (!analysis) return mapGhlOnlyContact(contact);
          matchedAnalysisIds.add(analysis.id);
          return {
            ...analysis,
            ghlContactId: contact.id || analysis.ghlContactId,
            origemLead: analysis.origemLead || contact.source || "",
            utmSource: analysis.utmSource || contact.utmSource || "",
            utmMedium: analysis.utmMedium || contact.utmMedium || "",
            utmCampaign: analysis.utmCampaign || contact.utmCampaign || "",
            utmContent: analysis.utmContent || contact.utmContent || "",
            referrerUrl: analysis.referrerUrl || contact.referrer || "",
          };
        });
        setCompanies([...merged, ...analyses.filter((analysis) => !matchedAnalysisIds.has(analysis.id))]);
      } catch (e) {
        setLoadError(e.message || "Não foi possível carregar as análises.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const selected = companies.find((c) => c.id === selectedId) || null;

  const openCompany = async (id) => {
    setSelectedId(id);
    if (String(id).startsWith("ghl:")) return;
    try {
      const response = await fetch(`/api/radar/analyses/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os detalhes.");
      const detail = mapRadarAnalysis(data);
      setCompanies((prev) => prev.map((company) => company.id === String(id) ? { ...company, ...detail } : company));
    } catch (e) {
      setLoadError(e.message || "Não foi possível carregar os detalhes.");
    }
  };

  const updateCompany = (id, patch) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const saveReview = async (company) => {
    setSaveState("saving");
    const body = {
      principalEvidencia: company.principalEvidencia,
      ofertaRecomendada: company.ofertaRecomendada,
      justificativaOferta: company.justificativaOferta,
      mensagemSugerida: company.mensagemDM,
      proximoPasso: company.proximoPasso,
      alertas: String(company.alertasComerciais || "").split("\n").map((value) => value.trim()).filter(Boolean),
      classificacao: company.classificacao,
      resumoExecutivo: company.resumoExecutivo,
      pontosFortes: company.pontosFortes,
      principaisOportunidades: company.principaisOportunidades,
      impactoNegocio: company.impactoNegocio,
      fitTrinca: company.fitTrinca,
      sugestaoAbordagem: company.sugestaoAbordagem,
      maturidadeProduto: company.maturidadeProduto,
      sinaisProduto: String(company.sinaisProduto || "").split("\n").map((value) => value.trim()).filter(Boolean),
      analiseProduto: company.analiseProduto,
      oportunidadesProduto: company.oportunidadesProduto,
      tipoAtivo: company.tipoAtivo,
      objetivoProvavel: company.objetivoProvavel,
      nivelOportunidade: company.nivelOportunidade,
      justificativaOportunidade: company.justificativaOportunidade,
      dorDominante: company.dorDominante,
      ganchoPrincipal: company.ganchoPrincipal,
      hipoteseDor: company.hipoteseDor,
      perguntasDescoberta: String(company.perguntasDescoberta || "").split("\n").map((value) => value.trim()).filter(Boolean),
      possivelExpansao: company.possivelExpansao,
      reviewedBy: company.reviewedBy || "Radar Trinca",
    };
    try {
      const response = await fetch(`/api/radar/analyses/${encodeURIComponent(company.id)}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar a revisão.");
      const reviewed = mapRadarAnalysis(data);
      const retainedNewFields = {
        tipoAtivo: data.tipoAtivo || company.tipoAtivo,
        objetivoProvavel: data.objetivoProvavel || company.objetivoProvavel,
        nivelOportunidade: data.nivelOportunidade || company.nivelOportunidade,
        justificativaOportunidade: data.justificativaOportunidade || company.justificativaOportunidade,
        dorDominante: data.dorDominante || company.dorDominante,
        ganchoPrincipal: data.ganchoPrincipal || company.ganchoPrincipal,
        hipoteseDor: data.hipoteseDor || company.hipoteseDor,
        perguntasDescoberta: Array.isArray(data.perguntasDescoberta) ? data.perguntasDescoberta.join("\n") : (data.perguntasDescoberta || company.perguntasDescoberta),
        possivelExpansao: data.possivelExpansao || company.possivelExpansao,
      };
      setCompanies((prev) => prev.map((item) => item.id === company.id ? { ...item, ...reviewed, ...retainedNewFields } : item));
      setSaveState("saved");
    } catch (e) {
      setSaveState("idle");
      throw e;
    }
  };

  const addCompany = (data) => {
    const id = "NEW-" + Date.now().toString(36).toUpperCase();
    setCompanies((prev) => [
      ...prev,
      {
        id,
        segmento: "Saúde",
        pais: "Brasil",
        website: "",
        modelo: "B2B",
        prioridade: "Média",
        nome: "",
        produto: "",
        ...BLANK_ANALYSIS_FIELDS,
        ...data,
      },
    ]);
    setSelectedId(id);
    setShowAdd(false);
  };

  const stats = useMemo(() => {
    const total = companies.length;
    const analisadas = companies.filter((c) => c.statusAnalise === "Analisada").length;
    const verde = companies.filter((c) => c.classificacao === "Verde").length;
    const amarelo = companies.filter((c) => c.classificacao === "Amarelo").length;
    const vermelho = companies.filter((c) => c.classificacao === "Vermelho").length;
    const porStatus = Object.fromEntries(
      COMMERCIAL_STATUSES.map((s) => [s, companies.filter((c) => c.statusComercial === s).length])
    );
    return { total, analisadas, verde, amarelo, vermelho, porStatus };
  }, [companies]);

  const filtered = companies.filter((c) => {
    const matchesFilter = filter === "Todas" || c.classificacao === filter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || c.nome.toLowerCase().includes(q) || c.produto.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="radar-root radar-scroll" style={{ minHeight: "100vh", background: "#1E1D1B", color: "#ece8e1" }}>
      {fontStyles()}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #302d28", position: "sticky", top: 0, background: "#1E1D1B", zIndex: 20 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#8A38F5,#1CBFFF)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Radar size={18} color="#fff" className="sweep" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>Radar Trinca</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: "#65605a", minWidth: 70, textAlign: "right" }}>
                {saveState === "saving" ? "salvando…" : loaded ? "salvo" : ""}
              </span>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#8A38F5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 13px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Plus size={15} /> Nova empresa
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mono" style={{ fontSize: 10, color: "#65605a", marginTop: 18, letterSpacing: 0.3 }}>
            CLASSIFICAÇÃO
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 8, marginTop: 6 }}>
            <Stat label="Mapeadas" value={stats.total} />
            <Stat label="Analisadas" value={stats.analisadas} />
            <Stat label="Verde" value={stats.verde} color={CLASS_STYLES.Verde.text} />
            <Stat label="Amarelo" value={stats.amarelo} color={CLASS_STYLES.Amarelo.text} />
            <Stat label="Vermelho" value={stats.vermelho} color={CLASS_STYLES.Vermelho.text} />
          </div>

          <div className="mono" style={{ fontSize: 10, color: "#65605a", marginTop: 14, letterSpacing: 0.3 }}>
            INTELIGÊNCIA COMERCIAL
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 8, marginTop: 6 }}>
            {COMMERCIAL_STATUSES.map((status) => (
              <Stat key={status} label={status} value={stats.porStatus[status]} color={STATUS_STYLES[status].color} />
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {["Todas", "A validar", "Verde", "Amarelo", "Vermelho"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="mono"
                style={{
                  padding: "5px 11px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                  border: "1px solid " + (filter === f ? "#8A38F5" : "#38352f"),
                  background: filter === f ? "rgba(138,56,245,0.15)" : "transparent",
                  color: filter === f ? "#c9a8fb" : "#a1a1aa",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                {f}
              </button>
            ))}
            <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
              <Search size={14} color="#65605a" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar empresa…"
                style={{
                  width: "100%",
                  background: "#211f1c",
                  border: "1px solid #38352f",
                  borderRadius: 8,
                  padding: "7px 10px 7px 32px",
                  color: "#ece8e1",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 20px 60px" }}>
        {loadError && (
          <div style={{ marginBottom: 14, border: "1px solid rgba(255,63,133,.35)", background: "rgba(255,63,133,.1)", color: "#ff8ab4", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
            {loadError}
          </div>
        )}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#65605a" }}>
            Nenhuma empresa encontrada com esse filtro.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((c, index) => (
              <button
                key={c.id}
                onClick={() => openCompany(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  width: "100%",
                  textAlign: "left",
                  background: "#242220",
                  border: "1px solid #302d28",
                  borderRadius: 10,
                  padding: "12px 14px",
                  cursor: "pointer",
                  transition: "border-color .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4a463f")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#302d28")}
              >
                <span className="mono" style={{ fontSize: 11, color: "#65605a", width: 62, flexShrink: 0 }}>
                  {index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.nome}
                  </div>
                  <div style={{ fontSize: 12, color: "#8f8a80", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.produto}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {c.notaGeral != null && (
                    <span className="mono" style={{ fontSize: 12, color: "#8f8a80" }}>
                      {c.notaGeral}/10
                    </span>
                  )}
                  {c.ofertaRecomendada && <span style={{ fontSize: 11, color: "#c9a8fb", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.ofertaRecomendada}</span>}
                  <StatusBadge status={c.statusComercial} />
                  <Badge classificacao={c.classificacao} />
                  <ChevronRight size={16} color="#65605a" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (selected.hasRadarAnalysis === false ? (
        <GhlOnlyDrawer company={selected} onClose={() => setSelectedId(null)} />
      ) : (
        <CompanyDrawer
          company={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateCompany(selected.id, patch)}
          onSaveReview={saveReview}
        />
      ))}

      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onAdd={addCompany} />}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: "#242220", border: "1px solid #302d28", borderRadius: 8, padding: "8px 10px" }}>
      <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: color || "#ece8e1", lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, color: "#8f8a80", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function GhlOnlyDrawer({ company, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <aside className="radar-scroll" style={{ position: "relative", width: "min(560px,100%)", height: "100%", overflowY: "auto", background: "#1E1D1B", borderLeft: "1px solid #302d28", padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 21 }}>{company.nome}</h2>
            <div style={{ marginTop: 8 }}><StatusBadge status="Sem Full" /></div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: 0, color: "#8f8a80", cursor: "pointer" }}><X size={20} /></button>
        </div>

        <div style={{ marginTop: 24, padding: 16, borderRadius: 10, border: "1px solid rgba(138,56,245,.3)", background: "rgba(138,56,245,.08)" }}>
          <div style={{ fontWeight: 700, color: "#d8c1ff" }}>Este contato ainda não tem Full no Radar</div>
          <p style={{ margin: "8px 0 0", color: "#a9a39a", fontSize: 13.5, lineHeight: 1.55 }}>
            O contato foi importado do GHL somente para consulta. Gere o relatório manualmente no Scaneia; quando o Full terminar, a análise será vinculada automaticamente pelo contato ou e-mail.
          </p>
          <a href="https://scaneia.com/interno" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 14, borderRadius: 8, background: "#8A38F5", color: "white", padding: "9px 13px", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <ExternalLink size={14} /> Rodar Full manualmente
          </a>
        </div>

        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          {[
            ["E-mail", company.email],
            ["Telefone", company.telefone],
            ["URL do site", company.website],
            ["Origem", company.origemLead],
            ["UTM source", company.utmSource],
            ["UTM medium", company.utmMedium],
            ["UTM campaign", company.utmCampaign],
          ].map(([label, value]) => (
            <div key={label} style={{ borderBottom: "1px solid #302d28", paddingBottom: 10 }}>
              <div style={{ color: "#65605a", fontSize: 10.5 }}>{label}</div>
              <div style={{ marginTop: 3, color: value ? "#d4d0c9" : "#65605a", fontSize: 13, overflowWrap: "anywhere" }}>
                {label === "Telefone" ? <WhatsAppLink phone={value} /> : (value || "—")}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Company detail drawer — includes the "cole o relatório" AI extraction flow
// ---------------------------------------------------------------------------
function CompanyDrawer({ company, onClose, onUpdate, onSaveReview }) {
  const [reportText, setReportText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("analise"); // analise | produto | comercial
  const [fileName, setFileName] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Finds `marker`, then extracts the JSON object literal that follows it,
  // respecting nested braces and quoted strings (so braces inside strings don't break it).
  function extractJsonAfterMarker(raw, marker) {
    const markerIdx = raw.indexOf(marker);
    if (markerIdx === -1) return null;
    const start = raw.indexOf("{", markerIdx);
    if (start === -1) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < raw.length; i++) {
      const ch = raw[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return raw.slice(start, i + 1);
      }
    }
    return null;
  }

  // Builds a compact, business-facing digest from the raw Scaneia bundle —
  // drops the verbose raw rule-checklists and keeps scores + narrative insights.
  function digestScaneiaBundle(bundle) {
    const pick = (obj, keys) => {
      if (!obj) return undefined;
      const out = {};
      keys.forEach((k) => {
        if (obj[k] !== undefined) out[k] = obj[k];
      });
      return out;
    };
    const digest = {
      url: bundle.url,
      meta: bundle.meta,
      analyzedAt: bundle.analyzedAt,
      totalScore: bundle.totalScore,
      scores: bundle.scores && pick(bundle.scores, ["global", "dev", "copy", "design", "mercado", "confidence", "conversionLoss"]),
      scoreByArea: bundle.scoreByArea,
      criticalCount: bundle.criticalCount,
      copyGaps: bundle.copy && bundle.copy.gaps,
      designGaps: bundle.design && bundle.design.gaps,
      mercadoPosicao: bundle.mercado && bundle.mercado.posicao,
      competitors: bundle.competitors,
      strategicInsights:
        bundle.strategicInsights &&
        bundle.strategicInsights.insights &&
        bundle.strategicInsights.insights.map((i) => pick(i, ["title", "body", "content", "impact", "priority", "dimension"])),
      actionPlan: bundle.actionPlan && bundle.actionPlan.aiPlan,
    };
    return JSON.stringify(digest, null, 2);
  }

  function handleFilePick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      let text = raw;
      let source = "texto extraído";

      const bundleJson = extractJsonAfterMarker(raw, "__SCANAI_OFFLINE_BUNDLE__");
      if (bundleJson) {
        try {
          const bundle = JSON.parse(bundleJson);
          text = digestScaneiaBundle(bundle);
          source = "dados do relatório Scaneia";
          const round1 = (n) => Math.round(n * 10) / 10;
          onUpdate({
            scoreProdutoDesign: bundle.scores && bundle.scores.design != null ? round1(bundle.scores.design / 10) : null,
            scoreProdutoTecnologia: bundle.scores && bundle.scores.dev != null ? round1(bundle.scores.dev / 10) : null,
            criticalCount: bundle.criticalCount != null ? bundle.criticalCount : null,
            confiancaScaneia: bundle.scores && bundle.scores.confidence != null ? bundle.scores.confidence : null,
          });
        } catch (err) {
          text = null; // fall through to HTML text extraction below
        }
      }

      if (!text) {
        const isHtml = /\.html?$/i.test(file.name) || /<html|<body|<!doctype html/i.test(raw.slice(0, 500));
        text = raw;
        if (isHtml) {
          try {
            const doc = new DOMParser().parseFromString(raw, "text/html");
            text = (doc.body && doc.body.innerText) || doc.documentElement.textContent || raw;
          } catch (err) {
            // fall back to raw if parsing fails
          }
        }
      }

      // collapse excessive blank lines
      text = text.replace(/\n{3,}/g, "\n\n").trim();
      const MAX_CHARS = 40000;
      let trimmed = false;
      if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
        trimmed = true;
      }
      setReportText(text);
      setFileName(file.name + " — " + source + (trimmed ? " (recortado)" : ""));
    };
    reader.onerror = () => setError("Não consegui ler esse arquivo. Tenta colar o texto manualmente.");
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function processarComIA() {
    if (!reportText.trim()) {
      setError("Cole o texto do relatório do Scaneia antes de processar.");
      return;
    }
    setError("");
    setProcessing(true);
    try {
      const systemPrompt = `Você é a camada de inteligência comercial do Radar Trinca. O Scaneia diagnostica o ativo; você transforma os achados em oportunidade e abordagem comercial.

Regras obrigatórias: não invente métricas ou fatos sobre a empresa; não assuma tráfego pago, baixa conversão ou causalidade; preserve números reais; use linguagem de hipótese quando houver inferência; não repita problemas; priorize 3 a 5 achados; traduza termos técnicos; seja específico, humano e conciso; evite linguagem genérica de consultoria e promessas.

Separe responsabilidades: diagnóstico explica o que foi encontrado; oportunidade explica onde a Trinca pode atuar; abordagem explica como iniciar a conversa. A mensagem deve ser curta, específica, sem pitch imediato e preferencialmente terminar em pergunta.

Responda APENAS com JSON válido usando estas chaves:
{
  "notaGeral": number|null, "clareza": number|null, "ux": number|null, "copy": number|null, "conversao": number|null, "performance": number|null, "seo": number|null, "acessibilidade": number|null,
  "classificacao": "Verde"|"Amarelo"|"Vermelho",
  "resumoExecutivo": string, "principalEvidencia": string, "pontosFortes": string, "impactoNegocio": string,
  "tipoAtivo": "Página de vendas"|"Landing page"|"Site institucional"|"E-commerce"|"SaaS"|"Plataforma"|"Curso / infoproduto"|"Página de serviço"|"Portfólio"|"Outro"|"Não identificado",
  "objetivoProvavel": string, "nivelOportunidade": "BAIXA"|"MÉDIA"|"ALTA", "justificativaOportunidade": string,
  "principaisOportunidades": string, "oportunidadesProduto": string, "ofertaRecomendada": string, "possivelExpansao": string,
  "dorDominante": string, "ganchoPrincipal": string, "hipoteseDor": string, "perguntasDescoberta": string[],
  "sugestaoAbordagem": string, "mensagemDM": string, "proximoPasso": string, "alertasComerciais": string[]
}`;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, company, reportText }),
      });

      const data = await response.json();

      if (!response.ok) {
        const apiMsg = data.error || `HTTP ${response.status}`;
        throw new Error(apiMsg);
      }

      if (!data.text || !data.text.trim()) {
        throw new Error("a IA não retornou texto");
      }
      let clean = data.text.replace(/```json|```/g, "").trim();
      // if there's stray text around the JSON, isolate the outermost {...} block
      const first = clean.indexOf("{");
      const last = clean.lastIndexOf("}");
      if (first > 0 || last < clean.length - 1) {
        if (first !== -1 && last !== -1 && last > first) clean = clean.slice(first, last + 1);
      }
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.sinaisProduto)) {
        parsed.sinaisProduto = parsed.sinaisProduto.join("\n");
      }
      if (Array.isArray(parsed.perguntasDescoberta)) parsed.perguntasDescoberta = parsed.perguntasDescoberta.join("\n");
      if (Array.isArray(parsed.alertasComerciais)) parsed.alertasComerciais = parsed.alertasComerciais.join("\n");

      onUpdate({
        ...parsed,
        maturidadeProduto: parsed.tipoAtivo || "Não identificado",
        analiseProduto: parsed.objetivoProvavel || "",
        fitTrinca: parsed.justificativaOportunidade || "",
        justificativaOferta: parsed.possivelExpansao || "",
        statusAnalise: "Analisada",
        dataAnalise: new Date().toLocaleDateString("pt-BR"),
      });
      setReportText("");
      setFileName("");
    } catch (e) {
      setError("Não consegui processar o relatório. Tenta colar de novo ou ajustar manualmente. (" + (e.message || "erro") + ")");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div
        className="radar-scroll"
        style={{
          position: "relative",
          width: "min(560px, 100%)",
          height: "100%",
          background: "#1E1D1B",
          borderLeft: "1px solid #302d28",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div style={{ position: "sticky", top: 0, background: "#1E1D1B", borderBottom: "1px solid #302d28", padding: "16px 20px", zIndex: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
            <div>
              <div className="mono" style={{ fontSize: 11, color: "#65605a" }}>{company.id}</div>
              <div style={{ fontWeight: 700, fontSize: 19 }}>{company.nome}</div>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 12, color: "#1CBFFF", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}
              >
                {company.website?.replace(/^https?:\/\//, "").replace(/\/$/, "")} <ExternalLink size={11} />
              </a>
              {company.telefone && (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <WhatsAppLink phone={company.telefone} />
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#8f8a80", cursor: "pointer", padding: 4 }}>
              <X size={20} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Badge classificacao={company.classificacao} />
            <span style={{ fontSize: 12, color: "#8f8a80" }}>{company.statusAnalise}</span>
            <span style={{ fontSize: 12, color: "#8f8a80" }}>· Oportunidade {company.nivelOportunidade || "—"}</span>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
            {[
              ["analise", "Diagnóstico"],
              ["produto", "Oportunidade"],
              ["comercial", "Abordagem"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  background: tab === key ? "#2c2925" : "transparent",
                  color: tab === key ? "#ece8e1" : "#8f8a80",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "18px 20px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <span style={{ color: "#8f8a80", fontSize: 11.5 }}>
              {company.statusComercial === "Revisada"
                ? "Alterações salvas aqui também serão sincronizadas nos campos Radar do GHL."
                : "Revise as três abas. Ao aprovar, o contato será marcado como revisado no GHL."}
            </span>
            <button
              onClick={async () => {
                setError("");
                setReviewSaving(true);
                try { await onSaveReview(company); }
                catch (e) { setError(e.message || "Não foi possível salvar a revisão."); }
                finally { setReviewSaving(false); }
              }}
              disabled={reviewSaving}
              style={{ background: "#8A38F5", color: "white", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 600, cursor: reviewSaving ? "default" : "pointer", opacity: reviewSaving ? .65 : 1, whiteSpace: "nowrap" }}
            >
              {reviewSaving
                ? "Sincronizando…"
                : company.statusComercial === "Revisada"
                  ? "Salvar alterações no GHL"
                  : "Aprovar e sincronizar no GHL"}
            </button>
          </div>
          {error && (
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 14, color: "#ff6ba0", fontSize: 12 }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}
          <div className="commercial-summary" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 7, marginBottom: 18 }}>
            {[
              ["Prioridade", company.nivelOportunidade || "—"],
              ["Ativo", company.tipoAtivo || "Não identificado"],
              ["Dor dominante", firstMeaningfulLine(company.dorDominante, company.principaisOportunidades)],
              ["Melhor gancho", firstMeaningfulLine(company.ganchoPrincipal, company.principalEvidencia)],
              ["Entrada Trinca", company.ofertaRecomendada || "—"],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "#242220", border: "1px solid #38352f", borderRadius: 8, padding: "8px 9px", minWidth: 0 }}>
                <div style={{ fontSize: 9.5, color: "#65605a", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 11.5, color: "#d4d0c9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={value}>{value}</div>
              </div>
            ))}
          </div>
          {tab === "analise" && (
            <>
              <div style={{ background: "rgba(28,191,255,.08)", border: "1px solid rgba(28,191,255,.22)", borderRadius: 10, padding: 12, marginBottom: 20, color: "#9edfff", fontSize: 12.5 }}>
                O Scaneia fornece os dados e scores. Os textos abaixo são uma interpretação comercial editável do diagnóstico.
              </div>

              {/* Classification override */}
              <label style={{ display: "block", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#8f8a80", marginBottom: 5 }}>Classificação do lead</div>
                <select
                  value={company.classificacao}
                  onChange={(e) => onUpdate({ classificacao: e.target.value })}
                  style={{
                    width: "100%",
                    background: "#211f1c",
                    border: "1px solid #38352f",
                    borderRadius: 8,
                    padding: "8px 10px",
                    color: "#ece8e1",
                    fontSize: 13.5,
                  }}
                >
                  {["A validar", "Verde", "Amarelo", "Vermelho"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              <SectionLabel title="Visão geral" source="Dado do Scaneia" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
                {SCORE_FIELDS.map(([key, label]) => (
                  <label key={key} style={{ display: "block" }}>
                    <div style={{ fontSize: 10, color: "#8f8a80", marginBottom: 4 }}>{label}</div>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={company[key] ?? ""}
                      readOnly
                      className="mono"
                      style={{
                        width: "100%",
                        background: "#211f1c",
                        border: "1px solid #38352f",
                        borderRadius: 7,
                        padding: "6px 8px",
                        color: "#ece8e1",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </label>
                ))}
              </div>
              <SectionLabel title="Diagnóstico principal" source="Interpretação comercial" />
              <Field label="Síntese conectada dos achados" multiline={4} value={company.resumoExecutivo} onChange={(v) => onUpdate({ resumoExecutivo: v })} />
              <SectionLabel title="Evidências principais" source="Dado do Scaneia" />
              <Field label="Até 5 evidências relevantes, preservando métricas reais" multiline={5} value={company.principalEvidencia || company.principaisOportunidades} onChange={(v) => onUpdate({ principalEvidencia: v })} />
              <SectionLabel title="O que já funciona" source="Interpretação comercial" />
              <Field label="Pontos positivos" multiline={3} value={company.pontosFortes} onChange={(v) => onUpdate({ pontosFortes: v })} />
              <SectionLabel title="Impacto provável" source="Hipótese comercial" />
              <Field label="Consequência potencial, sem afirmar causalidade" multiline={3} value={company.impactoNegocio} onChange={(v) => onUpdate({ impactoNegocio: v, hipoteseDor: v })} />
              <div style={{ fontSize: 11, color: "#65605a", marginTop: 4 }}>Última análise: {formatAnalysisDate(company.processadoEm)}</div>
            </>
          )}

          {tab === "produto" && (
            <>
              <div style={{ background: "rgba(138,56,245,.08)", border: "1px solid rgba(138,56,245,.22)", borderRadius: 10, padding: 12, marginBottom: 18, color: "#d8c1ff", fontSize: 12.5 }}>
                Esta aba traduz o diagnóstico em uma possível atuação da Trinca. As conclusões são hipóteses e devem ser validadas na conversa.
              </div>
              <SectionLabel title="Contexto do ativo" source="Interpretação comercial" />
              <label style={{ display: "block", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#8f8a80", marginBottom: 5 }}>Tipo de ativo</div>
                <select value={company.tipoAtivo} onChange={(e) => onUpdate({ tipoAtivo: e.target.value, maturidadeProduto: e.target.value })} style={{ width: "100%", background: "#211f1c", border: "1px solid #38352f", borderRadius: 8, padding: "8px 10px", color: "#ece8e1", fontSize: 13.5 }}>
                  {["Não identificado", "Página de vendas", "Landing page", "Site institucional", "E-commerce", "SaaS", "Plataforma", "Curso / infoproduto", "Página de serviço", "Portfólio", "Outro"].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <Field label="Objetivo provável do ativo · sinalizar quando for hipótese" multiline={3} value={company.objetivoProvavel} onChange={(v) => onUpdate({ objetivoProvavel: v, analiseProduto: v })} />
              <SectionLabel title="Nível da oportunidade" source="Interpretação comercial" />
              <label style={{ display: "block", marginBottom: 12 }}>
                <select value={company.nivelOportunidade} onChange={(e) => onUpdate({ nivelOportunidade: e.target.value })} style={{ width: "100%", background: "#211f1c", border: "1px solid #38352f", borderRadius: 8, padding: "8px 10px", color: "#ece8e1", fontSize: 13.5 }}>
                  {["BAIXA", "MÉDIA", "ALTA"].map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <Field label="Justificativa curta" multiline={3} value={company.justificativaOportunidade} onChange={(v) => onUpdate({ justificativaOportunidade: v, fitTrinca: v })} />
              <SectionLabel title="Principais bloqueios percebidos" source="Hipóteses comerciais" />
              <Field label="Máximo de 4, sem repetição" multiline={5} value={company.principaisOportunidades} onChange={(v) => onUpdate({ principaisOportunidades: v, dorDominante: firstMeaningfulLine(v) })} />
              <SectionLabel title="Onde a Trinca pode atuar" source="Interpretação comercial" />
              <Field label="Achado → capacidade coerente da Trinca" multiline={4} value={company.oportunidadesProduto} onChange={(v) => onUpdate({ oportunidadesProduto: v })} />
              <Field label="Entrada recomendada · concreta" multiline={3} value={company.ofertaRecomendada} onChange={(v) => onUpdate({ ofertaRecomendada: v })} />
              <Field label="Possível expansão · sem upsell agressivo" multiline={3} value={company.possivelExpansao} onChange={(v) => onUpdate({ possivelExpansao: v, justificativaOferta: v })} />
            </>
          )}

          {tab === "comercial" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#8f8a80", marginBottom: 5 }}>Status da análise comercial</div>
                  <StatusBadge status={company.statusComercial} />
                </div>
              </div>

              <div style={{ background: "#242220", border: "1px solid #38352f", borderRadius: 10, padding: 14, marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: "#8f8a80", marginBottom: 10 }}>Contexto do lead · dados de aquisição somente para leitura</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                  {[
                    ["Origem", company.origemLead],
                    ["UTM source", company.utmSource],
                    ["UTM medium", company.utmMedium],
                    ["UTM campaign", company.utmCampaign],
                    ["UTM term", company.utmTerm],
                    ["UTM content", company.utmContent],
                    ["Landing page", company.landingPageUrl, true],
                    ["Referrer", company.referrerUrl, true],
                  ].map(([label, value, isUrl]) => (
                    <div key={label} style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "#65605a" }}>{label}</div>
                      {value && isUrl ? (
                        <a href={value} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 2, color: "#1CBFFF", fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</a>
                      ) : (
                        <div style={{ fontSize: 12.5, color: value ? "#c9c4bb" : "#65605a", marginTop: 2, overflowWrap: "anywhere" }}>{value || "—"}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <SectionLabel title="Gancho principal" source="Interpretação comercial" />
              <Field label="Um único problema para abrir a conversa" multiline={2} value={company.ganchoPrincipal} onChange={(v) => onUpdate({ ganchoPrincipal: v })} />
              <SectionLabel title="Principal evidência" source="Dado do Scaneia" />
              <Field label="Dado concreto que sustenta o gancho" multiline={3} value={company.principalEvidencia} onChange={(v) => onUpdate({ principalEvidencia: v })} />
              <SectionLabel title="Hipótese de dor" source="Hipótese comercial" />
              <Field label="Possível consequência no negócio, sem tratar como certeza" multiline={3} value={company.hipoteseDor} onChange={(v) => onUpdate({ hipoteseDor: v, impactoNegocio: v })} />
              <SectionLabel title="Perguntas de descoberta" source="Interpretação comercial" />
              <Field label="2 a 4 perguntas, uma por linha" multiline={5} value={company.perguntasDescoberta} onChange={(v) => onUpdate({ perguntasDescoberta: v })} />
              <SectionLabel title="Estratégia de abordagem" source="Interpretação comercial" />
              <Field label="Evidência → pergunta → validação da dor → oferta" multiline={4} value={company.sugestaoAbordagem} onChange={(v) => onUpdate({ sugestaoAbordagem: v })} />
              <Field label="Mensagem sugerida · exige revisão humana" multiline={6} value={company.mensagemDM} onChange={(v) => onUpdate({ mensagemDM: v })} />
              <Field label="Próximo passo comercial" multiline={2} value={company.proximoPasso} onChange={(v) => onUpdate({ proximoPasso: v })} />
              <Field label="Alertas e cuidados de linguagem" multiline={3} value={company.alertasComerciais} onChange={(v) => onUpdate({ alertasComerciais: v })} />

              <SectionLabel title="Contato" />
              <Field label="Responsável / decisor" value={company.responsavel} onChange={(v) => onUpdate({ responsavel: v })} />
              <Field label="Cargo" value={company.cargo} onChange={(v) => onUpdate({ cargo: v })} />
              <Field label="LinkedIn" value={company.linkedin} onChange={(v) => onUpdate({ linkedin: v })} />
              <Field label="E-mail" value={company.email} onChange={(v) => onUpdate({ email: v })} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginTop: 14 }}>
                <div style={{ background: "#242220", border: "1px solid #38352f", borderRadius: 8, padding: 10 }}><div style={{ fontSize: 10, color: "#65605a" }}>Confiança da análise</div><div className="mono" style={{ marginTop: 4 }}>{company.confiancaRadar == null ? "—" : `${company.confiancaRadar}%`}</div></div>
                <div style={{ background: "#242220", border: "1px solid #38352f", borderRadius: 8, padding: 10 }}><div style={{ fontSize: 10, color: "#65605a" }}>Sincronização GHL</div><div style={{ marginTop: 4, fontSize: 12.5 }}>{company.statusGhl || "Não sincronizado"}</div></div>
              </div>

              {company.fullReportUrl && <a href={company.fullReportUrl} target="_blank" rel="noreferrer" style={{ color: "#1CBFFF", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, marginTop: 14 }}><ExternalLink size={14} /> Abrir relatório Full</a>}

              {(company.linkedin || company.email) && (
                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  {company.linkedin && (
                    <a href={company.linkedin} target="_blank" rel="noreferrer" style={{ color: "#1CBFFF", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
                      <Linkedin size={14} /> Abrir LinkedIn
                    </a>
                  )}
                  {company.email && (
                    <a href={"mailto:" + company.email} style={{ color: "#1CBFFF", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
                      <Mail size={14} /> Enviar e-mail
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add company modal
// ---------------------------------------------------------------------------
function AddCompanyModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ nome: "", produto: "", modelo: "B2B", website: "", prioridade: "Média" });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ position: "relative", width: "min(420px,100%)", background: "#242220", border: "1px solid #38352f", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Nova empresa</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8f8a80", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <Field label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
        <Field label="Produto / serviço" value={form.produto} onChange={(v) => setForm({ ...form, produto: v })} />
        <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
        <label style={{ display: "block", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#8f8a80", marginBottom: 5 }}>Prioridade</div>
          <select
            value={form.prioridade}
            onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
            style={{ width: "100%", background: "#211f1c", border: "1px solid #38352f", borderRadius: 8, padding: "8px 10px", color: "#ece8e1", fontSize: 13.5 }}
          >
            {["Alta", "Média", "Baixa"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => form.nome.trim() && onAdd(form)}
          disabled={!form.nome.trim()}
          style={{
            width: "100%",
            marginTop: 4,
            background: form.nome.trim() ? "#8A38F5" : "#3a3733",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: form.nome.trim() ? "pointer" : "default",
          }}
        >
          Adicionar ao Radar
        </button>
      </div>
    </div>
  );
}
