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

- [x] Renomear visualmente a opção e o título do modal para **“Cesta Básica”**, mantendo IDs/funções internas compatíveis durante a migração.
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

## Especificação aprovada — Mascote da Economia

O mascote representa a contribuição real do usuário para alimentar o aplicativo. A regra aprovada é:

```text
bipar produto → informar preço → adicionar ao carrinho → salvar a cotação
→ contribuição válida → mascote evolui
```

Não contam como contribuição válida: apenas bipar, consultar um produto, informar um preço e cancelar, ou adicionar algo sem que a informação seja salva.

### Implementação futura do mascote

- [ ] Separar `itens no carrinho` de `contribuições válidas`.
- [ ] Fazer o mascote evoluir somente após confirmação de salvamento da cotação.
- [ ] Evitar contagem duplicada do mesmo registro ou repetição acidental da operação.
- [ ] Criar identificador do evento de contribuição para permitir idempotência na sincronização.
- [ ] Com internet, confirmar a evolução após a gravação bem-sucedida no Supabase.
- [ ] Sem internet, registrar a contribuição como `pendente` na fila local.
- [ ] Confirmar a evolução permanente somente depois da sincronização bem-sucedida.
- [ ] Exibir estado claro para contribuição pendente, sincronizada ou com erro.
- [ ] Persistir o progresso histórico do mascote para que ele não volte a zero ao esvaziar o carrinho.
- [ ] Contar cada produto no máximo uma vez por período de compra.
- [ ] Definir o período de compra como a sessão/lista atual, encerrada quando a compra for finalizada e salva.
- [ ] Liberar nova contagem do mesmo produto somente em um novo período de compra.
- [ ] Não contar novamente alterações de quantidade do mesmo produto na mesma compra.
- [ ] Manter separadas a regra de pontuação do mascote e a gravação histórica de cotações de preço.
- [ ] Definir níveis, metas e recompensas sem prejudicar o fluxo de leitura, carrinho ou offline.
- [ ] Manter a animação e a apresentação atuais como evolução visual incremental.
- [ ] Testar cancelamento, falha de rede, reenvio da fila, logout e troca de dispositivo.

### Critério de aceite do mascote

- Bipar sem salvar não altera o progresso.
- Cancelar antes de salvar não altera o progresso.
- Salvar uma cotação válida aumenta o progresso uma única vez.
- Salvar o mesmo produto novamente na mesma compra não aumenta o progresso pela segunda vez.
- O mesmo produto pode contar novamente quando uma nova compra for iniciada.
- Uma cotação offline fica pendente e só se torna contribuição confirmada após sincronização.
- Esvaziar o carrinho não apaga o progresso histórico do mascote.

## Especificação aprovada — Autenticação e confirmação de e-mail

O acesso completo ao aplicativo deverá exigir cadastro com e-mail, senha e confirmação do endereço. Depois do cadastro, o app deve informar claramente que o link de confirmação foi enviado e que a confirmação é necessária para liberar o acesso completo e a publicação de cotações colaborativas.

- [ ] Ativar e validar confirmação de e-mail no Supabase Auth.
- [ ] Após o cadastro, exibir mensagem clara com o endereço usado, orientação para verificar spam e botão para reenviar a confirmação.
- [ ] Oferecer ação `Já confirmei meu e-mail` para atualizar a sessão e verificar o status real no Supabase.
- [ ] Permitir corrigir o endereço ou reiniciar o cadastro sem perder o contexto local permitido.
- [ ] Remover o texto atual que promete “acesso liberado no mesmo instante”.
- [ ] Impedir publicação de cotação colaborativa enquanto `email_confirmed_at` estiver ausente.
- [ ] Definir se usuário não confirmado poderá apenas consultar e usar recursos locais.
- [ ] Garantir que RLS/backend valide a confirmação; não confiar apenas no JavaScript do navegador.
- [ ] Configurar URLs de redirecionamento e recuperação de senha do ambiente publicado.
- [ ] Testar e-mail válido, e-mail não confirmado, confirmação concluída, link expirado, reenvio e spam.
- [ ] Testar logout, login posterior e atualização da sessão após confirmação.
- [ ] Atualizar a Política de Privacidade com o fluxo de autenticação adotado.

## Melhoria aprovada — Menu lateral expansível

As seções **Comunidade & Ajuda** e **Legal & Institucional** deverão ficar recolhidas inicialmente para reduzir a altura visual do menu no celular. Ao tocar no título, o usuário poderá expandir as opções correspondentes.

