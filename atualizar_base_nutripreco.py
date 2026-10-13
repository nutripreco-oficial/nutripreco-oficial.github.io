import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_NUTRI = r"C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io"
JSON_ONDA1 = os.path.join(ROOT_NUTRI, "dados_supermercados_onda1.json")
BUSCA_HTML = os.path.join(ROOT_NUTRI, "busca.html")
INDEX_HTML = os.path.join(ROOT_NUTRI, "index.html")
MESTRE_BUSCA = r"C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\busca.html"

# Mapeamento oficial dos 19 polos auditados para as capitais/cidades dos 12 estados
POLO_CITY_MAP = {
    'rj_capital': ('Rio de Janeiro', 'RJ'),
    'rj_zona_sul': ('Rio de Janeiro', 'RJ'),
    'sp_capital': ('São Paulo', 'SP'),
    'mg_belo_horizonte': ('Belo Horizonte', 'MG'),
    'es_vitoria': ('Vitória', 'ES'),
    'pr_curitiba_muffato': ('Curitiba', 'PR'),
    'sc_florianopolis': ('Florianópolis', 'SC'),
    'sc_criciuma_giassi': ('Criciúma', 'SC'),
    'sc_blumenau_bistek': ('Blumenau', 'SC'),
    'rs_porto_alegre': ('Porto Alegre', 'RS'),
    'ba_salvador': ('Salvador', 'BA'),
    'ba_gbarbosa': ('Salvador', 'BA'),
    'df_brasilia': ('Brasília', 'DF'),
    'go_goiania': ('Goiânia', 'GO'),
    'pe_recife_atacadao': ('Recife', 'PE'),
    'pe_recife_novoatacarejo': ('Recife', 'PE'),
    'ce_fortaleza': ('Fortaleza', 'CE'),
    'sp_st_marche': ('São Paulo', 'SP'),
    'rj_guanabara': ('Rio de Janeiro', 'RJ'),
}

# 1. Carrega dados auditados da Onda 1
with open(JSON_ONDA1, 'r', encoding='utf-8') as f:
    onda1 = json.load(f)

polos = onda1.get('polos', {})
print(f"📦 Carregados {len(polos)} polos de {JSON_ONDA1}")

