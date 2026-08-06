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

## Integração segura com GoHighLevel

O Radar atualiza somente contatos existentes, identificados por `contactId`, e envia exclusivamente os campos personalizados listados em `GHL_FIELD_MAP`. A requisição não inclui origem, atribuição, UTMs, tags, responsável, oportunidades ou estágios de pipeline.

Crie uma Private Integration no sub-account correto com os escopos mínimos `contacts.write` e `locations/customFields.readonly`. Configure no Netlify:

- `GHL_PRIVATE_TOKEN`: token da Private Integration.
- `GHL_LOCATION_ID`: ID do sub-account.
- `GHL_API_VERSION`: `2021-07-28`.
- `RADAR_SYNC_SECRET`: uma senha longa e aleatória usada pela equipe ao acionar a sincronização.
- `GHL_FIELD_MAP`: JSON que relaciona cada chave `radar_*` ao ID do campo correspondente no GHL, seguindo o modelo de `.env.example`.

Crie no GHL campos de contato com os seguintes nomes: `Radar · URL analisada`, `Radar · Nota geral`, `Radar · Problemas críticos`, `Radar · Principal evidência`, `Radar · Fit Trinca`, `Radar · Abordagem sugerida`, `Radar · Mensagem sugerida`, `Radar · Próximo passo`, `Radar · Status da análise` e `Radar · Data da análise`. Use texto longo para evidência, fit, abordagem e mensagem; número para nota e problemas; texto curto para os demais.