- [x] Transformar o título de `Comunidade & Ajuda` em controle expansível.
- [x] Transformar o título de `Legal & Institucional` em controle expansível.
- [x] Iniciar as duas seções fechadas.
- [x] Exibir indicador visual de fechado/aberto (`▸`/`▾`).
- [x] Permitir abrir e fechar por toque, teclado e leitor de tela.
- [x] Usar `button`, `aria-expanded` e `aria-controls` corretamente.
- [x] Manter apenas uma das duas seções aberta por vez para preservar o espaço visual.
- [x] Manter intactas as funções: indicar para amigos, suporte, instalar aplicativo, política de privacidade e base legal.
- [x] Usar transição curta e respeitar `prefers-reduced-motion`.
- [ ] Testar o menu em telas pequenas e com o painel administrativo visível.

## Decisões aprovadas — Tela principal e fluxo de leitura

Após confirmar um produto, o aplicativo deve concluir a etapa de cotação e retornar à tela principal. A câmera não será reaberta automaticamente: a área do scanner ficará pronta visualmente, mas a câmera do dispositivo permanecerá desligada até o usuário tocar novamente em `Iniciar Câmera`.

- [x] Reformular o indicador `Meu Pré-Caixa` para deixar explícito o significado da quantidade, exibindo o número e a palavra `item/itens`.
- [x] Adicionar orientação visual quando a câmera estiver desligada: `Pronto para registrar sua compra`.
- [ ] Manter o retorno à tela principal depois de confirmar/adicionar um produto.
- [ ] Não reabrir a câmera automaticamente após o retorno.
- [ ] Garantir que a câmera real fique desligada em standby, preservando bateria e privacidade.
- [ ] Deixar o botão `Iniciar Câmera` disponível para a próxima leitura manual.
- [x] Confirmado no código: o carrinho já oferece `Finalizar e Salvar no Histórico`.
- [ ] Avaliar se a finalização existente precisa de confirmação antes de salvar.
- [ ] Ao finalizar, preservar histórico e cotações, fechar o período atual do mascote, limpar somente o carrinho ativo e preparar uma nova compra.
- [ ] Padronizar o fluxo de preço já existente e novo preço em uma única rotina de validação e salvamento.
- [ ] Garantir nome válido, preço válido e confirmação de discrepância antes da gravação.
- [ ] No modo online, confirmar o salvamento da cotação antes de considerar a contribuição válida.
- [ ] No modo offline, inserir primeiro na fila local com identificador único e status `pendente` antes de considerar a contribuição pendente.
- [ ] Adicionar o produto ao carrinho sem perder a compra pessoal, mas separar esse estado da confirmação da contribuição colaborativa.
- [ ] Fazer o mascote contar somente a contribuição confirmada ou pendente conforme a regra definida, nunca apenas a presença no carrinho.
- [ ] Retornar à tela principal sem perder nome, preço, mercado, produto ou status de sincronização.
- [ ] Testar confirmação de preço existente, novo preço, cancelamento, erro de rede, fila offline e nova leitura manual.

## Diretriz aprovada — Design inclusivo para todas as idades

A nova tela inicial deverá funcionar como uma estação de caixa simples e profissional, mas também precisa atender pessoas idosas e usuários com diferentes níveis de familiaridade digital. A clareza e a acessibilidade terão prioridade sobre excesso de elementos decorativos.

- [ ] Usar hierarquia visual simples: compra atual, leitura, ação principal, ferramentas auxiliares e mascote.
- [ ] Usar textos claros em português, evitando depender apenas de ícones, emojis ou abreviações.
- [ ] Usar tamanho de texto confortável e permitir ampliação sem quebrar o layout.
- [ ] Garantir contraste suficiente entre texto, fundo, botões e estados de erro/sucesso.
- [ ] Usar áreas de toque grandes e bem espaçadas, especialmente em `Iniciar Câmera`, `Ver Carrinho` e confirmação de preço.
- [ ] Não depender somente de cor para comunicar estado; combinar cor com texto, ícone ou mensagem.
- [ ] Manter botões e posições previsíveis entre as telas.
- [ ] Evitar mudanças automáticas inesperadas, incluindo reabertura automática da câmera.
- [ ] Exibir feedback visível após salvar, entrar na fila offline, falhar ou concluir uma compra.
- [ ] Usar confirmação para ações destrutivas ou que finalizem uma etapa importante.
- [ ] Garantir navegação por teclado, leitor de tela, foco visível e rótulos acessíveis.
- [ ] Respeitar `prefers-reduced-motion` e evitar animações essenciais para compreender o fluxo.
- [ ] Testar em celulares pequenos, telas grandes, zoom do navegador e diferentes níveis de brilho.
- [ ] Fazer teste prático com pessoas de idades diferentes, incluindo pelo menos um grupo de usuários idosos.
- [ ] Validar a tela contra critérios aplicáveis da WCAG e boas práticas de acessibilidade móvel.

