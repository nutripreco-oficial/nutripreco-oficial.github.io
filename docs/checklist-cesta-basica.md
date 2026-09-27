# Checklist de evolução — Cesta Básica

**Projeto:** NutriPreço  
**Status:** especificação consolidada; implementação ainda não iniciada  
**Última revisão:** 26/09/2026

## Como usar

- `[ ]` pendente
- `[-]` em andamento
- `[x]` concluído e validado
- Marcar um item somente depois de testar o comportamento correspondente.
- Toda alteração de banco deve ter backup e plano de reversão.

## Regras de negócio consolidadas

- [ ] Renomear a opção **“Radar de Preços & Cesta Básica”** para **“Cesta Básica”**.
- [ ] Manter o Radar geral e os produtos/cotações existentes em compatibilidade durante a migração; remover apenas a apresentação antiga após validação.
- [ ] A Cesta Básica deve ser uma visão dos registros de preços já feitos pelos usuários; não haverá cadastro de preço separado.
- [ ] O fluxo atual deve continuar funcionando: bipar → identificar/informar produto → informar preço → adicionar ao carrinho → registrar cotação.
- [ ] Produto fora da lista oficial continua no carrinho e no Radar geral, mas não entra na Cesta Básica.
- [ ] O indicador principal será **Menor total estimado da cesta**.
- [ ] O menor total será a soma do menor preço válido encontrado para cada item na localização escolhida.
- [ ] **Média de preços** será indicador secundário e nunca será usada como nome do menor total.
- [ ] Com “Todos os mercados”, cada item pode vir do mercado mais barato diferente.
- [ ] Com mercado específico, calcular somente com cotações daquele mercado.
- [ ] Não misturar cidades, estados, embalagens ou períodos sem deixar isso explícito.
- [ ] Ausência de cotação deve aparecer como “sem cotação”; não inventar nem substituir o preço.

## Lista de referência da cesta

Referência de trabalho baseada na composição tradicional informada para o projeto:

- [ ] Carne
- [ ] Leite
- [ ] Feijão
- [ ] Arroz
- [ ] Farinha
- [ ] Batata
- [ ] Tomate
- [ ] Pão
- [ ] Café
- [ ] Banana
- [ ] Açúcar
- [ ] Óleo ou banha
- [ ] Manteiga
- [ ] Margarina

> Manteiga e margarina serão exibidas separadamente na interface, conforme decisão do projeto. A fonte oficial, versão, região e quantidade de referência devem ser documentadas antes do cálculo final.

## Fase 0 — Preparação e segurança

- [ ] Confirmar conector Supabase ativo e acesso somente ao projeto correto.
- [ ] Auditar schema, tabelas, colunas, índices, views, Storage e políticas atuais.
- [ ] Fazer backup/exportação do banco antes de qualquer migration.
- [ ] Registrar o checksum e o local do backup.
- [ ] Confirmar estratégia de rollback.
- [ ] Validar RLS com usuário anônimo, usuário comum e administrador.
- [ ] Definir autorização administrativa no backend; não depender apenas de `ADMIN_EMAILS` no JavaScript.

## Fase 1 — Modelo de dados

- [ ] Criar tabela versionada de itens oficiais da cesta.
- [ ] Definir identificador estável do item: `carne`, `leite`, `feijao`, etc.
- [ ] Criar relação entre produto real e item oficial da cesta.
- [ ] Permitir classificação `pendente`, `validada` ou `rejeitada`.
- [ ] Preservar produtos e cotações antigas; não apagar dados automaticamente.
- [ ] Garantir que cada cotação tenha produto, preço, mercado, cidade, estado e data.
- [ ] Padronizar mercado sem perder o nome original informado.
- [ ] Padronizar cidade/UF e evitar mistura entre localidades.
- [ ] Registrar marca, código de barras, unidade, peso ou volume.
- [ ] Definir embalagem/peso de referência e regra de preço por unidade de medida.
- [ ] Definir período de validade das cotações, inicialmente avaliar últimos 30 dias.
- [ ] Definir como lidar com registros duplicados, inválidos e fora da realidade.

## Fase 2 — Classificação dos produtos

