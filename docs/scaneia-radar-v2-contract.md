# Contrato Radar comercial v2

O Radar continua usando os endpoints internos atuais do Scaneia:

- `GET /api/internal/radar/analyses`
- `GET /api/internal/radar/analyses/{id}`
- `PUT /api/internal/radar/analyses/{id}/review`

## Novos campos

As respostas de lista/detalhe e o body de revisão devem aceitar estes campos opcionais:

- `tipoAtivo`: string
- `objetivoProvavel`: string
- `nivelOportunidade`: `BAIXA`, `MÉDIA` ou `ALTA`
- `justificativaOportunidade`: string
- `dorDominante`: string
- `ganchoPrincipal`: string
- `hipoteseDor`: string
- `perguntasDescoberta`: array de strings
- `possivelExpansao`: string

Todos devem ser opcionais para preservar registros antigos. O Radar possui fallback para o contrato anterior.

## Responsabilidade das abas

- Diagnóstico: fatos, scores e evidências do Scaneia, além de interpretação conectada dos achados.
- Oportunidade: tipo e objetivo provável do ativo, nível e justificativa da oportunidade, bloqueios, áreas de atuação, entrada e expansão.
- Abordagem: gancho, evidência, hipótese de dor, perguntas, estratégia, mensagem, próximo passo e cuidados.

## Geração por IA

A geração automática deve obedecer às regras do briefing: não inventar métricas ou fatos, não assumir tráfego ou baixa conversão, separar fato de hipótese, limitar e não repetir achados, preservar números reais e evitar linguagem genérica.

## GHL

A aprovação humana permanece obrigatória. Os oito campos atuais devem continuar funcionando. Campos adicionais só devem ser escritos depois de seus custom fields serem criados e seus IDs configurados; nunca alterar UTM, source, campanha, oportunidade, pipeline, tags, responsável ou dados pessoais.

## Ordem segura de implantação

1. Adicionar colunas opcionais e contrato v2 no Scaneia.
2. Atualizar prompt, parser, persistência, DTOs e testes do Scaneia.
3. Fazer deploy do Scaneia com os novos campos ainda opcionais no GHL.
4. Publicar o Radar.
5. Criar/configurar campos adicionais no GHL somente se forem desejados.
6. Reprocessar leads antigos apenas mediante ação explícita; não sobrescrever revisões humanas.
