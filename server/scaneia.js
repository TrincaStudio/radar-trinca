function getConfig() {
  const baseUrl = (process.env.SCANEIA_INTERNAL_API_URL || "").replace(/\/$/, "");
  const token = process.env.SCANEIA_INTERNAL_API_TOKEN || "";
  if (!baseUrl || !token) {
    const error = new Error("Integração com o Scaneia ainda não configurada.");
    error.status = 503;
    throw error;
  }
  return { baseUrl, token };
}

export async function requestScaneia(path, options = {}) {
  const { baseUrl, token } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Scaneia respondeu HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export function forwardError(error) {
  const rawMessage = error?.message || "";
  const sensitiveDatabaseError = /could not execute statement|duplicate key|constraint|\bsql\b|customers_email_key|insert into/i.test(rawMessage);
  return {
    status: Number(error?.status) || 502,
    body: { error: sensitiveDatabaseError ? "O Scaneia não conseguiu processar esta solicitação." : (rawMessage || "Não foi possível consultar o Scaneia.") },
  };
}
