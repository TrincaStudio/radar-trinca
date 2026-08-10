function config() {
  const token = (process.env.GHL_PRIVATE_TOKEN || "").trim();
  const locationId = (process.env.GHL_LOCATION_ID || "").trim();
  const siteFieldId = (process.env.GHL_CUSTOM_FIELD_URL_DO_SITE || "").trim();
  if (!token || !locationId) {
    const error = new Error("Consulta ao GHL ainda não configurada.");
    error.status = 503;
    throw error;
  }
  return { token, locationId, siteFieldId };
}

function valueOf(field) {
  const value = field?.value ?? field?.fieldValue;
  return value == null ? "" : String(value).trim();
}

function normalizeContact(contact, siteFieldId) {
  const attribution = Array.isArray(contact.attributions) ? contact.attributions[0] || {} : {};
  const siteField = Array.isArray(contact.customFields)
    ? contact.customFields.find((field) => String(field?.id || "") === siteFieldId)
    : null;
  return {
    id: String(contact.id || ""),
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    name: contact.contactName || contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    email: contact.email || "",
    phone: contact.phone || "",
    website: valueOf(siteField),
    source: contact.source || attribution.medium || "",
    utmSource: attribution.utmSource || "",
    utmMedium: attribution.utmMedium || "",
    utmCampaign: attribution.campaign || "",
    utmContent: attribution.utmContent || "",
    referrer: attribution.referrer || "",
    dateAdded: contact.dateAdded || "",
  };
}

export async function listGhlContacts() {
  const { token, locationId, siteFieldId } = config();
  const url = new URL("https://services.leadconnectorhq.com/contacts/");
  url.searchParams.set("locationId", locationId);
  url.searchParams.set("limit", "100");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(`GHL respondeu HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  const contacts = Array.isArray(data.contacts) ? data.contacts : [];
  return { total: Number(data.count ?? contacts.length), contacts: contacts.map((contact) => normalizeContact(contact, siteFieldId)) };
}

export function forwardGhlError(error) {
  return {
    status: Number(error?.status) || 502,
    body: { error: error?.message || "Não foi possível consultar os contatos do GHL." },
  };
}
