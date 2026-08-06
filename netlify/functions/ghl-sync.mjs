import { syncGhlContact } from "../../server/ghl.js";

export default async (request) => {
  if (request.method !== "POST") return Response.json({ error: "Método não permitido." }, { status: 405 });
  try {
    if (!process.env.RADAR_SYNC_SECRET || request.headers.get("X-Radar-Key") !== process.env.RADAR_SYNC_SECRET) {
      return Response.json({ error: "Chave de sincronização inválida." }, { status: 401 });
    }
    const { contactId, company } = await request.json();
    return Response.json(await syncGhlContact(contactId, company));
  } catch (error) {
    return Response.json({ error: error.message || "Não foi possível sincronizar com o GHL." }, { status: 502 });
  }
};

export const config = { path: "/api/ghl/sync" };
