"""
Adaptadores de Coleta Especializados para o Robô Maestro (Bloco Sudeste - SP & RJ)
Chief Data Officer (CDO) / Engenharia de Dados NutriPreço

Pronto para integração pelo CTO no 'robo_coleta_supermercados_nacional.py'.
100% Fontes Auditadas - Cláusula Pétrea Anti-Alucinação.
"""

import urllib.request
import urllib.parse
import json
import ssl
import re
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any, List

SSL_CTX = ssl._create_unverified_context()
HEADERS_DEFAULT = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html, */*"
}

PALAVRAS_NEGATIVAS_GLOBAL = [
    "vinagre", "biscoito de arroz", "lata para", "pote para", "porta cafe",
    "dosador", "caneca", "capilar", "corporal", "shampoo", "condicionador",
    "sabonete", "amaciante", "desinfetante", "tapete", "brinquedo", "racao",
    "cabo", "hub", "adaptador", "usb", "fone", "carregador"
]


def buscar_item_st_marche(queries: List[str]) -> Optional[Dict[str, Any]]:
    """Busca produto no e-commerce oficial da rede St. Marche (Shopify API)."""
    for q_str in queries:
        q = urllib.parse.quote(q_str)
        url = f"https://www.marche.com.br/search/suggest.json?q={q}&resources[type]=product"
        req = urllib.request.Request(url, headers=HEADERS_DEFAULT)
        try:
            with urllib.request.urlopen(req, timeout=7, context=SSL_CTX) as resp:
                data = json.loads(resp.read().decode("utf-8", errors="ignore"))
                prods = data.get("resources", {}).get("results", {}).get("products", [])
                for prod in prods:
                    nome = prod.get("title", "").strip()
                    nome_low = nome.lower()
                    if any(neg in nome_low for neg in PALAVRAS_NEGATIVAS_GLOBAL):
                        continue
                    preco_raw = prod.get("price")
                    if preco_raw is None:
                        continue
                    preco = float(preco_raw)
                    url_prod = prod.get("url", "")
                    if url_prod.startswith("/"):
                        url_prod = "https://www.marche.com.br" + url_prod.split("?")[0]
                    if 0.80 <= preco <= 150.0 and url_prod:
                        return {
                            "produto": nome,
                            "marca": "St. Marche Homologado",
                            "preco": round(preco, 2),
                            "fonte_url": url_prod,
                            "coletado_em": datetime.now(timezone.utc).isoformat()
                        }
        except Exception:
            continue
    return None


def buscar_item_guanabara(queries: List[str]) -> Optional[Dict[str, Any]]:
    """Busca produto nas categorias oficiais de ofertas dos Supermercados Guanabara RJ."""
    # Mapeamento de categorias da cesta alimentar no Guanabara
    categorias = ["2", "112", "32", "62", "82", "42", "203"]
    for q_str in queries:
        q_low = q_str.lower()
        for cat in categorias:
            url = f"https://www.supermercadosguanabara.com.br/produtos/{cat}"
            req = urllib.request.Request(url, headers=HEADERS_DEFAULT)
            try:
                with urllib.request.urlopen(req, timeout=7, context=SSL_CTX) as resp:
                    html = resp.read().decode("utf-8", errors="ignore")
                    soup = BeautifulSoup(html, "html.parser")
                    for card in soup.find_all("div", class_="col item"):
                        strings = list(card.stripped_strings)
                        if len(strings) >= 2:
                            preco_str = strings[0]
                            nome = strings[1]
                        else:
                            text = card.get_text(separator=" ", strip=True)
                            m_p = re.search(r"(\d+[\.,]\d{2})", text)
                            if not m_p:
                                continue
                            preco_str = m_p.group(1)
                            nome = re.sub(r"(\d+[\.,]\d{2}|cada|\*)", "", text).strip()

                        nome_low = nome.lower()
                        if any(neg in nome_low for neg in PALAVRAS_NEGATIVAS_GLOBAL):
                            continue
                        
                        # Teste de correspondência com o termo procurado
                        if all(termo in nome_low for termo in q_low.split()):
                            preco_limpo = preco_str.replace("R$", "").replace(" ", "").replace(",", ".")
                            preco = float(preco_limpo)
                            if 0.80 <= preco <= 150.0:
                                return {
                                    "produto": nome,
                                    "marca": "Guanabara Oficial",
                                    "preco": round(preco, 2),
                                    "fonte_url": url,
                                    "coletado_em": datetime.now(timezone.utc).isoformat()
                                }
            except Exception:
                continue
    return None


def buscar_item_mundial(queries: List[str]) -> Optional[Dict[str, Any]]:
    """Busca produto no catálogo de ofertas do Supermercados Mundial RJ via Next.js Data API."""
    url_base = "https://www.supermercadosmundial.com.br/departamentos/categoria/ofertas"
    req_base = urllib.request.Request(url_base, headers=HEADERS_DEFAULT)
    try:
        with urllib.request.urlopen(req_base, timeout=8, context=SSL_CTX) as resp:
            soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")
            tag_next = soup.find("script", id="__NEXT_DATA__")
            if not tag_next:
                return None
            data = json.loads(tag_next.string)
            props = data.get("props", {}).get("pageProps", {})
            offers = props.get("offers", [])
            
            for q_str in queries:
                q_low = q_str.lower()
                for offer in offers:
                    prod = offer.get("product", {})
                    nome = prod.get("description") or prod.get("customName") or ""
                    nome_low = nome.lower()
                    if any(neg in nome_low for neg in PALAVRAS_NEGATIVAS_GLOBAL):
                        continue
                    if all(termo in nome_low for termo in q_low.split()):
                        p_str = offer.get("price", "").replace("R$", "").replace("\xa0", "").replace(" ", "").replace(",", ".")
                        preco = float(p_str)
                        marca = prod.get("customBrand") or "Mundial"
                        if 0.80 <= preco <= 150.0:
                            return {
                                "produto": nome,
                                "marca": marca.strip(),
                                "preco": round(preco, 2),
                                "fonte_url": url_base,
                                "coletado_em": datetime.now(timezone.utc).isoformat()
                            }
    except Exception:
        pass
    return None