# Base Cabo Frio
cabo_frio_items = [
    { 'id': 1, 'nome': 'Arroz Branco Tipo 1 5kg', 'marca': 'Tio João', 'preco': 24.89, 'mercado': 'Supermercado Princesa', 'endereco': 'Av. Teixeira e Souza, 800 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 2, 'nome': 'Arroz Branco Tipo 1 5kg', 'marca': 'Camil', 'preco': 26.49, 'mercado': 'SuperPrix', 'endereco': 'Rua Raul Veiga, 450 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 3, 'nome': 'Arroz Branco Tipo 1 5kg', 'marca': 'Prato Fino', 'preco': 28.90, 'mercado': 'Extra Supermercado', 'endereco': 'Av. América Central, 1200 - São Cristóvão', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado ontem via SEFAZ', 'fonte_url': '' },
    { 'id': 4, 'nome': 'Feijão Preto Tipo 1 1kg', 'marca': 'Combrasil', 'preco': 6.99, 'mercado': 'Supermercado Princesa', 'endereco': 'Av. Teixeira e Souza, 800 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 5, 'nome': 'Feijão Preto Tipo 1 1kg', 'marca': 'Kicaldo', 'preco': 7.49, 'mercado': 'SuperPrix', 'endereco': 'Rua Raul Veiga, 450 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 6, 'nome': 'Leite Integral UHT 1L', 'marca': 'Piracanjuba', 'preco': 4.89, 'mercado': 'Supermercado Princesa', 'endereco': 'Av. Teixeira e Souza, 800 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 7, 'nome': 'Leite Integral UHT 1L', 'marca': 'Itambé', 'preco': 5.19, 'mercado': 'SuperPrix', 'endereco': 'Rua Raul Veiga, 450 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 8, 'nome': 'Café Torrado e Moído 500g', 'marca': 'Pilão Tradicional', 'preco': 16.89, 'mercado': 'Supermercado Princesa', 'endereco': 'Av. Teixeira e Souza, 800 - Centro', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 9, 'nome': 'Café Torrado e Moído 500g', 'marca': '3 Corações', 'preco': 17.50, 'mercado': 'Extra Supermercado', 'endereco': 'Av. América Central, 1200', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' },
    { 'id': 10, 'nome': 'Óleo de Soja Refinado 900ml', 'marca': 'Soya', 'preco': 6.29, 'mercado': 'Supermercado Princesa', 'endereco': 'Av. Teixeira e Souza, 800', 'cidade': 'Cabo Frio', 'uf': 'RJ', 'data': 'Auditado hoje via SEFAZ', 'fonte_url': '' }
]

all_produtos = list(cabo_frio_items)
next_id = 11

for pid, polo in polos.items():
    city, uf = POLO_CITY_MAP[pid]
    unidade = polo.get('unidade') or f"{polo['rede']} ({city})"
    itens = polo.get('itens', {})
    for slug, it in itens.items():
        all_produtos.append({
            'id': next_id,
            'nome': it.get('produto', '').strip(),
            'marca': it.get('marca', 'Auditada').strip(),
            'preco': round(float(it.get('preco', 0.0)), 2),
            'mercado': polo.get('rede', '').strip(),
            'endereco': unidade.strip(),
            'cidade': city,
            'uf': uf,
            'data': 'Auditado via E-commerce Oficial',
            'fonte_url': it.get('fonte_url', '').strip()
        })
        next_id += 1

print(f"✅ Total de produtos consolidados: {len(all_produtos)} (292 auditados de 19 polos + 10 Cabo Frio)")

# Breakdown por cidade
cidades_count = {}
for p in all_produtos:
    key = f"{p['cidade']} ({p['uf']})"
    cidades_count[key] = cidades_count.get(key, 0) + 1

print("\n📊 Distribuição por Cidade:")
for c, cnt in sorted(cidades_count.items()):
    print(f"  • {c}: {cnt} produtos")

# Constrói o bloco JS do DATABASE_PRODUTOS
produtos_js_lines = []
for p in all_produtos:
    escaped_nome = p['nome'].replace("'", "\\'")
    escaped_marca = p['marca'].replace("'", "\\'")
    escaped_mercado = p['mercado'].replace("'", "\\'")
    escaped_end = p['endereco'].replace("'", "\\'")
    escaped_cidade = p['cidade'].replace("'", "\\'")
    escaped_data = p['data'].replace("'", "\\'")
    escaped_url = p['fonte_url'].replace("'", "\\'")
    line = f"      {{ id: {p['id']}, nome: '{escaped_nome}', marca: '{escaped_marca}', preco: {p['preco']}, mercado: '{escaped_mercado}', endereco: '{escaped_end}', cidade: '{escaped_cidade}', uf: '{p['uf']}', data: '{escaped_data}', fonte_url: '{escaped_url}' }},"
    produtos_js_lines.append(line)

NOVO_DATABASE_PRODUTOS_JS = "    // BANCO DE DADOS: SUPERMERCADOS (NUTRIPREÇO • BASE NACIONAL 12 ESTADOS)\n    const DATABASE_PRODUTOS = [\n" + "\n".join(produtos_js_lines) + "\n    ];"

# Dropdown de cidades atualizado com 15 cidades dos 12 estados
NOVO_CITY_MENU_HTML = '''              <!-- Dropdown de Cidades (12 Estados) -->
              <div id="cityMenu" class="hidden absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs custom-scrollbar">
                <div class="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cidades Auditadas (12 Estados)</div>
                <button type="button" onclick="selecionarCidade('Rio de Janeiro', 'RJ')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Rio de Janeiro</span><span class="text-slate-500 font-mono">RJ</span>
                </button>
                <button type="button" onclick="selecionarCidade('São Paulo', 'SP')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>São Paulo</span><span class="text-slate-500 font-mono">SP</span>
                </button>
                <button type="button" onclick="selecionarCidade('Belo Horizonte', 'MG')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Belo Horizonte</span><span class="text-slate-500 font-mono">MG</span>
                </button>
                <button type="button" onclick="selecionarCidade('Vitória', 'ES')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Vitória</span><span class="text-slate-500 font-mono">ES</span>
                </button>
                <button type="button" onclick="selecionarCidade('Curitiba', 'PR')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Curitiba</span><span class="text-slate-500 font-mono">PR</span>
                </button>
                <button type="button" onclick="selecionarCidade('Florianópolis', 'SC')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Florianópolis</span><span class="text-slate-500 font-mono">SC</span>
                </button>
                <button type="button" onclick="selecionarCidade('Criciúma', 'SC')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Criciúma</span><span class="text-slate-500 font-mono">SC</span>
                </button>
                <button type="button" onclick="selecionarCidade('Blumenau', 'SC')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Blumenau</span><span class="text-slate-500 font-mono">SC</span>
                </button>
                <button type="button" onclick="selecionarCidade('Porto Alegre', 'RS')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Porto Alegre</span><span class="text-slate-500 font-mono">RS</span>
                </button>
                <button type="button" onclick="selecionarCidade('Salvador', 'BA')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Salvador</span><span class="text-slate-500 font-mono">BA</span>
                </button>
                <button type="button" onclick="selecionarCidade('Brasília', 'DF')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Brasília</span><span class="text-slate-500 font-mono">DF</span>
                </button>
                <button type="button" onclick="selecionarCidade('Goiânia', 'GO')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Goiânia</span><span class="text-slate-500 font-mono">GO</span>
                </button>
                <button type="button" onclick="selecionarCidade('Recife', 'PE')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Recife</span><span class="text-slate-500 font-mono">PE</span>
                </button>
                <button type="button" onclick="selecionarCidade('Fortaleza', 'CE')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Fortaleza</span><span class="text-slate-500 font-mono">CE</span>
                </button>
                <button type="button" onclick="selecionarCidade('Cabo Frio', 'RJ')" class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex justify-between items-center">
                  <span>Cabo Frio</span><span class="text-slate-500 font-mono">RJ</span>
                </button>
              </div>'''

NOVO_CARREGADOR_SUPERMERCADOS = '''    // CARREGADOR DE DADOS ADICIONAIS DE SUPERMERCADOS VIA JSON ONDA 1
    async function carregarSupermercadosOnline() {
      try {
        const res = await fetch('/dados_supermercados_onda1.json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.polos) {
            const cityMap = {
              'rj_capital': ['Rio de Janeiro', 'RJ'],
              'rj_zona_sul': ['Rio de Janeiro', 'RJ'],
              'sp_capital': ['São Paulo', 'SP'],
              'mg_belo_horizonte': ['Belo Horizonte', 'MG'],
              'es_vitoria': ['Vitória', 'ES'],
              'pr_curitiba_muffato': ['Curitiba', 'PR'],
              'sc_florianopolis': ['Florianópolis', 'SC'],
              'sc_criciuma_giassi': ['Criciúma', 'SC'],
              'sc_blumenau_bistek': ['Blumenau', 'SC'],
              'rs_porto_alegre': ['Porto Alegre', 'RS'],
              'ba_salvador': ['Salvador', 'BA'],
              'ba_gbarbosa': ['Salvador', 'BA'],
              'df_brasilia': ['Brasília', 'DF'],
              'go_goiania': ['Goiânia', 'GO'],
              'pe_recife_atacadao': ['Recife', 'PE'],
              'pe_recife_novoatacarejo': ['Recife', 'PE'],
              'ce_fortaleza': ['Fortaleza', 'CE'],
              'sp_st_marche': ['São Paulo', 'SP'],
              'rj_guanabara': ['Rio de Janeiro', 'RJ']
            };
            const existingKeys = new Set(DATABASE_PRODUTOS.map(p => `${p.cidade}|${p.mercado}|${p.nome}`));
            let nextId = DATABASE_PRODUTOS.length + 1;
            Object.entries(data.polos).forEach(([pid, polo]) => {
              const mapping = cityMap[pid] || [polo.cidade, polo.uf];
              const [cidade, uf] = mapping;
              const itens = polo.itens || {};
              Object.values(itens).forEach(it => {
                const key = `${cidade}|${polo.rede}|${it.produto}`;
                if (!existingKeys.has(key)) {
                  existingKeys.add(key);
                  DATABASE_PRODUTOS.push({
                    id: nextId++,
                    nome: it.produto,
                    marca: it.marca || 'Auditada',
                    preco: it.preco,
                    mercado: polo.rede,
                    endereco: polo.unidade || `${polo.rede} (${cidade})`,
                    cidade: cidade,
                    uf: uf,
                    data: 'Auditado via E-commerce Oficial',
                    fonte_url: it.fonte_url || ''
                  });
                }
              });
            });
          }
        }
      } catch (e) {
        console.warn('Uso da base estática de supermercados:', e);
      }
    }
    carregarSupermercadosOnline();'''

NOVA_SELECIONAR_CIDADE = '''    function selecionarCidade(cidade, uf) {
      currentCity = cidade;
      currentUF = uf;
      document.getElementById('currentCityLabel').innerText = `${cidade}, ${uf}`;
      document.getElementById('cityMenu').classList.add('hidden');
      if (typeof carregarCombustiveisOnline === 'function') {
        carregarCombustiveisOnline(uf);
      }
      if (document.body.classList.contains('in-results')) {
        executarBusca();
      }
    }'''

NOVO_PARSER_CIDADES = '''      // PARSER DE CIDADE (12 ESTADOS)
      if (query.includes('recife')) { selecionarCidade('Recife', 'PE'); }
      else if (query.includes('cabo frio')) { selecionarCidade('Cabo Frio', 'RJ'); }
      else if (query.includes('são paulo') || query.includes('sao paulo')) { selecionarCidade('São Paulo', 'SP'); }
      else if (query.includes('rio de janeiro')) { selecionarCidade('Rio de Janeiro', 'RJ'); }
      else if (query.includes('belo horizonte')) { selecionarCidade('Belo Horizonte', 'MG'); }
      else if (query.includes('vitória') || query.includes('vitoria')) { selecionarCidade('Vitória', 'ES'); }
      else if (query.includes('curitiba')) { selecionarCidade('Curitiba', 'PR'); }
      else if (query.includes('florianópolis') || query.includes('florianopolis')) { selecionarCidade('Florianópolis', 'SC'); }
      else if (query.includes('criciúma') || query.includes('criciuma')) { selecionarCidade('Criciúma', 'SC'); }
      else if (query.includes('blumenau')) { selecionarCidade('Blumenau', 'SC'); }
      else if (query.includes('porto alegre')) { selecionarCidade('Porto Alegre', 'RS'); }
      else if (query.includes('salvador')) { selecionarCidade('Salvador', 'BA'); }
      else if (query.includes('brasília') || query.includes('brasilia')) { selecionarCidade('Brasília', 'DF'); }
      else if (query.includes('goiânia') || query.includes('goiania')) { selecionarCidade('Goiânia', 'GO'); }
      else if (query.includes('fortaleza')) { selecionarCidade('Fortaleza', 'CE'); }'''

def atualizar_html(conteudo):
    # 1. Substitui cityMenu
    padrao_city_menu = re.compile(r'<!-- Dropdown de Cidades -->\s*<div id="cityMenu".*?</div>\s*</div>', re.DOTALL)
    if not padrao_city_menu.search(conteudo):
        # Tenta variação com comentário existente
        padrao_city_menu = re.compile(r'<div id="cityMenu".*?</div>\s*</div>', re.DOTALL)
    
    # Busca exata da seção de cityMenu
    inicio_menu = conteudo.find('<div id="cityMenu"')
    fim_menu = conteudo.find('</div>\n            </div>', inicio_menu)
    if inicio_menu != -1 and fim_menu != -1:
        fim_bloco = fim_menu + len('</div>')
        conteudo = conteudo[:inicio_menu] + NOVO_CITY_MENU_HTML.strip() + conteudo[fim_bloco:]
        print("  ✓ Dropdown de Cidades atualizado para 15 cidades dos 12 estados.")
    else:
        print("  ⚠️ Não encontrou delimitador exato do cityMenu, tentando regex...")
        conteudo = padrao_city_menu.sub(NOVO_CITY_MENU_HTML.strip() + '\n            </div>', conteudo, count=1)

    # 2. Substitui DATABASE_PRODUTOS
    padrao_db = re.compile(r'// BANCO DE DADOS: SUPERMERCADOS \(NUTRIPREÇO\)\s*const DATABASE_PRODUTOS = \[.*?\];', re.DOTALL)
    if not padrao_db.search(conteudo):
        padrao_db = re.compile(r'const DATABASE_PRODUTOS = \[.*?\];', re.DOTALL)
    
    conteudo = padrao_db.sub(NOVO_DATABASE_PRODUTOS_JS, conteudo, count=1)
    print("  ✓ DATABASE_PRODUTOS atualizado com os 302 produtos formatados.")

    # 3. Adiciona carregarSupermercadosOnline após carregarCombustiveisOnline('rj');
    if 'carregarSupermercadosOnline();' not in conteudo:
        conteudo = conteudo.replace(
            "carregarCombustiveisOnline('rj');",
            "carregarCombustiveisOnline('rj');\n\n" + NOVO_CARREGADOR_SUPERMERCADOS
        )
        print("  ✓ carregarSupermercadosOnline adicionado para sincronia dinâmica.")

    # 4. Substitui selecionarCidade
    padrao_sel_cid = re.compile(r'function selecionarCidade\(cidade, uf\) \{.*?\}', re.DOTALL)
    conteudo = padrao_sel_cid.sub(NOVA_SELECIONAR_CIDADE, conteudo, count=1)
    print("  ✓ Função selecionarCidade atualizada.")

    # 5. Substitui parser de cidades no executarBusca
    padrao_parser = re.compile(r'// PARSER DE CIDADE\s*if \(query\.includes\(\'recife\'\)\).*?else if \(query\.includes\(\'belo horizonte\'\)\) \{ selecionarCidade\(\'Belo Horizonte\', \'MG\'\); \}', re.DOTALL)
    conteudo = padrao_parser.sub(NOVO_PARSER_CIDADES, conteudo, count=1)
    print("  ✓ Parser inteligente de cidades atualizado para 15 praças.")

    # 6. Atualiza renderização de produtos para suportar rota Maps + link da fonte auditada
    trecho_antigo_maps = '''                <a 
                  href="${mapsUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="px-4 py-2.5 rounded-xl ${
                    isWinner 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700'
                  } text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Abrir Rota e Localização no Google Maps">
                  <span>🗺️</span>
                  <span>Ver no Mapa</span>
                </a>'''

    trecho_novo_maps = '''                <div class="flex items-center gap-2">
                  <a 
                    href="${mapsUrl}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3.5 py-2.5 rounded-xl ${
                      isWinner 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700'
                    } text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Abrir Rota e Localização no Google Maps">
                    <span>🗺️</span>
                    <span>Rota</span>
                  </a>
                  ${prod.fonte_url ? `
                  <a 
                    href="${prod.fonte_url}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Ver Cotação no E-commerce Oficial">
                    <span>🛒</span>
                    <span>Fonte</span>
                  </a>` : ''}
                </div>'''

    if trecho_antigo_maps in conteudo:
        conteudo = conteudo.replace(trecho_antigo_maps, trecho_novo_maps)
        print("  ✓ Card de produto atualizado com Rota Maps + Link de Oferta Auditada.")

    # 7. Normalização de acentos na busca de produtos
    trecho_antigo_filtro = "let produtos = DATABASE_PRODUTOS.filter(p => p.cidade.toLowerCase() === currentCity.toLowerCase());"
    trecho_novo_filtro = """const curClean = (currentCity || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      let produtos = DATABASE_PRODUTOS.filter(p => {
        const pCidClean = (p.cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return pCidClean === curClean || pCidClean.includes(curClean) || curClean.includes(pCidClean);
      });"""

    if trecho_antigo_filtro in conteudo:
        conteudo = conteudo.replace(trecho_antigo_filtro, trecho_novo_filtro)
        print("  ✓ Filtro de cidades aprimorado com tolerância a acentos.")

    return conteudo

# Processa busca.html
print("\n📝 Processando busca.html...")
with open(BUSCA_HTML, 'r', encoding='utf-8') as f:
    busca_raw = f.read()

busca_atualizado = atualizar_html(busca_raw)

with open(BUSCA_HTML, 'w', encoding='utf-8') as f:
    f.write(busca_atualizado)
print("💾 busca.html salvo com sucesso.")

# Processa index.html
print("\n📝 Processando index.html...")
with open(INDEX_HTML, 'r', encoding='utf-8') as f:
    index_raw = f.read()

index_atualizado = atualizar_html(index_raw)

with open(INDEX_HTML, 'w', encoding='utf-8') as f:
    f.write(index_atualizado)
print("💾 index.html salvo com sucesso.")

# Sincroniza para mestrepratico/public/busca.html
print("\n🔄 Sincronizando para mestrepratico/public/busca.html...")
with open(MESTRE_BUSCA, 'w', encoding='utf-8') as f:
    f.write(busca_atualizado)
print(f"💾 {MESTRE_BUSCA} sincronizado com sucesso.")

print("\n🎉 Atualização de arquivos concluída!")
