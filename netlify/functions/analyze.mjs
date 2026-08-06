export default async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Método não permitido." }, { status: 405 });
  }

  try {
    const { systemPrompt, company, reportText } = await request.json();
    if (!reportText || !company) {
      return Response.json({ error: "Relatório e empresa são obrigatórios." }, { status: 400 });
    }
    if (!process.env.AI_API_KEY) {
      return Response.json({ error: "AI_API_KEY não configurada no Netlify." }, { status: 503 });
    }

    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4.1-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Empresa: ${company.nome}\nProduto/serviço: ${company.produto}\nModelo: ${company.modelo}\nWebsite: ${company.website}\n\nRelatório do Scaneia:\n${reportText}`,
          },
        ],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) throw new Error(data?.error?.message || "Falha no provedor de IA.");
    return Response.json({ text: data?.choices?.[0]?.message?.content || "" });
  } catch (error) {
    return Response.json({ error: error.message || "Não foi possível processar a análise." }, { status: 502 });
  }
};

export const config = { path: "/api/analyze" };
