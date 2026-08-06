# Radar Trinca

Aplicação própria do Radar Comercial da Trinca, extraída do protótipo e preparada para hospedagem independente.

## Rodar localmente

1. Copie `.env.example` para `.env` e informe a chave do provedor de IA.
2. Rode `npm install`.
3. Desenvolvimento: `npm run dev`.
4. Produção: `npm run build` e depois `npm start`.

Nesta primeira versão os dados são salvos no `localStorage` do navegador, enquanto a chave de IA fica exclusivamente no servidor. Para uso multiusuário, o próximo passo é conectar autenticação e banco de dados.

## Publicar no Netlify

Conecte este diretório a um repositório Git e importe o repositório no Netlify. O `netlify.toml` já define o build, a pasta publicada e a Function da IA.

No painel do site, cadastre `AI_API_KEY`, `AI_BASE_URL` e `AI_MODEL` em **Project configuration → Environment variables**. Não coloque a chave no repositório. Depois, dispare um novo deploy para aplicar as variáveis.
