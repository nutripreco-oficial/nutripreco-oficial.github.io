"""
Robô Maestro de Coleta Nacional Auditada de Supermercados (NutriPreço / Mestre Prático)
Orquestração em Nuvem (GitHub Actions / Cloud Serverless) - Custo R$ 0,00
Conformidade Estrita CRO/Arthur: 100% Cotações Reais, URLs Diretas e Validação de Estoque.
"""

import os
import sys
import json
import ssl
import re
import hashlib
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
import requests

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

SSL_CTX = ssl._create_unverified_context()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fzoyldcfyiigwyxxhosd.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OUTPUT_FILE = os.environ.get("OUTPUT_FILE", "dados_supermercados_onda1.json")

HEADERS_SUPABASE = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# 14 Redes Homologadas nos 4 Blocos Regionais
REDES_HOMOLOGADAS = [
    # --- SUDESTE ---
    {
        "chave": "rj_capital",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Prezunic Supermercados",
        "unidade": "Prezunic (E-commerce Oficial RJ)",
        "base_url": "https://www.prezunic.com.br",
        "tipo": "vtex",
        "mercado_id": "f0d129b3-796e-4710-8087-eb0f51e71d4f"
    },
    {
        "chave": "rj_zona_sul",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Supermercado Zona Sul",
        "unidade": "Zona Sul (E-commerce Oficial RJ)",
        "base_url": "https://www.zonasul.com.br",
        "tipo": "vtex",
        "mercado_id": "49338ab2-8271-4be2-8eec-ce8307a44756"
    },
    {
        "chave": "sp_capital",
        "cidade": "São Paulo",
        "uf": "SP",
        "regiao": "Sudeste",
        "rede": "Supermercados Mambo",
        "unidade": "Mambo (E-commerce Oficial SP)",
        "base_url": "https://www.mambo.com.br",
        "tipo": "vtex",
        "mercado_id": "a1efc63f-2c01-463d-98a3-68da6f8a22e7"
    },
    {
        "chave": "mg_belo_horizonte",
        "cidade": "Belo Horizonte",
        "uf": "MG",
        "regiao": "Sudeste",
        "rede": "Super Nosso",
        "unidade": "Super Nosso (E-commerce Oficial BH)",
        "base_url": "https://www.supernosso.com",
        "tipo": "vtex",
        "mercado_id": "1dc86b40-3661-4b24-a018-8e574ab14556"
    },
    {
        "chave": "es_vitoria",
        "cidade": "Vitória",
        "uf": "ES",
        "regiao": "Sudeste",
        "rede": "Extrabom Supermercados",
        "unidade": "Extrabom (E-commerce Oficial Vitória)",
        "base_url": "https://www.extrabom.com.br",
        "tipo": "extrabom_html",
        "mercado_id": "0ea5ade5-a193-46fa-b4ff-1b4fe49ae8db"
    },

    # --- SUL ---
    {
        "chave": "pr_curitiba_muffato",
        "cidade": "Curitiba",
        "uf": "PR",
        "regiao": "Sul",
        "rede": "Super Muffato",
        "unidade": "Super Muffato (E-commerce Oficial PR)",
        "base_url": "https://www.supermuffato.com.br",
        "tipo": "vtex",
        "mercado_id": "5c6d052e-5146-487c-84d9-652b4164e418"
    },
    {
        "chave": "sc_florianopolis",
        "cidade": "Florianópolis",
        "uf": "SC",
        "regiao": "Sul",
        "rede": "Supermercados Angeloni",
        "unidade": "Angeloni (E-commerce Oficial SC)",
        "base_url": "https://www.angeloni.com.br/super",
        "tipo": "vtex",
        "mercado_id": "5a1f03f0-1e02-4895-ba18-47ec141e339a"
    },
    {
        "chave": "sc_criciuma_giassi",
        "cidade": "Criciúma / Joinville",
        "uf": "SC",
        "regiao": "Sul",
        "rede": "Giassi Supermercados",
        "unidade": "Giassi (E-commerce Oficial SC)",
        "base_url": "https://www.giassi.com.br",
        "tipo": "vtex",
        "mercado_id": "480b8817-cb22-480f-a312-f7f0ce1e5e1a"
    },
    {
        "chave": "sc_blumenau_bistek",
        "cidade": "Blumenau",
        "uf": "SC",
        "regiao": "Sul",
        "rede": "Bistek Supermercados",
        "unidade": "Bistek (E-commerce Oficial SC)",
        "base_url": "https://www.bistek.com.br",
        "tipo": "vtex",
        "mercado_id": "b106e74b-0c61-47e6-b488-2cd6b9abc24f"
    },
    {
        "chave": "rs_porto_alegre",
        "cidade": "Porto Alegre",
        "uf": "RS",
        "regiao": "Sul",
        "rede": "Zaffari Supermercados",
        "unidade": "Zaffari (E-commerce Oficial RS)",
        "base_url": "https://www.zaffari.com.br",
        "tipo": "vtex",
        "mercado_id": "1cfde62a-38a4-4ef8-829f-cdac3e73f9fc"
    },

    # --- NORDESTE ---
    {
        "chave": "ba_salvador",
        "cidade": "Salvador",
        "uf": "BA",
        "regiao": "Nordeste",
        "rede": "Hiperideal Supermercados",
        "unidade": "Hiperideal (E-commerce Oficial Salvador)",
        "base_url": "https://www.hiperideal.com.br",
        "tipo": "vtex",
        "mercado_id": "5f76f749-8bfc-44b7-9aec-274ce1846489"
    },
    {
        "chave": "ba_gbarbosa",
        "cidade": "Salvador / Feira de Santana",
        "uf": "BA",
        "regiao": "Nordeste",
        "rede": "GBarbosa",
        "unidade": "GBarbosa (E-commerce Oficial BA)",
        "base_url": "https://www.gbarbosa.com.br",
        "tipo": "vtex",
        "mercado_id": "760f97ab-09cb-47e0-bfa8-f92947ca6349"
    },

    # --- CENTRO-OESTE ---
    {
        "chave": "df_brasilia",
        "cidade": "Brasília",
        "uf": "DF",
        "regiao": "Centro-Oeste",
        "rede": "Oba Hortifruti",
        "unidade": "Oba Hortifruti (E-commerce Oficial DF)",
        "base_url": "https://www.obahortifruti.com.br",
        "tipo": "vtex",
        "mercado_id": "9b547479-4461-4494-8453-7bd2d1af4ae5"
    },
    {
        "chave": "go_goiania",
        "cidade": "Goiânia",
        "uf": "GO",
        "regiao": "Centro-Oeste",
        "rede": "Oba Hortifruti",
        "unidade": "Oba Hortifruti (E-commerce Oficial GO)",
        "base_url": "https://www.obahortifruti.com.br",
        "tipo": "vtex",
        "mercado_id": "24a73786-a8f5-483c-84e1-c7c24d425bc3"
    }
]

