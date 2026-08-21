import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forwardError, requestScaneia } from "./scaneia.js";
import { forwardGhlError, listGhlContacts } from "./highlevel.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
app.use(express.json({ limit: "2mb" }));

app.post("/api/analyze", async (req, res) => {
  const { systemPrompt, company, reportText } = req.body || {};
  if (!reportText || !company) return res.status(400).json({ error: "Relatório e empresa são obrigatórios." });
  if (!process.env.AI_API_KEY) return res.status(503).json({ error: "AI_API_KEY não configurada no servidor." });

  try {
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Empresa: ${company.nome}\nProduto/serviço: ${company.produto}\nModelo: ${company.modelo}\nWebsite: ${company.website}\n\nRelatório do Scaneia:\n${reportText}` },
        ],
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) throw new Error(data?.error?.message || "Falha no provedor de IA.");
    res.json({ text: data?.choices?.[0]?.message?.content || "" });
  } catch (error) {
    res.status(502).json({ error: error.message || "Não foi possível processar a análise." });
  }
});

app.get("/api/radar/analyses", async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    res.json(await requestScaneia(`/api/internal/radar/analyses${query ? `?${query}` : ""}`));
  } catch (error) {
    const forwarded = forwardError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.get("/api/ghl/contacts", async (_req, res) => {
  try {
    res.json(await listGhlContacts());
  } catch (error) {
    const forwarded = forwardGhlError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.get("/api/radar/analyses/:id", async (req, res) => {
  try {
    res.json(await requestScaneia(`/api/internal/radar/analyses/${encodeURIComponent(req.params.id)}`));
  } catch (error) {
    const forwarded = forwardError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.put("/api/radar/analyses/:id/review", async (req, res) => {
  try {
    res.json(await requestScaneia(`/api/internal/radar/analyses/${encodeURIComponent(req.params.id)}/review`, {
      method: "PUT",
      body: JSON.stringify(req.body || {}),
    }));
  } catch (error) {
    const forwarded = forwardError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.get("/api/radar/full-backfill", async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    res.json(await requestScaneia(`/api/internal/radar/full-backfill${query ? `?${query}` : ""}`));
  } catch (error) {
    const forwarded = forwardError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.post("/api/radar/full-backfill", async (req, res) => {
  try {
    res.json(await requestScaneia("/api/internal/radar/full-backfill", {
      method: "POST",
      body: JSON.stringify(req.body || {}),
    }));
  } catch (error) {
    const forwarded = forwardError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.post("/api/radar/full-backfill/process-ready", async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    res.json(await requestScaneia(`/api/internal/radar/full-backfill/process-ready${query ? `?${query}` : ""}`, {
      method: "POST",
    }));
  } catch (error) {
    const forwarded = forwardError(error);
    res.status(forwarded.status).json(forwarded.body);
  }
});

app.use(express.static(path.join(root, "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
app.listen(port, () => console.log(`Radar Trinca disponível na porta ${port}`));