- [ ] Normalizar acentos, caixa, pontuação e abreviações dos nomes.
- [ ] Criar regras confiáveis para produto encontrado por código de barras.
- [ ] Criar regras para descrição informada manualmente.
- [ ] Mapear exemplos: arroz, feijão, óleo/banha, manteiga, margarina, leite e demais itens.
- [ ] Não classificar automaticamente casos ambíguos.
- [ ] Criar fila administrativa de produtos pendentes de classificação.
- [ ] Rodar uma prévia de classificação dos produtos já cadastrados.
- [ ] Revisar amostra antes de gravar qualquer classificação em massa.
- [ ] Registrar a origem e a data da classificação.

## Fase 3 — Cálculos e consultas

- [ ] Consultar somente a localização selecionada.
- [ ] Consultar somente cotações válidas e dentro do período definido.
- [ ] Encontrar o menor preço por item oficial.
- [ ] Guardar mercado e data do menor preço.
- [ ] Calcular o **menor total estimado** somando os menores preços dos itens disponíveis.
- [ ] Informar se o total está completo ou parcial.
- [ ] Calcular média, maior preço e quantidade de cotações como indicadores secundários.
- [ ] Calcular cesta por mercado específico.
- [ ] Comparar mercados sem misturar o total da cidade com o total de um mercado.
- [ ] Testar empate de preços e múltiplas cotações do mesmo produto.
- [ ] Testar cidade sem dados, item sem cotação e mercado sem item.

## Fase 4 — Nova interface do usuário

- [ ] Renomear a entrada do menu para **Cesta Básica**.
- [ ] Criar seleção de estado.
- [ ] Criar seleção de cidade dependente do estado.
- [ ] Exibir **Menor total estimado da cesta** em destaque.
- [ ] Exibir se o total é completo ou parcial.
- [ ] Criar filtro por mercado.
- [ ] Criar filtro por item/produto.
- [ ] Exibir os itens oficiais e seus menores preços.
- [ ] Exibir produto real, marca, peso/volume, mercado, cidade e data.
- [ ] Exibir média de preços somente como informação secundária.
- [ ] Exibir aviso quando não houver dados suficientes.
- [ ] Manter o Radar geral e o carrinho funcionais durante a migração.
- [ ] Garantir responsividade, acessibilidade e funcionamento em telas pequenas.

## Fase 5 — Área administrativa

- [ ] Adicionar opção **Relatório da Cesta Básica** ao painel administrativo.
- [ ] Criar resumo por estado, cidade, mercado, item e período.
- [ ] Mostrar menor preço, média, maior preço e quantidade de cotações.
- [ ] Listar produtos classificados e pendentes.
- [ ] Permitir revisar/corrigir a classificação de um produto.
- [ ] Permitir invalidar registro indevido sem apagar o histórico físico.
- [ ] Registrar auditoria das ações administrativas.
- [ ] Exportar CSV inicialmente.
- [ ] Avaliar PDF depois que o CSV e os cálculos forem validados.
- [ ] Proteger todas as consultas e alterações com RLS/backend.

## Fase 6 — Compatibilidade, testes e publicação

- [ ] Testar leitura de código de barras com produto encontrado.
- [ ] Testar produto sem descrição e nome manual.
- [ ] Testar inclusão no carrinho.
- [ ] Testar registro online no Supabase.
- [ ] Testar fila offline e sincronização posterior.
- [ ] Testar Radar/Cesta sem dados.
- [ ] Testar filtros de estado, cidade, mercado e produto.
- [ ] Testar cálculo do menor total com mercados diferentes.
- [ ] Testar login, logout e usuário sem permissão administrativa.
- [ ] Testar painel e relatório administrativo.
- [ ] Rodar validação de JavaScript/HTML e `git diff --check`.
- [ ] Fazer backup final antes da publicação.
- [ ] Publicar em commit separado e descritivo.
- [ ] Validar o site publicado no celular.
- [ ] Atualizar este checklist com os itens realmente concluídos.

## Critérios de aceite

- O carrinho continua funcionando como antes.
- Uma cotação de produto oficial aparece na Cesta Básica sem cadastro duplicado.
- Um produto fora da lista oficial não aparece na Cesta Básica.
- Cidade e estado filtram corretamente os dados.
- O menor total é claramente diferente da média estatística.
- Nenhum produto ou cotação antiga é apagado durante a migração.
- Usuário comum não acessa dados ou ações administrativas protegidas.
- A experiência offline existente continua disponível.