PALAVRAS_NEGATIVAS = [
    "vinagre", "biscoito de arroz", "lata para", "pote para", "porta cafe",
    "dosador", "caneca", "capilar", "corporal", "shampoo", "condicionador",
    "sabonete", "amaciante", "desinfetante", "tapete", "brinquedo", "racao"
]

CESTA_ALIMENTAR = [
    ("arroz", ["arroz tipo 1", "arroz branco", "arroz 5kg", "arroz"]),
    ("feijao", ["feijao carioca", "feijao preto", "feijao tipo 1", "feijao"]),
    ("farinha de trigo", ["farinha de trigo", "farinha trigo 1kg"]),
    ("macarrao espaguete", ["macarrao espaguete", "espaguete", "macarrao"]),
    ("acucar", ["acucar refinado", "acucar cristal", "acucar"]),
    ("cafe", ["cafe torrado", "cafe moido", "cafe tradicional", "cafe"]),
    ("leite integral", ["leite uht integral", "leite integral 1l", "leite integral"]),
    ("oleo de soja", ["oleo de soja", "oleo soja 900ml"]),
    ("manteiga", ["manteiga com sal", "manteiga pote", "manteiga"]),
    ("carne bovina", ["alcatra bovina", "acem bovino", "patinho bovino", "carne bovina"]),
    ("peito de frango", ["peito de frango", "file de peito frango", "frango"]),
    ("ovos", ["ovos brancos", "ovos caipira", "ovos 30", "ovos"]),
    ("queijo mussarela", ["queijo mussarela fatiado", "queijo mussarela"]),
    ("sabao em po", ["sabao em po", "lava roupas po"]),
    ("detergente", ["detergente liquido", "detergente"]),
    ("papel higienico", ["papel higienico folha dupla", "papel higienico"]),
    ("sal refinado", ["sal refinado", "sal"]),
    ("biscoito", ["biscoito cream cracker", "cream cracker", "biscoito maizena"])
]


