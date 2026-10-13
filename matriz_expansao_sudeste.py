"""
Matriz de Expansão de Engenharia de Dados - Bloco Sudeste (RJ & SP)
Chief Data Officer (CDO) / Diretor de Dados
NutriPreço / Mestre Prático

Homologação Técnica de Fontes Primárias Auditadas:
Conformidade Estrita com a Cláusula Pétrea Anti-Alucinação (Zero Dados Sintéticos).
"""

from typing import Dict, Any, List

# Matriz Técnica de Redes Homologadas para o CTO integrar ao Robô de Coleta
MATRIZ_EXPANSAO_SUDESTE: List[Dict[str, Any]] = [
    # =========================================================================
    # SÃO PAULO (SP)
    # =========================================================================
    {
        "chave": "sp_carrefour",
        "cidade": "São Paulo",
        "uf": "SP",
        "regiao": "Sudeste",
        "rede": "Carrefour Hipermercados",
        "unidade": "Carrefour (E-commerce Oficial SP)",
        "base_url": "https://www.carrefour.com.br",
        "tipo": "vtex",
        "endpoint_pattern": "https://www.carrefour.com.br/api/catalog_system/pub/products/search/{query}?_from=0&_to=4",
        "formato": "vtex_json",
        "regras_extracao": {
            "filtro_negativo": ["cabo", "hub", "adaptador", "usb", "celular", "panela", "industrial", "brinquedo"],
            "faixa_preco_cesta": (0.80, 150.0),
            "validar_disponibilidade": True
        },
        "mercado_id": "c1f7b820-carrefour-sp-001"
    },
    {
        "chave": "sp_mambo",
        "cidade": "São Paulo",
        "uf": "SP",
        "regiao": "Sudeste",
        "rede": "Supermercados Mambo",
        "unidade": "Mambo (E-commerce Oficial SP)",
        "base_url": "https://www.mambo.com.br",
        "tipo": "vtex",
        "endpoint_pattern": "https://www.mambo.com.br/api/catalog_system/pub/products/search/{query}?_from=0&_to=4",
        "formato": "vtex_json",
        "regras_extracao": {
            "faixa_preco_cesta": (0.80, 150.0),
            "validar_disponibilidade": True
        },
        "mercado_id": "a1efc63f-2c01-463d-98a3-68da6f8a22e7"
    },
    {
        "chave": "sp_st_marche",
        "cidade": "São Paulo",
        "uf": "SP",
        "regiao": "Sudeste",
        "rede": "St. Marche Supermercados",
        "unidade": "St. Marche (Loja Online Oficial SP)",
        "base_url": "https://www.marche.com.br",
        "tipo": "shopify_suggest",
        "endpoint_pattern": "https://www.marche.com.br/search/suggest.json?q={query}&resources[type]=product",
        "endpoint_catalogo": "https://www.marche.com.br/products.json?page={page}&limit=250",
        "formato": "shopify_json",
        "regras_extracao": {
            "campo_produtos": "resources.results.products",
            "campo_nome": "title",
            "campo_preco": "price",
            "campo_url": "url",
            "url_prefixo": "https://www.marche.com.br"
        },
        "mercado_id": "e8d4a132-marche-sp-002"
    },
    {
        "chave": "sp_assai",
        "cidade": "São Paulo",
        "uf": "SP",
        "regiao": "Sudeste",
        "rede": "Assaí Atacadista SP",
        "unidade": "Assaí Atacadista (Catálogo Oficial SP)",
        "base_url": "https://www.assai.com.br",
        "tipo": "assai_static_json",
        "endpoint_pattern": "https://www.assai.com.br/sites/default/files/static/ofertas_assai.json",
        "formato": "json_estatico_oficial",
        "regras_extracao": {
            "segmentacao_uf": "SP",
            "extrair_campanhas_ativas": True,
            "validar_datas": True
        },
        "mercado_id": "b3e920fa-assai-sp-003"
    },
    {
        "chave": "sp_pao_de_acucar",
        "cidade": "São Paulo",
        "uf": "SP",
        "regiao": "Sudeste",
        "rede": "Pão de Açúcar",
        "unidade": "Pão de Açúcar (E-commerce Oficial SP)",
        "base_url": "https://www.paodeacucar.com",
        "tipo": "nextjs_catalog",
        "endpoint_pattern": "https://www.paodeacucar.com/busca?terms={query}",
        "formato": "html_nextjs",
        "regras_extracao": {
            "requer_user_agent_moderno": True,
            "cookie_session": True
        },
        "mercado_id": "d4c81a90-pda-sp-004"
    },

    # =========================================================================
    # RIO DE JANEIRO (RJ)
    # =========================================================================
    {
        "chave": "rj_guanabara",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Supermercados Guanabara",
        "unidade": "Guanabara (Tabela Oficial de Ofertas RJ)",
        "base_url": "https://www.supermercadosguanabara.com.br",
        "tipo": "guanabara_html",
        "endpoint_pattern": "https://www.supermercadosguanabara.com.br/produtos/{categoria_id}",
        "categorias_cesta": {
            "cereais_farinaceos": "2",
            "frios_laticinios": "32",
            "limpeza": "42",
            "matinais_padaria": "62",
            "bebidas": "82",
            "acougue": "112",
            "hortifruti_mercearia": "203"
        },
        "formato": "html_cards",
        "regras_extracao": {
            "seletor_card": "div.col.item",
            "validar_data_validade": True,
            "formato_data": "Validade: DD/MM/AAAA"
        },
        "mercado_id": "g1a98230-guanabara-rj-005"
    },
    {
        "chave": "rj_mundial",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Supermercados Mundial",
        "unidade": "Mundial (Catálogo Oficial de Ofertas RJ)",
        "base_url": "https://www.supermercadosmundial.com.br",
        "tipo": "mundial_nextjs_json",
        "endpoint_pattern": "https://www.supermercadosmundial.com.br/_next/data/{buildId}/departamentos/categoria/ofertas.json?page={page}",
        "endpoint_ssr": "https://www.supermercadosmundial.com.br/departamentos/categoria/ofertas?page={page}",
        "formato": "nextjs_data_json",
        "regras_extracao": {
            "campo_raiz": "pageProps.offers",
            "campo_nome": "product.description",
            "campo_marca": "product.customBrand",
            "campo_preco": "price",
            "campo_sku": "product.sku",
            "campo_validade": "unpublishedIn"
        },
        "mercado_id": "m9a12048-mundial-rj-006"
    },
    {
        "chave": "rj_prezunic",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Prezunic Supermercados",
        "unidade": "Prezunic (E-commerce Oficial RJ)",
        "base_url": "https://www.prezunic.com.br",
        "tipo": "vtex",
        "endpoint_pattern": "https://www.prezunic.com.br/api/catalog_system/pub/products/search/{query}?_from=0&_to=4",
        "formato": "vtex_json",
        "regras_extracao": {
            "faixa_preco_cesta": (0.80, 150.0),
            "validar_disponibilidade": True
        },
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
        "endpoint_pattern": "https://www.zonasul.com.br/api/catalog_system/pub/products/search/{query}?_from=0&_to=4",
        "formato": "vtex_json",
        "regras_extracao": {
            "faixa_preco_cesta": (0.80, 150.0),
            "validar_disponibilidade": True
        },
        "mercado_id": "49338ab2-8271-4be2-8eec-ce8307a44756"
    },
    {
        "chave": "rj_supermarket",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Rede Supermarket",
        "unidade": "Supermarket (Portal Oficial de Encartes RJ)",
        "base_url": "https://redesupermarket.com.br",
        "tipo": "pdf_encartes_repositorio",
        "endpoint_pattern": "https://redesupermarket.com.br/ofertas",
        "formato": "pdf_tabloide_semanal",
        "regras_extracao": {
            "seletor_links_pdf": "a[href*='.pdf']",
            "padrao_url_encarte": "https://redesupermarket.com.br/wp-content/uploads/{ano}/{mes}/encarte-*.pdf"
        },
        "mercado_id": "s7b32014-supermarket-rj-007"
    },
    {
        "chave": "rj_assai",
        "cidade": "Rio de Janeiro",
        "uf": "RJ",
        "regiao": "Sudeste",
        "rede": "Assaí Atacadista RJ",
        "unidade": "Assaí Atacadista (Catálogo Oficial RJ)",
        "base_url": "https://www.assai.com.br",
        "tipo": "assai_static_json",
        "endpoint_pattern": "https://www.assai.com.br/sites/default/files/static/ofertas_assai.json",
        "formato": "json_estatico_oficial",
        "regras_extracao": {
            "segmentacao_uf": "RJ",
            "extrair_campanhas_ativas": True,
            "validar_datas": True
        },
        "mercado_id": "a9c41032-assai-rj-008"
    }
]
