export const labels = {
  P1_FIRE: "P1 · Alta prioridade",
  P2_FOLLOW_UP: "P2 · Follow-up",
  P3_NURTURE: "P3 · Nutrição",
  TALK_TO_TRINCA: "Falar com a Trinca",
  SCANEIA_FULL_GIFT: "Scaneia Full",
  RECURRENT: "Vende de forma recorrente",
  IRREGULAR: "Vendas irregulares",
  INITIAL: "Operação inicial",
  IDEA: "Ainda na ideia",
  PRODUCT: "Produto",
  CONVERSION: "Conversão",
  MANUAL_OPS: "Operação manual",
  AI_OPS: "IA / automação",
  EXPERIENCE: "Experiência",
  DISCOVERY: "Descoberta",
  NARRATIVE: "Narrativa / posicionamento",
  ACTIVE_OPERATION: "Operação ativa",
  ACTIVE_PAGE_HIGH_TRAFFIC: "Página ativa com tráfego",
  ACTIVE_PAGE_NO_TRAFFIC: "Página ativa sem tráfego",
  DISCOVERY_STAGE: "Em descoberta",
  DECISION_MAKER: "Decisor(a)",
  LEADER: "Liderança",
  TEAM: "Time",
  SYNCED: "Sincronizado",
  NOT_AUTHORIZED: "Não autorizado",
  NOT_PENDING: "Sem pendência",
};

export const translate = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  const stringValue = String(value);
  if (stringValue === "true") return "Sim";
  if (stringValue === "false") return "Não";
  return labels[stringValue] ?? stringValue.replaceAll("_", " ").toLowerCase().replace(/^./, (s) => s.toUpperCase());
};

export const leadKey = (lead) =>
  String(lead["Lead ID"] || lead.Email || lead.Telefone || `${lead.Nome}-${lead._row || "x"}`);

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
};

export const normalizePhone = (value) => {
  if (!value) return "—";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return String(value);
};

export const commercialReading = (lead) => {
  const bits = [];
  const priority = String(lead.Prioridade || "");
  const role = String(lead["Papel no negócio"] || "");
  const maturity = String(lead.Maturidade || "");
  const pain = lead["Dor principal"];
  const automation = lead["Automation fit"];
  const page = lead["Status página"];

  if (priority === "P1_FIRE") bits.push("Lead quente e prioritário para contato comercial.");
  else if (priority === "P2_FOLLOW_UP") bits.push("Lead com potencial para follow-up consultivo.");
  else if (priority === "P3_NURTURE") bits.push("Lead mais adequado para nutrição antes da abordagem direta.");
  else bits.push("Lead ainda sem priorização FIRE definida.");

  if (role === "DECISION_MAKER") bits.push("É decisor(a), reduzindo atrito para avançar a oportunidade.");
  else if (role === "LEADER") bits.push("Ocupa posição de liderança e pode influenciar a decisão.");

  if (maturity === "RECURRENT") bits.push("Já possui recorrência de vendas e maior maturidade operacional.");
  if (maturity === "IDEA") bits.push("Ainda está em fase inicial, então a abordagem deve ser mais educativa.");
  if (pain) bits.push(`Dor principal identificada: ${translate(pain)}.`);
  if (String(automation) === "true" || automation === true) bits.push("Há fit declarado para automação.");
  if (page === "ACTIVE_PAGE_HIGH_TRAFFIC") bits.push("A operação já possui página ativa com tráfego, sinal de execução em andamento.");

  return bits.join(" ");
};

export const leadScore = (lead) => {
  let score = 0;
  if (lead.Prioridade === "P1_FIRE") score += 40;
  if (lead.Prioridade === "P2_FOLLOW_UP") score += 25;
  if (lead["Papel no negócio"] === "DECISION_MAKER") score += 20;
  if (lead["Papel no negócio"] === "LEADER") score += 12;
  if (lead.Maturidade === "RECURRENT") score += 20;
  if (lead.Maturidade === "IRREGULAR") score += 12;
  if (lead["Status página"] === "ACTIVE_PAGE_HIGH_TRAFFIC") score += 10;
  if (String(lead["Automation fit"]) === "true" || lead["Automation fit"] === true) score += 10;
  return Math.min(score, 100);
};