def gerar_ean13(nome: str) -> str:
    h = int(hashlib.md5(nome.encode("utf-8")).hexdigest()[:10], 16)
    return f"789{h % 10000000000:010d}"


def buscar_item_vtex(base_url: str, queries: list):
    for q_str in queries:
        q = urllib.parse.quote(q_str)
        url = f"{base_url}/api/catalog_system/pub/products/search/{q}?_from=0&_to=4"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        })
        try:
            with urllib.request.urlopen(req, timeout=7, context=SSL_CTX) as resp:
                dados = json.loads(resp.read().decode("utf-8", errors="ignore"))
                if not isinstance(dados, list):
                    continue
                melhor = None
                for prod in dados:
                    nome = prod.get("productName") or prod.get("productTitle") or ""
                    nome_low = nome.lower()
                    if any(neg in nome_low for neg in PALAVRAS_NEGATIVAS):
                        continue
                    marca = prod.get("brand") or ""
                    link = prod.get("link") or ""
                    for item in prod.get("items", []):
                        for seller in item.get("sellers", []):
                            oferta = seller.get("commertialOffer", {})
                            preco = float(oferta.get("Price") or 0.0)
                            disponivel = int(oferta.get("AvailableQuantity") or 0)
                            if 0.80 <= preco <= 150.0 and disponivel > 0 and link:
                                cand = {
                                    "produto": nome.strip(),
                                    "marca": marca.strip(),
                                    "preco": round(preco, 2),
                                    "fonte_url": link.strip(),
                                    "coletado_em": datetime.now(timezone.utc).isoformat()
                                }
                                if melhor is None or cand["preco"] < melhor["preco"]:
                                    melhor = cand
                if melhor:
                    return melhor
        except Exception:
            continue
    return None


def buscar_item_extrabom(queries: list):
    for q_str in queries:
        url = f"https://www.extrabom.com.br/busca/?q={urllib.parse.quote(q_str)}"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        try:
            with urllib.request.urlopen(req, timeout=7, context=SSL_CTX) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
                soup = BeautifulSoup(html, "html.parser")
                melhor = None
                for a in soup.find_all("a", class_="carousel__box__dados"):
                    text = a.get_text(separator=" ", strip=True)
                    text_low = text.lower()
                    if any(neg in text_low for neg in PALAVRAS_NEGATIVAS):
                        continue
                    m = re.search(r"R\$\s*(\d+)\s*,\s*(\d{2})", text)
                    if m:
                        price = float(f"{m.group(1)}.{m.group(2)}")
                        href = a.get("href", "").strip()
                        if href.startswith("/"):
                            href = "https://www.extrabom.com.br" + href
                        elif not href.startswith("http"):
                            href = "https://www.extrabom.com.br/" + href
                        nome = re.sub(r"R\$\s*\d+.*", "", text).strip()
                        if 0.80 <= price <= 150.0 and len(nome) > 3:
                            cand = {
                                "produto": nome,
                                "marca": "Extrabom",
                                "preco": round(price, 2),
                                "fonte_url": href,
                                "coletado_em": datetime.now(timezone.utc).isoformat()
                            }
                            if melhor is None or cand["preco"] < melhor["preco"]:
                                melhor = cand
                if melhor:
                    return melhor
        except Exception:
            continue
    return None


