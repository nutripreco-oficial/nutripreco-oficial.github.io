"""
Atualizador Automático dos Sites (NutriPreço e Mestre Prático)
Executado logo após a esteira de raspagem em nuvem terminar.
1. Injeta os produtos auditados no index.html e busca.html do NutriPreço (GitHub Pages).
2. Se as credenciais Cloudflare estiverem configuradas, dispara deploy do Mestre Prático.
"""

import os
import sys
import json
import re

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def atualizar_frontends():
    caminho_dados = os.path.join(os.path.dirname(__file__), "dados_coleta_nuvem_rj.json")
    if not os.path.exists(caminho_dados):
        print("Aviso: dados_coleta_nuvem_rj.json não encontrado. Nada a injetar.")
        return

    with open(caminho_dados, "r", encoding="utf-8") as f:
        data = json.load(f)

    itens = data.get("itens", [])
    if not itens:
        print("Aviso: Nenhum item para injetar.")
        return

    print(f"Alimentando sites com {len(itens)} novos produtos auditados...")

    # Formatar itens para JS
    js_items = []
    for idx, it in enumerate(itens):
        js_items.append({
            "id": f"cloud-{idx+1:04d}",
            "nome": it.get("produto"),
            "marca": it.get("marca"),
            "preco": it.get("preco"),
            "mercado": it.get("supermercado"),
            "endereco": it.get("endereco"),
            "cidade": it.get("municipio"),
            "uf": "RJ",
            "data": it.get("data_auditoria"),
            "valido_ate": it.get("valido_ate"),
            "fonte_url": it.get("fonte_url")
        })

    js_chunk = json.dumps(js_items, ensure_ascii=False)

    # 1. Atualizar index.html e busca.html do NutriPreço
    pattern = r'DATABASE_PRODUTOS\s*=\s*\[[\s\S]*?\];'
    replacement = f'DATABASE_PRODUTOS = {js_chunk};'

    arquivos_nutripreco = ["index.html", "busca.html"]
    for nome_arq in arquivos_nutripreco:
        arq_path = os.path.join(os.path.dirname(__file__), nome_arq)
        if os.path.exists(arq_path):
            with open(arq_path, "r", encoding="utf-8") as f:
                content = f.read()

            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content, count=1)
                with open(arq_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"✓ NutriPreço atualizado com sucesso: {nome_arq}")

    # 2. Sincronizar Mestre Prático se estiver na mesma árvore ou disparar webhook
    mestre_busca = os.path.join(os.path.dirname(__file__), "..", "mestrepratico", "public", "busca.html")
    if os.path.exists(mestre_busca):
        with open(mestre_busca, "r", encoding="utf-8") as f:
            content = f.read()
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content, count=1)
            with open(mestre_busca, "w", encoding="utf-8") as f:
                f.write(content)
            print("✓ Mestre Prático atualizado localmente: public/busca.html")

    print("Pipeline de alimentação concluído!")

if __name__ == "__main__":
    atualizar_frontends()
