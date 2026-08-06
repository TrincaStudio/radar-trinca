const RADAR_FIELDS = {
  radar_url_analisada: (company) => company.website,
  radar_nota_geral: (company) => company.notaGeral,
  radar_problemas_criticos: (company) => company.criticalCount,
  radar_principal_evidencia: (company) => company.principaisOportunidades,
  radar_fit_trinca: (company) => company.fitTrinca,
  radar_abordagem_sugerida: (company) => company.sugestaoAbordagem,
  radar_mensagem_sugerida: (company) => company.mensagemDM,
  radar_proximo_passo: (company) => company.proximoPasso,
  radar_status_analise: (company) => company.statusAnalise,
  radar_data_analise: (company) => company.dataAnalise,
};

function getConfig() {
  if (!process.env.GHL_PRIVATE_TOKEN) throw new Error("GHL_PRIVATE_TOKEN não configurado.");
  if (!process.env.GHL_LOCATION_ID) throw new Error("GHL_LOCATION_ID não configurado.");
  let fieldMap;
  try {
    fieldMap = JSON.parse(process.env.GHL_FIELD_MAP || "{}");
  } catch {
    throw new Error("GHL_FIELD_MAP não contém um JSON válido.");
  }
  return { fieldMap, token: process.env.GHL_PRIVATE_TOKEN };
}

export async function syncGhlContact(contactId, company) {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(contactId || "")) throw new Error("Contact ID do GHL inválido.");
  const { fieldMap, token } = getConfig();
  const customFields = Object.entries(RADAR_FIELDS).flatMap(([radarKey, read]) => {
    const id = fieldMap[radarKey];
    const value = read(company || {});
    if (!id || value === null || value === undefined || value === "") return [];
    const safeValue = typeof value === "string" ? value.slice(0, 5000) : value;
    return [{ id, fieldValue: safeValue }];
  });
  if (!customFields.length) throw new Error("Nenhum campo Radar foi mapeado ou possui valor para sincronizar.");

  const response = await fetch(`https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: process.env.GHL_API_VERSION || "2021-07-28",
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customFields }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.error || `GHL respondeu HTTP ${response.status}.`);
  return { updatedFields: customFields.length, contactId };
}
