"""
====================================================================
ROBÔ CAÇADOR DE ENCARTES EM NUVEM (GITHUB ACTIONS CRON)
Holding Arthur RetailTech | NutriPreço & Mestre Prático
Extração Autônoma 100% em Nuvem - Custo R$ 0,00
====================================================================
"""

import os
import sys
import json
import time
import asyncio
from pathlib import Path
import requests

# Forçar UTF-8
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from playwright.async_api import async_playwright

# Configurações de Nuvem / Supabase / Gemini
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

OUTPUT_DIR = Path("encartes_capturados")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PROMPT_SISTEMA_ENCARTE = """
Você é o motor de inteligência artificial de extração de encartes de supermercados e atacados do NutriPreço (nutripreco.com.br).
Sua missão é ler o folheto/encarte promocional anexado (imagem ou PDF) e extrair com precisão cirúrgica todas as ofertas visíveis.

Regras de Extração:
1. Extraia o nome da rede/supermercado se visível no cabeçalho ou rodapé.
2. Identifique as datas de vigência da promoção ("válido de ... até ..."). Se encontrar apenas a data final, preencha a data final.
3. Para cada produto com preço identificado, retorne um objeto no array 'itens':
   - "nome": Nome comercial limpo do produto (ex: "Maçã Gala", "Arroz Camil 5kg", "Feijão Preto")
   - "marca": Nome da marca se identificável
   - "gramatura": Peso ou volume da embalagem (ex: "1kg", "500g", "1L", "Cada")
   - "preco_regular": Valor numérico float (ex: 4.49)
   - "preco_promocional": Valor promocional ou null
   - "unidade": "Cada", "kg", "Pct", "L"
   - "setor": Categoria apropriada ("mercearia", "carnes-frios", "higiene-beleza", "limpeza", "bebidas", "hortifruti", "padaria")

Retorne estritamente um JSON estruturado com o schema:
{
  "mercado_detectado": "Nome do Mercado",
  "cidade_detectada": "Cabo Frio",
  "data_inicio": "YYYY-MM-DD",
  "data_fim": "YYYY-MM-DD",
  "itens": [
    {
      "nome": "string",
      "marca": "string",
      "gramatura": "string",
      "preco_regular": 0.00,
      "preco_promocional": null,
      "unidade": "Cada",
      "setor": "mercearia"
    }
  ]
}
"""

ALVOS_CABOFRIO = [
    {
        "id": "tinoco_cabofrio",
        "nome": "Supermercados Tinoco",
        "bairro": "Centro",
        "cidade": "Cabo Frio",
        "estado": "RJ",
        "url_alvo": "https://www.facebook.com/tinocorb/photos",
        "tipo": "Supermercado Tradicional"
    },
    {
        "id": "grand_marche_cf",
        "nome": "Grand Marché",
        "bairro": "Centro",
        "cidade": "Cabo Frio",
        "estado": "RJ",
        "url_alvo": "https://www.facebook.com/grandmarchecabofrio/photos",
        "tipo": "Supermercado Regional"
    },
    {
        "id": "garagem_verde_cf",
        "nome": "Garagem Verde Hortifrúti",
        "bairro": "São Cristóvão",
        "cidade": "Cabo Frio",
        "estado": "RJ",
        "url_alvo": "https://www.facebook.com/garagemverdesupermercados/photos",
        "tipo": "Hortifrúti e Mercearia"
    }
]

def extrair_ia_gemini(imagem_bytes):
    import base64
    b64_data = base64.b64encode(imagem_bytes).decode("utf-8")
    modelos = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    
    for modelo in modelos:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": PROMPT_SISTEMA_ENCARTE},
                    {"inline_data": {"mime_type": "image/png", "data": b64_data}}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }
        try:
            r = requests.post(url, json=payload, timeout=60)
            if r.status_code == 200:
                res_json = r.json()
                candidates = res_json.get("candidates", [])
                if candidates:
                    raw_text = candidates[0]["content"]["parts"][0]["text"]
                    return json.loads(raw_text)
            else:
                time.sleep(1)
        except Exception:
            pass
    return None

def salvar_supabase(itens, mercado_nome, bairro, cidade="Cabo Frio", estado="RJ"):
    if not itens:
        return 0
    url = f"{SUPABASE_URL}/rest/v1/products"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    payloads = []
    for it in itens:
        payloads.append({
            "name": f"{it.get('nome', '')} {it.get('gramatura', '')}".strip(),
            "brand": it.get("marca") or "Regional",
            "price": float(it.get("preco_promocional") or it.get("preco_regular") or 0.0),
            "unit": it.get("unidade", "Cada"),
            "category": it.get("setor", "geral"),
            "market_name": mercado_nome,
            "neighborhood": bairro,
            "city": cidade,
            "state": estado,
            "source": "encarte_nuvem_playwright",
            "active": True
        })
    
    try:
        r = requests.post(url, json=payloads, headers=headers, timeout=15)
        return len(payloads) if r.status_code in [200, 201] else 0
    except Exception as e:
        print(f"[-] Erro ao salvar Supabase: {e}")
        return 0

async def rodar_varredura_nuvem():
    print("=" * 70)
    print("☁️ [NUVEM] INICIANDO ROBÔ CAÇADOR DE ENCARTES (GITHUB ACTIONS)")
    print("=" * 70)
    
    total_geral_ofertas = 0
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        for alvo in ALVOS_CABOFRIO:
            nome = alvo["nome"]
            url = alvo["url_alvo"]
            bairro = alvo["bairro"]
            print(f"\n🚀 [NUVEM] Auditando {nome} ({bairro} - Cabo Frio)...")
            
            try:
                await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                await page.wait_for_timeout(3000)
                
                # Fechar dialogs
                await page.evaluate("""
                    () => {
                        document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
                        document.querySelectorAll('div[class*="backdrop"]').forEach(b => b.remove());
                    }
                """)
                await page.wait_for_timeout(1500)
                await page.mouse.wheel(0, 700)
                await page.wait_for_timeout(3000)
                
                # Screenshot
                screenshot_bytes = await page.screenshot(full_page=False)
                print(f"  📸 Screenshot capturado na nuvem.")
                
                # Extração IA
                dados_ia = extrair_ia_gemini(screenshot_bytes)
                if dados_ia and "itens" in dados_ia and dados_ia["itens"]:
                    itens = dados_ia["itens"]
                    print(f"  🧠 [IA] {len(itens)} ofertas mineradas com sucesso!")
                    salvos = salvar_supabase(itens, f"{nome} - {bairro}", bairro)
                    print(f"  💾 {salvos} ofertas sincronizadas no Supabase!")
                    total_geral_ofertas += salvos
                else:
                    print(f"  ⚠️ Nenhuma oferta identificada no frame desta rede.")
            except Exception as e:
                print(f"  [-] Erro no processamento de {nome}: {e}")
                
        await browser.close()
        
    print("\n" + "=" * 70)
    print(f"🎉 CICLO EM NUVEM FINALIZADO! TOTAL DE OFERTAS COLETADAS: {total_geral_ofertas}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(rodar_varredura_nuvem())