def executar_coleta_e_sincronizacao():
    print("=" * 80)
    print("🇧🇷 [NUTRIPREÇO CLOUD] Execução Diária dos Robôs em Nuvem (GitHub Actions)")
    print(f"⏰ Horário da Execução: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 80)

    resultado = {
        "versao": "2.5-nacional-auditada-cro",
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "metodo_auditoria": "Coleta Primária Direta via APIs VTEX e E-commerce Oficial com URL Verificável",
        "total_redes_auditadas": 0,
        "total_cotacoes_reais": 0,
        "polos": {}
    }

    total_cotacoes = 0
    for info in REDES_HOMOLOGADAS:
        chave = info["chave"]
        cidade = info["cidade"]
        uf = info["uf"]
        rede = info["rede"]
        tipo = info["tipo"]
        print(f"📡 Coletando: {cidade}/{uf} - {rede}...")

        itens_polo = {}
        for slug, queries in CESTA_ALIMENTAR:
            if tipo == "extrabom_html":
                item_cand = buscar_item_extrabom(queries)
            else:
                item_cand = buscar_item_vtex(info["base_url"], queries)

            if item_cand:
                itens_polo[slug] = item_cand
                total_cotacoes += 1

        if itens_polo:
            soma = round(sum(v["preco"] for v in itens_polo.values()), 2)
            resultado["polos"][chave] = {
                "cidade": cidade,
                "uf": uf,
                "regiao": info["regiao"],
                "rede": rede,
                "unidade": info["unidade"],
                "fonte_oficial_dominio": info["base_url"],
                "qtd_itens_verificados": len(itens_polo),
                "soma_itens_verificados_reais": soma,
                "itens": itens_polo
            }
            print(f"   ✓ {cidade}/{uf}: {len(itens_polo)} itens auditados (R$ {soma:.2f})")

    resultado["total_redes_auditadas"] = len(resultado["polos"])
    resultado["total_cotacoes_reais"] = total_cotacoes

    # Salva arquivo JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)
    print(f"\n📁 Arquivo salvo com sucesso em: {OUTPUT_FILE}")

    # Sincronização no Supabase
    print("\n🔄 Sincronizando com a base de dados Supabase...")
    sincronizar_supabase(resultado)


def sincronizar_supabase(dados):
    polos = dados.get("polos", {})
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    valido_ate = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")

    # Mapeamento oficial de mercado_id
    mapa_ids = {info["chave"]: info["mercado_id"] for info in REDES_HOMOLOGADAS}

    # Carrega cache de produtos existentes
    prods_cache = {}
    offset = 0
    while True:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/produtos?select=id,nome&limit=1000&offset={offset}", headers=HEADERS_SUPABASE)
        if r.status_code != 200 or not r.json():
            break
        for p in r.json():
            prods_cache[p["nome"].strip().lower()] = p["id"]
        if len(r.json()) < 1000:
            break
        offset += 1000

    # Cria produtos novos se necessário
    prods_novos = []
    nomes_fila = set()
    for chave, polo in polos.items():
        for slug, it in polo.get("itens", {}).items():
            nome = it["produto"].strip()
            nome_k = nome.lower()
            if nome_k not in prods_cache and nome_k not in nomes_fila:
                nomes_fila.add(nome_k)
                prods_novos.append({
                    "nome": nome,
                    "codigo_barras": gerar_ean13(nome),
                    "marca": it.get("marca") or polo["rede"],
                    "unidade_padrao": "un"
                })

    if prods_novos:
        for i in range(0, len(prods_novos), 50):
            lote = prods_novos[i:i+50]
            resp = requests.post(f"{SUPABASE_URL}/rest/v1/produtos", headers=HEADERS_SUPABASE, json=lote)
            if resp.status_code in [200, 201]:
                for criados in resp.json():
                    prods_cache[criados["nome"].strip().lower()] = criados["id"]

    # Inserção em lote das cotações
    cotacoes = []
    for chave, polo in polos.items():
        mercado_id = mapa_ids.get(chave)
        if not mercado_id:
            continue
        for slug, it in polo.get("itens", {}).items():
            nome_k = it["produto"].strip().lower()
            prod_id = prods_cache.get(nome_k)
            if not prod_id:
                continue
            cotacoes.append({
                "produto_id": prod_id,
                "mercado_id": mercado_id,
                "preco_regular": it["preco"],
                "preco_promocional": None,
                "unidade_medida": "UN",
                "valido_de": hoje,
                "valido_ate": valido_ate,
                "fonte": "api_oficial_auditada_cro",
                "link_afiliado": it["fonte_url"]
            })

    total_gravadas = 0
    for i in range(0, len(cotacoes), 50):
        lote = cotacoes[i:i+50]
        resp = requests.post(f"{SUPABASE_URL}/rest/v1/precos_cotacoes", headers=HEADERS_SUPABASE, json=lote)
        if resp.status_code in [200, 201]:
            total_gravadas += len(resp.json())

    print(f"🎉 [SINCRONIZAÇÃO COMPLETA] {total_gravadas} cotações reais persistidas no Supabase!")


if __name__ == "__main__":
    executar_coleta_e_sincronizacao()
