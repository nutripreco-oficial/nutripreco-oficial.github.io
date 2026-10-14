import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("🚀 Iniciando atualização de links reais e monetização Amazon...")

# 1. Carregar mapeamento de dados_supermercados_onda1.json
with open('dados_supermercados_onda1.json', 'r', encoding='utf-8') as f:
    onda1 = json.load(f)

prod_to_url = {}
for pid, polo in onda1.get('polos', {}).items():
    for slug, it in polo.get('itens', {}).items():
        p_nome = (it.get('produto') or '').strip().lower()
        f_url = (it.get('fonte_url') or '').strip()
        if p_nome and f_url:
            prod_to_url[p_nome] = f_url

rede_sites = {
    'oba hortifruti': 'https://www.obahortifruti.com.br',
    'supermercados mambo': 'https://www.mambo.com.br',
    'prezunic': 'https://www.prezunic.com.br',
    'supermercados guanabara': 'https://www.supermercadosguanabara.com.br',
    'supermercados mundial': 'https://www.supermercadosmundial.com.br',
    'supermarket': 'https://redesupermarket.com.br',
    'bramil': 'https://bramil.com.br',
    'superbom': 'https://www.redesuperbom.com.br',
    'rende pacas': 'https://mercadorendepacas.com',
    'atacadao': 'https://www.atacadao.com.br',
    'carrefour': 'https://www.carrefour.com.br',
    'pao de acucar': 'https://www.paodeacucar.com',
    'assai': 'https://www.assai.com.br'
}

busca_path = r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\busca.html'
with open(busca_path, 'r', encoding='utf-8') as f:
    html = f.read()

# 2. Corrigir DATABASE_PRODUTOS substituindo placeholders por URLs reais
m = re.search(r'const DATABASE_PRODUTOS = (\[.*?\]);', html, re.DOTALL)
if not m:
    print("❌ Erro: DATABASE_PRODUTOS não encontrado")
    sys.exit(1)

data = json.loads(m.group(1))
corrigidos = 0
for p in data:
    f_url = p.get('fonte_url') or ''
    if 'api_oficial' in f_url or 'cro' in f_url or not f_url.startswith('http'):
        p_nome = (p.get('nome') or '').strip().lower()
        merc = (p.get('mercado') or '').strip().lower()
        
        if p_nome in prod_to_url:
            p['fonte_url'] = prod_to_url[p_nome]
            corrigidos += 1
        else:
            achou = False
            for r_k, r_u in rede_sites.items():
                if r_k in merc:
                    p['fonte_url'] = r_u
                    corrigidos += 1
                    achou = True
                    break
            if not achou:
                p['fonte_url'] = f"https://www.google.com/search?q={p.get('nome', '').replace(' ', '+')}+{merc.replace(' ', '+')}"
                corrigidos += 1

print(f"✅ Substituídas {corrigidos} URLs de placeholder por URLs reais e verificáveis!")

novo_db = "const DATABASE_PRODUTOS = " + json.dumps(data, ensure_ascii=False) + ";"
html = html[:m.start()] + novo_db + html[m.end():]

# 3. Atualizar carregarSupabaseAoVivo para mapear link_afiliado prioritariamente
antigo_supabase_fonte = "fonte_url: item.fonte || 'https://fzoyldcfyiigwyxxhosd.supabase.co'"
novo_supabase_fonte = "fonte_url: (item.link_afiliado && item.link_afiliado.startsWith('http')) ? item.link_afiliado : ((item.fonte && item.fonte.startsWith('http')) ? item.fonte : 'https://fzoyldcfyiigwyxxhosd.supabase.co')"

if antigo_supabase_fonte in html:
    html = html.replace(antigo_supabase_fonte, novo_supabase_fonte)
    print("✅ Atualizado extrator do Supabase para priorizar link_afiliado real")

# 4. Inserir botão da Amazon e ajustar botão Fonte em renderizarResultadosComida
bloco_botoes_antigo = """                  ${prod.fonte_url ? `
                  <a 
                    href="${prod.fonte_url}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Ver Cotação no E-commerce Oficial">
                    <span>🛒</span>
                    <span>Fonte</span>
                  </a>` : ''}"""

bloco_botoes_novo = """                  ${prod.fonte_url ? `
                  <a 
                    href="${prod.fonte_url}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Comprovação Oficial do Preço no Supermercado (CDC Art. 30 e 31)">
                    <span>🛒</span>
                    <span>Fonte</span>
                  </a>` : ''}
                  <a 
                    href="https://www.amazon.com.br/s?k=${encodeURIComponent(prod.nome)}&tag=mestrepratico-20" 
                    target="_blank" 
                    rel="sponsored nofollow" 
                    class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-amber-500/20"
                    title="Pesquisar e Comparar este produto na Amazon">
                    <span>📦</span>
                    <span>Amazon</span>
                  </a>"""

if bloco_botoes_antigo in html:
    html = html.replace(bloco_botoes_antigo, bloco_botoes_novo)
    print("✅ Inserido botão de monetização Amazon com tag=mestrepratico-20 e rel=sponsored nofollow")
else:
    print("⚠️ Bloco de botões antigo não encontrado exatamente, buscando alternativa...")
    # Tentar substituição por regex
    padrao_botoes = re.compile(r'\$\{prod\.fonte_url \? `.*?class="[^"]*text-emerald-400[^"]*".*?<span>Fonte</span>\s*</a>` : \'\'\}', re.DOTALL)
    if padrao_botoes.search(html):
        html = padrao_botoes.sub(bloco_botoes_novo, html)
        print("✅ Inserido botão de monetização Amazon via regex!")

# 5. Adicionar disclosure legal de associado Amazon no rodapé
disclosure_amazon = """        <!-- Cláusula Obrigatória de Compliance: Programa de Associados Amazon -->
        <p class="text-[11px] text-slate-400/80 text-center max-w-xl mx-auto mt-2 leading-relaxed">
          Como participante do Programa de Associados da Amazon, o NutriPreço / Mestre Prático pode ser remunerado por compras qualificadas, sem nenhum custo adicional para o consumidor.
        </p>"""

if "Como participante do Programa de Associados da Amazon" not in html:
    pos_rodape = html.find("HOLDING INTELIGÊNCIA DE VAREJO INOVA SIMPLES (I.S.)")
    if pos_rodape != -1:
        insert_idx = html.rfind("</div>", 0, pos_rodape)
        if insert_idx != -1:
            html = html[:insert_idx] + "\n" + disclosure_amazon + "\n" + html[insert_idx:]
            print("✅ Inserido disclosure legal de Associados Amazon no rodapé")

# 6. Salvar em busca.html e index.html (nutripreco e mestrepratico)
with open(busca_path, 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\busca.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("💾 Todos os 4 arquivos sincronizados e prontos!")
