import json

with open(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\dados_coleta_nuvem_rj.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

itens = data.get('itens', [])
print(f'Carregando {len(itens)} produtos de Nova Iguaçu para injeção no front-end.')

js_items = []
for idx, it in enumerate(itens):
    js_items.append({
        'id': f'prod-ni-{idx+1:03d}',
        'nome': it['produto'],
        'marca': it['marca'],
        'preco': it['preco'],
        'mercado': it['supermercado'],
        'endereco': it['endereco'],
        'cidade': 'Nova Iguaçu',
        'uf': 'RJ',
        'data': it['data_auditoria'],
        'valido_ate': it['valido_ate'],
        'fonte_url': it['fonte_url']
    })

js_string = json.dumps(js_items, ensure_ascii=False)

def atualizar_arquivo(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Adiciona Nova Iguaçu a CIDADES_AUDITADAS se não estiver
    if "'Nova Iguaçu'" not in content and "'Nova Iguacu'" not in content:
        content = content.replace(
            "const CIDADES_AUDITADAS = [",
            "const CIDADES_AUDITADAS = [\n      { nome: 'Nova Iguaçu', uf: 'RJ', lat: -22.75, lon: -43.45 },"
        )
    
    # Injeta no DATABASE_PRODUTOS
    if 'DATABASE_PRODUTOS = [' in content:
        marker = 'DATABASE_PRODUTOS = ['
        content = content.replace(marker, marker + '\n' + js_string[1:-1] + ',')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Atualizado: {path}')

atualizar_arquivo(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\index.html')
atualizar_arquivo(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\nutripreco-oficial.github.io\busca.html')
atualizar_arquivo(r'C:\Users\ARTHUR\.gemini\antigravity\scratch\mestrepratico\public\busca.html')
print('Frontends sincronizados com Nova Iguaçu!')
