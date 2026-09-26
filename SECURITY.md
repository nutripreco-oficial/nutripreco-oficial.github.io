# Segurança e LGPD — NutriPreço

## Escopo

O frontend contém apenas uma chave pública do Supabase (`sb_publishable_*`). Ela pode aparecer no navegador. **Não coloque service role key, tokens privados ou credenciais administrativas no repositório.**

## Obrigatório no Supabase antes de produção

1. Ativar RLS em todas as tabelas: `produtos`, `mercados`, `registros_precos`, `app_telemetria` e tabelas auxiliares.
2. Permitir leitura pública somente dos campos necessários para consulta colaborativa.
3. Permitir inserção de preços para usuários autenticados ou, se visitante for permitido, validar limites, formato, cidade e frequência em uma Edge Function.
4. Restringir `UPDATE`/`DELETE` de preços e mercados ao autor do registro ou a uma role administrativa verificada no servidor.
5. Não usar e-mail do navegador como autorização. A lista `ADMIN_EMAILS` no cliente serve apenas para ocultar/mostrar UI; não é controle de segurança.
6. Restringir `app_telemetria` a dados mínimos, sem e-mail, nome ou conteúdo sensível; aplicar retenção e acesso administrativo.
7. Configurar confirmação de e-mail, recuperação de senha, limites de tentativa e URLs permitidas.
8. Criar fluxo de exclusão real de conta em Edge Function com verificação de sessão e remoção/anonimização dos dados associados.
9. Revisar Storage: buckets privados por padrão, políticas por usuário e limites de tamanho/tipo para imagens de encartes.
10. Auditar as políticas com uma sessão anônima e uma sessão autenticada que não seja administradora.

## Verificação mínima

- Usuário anônimo não consegue `DELETE`, `UPDATE` ou listar dados privados.
- Usuário A não consegue ler ou apagar histórico privado de usuário B.
- Usuário autenticado comum não consegue apagar preços/mercados de terceiros.
- Expiração de sessão remove as permissões administrativas da interface e do servidor.
- A exclusão de conta retorna sucesso somente após a remoção efetiva, não apenas após logout.

## Dados locais

Carrinho, histórico, listas, preferências, cache de produtos e fila offline são armazenados no `localStorage` do dispositivo. O usuário deve limpar os dados do navegador para remoção local imediata. Não guardar senhas no `localStorage`.

## Incidente e contato

Não commitar chaves privadas. Em caso de exposição, revogar/rotacionar imediatamente no provedor e revisar o histórico do Git. Solicitações de privacidade devem seguir o contato publicado em `privacidade.html`.