## Diretriz aprovada — Mascote como estímulo de contribuição

O Mascote da Economia permanecerá na tela inicial porque oferece feedback visual e sensação de reconhecimento para quem registra preços. Ele deve estimular a colaboração de forma positiva, simples e transparente, sem competir com a leitura do código, o valor da compra ou as ações principais.

- [ ] Manter o mascote visível na tela inicial, em posição secundária e facilmente compreensível.
- [ ] Mostrar progresso baseado em contribuições salvas ou pendentes conforme as regras definidas, e não apenas em itens no carrinho.
- [ ] Usar mensagens positivas de reconhecimento após uma contribuição válida.
- [ ] Evitar punições, pressão excessiva, linguagem de culpa ou competição obrigatória.
- [ ] Explicar de forma simples por que o mascote evoluiu ou permanece aguardando sincronização.
- [ ] Diferenciar visualmente progresso da compra pessoal e contribuição para o aplicativo.
- [ ] Garantir que animações do mascote não sejam necessárias para entender o fluxo e respeitem redução de movimento.
- [ ] Manter textos, níveis e recompensas legíveis para pessoas idosas e usuários com baixa familiaridade digital.
- [ ] Testar se o mascote motiva sem atrapalhar a câmera, o carrinho, o preço ou a privacidade.

## Especificação aprovada — Métricas do painel administrativo

O painel administrativo deverá separar claramente métricas de cadastro, uso e contribuição, sem expor dados pessoais individuais. O resumo desejado é:

```text
Contas cadastradas
Contas confirmadas
Usuários ativos nos últimos 30 dias
Contribuidores de preços
Cotações registradas
Mercados cobertos
Cidades com dados
```

- [ ] Substituir o indicador ambíguo `Usuários / Acessos` por métricas com definições claras.
- [ ] Contar contas cadastradas diretamente no backend/Auth, sem usar apenas `device_id`.
- [ ] Contar contas com e-mail confirmado por `email_confirmed_at`.
- [ ] Definir e calcular usuários ativos em janelas de 1, 7 e 30 dias.
- [ ] Contar contribuidores distintos que salvaram ao menos uma cotação válida.
- [ ] Contar cotações válidas, sem duplicar reenvios offline.
- [ ] Contar mercados cobertos e cidades com dados por registros válidos.
- [ ] Exibir data/hora da última atualização das métricas.
- [ ] Implementar consulta administrativa protegida, Edge Function ou view segura; nunca expor `service_role` no navegador.
- [ ] Garantir que o painel mostre apenas dados agregados, sem e-mails, nomes, IDs de dispositivo ou localização individual.
- [ ] Definir retenção e minimização da telemetria conforme a Política de Privacidade.
- [ ] Testar as métricas com usuário não confirmado, usuário confirmado, visitante, contribuidor e registros offline.

## Decisão aprovada — Estratégia de custos e escala

O NutriPreço já foi concebido para uso nacional, com estados e cidades selecionáveis. A implementação começará usando os recursos gratuitos do Supabase, sem contratar planos pagos antecipadamente. A migração para planos pagos será avaliada somente quando houver crescimento real de usuários/uso, quando os limites gratuitos estiverem próximos de ser alcançados ou quando forem necessários recursos adicionais de disponibilidade, backup, suporte, armazenamento ou processamento. A abrangência nacional, por si só, não será um gatilho de migração.

- [ ] Monitorar usuários ativos mensais, banco, armazenamento, transferência e invocações de Edge Functions.
- [ ] Definir alertas internos antes de atingir os limites do plano gratuito.
- [ ] Revisar mensalmente o consumo e registrar a decisão no projeto.
- [ ] Não expor chaves administrativas para evitar uso indevido e custos inesperados.
- [ ] Avaliar plano pago somente quando houver necessidade técnica, crescimento real ou proximidade das cotas.
- [ ] Antes da migração, comparar custos, backups, retenção, disponibilidade e recursos necessários.
- [ ] Planejar a migração sem interromper autenticação, preços, métricas, Cesta Básica e modo offline.
- [ ] Registrar a aprovação do plano pago e seu impacto operacional antes de contratar.

## Critérios de aceite

- O carrinho continua funcionando como antes.
- Uma cotação de produto oficial aparece na Cesta Básica sem cadastro duplicado.
- Um produto fora da lista oficial não aparece na Cesta Básica.
- Cidade e estado filtram corretamente os dados.
- O menor total é claramente diferente da média estatística.
- Nenhum produto ou cotação antiga é apagado durante a migração.
- Usuário comum não acessa dados ou ações administrativas protegidas.
- A experiência offline existente continua disponível.
