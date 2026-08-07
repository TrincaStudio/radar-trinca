# Radar Trinca

Aplicação própria do Radar Comercial da Trinca, extraída do protótipo e preparada para hospedagem independente.

## Rodar localmente

1. Copie `.env.example` para `.env` e informe a chave do provedor de IA.
2. Rode `npm install`.
3. Desenvolvimento: `npm run dev`.
4. Produção: `npm run build` e depois `npm start`.

Nesta primeira versão os dados são salvos no `localStorage` do navegador, enquanto a chave de IA fica exclusivamente no servidor. Para uso multiusuário, o próximo passo é conectar autenticação e banco de dados.

## Arquitetura comercial

O Scaneia é responsável por processar o Full, persistir a análise comercial e sincronizar os campos `radar_*` no GoHighLevel. O Radar é a interface de consulta e revisão humana; ele não recebe credenciais do GHL, não move pipeline e não envia mensagens.

Para conectar a interface à API interna do Scaneia, configure no servidor/Netlify:

- `SCANEIA_INTERNAL_API_URL`: URL base do backend do Scaneia.
- `SCANEIA_INTERNAL_API_TOKEN`: credencial server-to-server exclusiva do Radar.

O navegador chama somente o proxy `/api/radar/analyses`. O token interno nunca deve ser exposto como variável `VITE_*`.

Contrato esperado:

- `GET /api/internal/radar/analyses`
- `GET /api/internal/radar/analyses/{id}`
- `PUT /api/internal/radar/analyses/{id}/review`

## Publicar no Netlify

Conecte este diretório a um repositório Git e importe o repositório no Netlify. O `netlify.toml` já define o build, a pasta publicada e a Function da IA.

No painel do site, cadastre `AI_API_KEY`, `AI_BASE_URL` e `AI_MODEL` em **Project configuration → Environment variables**. Não coloque a chave no repositório. Depois, dispare um novo deploy para aplicar as variáveis.
