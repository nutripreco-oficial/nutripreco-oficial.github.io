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
