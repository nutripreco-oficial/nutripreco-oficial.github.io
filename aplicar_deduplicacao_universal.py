import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

busca_path = r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\busca.html'
with open(busca_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Deduplicar a base DATABASE_PRODUTOS no arquivo
m = re.search(r'const DATABASE_PRODUTOS = (\[.*?\]);', html, re.DOTALL)
if not m:
    print("❌ DATABASE_PRODUTOS não encontrado")
    sys.exit(1)

data = json.loads(m.group(1))
print(f"📊 Total antes da deduplicação: {len(data)}")

map_unicos = {}
for p in data:
    cid = (p.get('cidade') or '').lower().strip()
    merc = (p.get('mercado') or '').lower().strip()
    nome = (p.get('nome') or '').lower().strip()
    k = f"{cid}|{merc}|{nome}"
    if k not in map_unicos:
        map_unicos[k] = p
    else:
        d_ex = map_unicos[k].get('valido_ate') or map_unicos[k].get('data') or ''
        d_nv = p.get('valido_ate') or p.get('data') or ''
        if d_nv > d_ex:
            map_unicos[k] = p

produtos_deduplicados = list(map_unicos.values())
print(f"✅ Total após deduplicação universal estática: {len(produtos_deduplicados)} (Removidas {len(data) - len(produtos_deduplicados)} duplicatas)")

novo_db = "const DATABASE_PRODUTOS = " + json.dumps(produtos_deduplicados, ensure_ascii=False) + ";"
html = html[:m.start()] + novo_db + html[m.end():]

# 2. Adicionar função universal de extração de marca no JavaScript
funcao_marca_js = """
    // =========================================================================
    // EXTRATOR UNIVERSAL DE MARCA INTELIGENTE (ELIMINA SELO GENÉRICO 'GERAL')
    // =========================================================================
    function obterMarcaExibicao(nome, marcaOriginal) {
      if (marcaOriginal && marcaOriginal !== 'Geral' && marcaOriginal !== 'Auditada' && marcaOriginal !== 'N/A' && marcaOriginal.trim().length > 0) {
        return marcaOriginal.toUpperCase().trim();
      }
      const nomeUp = (nome || '').toUpperCase();
      const marcasConhecidas = [
        'TIO JOÃO', 'TIO JOAO', 'CAMIL', 'PRATO FINO', 'OURO BRANCO', 'SABOR MÁXIMO', 'SABOR MAXIMO',
        'GRANFINO', 'KICALDO', 'PANTERA', 'DONA BENTA', 'RENATA', 'BARILLA', 'VILMA', 'ADRIA',
        'MELITTA', 'PILÃO', 'PILAO', '3 CORAÇÕES', '3 CORACOES', 'CABOCLO', 'MARATÁ', 'MARATA',
        'SOYA', 'LIZA', 'LISA', 'CONCÓRDIA', 'CONCORDIA', 'LEVE', 'VITALIV', 'SALADA',
        'PIRACANJUBA', 'ITAMBÉ', 'ITAMBE', 'NINHO', 'MOLICO', 'PARMALAT', 'TIROL', 'CAPEL', 'ELEFANTE',
        'SADIA', 'PERDIGÃO', 'PERDIGAO', 'SEARA', 'AURORA', 'FRIBOI', 'LAR', 'SWIFT',
        'QUALITÁ', 'QUALITA', 'CARREFOUR', 'CASINO', 'OBA BEM QUERER', 'TAEQ', 'BOMPREÇO',
        'YPE', 'YPÊ', 'OMO', 'BRILHANTE', 'TIXAN', 'VEJA', 'LIMPOL', 'DOWNY', 'COMFORT', 'NEVE'
      ];
      for (const m of marcasConhecidas) {
        if (nomeUp.includes(m)) return m;
      }
      // Se não encontrou nas marcas conhecidas, analisa a estrutura do nome
      const palavras = (nome || '').split(' ');
      if (palavras.length >= 2 && ['arroz', 'feijão', 'feijao', 'óleo', 'oleo', 'café', 'cafe', 'leite'].includes(palavras[0].toLowerCase())) {
        return palavras[1].toUpperCase();
      }
      return marcaOriginal || 'Auditada';
    }
"""

if "function obterMarcaExibicao" not in html:
    pos_marca = html.find("function obterBadgeValidade(valido_ate) {")
    if pos_marca != -1:
        html = html[:pos_marca] + funcao_marca_js + "\n    " + html[pos_marca:]
        print("✅ Inserida função universal obterMarcaExibicao()")
    else:
        print("⚠️ Ponto de inserção obterBadgeValidade não encontrado")

# 3. Atualizar renderizarResultadosComida para aplicar deduplicação universal e contagem correta de mercados
# Localizar o trecho da ordenação e filtragem
bloco_antigo = """      if (termo && termo.length > 0) {
        produtos = produtos.filter(p => 
          p.nome.toLowerCase().includes(termo) || 
          p.marca.toLowerCase().includes(termo) ||
          termo.includes(p.nome.toLowerCase().split(' ')[0])
        );
      }

      produtos.sort((a, b) => a.preco - b.preco);"""

bloco_novo = """      if (termo && termo.length > 0) {
        produtos = produtos.filter(p => 
          p.nome.toLowerCase().includes(termo) || 
          p.marca.toLowerCase().includes(termo) ||
          termo.includes(p.nome.toLowerCase().split(' ')[0])
        );
      }

      // ==============================================================================
      // DEDUPLICAÇÃO UNIVERSAL DE COTAÇÕES (REGRA DA COTAÇÃO MAIS RECENTE)
      // Agrupa por Produto + Mercado mantendo apenas a cotação ativa mais recente.
      // Elimina repetições de histórico do mesmo produto no mesmo mercado.
      // ==============================================================================
      const mapaDeduplicacao = new Map();
      produtos.forEach(p => {
        const normNome = (p.nome || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
        const normMercado = (p.mercado || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
        const chaveUnica = `${normMercado}|${normNome}`;

        if (!mapaDeduplicacao.has(chaveUnica)) {
          mapaDeduplicacao.set(chaveUnica, p);
        } else {
          const existente = mapaDeduplicacao.get(chaveUnica);
          const dataExistente = (existente.valido_ate || existente.data || '');
          const dataNova = (p.valido_ate || p.data || '');
          if (dataNova > dataExistente) {
            mapaDeduplicacao.set(chaveUnica, p);
          }
        }
      });
      produtos = Array.from(mapaDeduplicacao.values());

      produtos.sort((a, b) => a.preco - b.preco);"""

if bloco_antigo in html:
    html = html.replace(bloco_antigo, bloco_novo)
    print("✅ Inserida lógica de deduplicação universal em renderizarResultadosComida")
else:
    print("⚠️ Bloco antigo de filtragem de produtos não encontrado exatamente")

# 4. Atualizar o badge de marca para usar obterMarcaExibicao(prod.nome, prod.marca)
html = html.replace("${prod.marca}", "${obterMarcaExibicao(prod.nome, prod.marca)}")
print("✅ Atualizado badge de marca para extração inteligente universal")

# 5. Atualizar o texto do contador de resultados para diferenciar ofertas de supermercados
count_antigo = "countText.innerHTML = `Encontrados <strong class=\"text-white\">${produtos.length}</strong> supermercados com cotação auditada em <strong class=\"text-emerald-400\">${currentCity}</strong>`;"
count_novo = """const mercadosUnicosCount = new Set(produtos.map(p => (p.mercado || '').trim().toLowerCase())).size;
      const labelMercados = mercadosUnicosCount === 1 ? '1 supermercado' : `${mercadosUnicosCount} supermercados`;
      const labelOfertas = produtos.length === 1 ? '1 oferta' : `${produtos.length} ofertas`;
      countText.innerHTML = `Encontradas <strong class="text-white">${labelOfertas}</strong> em <strong class="text-emerald-400">${labelMercados}</strong> com cotação auditada em <strong class="text-emerald-400">${currentCity}</strong>`;"""

if count_antigo in html:
    html = html.replace(count_antigo, count_novo)
    print("✅ Atualizado contador de ofertas vs supermercados reais")
else:
    print("⚠️ Texto do contador de resultados não encontrado exatamente")

# 6. Salvar em busca.html e index.html (nutripreco e mestrepratico)
with open(busca_path, 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\busca.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("💾 Todos os 4 arquivos sincronizados com sucesso!")
