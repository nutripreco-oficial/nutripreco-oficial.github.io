# Referências técnicas — Supabase

Consultadas em 26/09/2026 para orientar a estratégia inicial do NutriPreço.

- [Supabase Pricing](https://supabase.com/pricing)
  - Plano Free: sem custo inicial, com limites de usuários ativos mensais, banco, transferência e armazenamento.
  - Plano Free pode ser pausado após período de inatividade.
  - Planos pagos, compute e add-ons devem ser conferidos novamente antes de qualquer contratação.
- [Edge Functions Pricing](https://supabase.com/docs/guides/functions/pricing)
  - Cota Free informada na documentação: 500.000 invocações.
  - Excedente documentado: US$ 2 por 1 milhão de invocações.
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
  - RLS deve ser habilitado nas tabelas expostas.
  - Grants e policies precisam ser avaliados juntos.
  - `service_role` bypassa RLS e deve permanecer somente no backend/Edge Function.
  - Views podem usar `security_invoker = true` em PostgreSQL 15+ para respeitar RLS.

## Decisão do projeto

O NutriPreço começa usando os recursos gratuitos. A abrangência nacional não é gatilho de migração, pois o produto já foi concebido para uso nacional. A avaliação de plano pago ocorrerá somente por crescimento real, proximidade de cotas ou necessidade técnica de disponibilidade, backups, suporte, armazenamento ou processamento.
