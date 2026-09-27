# NutriPreço

Aplicativo web progressivo para consulta colaborativa de preços, leitura de códigos de barras e planejamento de compras.

## Checklist técnico

- [x] **Backup pré-alteração:** realizado fora do repositório antes deste ciclo; checksum SHA-256 registrado no relatório da execução.
- [x] **PWA:** manifesto com metadados de instalação, ícones 192/512 e service worker com atualização de cache e fallback offline.
- [x] **Modo offline local-first:** catálogo mínimo, preferências, carrinho, lista e fila de sincronização permanecem disponíveis sem rede.
- [x] **LGPD no cliente:** política publicada, minimização da telemetria e aviso de que dados locais ficam no dispositivo.
- [x] **Segurança do Supabase:** schema, índices, bucket e RLS executados com sucesso no Supabase.
- [x] **Exclusão de conta (LGPD):** função segura `excluir_minha_conta_lgpd()` com anonimização de cotações criada e conectada no cliente.
- [x] **Simplificação de UX:** Lista Prévia Dinâmica removida para focar 100% no carrinho pré-caixa de gôndola.
- [x] **Cesta Básica Nacional (DIEESE):** modal atualizado com 3 seletores dinâmicos (Estado, Cidade, Mercado), cálculo de cesta fechada dos 13 itens oficiais e ranking com cobertura.
- [x] **Gamificação do Mascote:** pontuação cumulativa permanente (+10 XP no 'Preço Confere' e +15 XP no 'Gravar no Pré-Caixa', nunca zera ao finalizar compra ou limpar carrinho, títulos e níveis 1 a 5 persistentes).
- [x] **GPS e Confirmação de Mercados (Integridade Presencial):**
  - Confirmação e seletor rápido no topo da tela do leitor com troca em 1 toque.
  - Fim do padrão fixo cego (mercado selecionado persistente ou autodetectado).
  - Cache local-first dos mercados com coordenadas para funcionar 100% offline em galpões e atacarejos.
  - Raio de tolerância de 350 metros (geofencing realista para hipermercados e estacionamentos).
  - Auto-calibração silenciosa (mercados com coordenadas nulas recebem GPS automaticamente no registro presencial).
  - Botão visível "🏪 ➕ Cadastrar Novo Mercado Aqui" com captura ao vivo de coordenadas.
  - Proteção contra mistura de produtos de mercados diferentes no mesmo carrinho pré-caixa.
- [x] **Tratamento Inteligente de Código de Barras e Gramatura:**
  - Fusão automática de `product_name` + `quantity` da base Open Food Facts (ex: "Café Pilão" + "500g" = "Café Pilão 500g").
  - Placeholder orientativo para produtos inéditos com tamanho/peso (Ex: Arroz Camil 5kg, Óleo Liza 900ml).
  - Suporte completo a itens de balança (`kg` vs `un`) com quantidade gravada fielmente no carrinho.
- [x] **Minhas Compras Salvas & Comparador Inteligente:**
  - Filtros de período: `[ ☀️ Hoje ]`, `[ 📅 Esta Semana ]`, `[ 🗓️ Este Mês ]`, `[ 📂 Todas ]` com totais dinâmicos.
  - Compartilhamento individual de compras salvas via WhatsApp formatado.
- [x] **Visor de Caixa Registradora (Frente de Caixa / PDV):**
  - Display estilo visor de caixa registradora para todas as idades: `[ Quantidade/Peso ] × [ Preço Unitário/Kg ] = [ Total a Pagar ]`.
  - Zero margem para erro de cálculo: display claro com grandes dígitos e atualização instantânea.
- [x] **Cálculo & Comparação por Quilo (R$/kg):**
  - Normalização automática para itens de açougue, hortifrúti, padaria e frios em `R$/kg`.
  - Cálculo bidirecional: permite informar o preço por quilo OU o valor da bandeja da balança com dedução do preço/kg.
  - Alerta comparativo indicando economia ou sobrepreço por quilo (ex: *"R$ 3,00/kg mais barato no Assaí"*).
- [x] **Destaque Imediato do Menor Preço da Cidade ao Bipar:**
  - Banner no topo da tela informando onde aquele produto foi encontrado pelo menor preço na cidade.
  - Sinalização instantânea: verde quando o mercado atual for o mais barato, ou vermelho apontando onde comprar mais barato.
- [x] **Busca em Cascata Multi-Base (100% Gratuita):**
  - Encadeamento sequencial: Cache Local ➔ Supabase `produtos` ➔ Open Food Facts (Alimentos) ➔ Open Beauty Facts (Higiene/Bebê) ➔ Open Products Facts (Limpeza/Pet).
  - Triplicação da cobertura automática de produtos industrializados sem custo de API.
- [ ] **Organização do código:** separar o monólito `index.html` em módulos após cobertura mínima de testes e sem alterar o comportamento em produção.

## Desenvolvimento local

O projeto é estático e pode ser servido com qualquer servidor HTTP. Por exemplo:

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173/`. O service worker exige HTTP(S); não use `file://` para validar o PWA.

## Integrações

- Supabase: autenticação e dados colaborativos.
- Open Food Facts: informações públicas de produtos.
- IBGE: lista de municípios, com cache e fallback local.
- Bibliotecas de câmera/OCR: carregadas do CDN quando há conexão.

A chave `sb_publishable_*` presente no cliente é uma chave pública, não um segredo. A proteção depende de RLS e políticas corretas no Supabase; consulte `SECURITY.md`.
