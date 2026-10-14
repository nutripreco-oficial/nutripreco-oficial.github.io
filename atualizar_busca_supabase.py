import urllib.request
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://fzoyldcfyiigwyxxhosd.supabase.co'
SUPABASE_KEY = 'sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv'

print("🔄 1. Buscando todas as cotações ativas do Supabase...")
url = f'{SUPABASE_URL}/rest/v1/precos_cotacoes?select=id,preco_regular,preco_promocional,unidade_medida,fonte,valido_ate,created_at,produtos(id,nome,marca,gramatura,imagem_url),mercados(id,nome,rede,estado,cidade,bairro)&order=created_at.desc&limit=5000'
req = urllib.request.Request(url, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
with urllib.request.urlopen(req) as resp:
    supabase_data = json.loads(resp.read().decode())

print(f"📦 Total de cotações obtidas no Supabase: {len(supabase_data)}")

# Mapear cotações do Supabase para o formato do DATABASE_PRODUTOS
novos_produtos_supabase = []
for item in supabase_data:
    p = item.get('produtos') or {}
    m = item.get('mercados') or {}
    preco = float(item.get('preco_promocional') or item.get('preco_regular') or 0)
    nome = (p.get('nome') or '').strip()
    if not nome or preco <= 0:
        continue
    
    cidade = (m.get('cidade') or 'Cabo Frio').strip()
    if cidade.endswith(' - RJ'):
        cidade = cidade.replace(' - RJ', '').strip()
    
    mercado_nome = m.get('nome') or 'Mercado Parceiro'
    bairro = m.get('bairro') or ''
    uf = m.get('estado') or 'RJ'
    endereco = f"{bairro}, {cidade} - {uf}" if bairro else f"{cidade} - {uf}"
    data_criacao = (item.get('created_at') or '2026-10-14').split('T')[0]
    
    novos_produtos_supabase.append({
        'id': item.get('id') or f"spb-{len(novos_produtos_supabase)+1}",
        'nome': nome,
        'marca': p.get('marca') or 'Auditada',
        'preco': preco,
        'mercado': mercado_nome,
        'endereco': endereco,
        'cidade': cidade,
        'uf': uf,
        'data': data_criacao,
        'valido_ate': item.get('valido_ate') or '',
        'fonte_url': item.get('fonte') or 'https://fzoyldcfyiigwyxxhosd.supabase.co',
        'imagem_url': p.get('imagem_url') or ''
    })

print(f"✅ Cotações válidas estruturadas: {len(novos_produtos_supabase)}")
cf_count = len([x for x in novos_produtos_supabase if x['cidade'].lower() == 'cabo frio'])
print(f"📍 Cotações para Cabo Frio: {cf_count}")
arroz_cf = [x for x in novos_produtos_supabase if x['cidade'].lower() == 'cabo frio' and 'arroz' in x['nome'].lower()]
print(f"🍚 Itens de arroz em Cabo Frio: {len(arroz_cf)}")
for a in arroz_cf:
    print(f"   -> {a['nome']} | R$ {a['preco']} | {a['mercado']}")

# Ler busca.html
busca_path = r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\busca.html'
with open(busca_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

# 2. Extrair o DATABASE_PRODUTOS existente e mesclar com os itens do Supabase
# Procurar por `const DATABASE_PRODUTOS = [` ... `];`
db_pattern = re.compile(r'const DATABASE_PRODUTOS = (\[.*?\]);', re.DOTALL)
m = db_pattern.search(html_content)
if not m:
    print("❌ Erro: DATABASE_PRODUTOS não encontrado em busca.html")
    sys.exit(1)

existentes = json.loads(m.group(1))
print(f"📊 Total de itens existentes em DATABASE_PRODUTOS: {len(existentes)}")

# Mesclar dando prioridade ao Supabase (evitando duplicatas por cidade+mercado+nome)
chaves_existentes = set()
for item in existentes:
    k = f"{(item.get('cidade') or '').lower().strip()}|{(item.get('mercado') or '').lower().strip()}|{(item.get('nome') or '').lower().strip()}"
    chaves_existentes.add(k)

# Adicionar os itens do Supabase que ainda não estejam na lista
adicionados_estatico = 0
produtos_finais = list(novos_produtos_supabase) # Itens do Supabase entram primeiro
chaves_supabase = set(f"{x['cidade'].lower().strip()}|{x['mercado'].lower().strip()}|{x['nome'].lower().strip()}" for x in novos_produtos_supabase)

for item in existentes:
    k = f"{(item.get('cidade') or '').lower().strip()}|{(item.get('mercado') or '').lower().strip()}|{(item.get('nome') or '').lower().strip()}"
    if k not in chaves_supabase:
        produtos_finais.append(item)

print(f"💎 Total final em DATABASE_PRODUTOS mesclado: {len(produtos_finais)}")
cf_finais = [x for x in produtos_finais if (x.get('cidade') or '').lower() == 'cabo frio']
print(f"💎 Total final de Cabo Frio: {len(cf_finais)}")
arroz_final = [x for x in cf_finais if 'arroz' in (x.get('nome') or '').lower()]
print(f"💎 Total final de arroz em Cabo Frio: {len(arroz_final)}")

# Atualizar DATABASE_PRODUTOS no HTML
novo_db_str = "const DATABASE_PRODUTOS = " + json.dumps(produtos_finais, ensure_ascii=False) + ";"
html_content = html_content[:m.start()] + novo_db_str + html_content[m.end():]

# 3. Inserir a função carregarSupabaseAoVivo() logo após carregarSupermercadosOnline()
supabase_live_js = """
    // =========================================================================
    // CONEXÃO VIVA AO SUPABASE (TABELA precos_cotacoes - FONTE PRIMÁRIA AUDITADA)
    // Sincroniza em tempo real as cotações mais recentes diretamente do banco central
    // =========================================================================
    async function carregarSupabaseAoVivo() {
      try {
        const SUPABASE_URL = 'https://fzoyldcfyiigwyxxhosd.supabase.co';
        const SUPABASE_KEY = 'sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv';
        const endpoint = `${SUPABASE_URL}/rest/v1/precos_cotacoes?select=id,preco_regular,preco_promocional,unidade_medida,fonte,valido_ate,created_at,produtos(id,nome,marca,gramatura,imagem_url),mercados(id,nome,rede,estado,cidade,bairro)&order=created_at.desc&limit=5000`;
        
        const res = await fetch(endpoint, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        });
        
        if (res.ok) {
          const cotacoes = await res.json();
          if (Array.isArray(cotacoes) && cotacoes.length > 0) {
            const existingKeys = new Set(DATABASE_PRODUTOS.map(p => `${(p.cidade||'').toLowerCase().trim()}|${(p.mercado||'').toLowerCase().trim()}|${(p.nome||'').toLowerCase().trim()}`));
            let adicionados = 0;
            
            cotacoes.forEach(item => {
              const p = item.produtos || {};
              const m = item.mercados || {};
              const preco = Number(item.preco_promocional || item.preco_regular || 0);
              if (!p.nome || preco <= 0) return;
              
              let cidade = (m.cidade || 'Cabo Frio').trim();
              if (cidade.endsWith(' - RJ')) cidade = cidade.replace(' - RJ', '').trim();
              const mercadoNome = m.nome || 'Mercado Parceiro';
              const prodNome = p.nome.trim();
              const key = `${cidade.toLowerCase()}|${mercadoNome.toLowerCase()}|${prodNome.toLowerCase()}`;
              
              const novoItem = {
                id: item.id || `spb-${Math.random().toString(36).substr(2, 9)}`,
                nome: prodNome,
                marca: p.marca || 'Auditada',
                preco: preco,
                mercado: mercadoNome,
                endereco: m.bairro ? `${m.bairro}, ${cidade} - ${m.estado || 'RJ'}` : `${cidade} - ${m.estado || 'RJ'}`,
                cidade: cidade,
                uf: m.estado || 'RJ',
                data: item.created_at ? item.created_at.split('T')[0] : 'Hoje',
                valido_ate: item.valido_ate || '',
                fonte_url: item.fonte || 'https://fzoyldcfyiigwyxxhosd.supabase.co',
                imagem_url: p.imagem_url || ''
              };
              
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                DATABASE_PRODUTOS.unshift(novoItem);
                adicionados++;
              }
            });
            
            console.log(`[Supabase Live] ${adicionados} novas cotações sincronizadas do banco central. Total na memória: ${DATABASE_PRODUTOS.length}`);
            
            // Se o usuário já estiver com busca aberta, atualiza a tela para refletir dados do banco
            const searchInput = document.getElementById('searchInput');
            if (document.body.classList.contains('in-results') && searchInput && searchInput.value.trim().length > 0 && currentSearchMode === 'food') {
              renderizarResultadosComida(searchInput.value.trim().toLowerCase(), searchInput.value.trim());
            }
          }
        }
      } catch (err) {
        console.warn('[Supabase Live] Sincronização em segundo plano usando cache offline:', err);
      }
    }
    carregarSupabaseAoVivo();
"""

if "carregarSupabaseAoVivo()" not in html_content:
    target_pos = html_content.find("carregarSupermercadosOnline();")
    if target_pos != -1:
        insert_idx = target_pos + len("carregarSupermercadosOnline();")
        html_content = html_content[:insert_idx] + "\n" + supabase_live_js + html_content[insert_idx:]
        print("✅ Inserida rotina carregarSupabaseAoVivo()")
    else:
        print("⚠️ Ponto de inserção carregarSupermercadosOnline() não encontrado")

# 4. Corrigir o bloco de Fallback de renderizarResultadosComida (produtos.length === 0)
# Substituir a lógica cega que chama qualquer termo sem resultado de "cidade em expansão"
old_fallback_pattern = re.compile(
    r'if \(produtos\.length === 0\) \{.*?return;\s*\}',
    re.DOTALL
)

novo_fallback_code = """if (produtos.length === 0) {
        const cidadeTemCobertura = isCityCovered(currentCity);
        
        if (!cidadeTemCobertura) {
          countText.innerHTML = `Nenhum preço auditado para "${termo || 'sua busca'}" em ${currentCity} - ${currentUF}.`;
          currentAiSummary = `O NutriPreço está expandindo para ${currentCity} - ${currentUF}! Nossos robôs caçadores estão mapeando supermercados da sua região.`;
          aiBody.innerHTML = `
            <div class="flex items-start gap-3">
              <span class="text-2xl">🚧</span>
              <div>
                <p class="text-amber-300 font-bold mb-1 text-base">O NutriPreço está expandindo para ${currentCity} - ${currentUF}!</p>
                <p class="text-slate-300 text-sm">Nossos robôs caçadores de menor preço ainda não registraram cotações nesta localidade para "${termo || queryOriginal}".</p>
              </div>
            </div>
          `;
          container.innerHTML = `
            <div class="rounded-3xl bg-slate-900/80 border border-amber-500/30 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-2xl">
              <div class="text-4xl mb-3">🚧</div>
              <h3 class="text-lg sm:text-xl font-bold text-white mb-2">O NutriPreço está expandindo para ${currentCity} - ${currentUF}!</h3>
              <p class="text-slate-300 text-sm mb-6">Estamos conectando novos supermercados e redes locais para trazer economia real à sua mesa.</p>
              <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-left">
                <div class="font-bold text-amber-300 text-sm flex items-center gap-1.5 mb-2">
                  <span>💡</span>
                  <span>Quer ver as ofertas do seu bairro aqui? Indique os supermercados da sua região!</span>
                </div>
                <form onsubmit="enviarSugestaoMercado(event, 'results')" class="mt-3 flex flex-col sm:flex-row gap-2">
                  <input type="text" id="inputSugestaoMercadoResults" placeholder="Nome do mercado e bairro (ex: Supermercado Silva, Centro)..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400" required />
                  <button type="submit" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer">Indicar Mercado</button>
                </form>
                <div id="sugestaoFeedbackResults" class="hidden mt-2.5 text-xs text-emerald-400 font-semibold">✓ Muito obrigado! Sugestão enviada à nossa equipe de expansão.</div>
              </div>
            </div>
          `;
          return;
        }

        // CIDADE COBERTA (como Cabo Frio, Rio de Janeiro, etc.) mas com termo de busca específico não encontrado
        countText.innerHTML = `Nenhum preço encontrado para "${termo || queryOriginal}" em ${currentCity} - ${currentUF}.`;
        currentAiSummary = `Não encontramos ofertas ativas para "${termo || queryOriginal}" em ${currentCity} - ${currentUF}. Confira abaixo os produtos disponíveis auditados na sua cidade.`;
        aiBody.innerHTML = `
          <div class="flex items-start gap-3">
            <span class="text-2xl">🔍</span>
            <div>
              <p class="text-emerald-400 font-bold mb-1 text-base">Busca em ${currentCity} - ${currentUF}</p>
              <p class="text-slate-300 text-sm">Nenhum produto cadastrado com o termo "${termo || queryOriginal}". Experimente pesquisar por <strong>arroz, feijão, café, leite, óleo</strong> ou navegue nas ofertas auditadas logo abaixo.</p>
            </div>
          </div>
        `;

        const curCityClean = (currentCity || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
        let sugestoesCidade = DATABASE_PRODUTOS.filter(p => {
          const pCidClean = (p.cidade || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
          return pCidClean === curCityClean || pCidClean.includes(curCityClean) || curCityClean.includes(pCidClean);
        }).sort((a, b) => a.preco - b.preco).slice(0, 10);

        if (sugestoesCidade.length > 0) {
          container.innerHTML = `
            <div class="mb-4 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-left">
              <h4 class="text-sm font-bold text-emerald-400 mb-1">🛒 Produtos Disponíveis com Menor Preço em ${currentCity}:</h4>
              <p class="text-xs text-slate-400">Enquanto novos encartes são processados para "${termo || queryOriginal}", veja os itens já auditados na cidade:</p>
            </div>
            ${sugestoesCidade.map((p, idx) => `
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-4 mb-2.5">
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-white text-sm sm:text-base truncate">${p.nome}</div>
                  <div class="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span class="text-emerald-400 font-semibold">${p.mercado}</span>
                    <span>•</span>
                    <span>${p.endereco || p.cidade}</span>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-lg sm:text-xl font-extrabold text-emerald-400">R$ ${p.preco.toFixed(2).replace('.', ',')}</div>
                  <button onclick="buscarTermo('${p.nome.split(' ')[0]}')" class="mt-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold">Comparar</button>
                </div>
              </div>
            `).join('')}
          `;
        } else {
          container.innerHTML = `
            <div class="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 text-center max-w-xl mx-auto">
              <div class="text-3xl mb-2">🔍</div>
              <p class="text-slate-300 text-sm">Nenhum produto cadastrado no momento para ${currentCity}.</p>
            </div>
          `;
        }
        return;
      }"""

# Substituir o primeiro bloco if (produtos.length === 0) correspondente em renderizarResultadosComida
m_fb = old_fallback_pattern.search(html_content)
if m_fb:
    html_content = html_content[:m_fb.start()] + novo_fallback_code + html_content[m_fb.end():]
    print("✅ Substituído fallback errôneo de expansão por verificação inteligente de cobertura")
else:
    print("⚠️ Bloco de fallback antigo não encontrado via regex")

# Salvar busca.html atualizado
with open(busca_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f"💾 Arquivo busca.html salvo com sucesso ({len(html_content)} bytes)")

# Salvar index.html no nutripreco-oficial
index_path = r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\index.html'
with open(index_path, 'w', encoding='utf-8') as f:
    f.write(html_content)
print("💾 Arquivo index.html (nutripreco) sincronizado")

# Salvar em mestrepratico/public/busca.html e index.html
mp_busca = r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\busca.html'
mp_index = r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\index.html'
with open(mp_busca, 'w', encoding='utf-8') as f:
    f.write(html_content)
with open(mp_index, 'w', encoding='utf-8') as f:
    f.write(html_content)
print("💾 Arquivos de mestrepratico/public (busca.html e index.html) sincronizados")
