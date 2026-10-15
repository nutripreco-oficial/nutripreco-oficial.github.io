// =========================================================================
// SAFE EVENT DISPATCHER (MOZILLA OBSERVATORY CSP A+ COMPLIANT)
// Elimina necessidade de 'unsafe-inline' e 'unsafe-eval'
// =========================================================================
function executarAcaoSegura(el, rawAction, event) {
  if (!rawAction) return;
  const statements = rawAction.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    const match = stmt.match(/^([a-zA-Z0-9_]+)(?:\((.*)\))?$/s);
    if (!match) continue;
    const fnName = match[1];
    const argsRaw = (match[2] || '').trim();
    if (typeof window[fnName] === 'function') {
      let args = [];
      if (argsRaw && argsRaw !== 'event' && argsRaw !== 'this.value') {
        args = argsRaw.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      } else if (argsRaw === 'event') {
        args = [event];
      } else if (argsRaw === 'this.value') {
        args = [el.value];
      }
      try {
        window[fnName].apply(el, args);
      } catch (err) {
        console.warn(`[Safe Dispatcher] Erro em ${fnName}:`, err);
      }
    }
  }
  if (event && event.type === 'click' && el.tagName === 'A' && el.getAttribute('href') === '#') {
    event.preventDefault();
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-onclick], [onclick]');
  if (el) {
    const raw = el.getAttribute('data-onclick') || el.getAttribute('onclick');
    executarAcaoSegura(el, raw, e);
  }
}, true);

document.addEventListener('input', (e) => {
  const el = e.target;
  const raw = el.getAttribute('data-oninput') || el.getAttribute('oninput');
  if (raw) {
    executarAcaoSegura(el, raw, e);
  }
}, true);

document.addEventListener('submit', (e) => {
  const el = e.target;
  const raw = el.getAttribute('data-onsubmit') || el.getAttribute('onsubmit');
  if (raw) {
    e.preventDefault();
    executarAcaoSegura(el, raw, e);
  }
}, true);

// Limpeza preventiva de atributos inline para compliance estrito com CSP
function sanitizarHandlersInline(root = document) {
  root.querySelectorAll('[onclick]').forEach(el => {
    el.setAttribute('data-onclick', el.getAttribute('onclick'));
    el.removeAttribute('onclick');
  });
  root.querySelectorAll('[oninput]').forEach(el => {
    el.setAttribute('data-oninput', el.getAttribute('oninput'));
    el.removeAttribute('oninput');
  });
  root.querySelectorAll('[onsubmit]').forEach(el => {
    el.setAttribute('data-onsubmit', el.getAttribute('onsubmit'));
    el.removeAttribute('onsubmit');
  });
}

document.addEventListener('DOMContentLoaded', () => sanitizarHandlersInline());


// ESTADO GLOBAL
    let searchMode = 'food'; // 'food' (NutriPreço) ou 'fuel' (NutriCombust)
    let currentCity = 'Cabo Frio';
    let currentUF = 'RJ';
    let isListening = false;
    let recognition = null;
    let synthUtterance = null;
    let currentAiSummary = '';
    let deferredPrompt = null;

        // BANCO DE DADOS: SUPERMERCADOS (NUTRIPREÇO • BASE NACIONAL 12 ESTADOS)
        let DATABASE_PRODUTOS = [];

    // CARREGAMENTO ASSÍNCRONO DA BASE DE PRODUTOS (<150KB INITIAL PAYLOAD)
    async function carregarBaseProdutos() {
      try {
        const res = await fetch('/dados_produtos_base.json');
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            const existingKeys = new Set(DATABASE_PRODUTOS.map(p => `${p.cidade}|${p.mercado}|${p.nome}`));
            items.forEach(it => {
              const k = `${it.cidade}|${it.mercado}|${it.nome}`;
              if (!existingKeys.has(k)) {
                DATABASE_PRODUTOS.push(it);
                existingKeys.add(k);
              }
            });
            console.log(`[Base Produtos] ${items.length} cotações carregadas no cache local.`);
            const sInput = document.getElementById('searchInput');
            if (document.body.classList.contains('in-results') && sInput && sInput.value.trim().length > 0 && searchMode === 'food') {
              renderizarResultadosComida(sInput.value.trim().toLowerCase(), sInput.value.trim());
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar base assíncrona de produtos:', e);
      }
    }
    carregarBaseProdutos();

    // BANCO DE DADOS: POSTOS DE COMBUSTÍVEIS (NUTRICOMBUST ANP OFICIAL)
    const DATABASE_POSTOS = [
      // CABO FRIO (RJ)
      { id: 101, posto: 'Posto do Cabo LTDA', bandeira: 'Ipiranga', endereco: 'Av. América Central, 2270', bairro: 'Praia do Siqueira', cidade: 'Cabo Frio', uf: 'RJ', gasolina_comum: 6.77, gasolina_aditivada: 6.77, etanol: 4.88, diesel_s10: 7.19, gnv: 4.79, data: 'Auditado via ANP Dados Abertos' },
      { id: 102, posto: 'Auto Posto São Pedro', bandeira: 'Shell', endereco: 'Rod. Amaral Peixoto, km 136', bairro: 'Portinho', cidade: 'Cabo Frio', uf: 'RJ', gasolina_comum: 6.79, gasolina_aditivada: 6.95, etanol: 4.92, diesel_s10: 7.24, gnv: 4.85, data: 'Auditado via ANP Dados Abertos' },
      { id: 103, posto: 'Posto Estrela da Praia', bandeira: 'Vibra / Petrobras', endereco: 'Av. Assumpção, 350', bairro: 'Passagem', cidade: 'Cabo Frio', uf: 'RJ', gasolina_comum: 6.84, gasolina_aditivada: 6.99, etanol: 4.99, diesel_s10: 7.29, gnv: 0, data: 'Auditado via ANP Dados Abertos' },
      { id: 104, posto: 'Posto Mar Azul', bandeira: 'Bandeira Branca', endereco: 'Rua Raul Veiga, 120', bairro: 'Centro', cidade: 'Cabo Frio', uf: 'RJ', gasolina_comum: 6.69, gasolina_aditivada: 6.79, etanol: 4.79, diesel_s10: 7.09, gnv: 4.69, data: 'Auditado via Cupom Fiscal' },

      // RIO DE JANEIRO (CAPITAL)
      { id: 105, posto: 'Posto Jardim Sulacap', bandeira: 'Bandeira Branca', endereco: 'Rua Euzebio de Almeida, 2098', bairro: 'Jardim Sulacap', cidade: 'Rio de Janeiro', uf: 'RJ', gasolina_comum: 5.99, gasolina_aditivada: 6.19, etanol: 4.49, diesel_s10: 6.87, gnv: 4.45, data: 'Auditado via ANP' },
      { id: 106, posto: 'Auto Posto Maracanã', bandeira: 'Shell', endereco: 'Av. Maracanã, 750', bairro: 'Tijuca', cidade: 'Rio de Janeiro', uf: 'RJ', gasolina_comum: 6.15, gasolina_aditivada: 6.35, etanol: 4.59, diesel_s10: 6.95, gnv: 4.59, data: 'Auditado via ANP' },

      // NITERÓI (RJ) • AUDITADO VIA ANP DADOS ABERTOS
      { id: 111, posto: 'Carlan Óleo e Combustível LTDA', bandeira: 'Bandeira Branca', endereco: 'Alameda São Boaventura, 1119', bairro: 'Fonseca', cidade: 'Niterói', uf: 'RJ', gasolina_comum: 6.39, gasolina_aditivada: 6.49, etanol: 4.49, diesel_s10: 7.19, gnv: 4.39, data: 'Auditado via ANP Oficial' },
      { id: 112, posto: 'WMS Supermercados (Posto Sam\'s Club)', bandeira: 'Ipiranga', endereco: 'Rodovia BR-101, km 318', bairro: 'Barreto', cidade: 'Niterói', uf: 'RJ', gasolina_comum: 6.47, gasolina_aditivada: 6.67, etanol: 4.59, diesel_s10: 6.87, gnv: 4.45, data: 'Auditado via ANP Oficial' },
      { id: 113, posto: 'Nitgas Posto GNV e Combustíveis', bandeira: 'Nexta', endereco: 'Alameda São Boaventura, 343', bairro: 'Fonseca', cidade: 'Niterói', uf: 'RJ', gasolina_comum: 6.49, gasolina_aditivada: 6.59, etanol: 4.39, diesel_s10: 6.79, gnv: 4.39, data: 'Auditado via ANP Oficial' },
      { id: 114, posto: 'Posto Icaraí Praia', bandeira: 'Shell', endereco: 'Praia de Icaraí, 210', bairro: 'Icaraí', cidade: 'Niterói', uf: 'RJ', gasolina_comum: 6.59, gasolina_aditivada: 6.79, etanol: 4.69, diesel_s10: 6.99, gnv: 4.49, data: 'Auditado via ANP Oficial' },

      // SÃO GONÇALO (RJ) • AUDITADO VIA ANP DADOS ABERTOS
      { id: 115, posto: 'Posto Tribobó (Ale)', bandeira: 'Ale', endereco: 'Av. Visconde de Santarém, 100', bairro: 'Tribobó', cidade: 'São Gonçalo', uf: 'RJ', gasolina_comum: 6.29, gasolina_aditivada: 6.39, etanol: 4.29, diesel_s10: 6.69, gnv: 4.29, data: 'Auditado via ANP Oficial' },
      { id: 116, posto: 'Auto Posto KM 10 (Petrobras)', bandeira: 'Vibra / Petrobras', endereco: 'Av. Rio do Ouro, 10', bairro: 'Cala Boca', cidade: 'São Gonçalo', uf: 'RJ', gasolina_comum: 6.39, gasolina_aditivada: 6.49, etanol: 4.49, diesel_s10: 6.99, gnv: 4.39, data: 'Auditado via ANP Oficial' },
      { id: 117, posto: 'Posto de Gasolina Santa Luzia', bandeira: 'Bandeira Branca', endereco: 'Av. Santa Luzia, 190', bairro: 'Santa Luzia', cidade: 'São Gonçalo', uf: 'RJ', gasolina_comum: 6.39, gasolina_aditivada: 6.39, etanol: 4.59, diesel_s10: 6.99, gnv: 4.39, data: 'Auditado via ANP Oficial' },
      { id: 118, posto: 'Posto Luna I Combustíveis (Neves)', bandeira: 'Vibra / Petrobras', endereco: 'Rua Dr. Alberto Torres, 128', bairro: 'Neves', cidade: 'São Gonçalo', uf: 'RJ', gasolina_comum: 6.49, gasolina_aditivada: 6.49, etanol: 4.59, diesel_s10: 6.99, gnv: 4.19, data: 'Auditado via ANP Oficial' },

      // DUQUE DE CAXIAS (RJ) • AUDITADO VIA ANP DADOS ABERTOS
      { id: 119, posto: 'Auto Posto Via Terê LTDA', bandeira: 'Bandeira Branca', endereco: 'Rodovia Rio-Magé, s/n', bairro: 'Jardim Anhangá', cidade: 'Duque de Caxias', uf: 'RJ', gasolina_comum: 6.19, gasolina_aditivada: 6.29, etanol: 4.27, diesel_s10: 6.89, gnv: 4.29, data: 'Auditado via ANP Oficial' },
      { id: 120, posto: 'Golf Derivados de Petróleo LTDA', bandeira: 'Nexta', endereco: 'Rodovia Washington Luiz, 13500', bairro: 'Jardim Primavera', cidade: 'Duque de Caxias', uf: 'RJ', gasolina_comum: 6.29, gasolina_aditivada: 6.39, etanol: 4.69, diesel_s10: 6.68, gnv: 4.39, data: 'Auditado via ANP Oficial' },
      { id: 121, posto: 'Posto de Gasolina Duda Vieira', bandeira: 'Ale', endereco: 'Av. Gov. Leonel Brizola, s/n', bairro: 'Parque Muísa', cidade: 'Duque de Caxias', uf: 'RJ', gasolina_comum: 6.38, gasolina_aditivada: 6.48, etanol: 4.68, diesel_s10: 6.58, gnv: 4.58, data: 'Auditado via ANP Oficial' },
      { id: 122, posto: 'Posto Estrela Guia da Taquara', bandeira: 'Bandeira Branca', endereco: 'Av. Automóvel Club, 4824', bairro: 'Jardim Imbariê', cidade: 'Duque de Caxias', uf: 'RJ', gasolina_comum: 6.39, gasolina_aditivada: 6.50, etanol: 4.39, diesel_s10: 7.29, gnv: 4.26, data: 'Auditado via ANP Oficial' },

      // SÃO PAULO
      { id: 107, posto: 'Posto Shell Marginal Tietê', bandeira: 'Shell', endereco: 'Av. Marginal Tietê, 4500', bairro: 'Lapa', cidade: 'São Paulo', uf: 'SP', gasolina_comum: 5.79, gasolina_aditivada: 5.99, etanol: 3.89, diesel_s10: 6.19, gnv: 4.29, data: 'Auditado via ANP' },
      { id: 108, posto: 'Auto Posto Ipiranga Rebouças', bandeira: 'Ipiranga', endereco: 'Av. Rebouças, 1800', bairro: 'Pinheiros', cidade: 'São Paulo', uf: 'SP', gasolina_comum: 5.85, gasolina_aditivada: 6.05, etanol: 3.95, diesel_s10: 6.25, gnv: 4.35, data: 'Auditado via ANP' },

      // RECIFE
      { id: 109, posto: 'Posto Petrobras Mascarenhas', bandeira: 'Vibra / Petrobras', endereco: 'Av. Mascarenhas de Morais, 3100', bairro: 'Imbiribeira', cidade: 'Recife', uf: 'PE', gasolina_comum: 5.99, gasolina_aditivada: 6.19, etanol: 4.45, diesel_s10: 6.39, gnv: 4.59, data: 'Auditado via ANP' },
      { id: 110, posto: 'Posto Shell Agamenon', bandeira: 'Shell', endereco: 'Av. Gov. Agamenon Magalhães, 1200', bairro: 'Derby', cidade: 'Recife', uf: 'PE', gasolina_comum: 6.05, gasolina_aditivada: 6.25, etanol: 4.49, diesel_s10: 6.45, gnv: 4.65, data: 'Auditado via ANP' }
    ];

    // CARREGADOR DE DADOS ADICIONAIS DE COMBUSTÍVEL SE DISPONÍVEIS VIA JSON
    async function carregarCombustiveisOnline(uf) {
      try {
        const res = await fetch(`/dados_combustiveis_${uf.toLowerCase()}.json`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.postos && Array.isArray(data.postos)) {
            data.postos.forEach(p => {
              if (!DATABASE_POSTOS.some(existing => existing.id === p.id)) {
                DATABASE_POSTOS.push({
                  id: p.id || Math.random(),
                  posto: p.posto,
                  bandeira: p.bandeira,
                  endereco: p.endereco,
                  bairro: p.bairro,
                  cidade: p.cidade,
                  uf: uf.toUpperCase(),
                  gasolina_comum: p.gasolina_comum || 0,
                  gasolina_aditivada: p.gasolina_aditivada || 0,
                  etanol: p.etanol || 0,
                  diesel_s10: p.diesel_s10 || 0,
                  gnv: p.gnv || 0,
                  data: 'Auditado via ANP Oficial'
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Uso da base local de postos:', e);
      }
    }
    carregarCombustiveisOnline('rj');
    carregarCombustiveisOnline('sp');
    carregarCombustiveisOnline('mg');
    carregarCombustiveisOnline('es');
    carregarCombustiveisOnline('pr');
    carregarCombustiveisOnline('sc');
    carregarCombustiveisOnline('rs');
    carregarCombustiveisOnline('ba');
    carregarCombustiveisOnline('pe');
    carregarCombustiveisOnline('ce');
    carregarCombustiveisOnline('df');
    carregarCombustiveisOnline('go');
    carregarCombustiveisOnline('ms');
    carregarCombustiveisOnline('mt');
    carregarCombustiveisOnline('pb');
    carregarCombustiveisOnline('rn');
    carregarCombustiveisOnline('al');
    carregarCombustiveisOnline('se');
    carregarCombustiveisOnline('ma');
    carregarCombustiveisOnline('pi');
    carregarCombustiveisOnline('pa');
    carregarCombustiveisOnline('am');
    carregarCombustiveisOnline('mg');
    carregarCombustiveisOnline('es');
    carregarCombustiveisOnline('pr');
    carregarCombustiveisOnline('sc');
    carregarCombustiveisOnline('rs');
    carregarCombustiveisOnline('ba');
    carregarCombustiveisOnline('pe');
    carregarCombustiveisOnline('ce');
    carregarCombustiveisOnline('df');
    carregarCombustiveisOnline('go');
    carregarCombustiveisOnline('ms');
    carregarCombustiveisOnline('mt');
    carregarCombustiveisOnline('pb');
    carregarCombustiveisOnline('rn');
    carregarCombustiveisOnline('al');
    carregarCombustiveisOnline('se');
    carregarCombustiveisOnline('ma');
    carregarCombustiveisOnline('pi');
    carregarCombustiveisOnline('pa');
    carregarCombustiveisOnline('am');

    // CARREGADOR DE DADOS ADICIONAIS DE SUPERMERCADOS VIA JSON ONDA 1
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
              'pr_curitiba_angeloni': ['Curitiba', 'PR'],
              'pr_curitiba_festval': ['Curitiba', 'PR'],
              'sc_florianopolis': ['Florianópolis', 'SC'],
              'sc_criciuma_giassi': ['Criciúma', 'SC'],
              'sc_blumenau_bistek': ['Blumenau', 'SC'],
              'rs_porto_alegre': ['Porto Alegre', 'RS'],
              'rs_porto_alegre_zaffari': ['Porto Alegre', 'RS'],
              'rs_porto_alegre_rissul': ['Porto Alegre', 'RS'],
              'ba_salvador': ['Salvador', 'BA'],
              'ba_gbarbosa': ['Salvador', 'BA'],
              'ba_feira_de_santana': ['Feira de Santana', 'BA'],
              'ba_hiperideal': ['Salvador', 'BA'],
              'df_brasilia': ['Brasília', 'DF'],
              'df_taguatinga': ['Taguatinga', 'DF'],
              'df_ceilandia': ['Ceilândia', 'DF'],
              'df_aguas_claras': ['Águas Claras', 'DF'],
              'go_goiania': ['Goiânia', 'GO'],
              'go_aparecida_de_goiania': ['Aparecida de Goiânia', 'GO'],
              'go_anapolis': ['Anápolis', 'GO'],
              'go_rio_verde': ['Rio Verde', 'GO'],
              'ms_campo_grande': ['Campo Grande', 'MS'],
              'ms_dourados': ['Dourados', 'MS'],
              'ms_tres_lagoas': ['Três Lagoas', 'MS'],
              'ms_corumba': ['Corumbá', 'MS'],
              'ms_ponta_pora': ['Ponta Porã', 'MS'],
              'mt_cuiaba': ['Cuiabá', 'MT'],
              'mt_varzea_grande': ['Várzea Grande', 'MT'],
              'mt_rondonopolis': ['Rondonópolis', 'MT'],
              'mt_sinop': ['Sinop', 'MT'],
              'mt_caceres': ['Cáceres', 'MT'],
              'pb_joao_pessoa': ['João Pessoa', 'PB'],
              'pb_campina_grande': ['Campina Grande', 'PB'],
              'pb_patos': ['Patos', 'PB'],
              'pb_cabedelo': ['Cabedelo', 'PB'],
              'pb_bayeux': ['Bayeux', 'PB'],
              'rn_natal': ['Natal', 'RN'],
              'rn_mossoro': ['Mossoró', 'RN'],
              'rn_parnamirim': ['Parnamirim', 'RN'],
              'rn_caico': ['Caicó', 'RN'],
              'rn_assu': ['Assú', 'RN'],
              'al_maceio': ['Maceió', 'AL'],
              'al_arapiraca': ['Arapiraca', 'AL'],
              'al_rio_largo': ['Rio Largo', 'AL'],
              'al_palmeira_dos_indios': ['Palmeira dos Índios', 'AL'],
              'al_maragogi': ['Maragogi', 'AL'],
              'se_aracaju': ['Aracaju', 'SE'],
              'se_nossa_senhora_do_socorro': ['Nossa Senhora do Socorro', 'SE'],
              'se_itabaiana': ['Itabaiana', 'SE'],
              'se_lagarto': ['Lagarto', 'SE'],
              'se_estancia': ['Estância', 'SE'],
              'ma_sao_luis': ['São Luís', 'MA'],
              'ma_imperatriz': ['Imperatriz', 'MA'],
              'ma_caxias': ['Caxias', 'MA'],
              'ma_timon': ['Timon', 'MA'],
              'ma_acailandia': ['Açailândia', 'MA'],
              'pi_teresina': ['Teresina', 'PI'],
              'pi_parnaiba': ['Parnaíba', 'PI'],
              'pi_picos': ['Picos', 'PI'],
              'pi_piripiri': ['Piripiri', 'PI'],
              'pi_floriano': ['Floriano', 'PI'],
              'pa_belem': ['Belém', 'PA'],
              'pa_ananindeua': ['Ananindeua', 'PA'],
              'pa_santarem': ['Santarém', 'PA'],
              'pa_maraba': ['Marabá', 'PA'],
              'pa_parauapebas': ['Parauapebas', 'PA'],
              'am_manaus': ['Manaus', 'AM'],
              'am_parintins': ['Parintins', 'AM'],
              'am_itacoatiara': ['Itacoatiara', 'AM'],
              'am_manacapuru': ['Manacapuru', 'AM'],
              'am_coari': ['Coari', 'AM'],
              'pe_recife_atacadao': ['Recife', 'PE'],
              'pe_recife_novoatacarejo': ['Recife', 'PE'],
              'pe_petrolina_gbarbosa': ['Petrolina', 'PE'],
              'pe_caruaru_atacadao': ['Caruaru', 'PE'],
              'ce_fortaleza': ['Fortaleza', 'CE'],
              'ce_caucaia': ['Caucaia', 'CE'],
              'ce_juazeiro_do_norte': ['Juazeiro do Norte', 'CE'],
              'ce_sobral': ['Sobral', 'CE'],
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
    carregarSupermercadosOnline();

    // CARREGADOR DE DADOS REAIS DE SUPERMERCADOS DE SÃO PAULO (FÓRMULA MESTRE)
    async function carregarSupermercadosSP() {
      try {
        const res = await fetch('/dados_supermercados_sp.json');
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            const existingKeys = new Set(DATABASE_PRODUTOS.map(p => `${p.cidade}|${p.mercado}|${p.nome}`));
            let nextId = DATABASE_PRODUTOS.length + 1;
            items.forEach(it => {
              const key = `${it.cidade}|${it.mercado}|${it.nome}`;
              if (!existingKeys.has(key)) {
                existingKeys.add(key);
                DATABASE_PRODUTOS.push({
                  id: nextId++,
                  nome: it.nome,
                  marca: it.marca || 'Auditada',
                  preco: it.preco,
                  mercado: it.mercado,
                  endereco: it.endereco,
                  cidade: it.cidade,
                  uf: it.uf || 'SP',
                  data: it.data || 'Auditado via E-commerce Oficial',
                  fonte_url: it.fonte_url || ''
                });
              }
            });
            console.log(`✓ NutriPreço: ${items.length} ofertas reais de São Paulo integradas.`);

            // Re-renderiza a busca na hora caso o usuário já tenha pesquisado
            const sInput = document.getElementById('searchInput');
            if (document.body.classList.contains('in-results') && sInput && sInput.value.trim().length > 0 && searchMode === 'food') {
              renderizarResultadosComida(sInput.value.trim().toLowerCase(), sInput.value.trim());
            }
          }
        }
      } catch (e) {
        console.warn('Uso da base local de SP:', e);
      }
    }
    carregarSupermercadosSP();

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
                fonte_url: (item.link_afiliado && item.link_afiliado.startsWith('http')) ? item.link_afiliado : ((item.fonte && item.fonte.startsWith('http')) ? item.fonte : 'https://fzoyldcfyiigwyxxhosd.supabase.co'),
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


    // MODO ALTERNADOR: NUTRIPREÇO (SUPERMERCADOS) vs NUTRICOMBUST (POSTOS)
    function setSearchMode(mode) {
      searchMode = mode;
      const body = document.body;
      const btnFood = document.getElementById('btnModeFood');
      const btnFuel = document.getElementById('btnModeFuel');
      const brandBadge = document.getElementById('brandIconBadge');
      const iconFood = document.getElementById('iconFood');
      const iconFuel = document.getElementById('iconFuel');
      const brandText = document.getElementById('brandNameText');
      const tagline = document.getElementById('homeTagline');
      const headerAudit = document.getElementById('headerAuditText');
      const btnPrimary = document.getElementById('btnSearchPrimary');
      const sortLabel = document.getElementById('sortLabel');
      const cityBtn = document.getElementById('btnCitySelect');

      if (mode === 'fuel') {
        body.classList.add('mode-fuel');
        
        // Estilo dos Botões de Modo
        btnFood.className = "group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer bg-slate-900/80 border-slate-700/80 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-300";
        btnFuel.className = "group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer bg-amber-500/20 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)]";

        // Logo NutriCombust
        brandBadge.className = "w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-700 flex items-center justify-center glow-brand-amber border border-amber-300/40 transition-all duration-300";
        iconFood.classList.add('hidden');
        iconFuel.classList.remove('hidden');
        brandText.innerText = "NutriCombust";
        tagline.innerText = "O Motor de Busca de Combustíveis no Brasil";
        tagline.className = "text-xs font-semibold text-amber-400 tracking-wider uppercase pl-0.5";
        headerAudit.innerText = "Postos Oficiais ANP & Cupons de Abastecimento";
        btnPrimary.innerText = "⛽ Buscar Posto Mais Barato";
        sortLabel.className = "font-bold text-amber-400";
        if (cityBtn) cityBtn.className = "text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer transition-colors";
        const pinH = document.getElementById("locationIndicatorPin");
        const pinR = document.getElementById("resultsPin");
        if (pinH) pinH.className = "text-amber-400 transition-colors";
        if (pinR) pinR.className = "text-amber-400 transition-colors";

      } else {
        body.classList.remove('mode-fuel');

        // Estilo dos Botões de Modo
        btnFood.className = "group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer bg-emerald-500/15 border-emerald-500/50 text-white shadow-[0_0_15px_rgba(0,230,118,0.2)]";
        btnFuel.className = "group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer bg-slate-900/80 border-slate-700/80 hover:border-amber-500/60 text-slate-300 hover:text-amber-300";

        // Logo NutriPreço
        brandBadge.className = "w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-800 flex items-center justify-center glow-brand-green border border-emerald-300/40 transition-all duration-300";
        iconFood.classList.remove('hidden');
        iconFuel.classList.add('hidden');
        brandText.innerText = "NutriPreço";
        tagline.innerText = "O Motor de Busca da Economia Real";
        tagline.className = "text-xs font-semibold text-emerald-400 tracking-wider uppercase pl-0.5";
        headerAudit.innerText = "SEFAZ & ANP Verificados";
        btnPrimary.innerText = "🔍 Pesquisar Menor Preço";
        sortLabel.className = "font-bold text-emerald-400";
        if (cityBtn) cityBtn.className = "text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer transition-colors";
        const pinH2 = document.getElementById("locationIndicatorPin");
        const pinR2 = document.getElementById("resultsPin");
        if (pinH2) pinH2.className = "text-emerald-400 transition-colors";
        if (pinR2) pinR2.className = "text-emerald-400 transition-colors";
      }

      renderChips();
      resetTypewriter();
      
      // Se já estiver na tela de resultados, refaz a busca no novo modo
      if (document.body.classList.contains('in-results')) {
        executarBusca();
      }
    }

    // RENDERIZADOR DE CHIPS RÁPIDOS CONFORME O MODO
                        function renderChips() {
      const container = document.getElementById('quickChipsBlock');
      if (!container) return;
      container.innerHTML = `
        <span class="text-xs text-slate-500 font-semibold mr-1">Cesta Básica:</span>
        <button onclick="buscarTermo('Arroz 5kg')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          🌾 Arroz 5kg
        </button>
        <button onclick="buscarTermo('Feijão Preto')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          🫘 Feijão Preto
        </button>
        <button onclick="buscarTermo('Café')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          ☕ Café
        </button>
        <button onclick="buscarTermo('Leite Integral')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          🥛 Leite Integral
        </button>
        <button onclick="buscarTermo('Óleo de Soja')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          🛢️ Óleo de Soja
        </button>
        <button onclick="buscarTermo('Açúcar')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          🍞 Açúcar
        </button>
        <button onclick="buscarTermo('Carnes')" class="px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors">
          🥩 Carnes
        </button>
      `;
    }

    // EFEITO TYPEWRITER AUTOMÁTICO NO PLACEHOLDER
    const placeholdersFood = [
      "Arroz 5kg mais barato em Cabo Frio...",
      "Leite integral em Recife...",
      "Feijão preto tipo 1 em São Paulo...",
      "Café torrado 500g mais em conta...",
      "Cesta básica completa com menor preço..."
    ];
    const placeholdersFuel = [
      "Gasolina comum mais barata em Cabo Frio...",
      "Etanol hidratado em São Paulo...",
      "Diesel S10 em Recife...",
      "Posto Shell com melhor preço...",
      "Onde abastecer mais barato hoje..."
    ];

    let twIndex = 0;
    let twCharIndex = 0;
    let isDeleting = false;
    let twTimeout = null;

    function runTypewriter() {
      const input = document.getElementById('searchInput');
      if (document.activeElement === input || input.value.length > 0) {
        twTimeout = setTimeout(runTypewriter, 1000);
        return;
      }

      const list = searchMode === 'fuel' ? placeholdersFuel : placeholdersFood;
      const currentText = list[twIndex % list.length];

      if (!isDeleting) {
        input.placeholder = currentText.substring(0, twCharIndex + 1);
        twCharIndex++;
        if (twCharIndex >= currentText.length) {
          isDeleting = true;
          twTimeout = setTimeout(runTypewriter, 2200);
          return;
        }
        twTimeout = setTimeout(runTypewriter, 50);
      } else {
        input.placeholder = currentText.substring(0, twCharIndex - 1);
        twCharIndex--;
        if (twCharIndex <= 0) {
          isDeleting = false;
          twIndex++;
          twTimeout = setTimeout(runTypewriter, 500);
          return;
        }
        twTimeout = setTimeout(runTypewriter, 25);
      }
    }

    function resetTypewriter() {
      clearTimeout(twTimeout);
      twCharIndex = 0;
      isDeleting = false;
      runTypewriter();
    }

    // MONITORAMENTO DO INPUT
    const searchInput = document.getElementById('searchInput');
    const btnClear = document.getElementById('btnClear');

    searchInput.addEventListener('input', () => {
      if (searchInput.value.trim().length > 0) {
        btnClear.classList.remove('hidden');
      } else {
        btnClear.classList.add('hidden');
      }
    });

    function limparBusca() {
      searchInput.value = '';
      btnClear.classList.add('hidden');
      searchInput.focus();
    }

    // ==============================================================================
    // MOTOR DE GEOLOCALIZAÇÃO AUTOMÁTICA HÍBRIDA & HIERARQUIA DO RIO DE JANEIRO (92 MUNICÍPIOS)
    // ==============================================================================
    const CIDADES_RJ_POR_REGIAO = {
      "Metropolitana & Baixada": [
        "Rio de Janeiro", "Niterói", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu",
        "Belford Roxo", "São João de Meriti", "Nilópolis", "Mesquita", "Magé",
        "Itaboraí", "Maricá", "Queimados", "Japeri", "Seropédica", "Paracambi",
        "Itaguaí", "Guapimirim", "Tanguá", "Rio Bonito", "Cachoeiras de Macacu"
      ],
      "Região dos Lagos": [
        "Cabo Frio", "Araruama", "São Pedro da Aldeia", "Armação dos Búzios",
        "Arraial do Cabo", "Saquarema", "Iguaba Grande", "Rio das Ostras",
        "Casimiro de Abreu", "Silva Jardim"
      ],
      "Região Serrana": [
        "Petrópolis", "Teresópolis", "Nova Friburgo", "Bom Jardim", "Cantagalo",
        "Carmo", "Cordeiro", "Duas Barras", "Macuco", "Santa Maria Madalena",
        "São José do Vale do Rio Preto", "São Sebastião do Alto", "Sumidouro", "Trajano de Moraes"
      ],
      "Norte & Noroeste": [
        "Campos dos Goytacazes", "Macaé", "Itaperuna", "Santo Antônio de Pádua",
        "São Fidélis", "São João da Barra", "Quissamã", "Bom Jesus do Itabapoana",
        "Miracema", "Itaocara", "Cambuci", "Italva", "Cardoso Moreira", "Aperibé",
        "Carapebus", "Conceição de Macabu", "Laje do Muriaé", "Natividade",
        "Porciúncula", "São Francisco de Itabapoana", "São José de Ubá", "Varre-Sai"
      ],
      "Médio Paraíba & Costa Verde": [
        "Volta Redonda", "Barra Mansa", "Resende", "Angra dos Reis", "Paraty",
        "Mangaratiba", "Barra do Piraí", "Valença", "Três Rios", "Paraíba do Sul",
        "Pinheiral", "Piraí", "Porto Real", "Quatis", "Rio Claro", "Rio das Flores",
        "Itatiaia", "Areal", "Comendador Levy Gasparian", "Sapucaia", "Vassouras",
        "Mendes", "Engenheiro Paulo de Frontin", "Paty do Alferes", "Miguel Pereira"
      ]
    };

    const TODAS_CIDADES_RJ = Object.values(CIDADES_RJ_POR_REGIAO).flat();

    const CIDADES_SP_POR_REGIAO = {
      "Grande SP & Capital": [
        "São Paulo", "Guarulhos", "São Bernardo do Campo", "Santo André", "Osasco",
        "Barueri", "Diadema", "São Caetano do Sul", "Mauá", "Cotia",
        "Suzano", "Mogi das Cruzes", "Itaquaquecetuba", "Embu das Artes", "Taboão da Serra",
        "Carapicuíba", "Poá", "Ribeirão Pires", "Itapecerica da Serra"
      ],
      "Campinas, Jundiaí & Piracicaba": [
        "Campinas", "Americana", "Sumaré", "Hortolândia", "Indaiatuba",
        "Paulínia", "Valinhos", "Vinhedo", "Cosmópolis", "Jundiaí",
        "Várzea Paulista", "Itatiba", "Piracicaba", "Limeira", "Araras",
        "Leme", "Rio Claro"
      ],
      "Baixada Santista & Litoral": [
        "Santos", "Praia Grande", "São Vicente", "Guarujá", "Cubatão",
        "Itanhaém", "Caraguatatuba", "Ubatuba"
      ],
      "Vale do Paraíba & Bragantina": [
        "São José dos Campos", "Taubaté", "Jacareí", "Guaratinguetá", "Lorena",
        "Caçapava", "Cruzeiro", "Bragança Paulista", "Atibaia"
      ],
      "Ribeirão Preto, Franca & Central": [
        "Ribeirão Preto", "Sertãozinho", "Jaboticabal", "Monte Alto", "Franca",
        "Barretos", "Bebedouro", "Olímpia", "São Carlos", "Araraquara",
        "Matão", "Ibitinga", "Itápolis", "São João da Boa Vista", "Mogi Guaçu",
        "Mogi Mirim", "Itapira", "Mococa", "Pirassununga", "Porto Ferreira"
      ],
      "Sorocaba, Bauru & Interior": [
        "Sorocaba", "Votorantim", "Itu", "Salto", "Tatuí",
        "Itapetininga", "Itapeva", "Bauru", "Jaú", "Botucatu",
        "Marília", "Garça", "Tupã", "Ourinhos", "Assis",
        "Paraguaçu Paulista", "Avaré", "São José do Rio Preto", "Catanduva", "Votuporanga",
        "José Bonifácio", "Jales", "Presidente Prudente", "Araçatuba", "Birigui",
        "Adamantina", "Lins"
      ]
    };

    const TODAS_CIDADES_SP = Object.values(CIDADES_SP_POR_REGIAO).flat();

    const CIDADES_MG_POR_REGIAO = {
      "Metropolitana & Central": [
        "Belo Horizonte", "Contagem", "Betim", "Nova Lima", "Sabará",
        "Sete Lagoas", "Ouro Preto", "Congonhas", "Conselheiro Lafaiete", "Curvelo"
      ],
      "Triângulo & Alto Paranaíba": [
        "Uberlândia", "Uberaba", "Araguari", "Ituiutaba", "Frutal",
        "Araxá", "Patrocínio", "Monte Carmelo"
      ],
      "Zona da Mata & Vertentes": [
        "Juiz de Fora", "Barbacena", "São João del-Rei", "Ubá",
        "Muriaé", "Leopoldina", "Viçosa"
      ],
      "Sul & Sudoeste": [
        "Poços de Caldas", "Varginha", "Itajubá", "Alfenas",
        "Lavras", "Três Corações", "Passos", "São Sebastião do Paraíso", "Guaxupé"
      ],
      "Centro-Oeste": [
        "Divinópolis", "Itaúna", "Pará de Minas", "Bom Despacho",
        "Formiga", "Campo Belo", "Oliveira"
      ],
      "Vale do Aço & Rio Doce": [
        "Ipatinga", "Coronel Fabriciano", "Timóteo", "Governador Valadares",
        "Teófilo Otoni", "Caratinga", "João Monlevade"
      ],
      "Norte & Noroeste": [
        "Montes Claros", "Janaúba", "Januária", "Paracatu",
        "Unaí", "João Pinheiro"
      ]
    };

    const TODAS_CIDADES_MG = Object.values(CIDADES_MG_POR_REGIAO).flat();

    const CIDADES_ES_POR_REGIAO = {
      "Grande Vitória & Central": [
        "Vitória", "Vila Velha", "Serra", "Cariacica", "Viana", "Guarapari", "Fundão"
      ],
      "Norte, Noroeste & Rio Doce": [
        "Linhares", "Colatina", "São Mateus", "Aracruz", "Baixo Guandu", "Marilândia",
        "Pancas", "São Gabriel da Palha", "Nova Venécia", "Barra de São Francisco",
        "Pinheiros", "Montanha", "Conceição da Barra", "Jaguaré", "Sooretama",
        "João Neiva", "Ibiraçu", "Pedro Canário", "Boa Esperança", "Ecoporanga",
        "Água Doce do Norte", "Águia Branca", "Mantenópolis", "São Domingos do Norte",
        "Alto Rio Novo", "Governador Lindenberg", "Vila Valério", "Vila Pavão",
        "São Roque do Canaã", "Mucurici", "Ponto Belo", "Rio Bananal"
      ],
      "Sul & Litoral Sul": [
        "Cachoeiro de Itapemirim", "Castelo", "Alegre", "Guaçuí", "Iúna",
        "Anchieta", "Piúma", "Itapemirim", "Marataízes", "Presidente Kennedy",
        "Iconha", "Rio Novo do Sul", "Alfredo Chaves", "Jerônimo Monteiro",
        "Muqui", "Mimoso do Sul", "Atílio Vivacqua", "Vargem Alta",
        "Apiacá", "Bom Jesus do Norte", "São José do Calçado",
        "Dores do Rio Preto", "Divino de São Lourenço"
      ],
      "Região Serrana & Caparaó": [
        "Domingos Martins", "Marechal Floriano", "Santa Teresa", "Santa Maria de Jetibá",
        "Santa Leopoldina", "Afonso Cláudio", "Venda Nova do Imigrante", "Brejetuba",
        "Conceição do Castelo", "Laranja da Terra", "Itarana", "Itaguaçu",
        "Ibatiba", "Irupi", "Ibitirama", "Muniz Freire"
      ]
    };

    const TODAS_CIDADES_ES = Object.values(CIDADES_ES_POR_REGIAO).flat();

    const CIDADES_PR_POR_REGIAO = {
      "Curitiba & Região Metropolitana": [
        "Curitiba", "São José dos Pinhais", "Colombo", "Araucária", "Fazenda Rio Grande",
        "Pinhais", "Campo Largo", "Almirante Tamandaré", "Piraquara", "Quatro Barras",
        "Campina Grande do Sul", "Campo Magro", "Lapa", "Rio Branco do Sul", "Mandirituba"
      ],
      "Campos Gerais & Centro-Sul": [
        "Ponta Grossa", "Castro", "Telêmaco Borba", "Irati", "União da Vitória",
        "Guarapuava", "Prudentópolis", "Palmeira", "Jaguariaíva", "Carambeí",
        "Piraí do Sul", "Tibagi", "Laranjeiras do Sul", "Pinhão", "Reserva"
      ],
      "Norte Central & Norte Pioneiro": [
        "Londrina", "Maringá", "Apucarana", "Arapongas", "Rolândia", "Cambé",
        "Sarandi", "Ibiporã", "Cornélio Procópio", "Santo Antônio da Platina",
        "Jacarezinho", "Bandeirantes", "Mandaguari", "Porecatu", "Jandaia do Sul",
        "Astorga", "Assaí", "Ibaiti"
      ],
      "Oeste, Sudoeste & Noroeste": [
        "Cascavel", "Foz do Iguaçu", "Toledo", "Medianeira", "Marechal Cândido Rondon",
        "Umuarama", "Cianorte", "Paranavaí", "Francisco Beltrão", "Pato Branco",
        "Palotina", "Dois Vizinhos", "Guaíra", "Santa Helena", "Matelândia",
        "Chopinzinho", "Coronel Vivida", "Loanda", "Campo Mourão"
      ],
      "Litoral Paranaense": [
        "Paranaguá", "Matinhos", "Guaratuba", "Pontal do Paraná", "Antonina", "Morretes"
      ]
    };

    const TODAS_CIDADES_PR = Object.values(CIDADES_PR_POR_REGIAO).flat();

    const CIDADES_SC_POR_REGIAO = {
      "Grande Florianópolis & Litoral": [
        "Florianópolis", "São José", "Palhoça", "Biguaçu", "Santo Amaro da Imperatriz",
        "Governador Celso Ramos", "Tijucas", "Garopaba", "Imbituba", "Antônio Carlos",
        "São Pedro de Alcântara", "Águas Mornas"
      ],
      "Vale do Itajaí & Foz": [
        "Blumenau", "Itajaí", "Balneário Camboriú", "Brusque", "Navegantes",
        "Camboriú", "Gaspar", "Indaial", "Pomerode", "Timbó",
        "Itapema", "Porto Belo", "Penha", "Piçarras", "Ibirama"
      ],
      "Norte Catarinense & Planalto": [
        "Joinville", "Jaraguá do Sul", "São Bento do Sul", "Mafra", "Canoinhas",
        "Rio Negrinho", "Guaramirim", "Porto União", "Araquari", "São Francisco do Sul",
        "Corupá", "Itapoá"
      ],
      "Sul Catarinense & Carbonífera": [
        "Criciúma", "Tubarão", "Araranguá", "Içara", "Laguna",
        "Braço do Norte", "Orleans", "Urussanga", "Forquilhinha", "Sombrio",
        "Morro da Fumaça", "Nova Veneza"
      ],
      "Oeste, Meio-Oeste & Serra": [
        "Chapecó", "Lages", "Caçador", "Concórdia", "Videira",
        "Xanxerê", "Joaçaba", "Curitibanos", "Fraiburgo", "São Miguel do Oeste",
        "Campos Novos", "Maravilha", "Capinzal", "Pinhalzinho", "São Joaquim"
      ]
    };

    const TODAS_CIDADES_SC = Object.values(CIDADES_SC_POR_REGIAO).flat();

    const CIDADES_RS_POR_REGIAO = {
      "Porto Alegre & Região Metropolitana": [
        "Porto Alegre", "Canoas", "Novo Hamburgo", "São Leopoldo", "Gravataí",
        "Viamão", "Alvorada", "Cachoeirinha", "Sapucaia do Sul", "Esteio",
        "Guaíba", "Campo Bom", "Sapiranga", "Montenegro", "Taquara"
      ],
      "Serra Gaúcha & Hortênsias": [
        "Caxias do Sul", "Bento Gonçalves", "Farroupilha", "Gramado", "Canela",
        "Vacaria", "Garibaldi", "Carlos Barbosa", "Nova Prata", "Veranópolis",
        "Flores da Cunha", "São Marcos", "Feliz", "Igrejinha", "Três Coroas"
      ],
      "Planalto, Missões & Alto Uruguai": [
        "Passo Fundo", "Erechim", "Santo Ângelo", "Ijuí", "Cruz Alta",
        "Santa Rosa", "Carazinho", "Frederico Westphalen", "Palmeira das Missões", "Panambi",
        "São Borja", "Marau", "Soledade", "Não-Me-Toque", "Getúlio Vargas"
      ],
      "Centro, Vales & Fronteira Oeste": [
        "Santa Maria", "Santa Cruz do Sul", "Lajeado", "Cachoeira do Sul", "Uruguaiana",
        "Santana do Livramento", "Alegrete", "Venâncio Aires", "São Gabriel", "Estrela",
        "Encantado", "Rosário do Sul", "Itaqui", "Taquari", "Teutônia"
      ],
      "Sul Gaúcho, Campanha & Litoral": [
        "Pelotas", "Rio Grande", "Bagé", "Dom Pedrito", "Camaquã",
        "São Lourenço do Sul", "Jaguarão", "Torres", "Capão da Canoa", "Tramandaí",
        "Osório", "Santo Antônio da Patrulha"
      ]
    };

    const TODAS_CIDADES_RS = Object.values(CIDADES_RS_POR_REGIAO).flat();

    const CIDADES_BA_POR_REGIAO = {
      "Salvador, RMS & Recôncavo": [
        "Salvador", "Lauro de Freitas", "Camaçari", "Simões Filho", "Candeias",
        "Dias d'Ávila", "Mata de São João", "Pojuca", "Vera Cruz", "Itaparica",
        "Madre de Deus", "Santo Amaro", "São Francisco do Conde", "Cachoeira", "Cruz das Almas",
        "Santo Antônio de Jesus"
      ],
      "Feira de Santana & Portal do Sertão": [
        "Feira de Santana", "Serrinha", "Alagoinhas", "Conceição do Coité", "Riachão do Jacuípe",
        "Ipirá", "Santa Bárbara", "Amélia Rodrigues", "São Gonçalo dos Campos", "Teofilândia",
        "Araci", "Ruy Barbosa", "Castro Alves", "Muritiba"
      ],
      "Sul & Costa do Cacau e Descobrimento": [
        "Ilhéus", "Itabuna", "Porto Seguro", "Eunápolis", "Teixeira de Freitas",
        "Itamaraju", "Valença", "Ubaitaba", "Gandu", "Canavieiras",
        "Camamu", "Prado", "Nova Viçosa", "Mucuri", "Una"
      ],
      "Sudoeste, Serra Geral & Chapada": [
        "Vitória da Conquista", "Jequié", "Brumado", "Guanambi", "Caetité",
        "Jaguaquara", "Poções", "Livramento de Nossa Senhora", "Itapetinga", "Lençóis",
        "Seabra", "Itaberaba", "Macaúbas", "Paramirim"
      ],
      "Norte, Vale do São Francisco & Oeste": [
        "Juazeiro", "Paulo Afonso", "Senhor do Bonfim", "Jacobina", "Irecê",
        "Barreiras", "Luís Eduardo Magalhães", "Bom Jesus da Lapa", "Campo Formoso", "Casa Nova",
        "Remanso", "Morro do Chapéu", "Santa Maria da Vitória"
      ]
    };

    const TODAS_CIDADES_BA = Object.values(CIDADES_BA_POR_REGIAO).flat();

    const CIDADES_PE_POR_REGIAO = {
      "Recife & RMR": [
        "Recife", "Jaboatão dos Guararapes", "Olinda", "Paulista", "Cabo de Santo Agostinho",
        "Camaragibe", "Igarassu", "São Lourenço da Mata", "Abreu e Lima", "Ipojuca",
        "Moreno", "Itapissuma", "Ilha de Itamaracá"
      ],
      "Zona da Mata": [
        "Vitória de Santo Antão", "Goiana", "Carpina", "Palmares", "Timbaúba",
        "Paudalho", "Escada", "Barreiros", "Sirinhaém", "Catende",
        "Ribeirão", "Vicência", "Nazaré da Mata"
      ],
      "Agreste Pernambucano": [
        "Caruaru", "Garanhuns", "Santa Cruz do Capibaribe", "Gravatá", "Belo Jardim",
        "Toritama", "Surubim", "Bezerros", "Pesqueira", "Brejo da Madre de Deus",
        "Bom Jardim", "Lajedo", "São Bento do Una", "São Caetano"
      ],
      "Sertão Central & Pajeú": [
        "Arcoverde", "Serra Talhada", "Salgueiro", "Afogados da Ingazeira", "Custódia",
        "Sertânia", "São José do Egito", "Triunfo", "Floresta", "Belém do São Francisco",
        "Tabira"
      ],
      "Sertão do São Francisco & Araripe": [
        "Petrolina", "Araripina", "Ouricuri", "Santa Maria da Boa Vista", "Cabrobó",
        "Lagoa Grande", "Bodocó", "Ipubi", "Trindade", "Exu"
      ]
    };

    const TODAS_CIDADES_PE = Object.values(CIDADES_PE_POR_REGIAO).flat();

    const CIDADES_CE_POR_REGIAO = {
      "Fortaleza & RMF": [
        "Fortaleza", "Caucaia", "Maracanaú", "Maranguape", "Aquiraz",
        "Cascavel", "Pacatuba", "Horizonte", "Pacajus", "Eusébio",
        "São Gonçalo do Amarante", "Itaitinga", "Paracuru", "Trairi"
      ],
      "Litoral Norte & Sobral": [
        "Sobral", "Itapipoca", "Tianguá", "Camocim", "Acaraú",
        "Granja", "Viçosa do Ceará", "São Benedito", "Massapê", "Ipu",
        "Santa Quitéria", "Itarema"
      ],
      "Sertão Central & Inhamuns": [
        "Quixadá", "Quixeramobim", "Crateús", "Canindé", "Tauá",
        "Morada Nova", "Boa Viagem", "Senador Pompeu", "Mombaça", "Pedra Branca"
      ],
      "Vale do Jaguaribe": [
        "Limoeiro do Norte", "Russas", "Aracati", "Jaguaribe", "Tabuleiro do Norte",
        "Beberibe", "Icapuí", "Jaguaruana", "Alto Santo"
      ],
      "Cariri & Centro-Sul": [
        "Juazeiro do Norte", "Crato", "Barbalha", "Iguatu", "Icó",
        "Brejo Santo", "Missão Velha", "Mauriti", "Várzea Alegre", "Lavras da Mangabeira",
        "Campos Sales"
      ]
    };

    const TODAS_CIDADES_CE = Object.values(CIDADES_CE_POR_REGIAO).flat();

    const CIDADES_DF_POR_REGIAO = {
      "Plano Piloto & Central": [
        "Brasília (Plano Piloto)", "Asa Sul", "Asa Norte", "Sudoeste / Octogonal", "Cruzeiro",
        "Lago Sul", "Lago Norte", "Candangolândia", "Núcleo Bandeirante", "Vila Planalto"
      ],
      "Oeste (Taguatinga & Ceilândia)": [
        "Taguatinga", "Ceilândia", "Vicente Pires", "Arniqueira", "Sol Nascente / Pôr do Sol",
        "Brazlândia", "Samambaia"
      ],
      "Sudoeste & Sul (Águas Claras & Gama)": [
        "Águas Claras", "Guará", "Guará II", "Gama", "Santa Maria",
        "Recanto das Emas", "Riacho Fundo", "Riacho Fundo II", "Park Way"
      ],
      "Norte & Leste (Sobradinho & Planaltina)": [
        "Sobradinho", "Sobradinho II", "Planaltina", "Paranoá", "Itapoã",
        "São Sebastião", "Jardim Botânico", "Varjão", "Fercal"
      ],
      "Entorno Metropolitano": [
        "Valparaíso de Goiás", "Águas Lindas de Goiás", "Luziânia", "Novo Gama", "Cidade Ocidental",
        "Formosa", "Planaltina de Goiás"
      ]
    };

    const TODAS_CIDADES_DF = Object.values(CIDADES_DF_POR_REGIAO).flat();

    const CIDADES_GO_POR_REGIAO = {
      "Goiânia & Região Metropolitana": [
        "Goiânia", "Aparecida de Goiânia", "Senador Canedo", "Trindade", "Goianira",
        "Inhumas", "Bela Vista de Goiás", "Nerópolis", "Guapó", "Hidrolândia",
        "Bonfinópolis", "Goianápolis"
      ],
      "Centro & Eixo Anápolis": [
        "Anápolis", "Jaraguá", "Pirenópolis", "Corumbá de Goiás", "Goianésia",
        "Ceres", "Rialma", "Itapuranga", "Crixás", "Uruaçu"
      ],
      "Sul Goiano & Região das Águas": [
        "Itumbiara", "Rio Verde", "Jataí", "Catalão", "Caldas Novas",
        "Morrinhos", "Goiatuba", "Mineiros", "Quirinópolis", "Piracanjuba",
        "Santa Helena de Goiás", "Ipameri", "Pires do Rio"
      ],
      "Entorno do DF & Leste": [
        "Luziânia", "Valparaíso de Goiás", "Águas Lindas de Goiás", "Novo Gama", "Cidade Ocidental",
        "Formosa", "Planaltina de Goiás", "Cristalina", "Santo Antônio do Descoberto", "Posse"
      ],
      "Norte & Noroeste": [
        "Porangatu", "São Miguel do Araguaia", "Minaçu", "Niquelândia", "Mara Rosa",
        "Goiás", "Iporá", "São Luís de Montes Belos", "Aragarças", "Mozarlândia"
      ]
    };

    const TODAS_CIDADES_GO = Object.values(CIDADES_GO_POR_REGIAO).flat();

    const CIDADES_MS_POR_REGIAO = {
      "Campo Grande & Região Central": [
        "Campo Grande", "Sidrolândia", "Terenos", "Jaraguari", "Ribas do Rio Pardo",
        "Bandeirantes", "Corguinho", "Rochedo", "Dois Irmãos do Buriti"
      ],
      "Dourados & Sul Fronteira": [
        "Dourados", "Ponta Porã", "Naviraí", "Maracaju", "Fátima do Sul",
        "Rio Brilhante", "Caarapó", "Amambai", "Itaporã", "Mundo Novo",
        "Iguatemi", "Coronel Sapucaia", "Eldorado", "Deodápolis"
      ],
      "Leste & Vale da Celulose (Bolsão)": [
        "Três Lagoas", "Paranaíba", "Chapadão do Sul", "Aparecida do Taboado",
        "Brasilândia", "Cassilândia", "Água Clara", "Bataguassu",
        "Santa Rita do Pardo", "Inocência", "Selvíria"
      ],
      "Pantanal & Sudoeste / Bonito": [
        "Corumbá", "Ladário", "Aquidauana", "Anastácio", "Miranda",
        "Bonito", "Jardim", "Bela Vista", "Porto Murtinho", "Guia Lopes da Laguna", "Bodoquena"
      ],
      "Norte & Alto Taquari": [
        "Coxim", "São Gabriel do Oeste", "Sonora", "Rio Verde de Mato Grosso",
        "Camapuã", "Pedro Gomes", "Costa Rica", "Alcinópolis", "Figueirão"
      ]
    };

    const TODAS_CIDADES_MS = Object.values(CIDADES_MS_POR_REGIAO).flat();

    const CIDADES_MT_POR_REGIAO = {
      "Cuiabá & Região Metropolitana": [
        "Cuiabá", "Várzea Grande", "Santo Antônio de Leverger", "Chapada dos Guimarães",
        "Nossa Senhora do Livramento", "Poconé", "Barão de Melgaço", "Acorizal", "Jangada"
      ],
      "Sul & Rondonópolis": [
        "Rondonópolis", "Jaciara", "Primavera do Leste", "Campo Verde",
        "Paranatinga", "Juscimeira", "Pedra Preta", "Itiquira",
        "Alto Araguaia", "Alto Garças", "Guiratinga", "Dom Aquino"
      ],
      "Médio-Norte & Eixo Agro": [
        "Sinop", "Sorriso", "Lucas do Rio Verde", "Nova Mutum",
        "Tapurah", "Santa Rita do Trivelato", "Ipiranga do Norte", "Vera", "Cláudia", "Feliz Natal"
      ],
      "Sudoeste & Vale do Guaporé": [
        "Cáceres", "Tangará da Serra", "Barra do Bugres", "Mirassol d'Oeste",
        "São José dos Quatro Marcos", "Pontes e Lacerda", "Comodoro", "Araputanga", "Nova Olímpia", "Jauru"
      ],
      "Norte & Araguaia": [
        "Alta Floresta", "Colíder", "Guarantã do Norte", "Peixoto de Azevedo",
        "Juína", "Juara", "Barra do Garças", "Água Boa", "Canarana", "Confresa", "Vila Rica"
      ]
    };

    const TODAS_CIDADES_MT = Object.values(CIDADES_MT_POR_REGIAO).flat();

    const CIDADES_PB_POR_REGIAO = {
      "João Pessoa & Região Metropolitana": [
        "João Pessoa", "Santa Rita", "Bayeux", "Cabedelo", "Conde",
        "Alhandra", "Pitimbu", "Caaporã", "Lucena", "Rio Tinto"
      ],
      "Campina Grande & Borborema": [
        "Campina Grande", "Queimadas", "Lagoa Seca", "Esperança",
        "Remígio", "Pocinhos", "Boqueirão", "Soledade", "Fagundes", "Alagoa Nova"
      ],
      "Sertão & Alto Piranhas": [
        "Patos", "Sousa", "Cajazeiras", "Pombal", "Piancó",
        "Itaporanga", "Catolé do Rocha", "São Bento", "Princesa Isabel", "Teixeira"
      ],
      "Agreste & Brejo Paraibano": [
        "Guarabira", "Solânea", "Bananeiras", "Areia", "Mamanguape",
        "Sapé", "Itabaiana", "Mari", "Araruna", "Belém"
      ],
      "Cariri & Curimataú": [
        "Monteiro", "Serra Branca", "Sumé", "Picuí", "Cuité",
        "Juazeirinho", "Taperoá", "Barra de Santana"
      ]
    };

    const TODAS_CIDADES_PB = Object.values(CIDADES_PB_POR_REGIAO).flat();

    const CIDADES_RN_POR_REGIAO = {
      "Natal & Região Metropolitana": [
        "Natal", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Ceará-Mirim",
        "Extremoz", "Nísia Floresta", "São José de Mipibu", "Monte Alegre", "Tibau do Sul"
      ],
      "Oeste Potiguar & Costa Branca": [
        "Mossoró", "Assú", "Tibau", "Areia Branca", "Macau",
        "Baraúna", "Apodi", "Grossos", "Governador Dix-Sept Rosado", "Caraúbas"
      ],
      "Agreste & Litoral Sul": [
        "Nova Cruz", "Santo Antônio", "Goianinha", "Canguaretama", "Passa e Fica",
        "Santa Cruz", "São Paulo do Potengi", "Brejinho", "João Câmara", "Touros"
      ],
      "Seridó Potiguar": [
        "Caicó", "Currais Novos", "Parelhas", "Jucurutu", "Acari",
        "Jardim do Seridó", "Florânia", "Cerro Corá", "Cruzeta", "São João do Sabugi"
      ],
      "Alto Oeste & Sertão": [
        "Pau dos Ferros", "Alexandria", "São Miguel", "Umarizal", "Martins",
        "Patu", "Portalegre", "Almino Afonso", "Luís Gomes", "Severiano Melo"
      ]
    };

    const TODAS_CIDADES_RN = Object.values(CIDADES_RN_POR_REGIAO).flat();

    const CIDADES_AL_POR_REGIAO = {
      "Maceió & Região Metropolitana": [
        "Maceió", "Rio Largo", "Marechal Deodoro", "Pilar", "Paripueira",
        "Barra de Santo Antônio", "Satuba", "Santa Luzia do Norte", "Coqueiro Seco", "Messias"
      ],
      "Agreste & Arapiraca": [
        "Arapiraca", "Palmeira dos Índios", "São Sebastião", "Lagoa da Canoa", "Feira Grande",
        "Igaci", "Craíbas", "Taquarana", "Limoeiro de Anadia", "Girau do Ponciano"
      ],
      "Litoral & Costa dos Corais": [
        "Maragogi", "Japaratinga", "Porto de Pedras", "São Miguel dos Milagres", "Passo de Camaragibe",
        "Penedo", "Coruripe", "Piaçabuçu", "Feliz Deserto", "Jequiá da Praia"
      ],
      "Zona da Mata & Vale do Mundaú": [
        "União dos Palmares", "São José da Laje", "Murici", "Viçosa", "Atalaia",
        "Capela", "Branquinha", "Ibateguara", "Chã Preta", "Cajueiro"
      ],
      "Sertão Alagoano": [
        "Delmiro Gouveia", "Santana do Ipanema", "Piranhas", "Batalha", "Pão de Açúcar",
        "Olho d'Água das Flores", "São José da Tapera", "Mata Grande", "Água Branca", "Major Isidoro"
      ]
    };

    const TODAS_CIDADES_AL = Object.values(CIDADES_AL_POR_REGIAO).flat();

    const CIDADES_SE_POR_REGIAO = {
      "Grande Aracaju & Litoral": [
        "Aracaju", "Nossa Senhora do Socorro", "São Cristóvão", "Barra dos Coqueiros",
        "Laranjeiras", "Itaporanga d'Ajuda", "Maruim", "Santo Amaro das Brotas"
      ],
      "Agreste Central & Itabaiana": [
        "Itabaiana", "Lagarto", "Simão Dias", "Campo do Brito", "Ribeirópolis",
        "Moita Bonita", "Areia Branca", "Macambira", "São Domingos", "Malhador"
      ],
      "Sul Sergipano & Litoral Sul": [
        "Estância", "Itabaianinha", "Tobias Barreto", "Umbaúba", "Boquim",
        "Cristinápolis", "Santa Luzia do Itanhy", "Indiaroba", "Arauá", "Pedrinhas"
      ],
      "Alto Sertão & Baixo São Francisco": [
        "Nossa Senhora da Glória", "Canindé de São Francisco", "Poço Redondo", "Porto da Folha",
        "Monte Alegre de Sergipe", "Propriá", "Neópolis", "Santana do São Francisco", "Ilha das Flores", "Gararu"
      ],
      "Médio Sertão & Cotinguiba": [
        "Capela", "Japaratuba", "Carmópolis", "Rosário do Catete",
        "Aquidabã", "Nossa Senhora das Dores", "Siriri", "Muribeca", "Pirambu"
      ]
    };

    const TODAS_CIDADES_SE = Object.values(CIDADES_SE_POR_REGIAO).flat();

    const CIDADES_MA_POR_REGIAO = {
      "Grande Ilha de São Luís & Baixada": [
        "São Luís", "São José de Ribamar", "Paço do Lumiar", "Raposa", "Alcântara",
        "Rosário", "Bacabeira", "Pinheiro", "Santa Helena", "Viana"
      ],
      "Região Tocantina & Imperatriz": [
        "Imperatriz", "Açailândia", "João Lisboa", "Estreito", "Porto Franco",
        "Amarante do Maranhão", "Montes Altos", "Ribamar Fiquene", "Davinópolis", "Buriticupu"
      ],
      "Cocais & Leste Maranhense": [
        "Caxias", "Timon", "Codó", "Coroatá", "Coelho Neto",
        "Barra do Corda", "Presidente Dutra", "Colinas", "Dom Pedro", "Gonçalves Dias"
      ],
      "Médio Mearim & Vale do Pindaré": [
        "Bacabal", "Santa Inês", "Pedreiras", "Igarapé Grande", "Lago da Pedra",
        "Zé Doca", "Bom Jardim", "Pio XII", "Poção de Pedras", "Trizidela do Vale"
      ],
      "Sul & Lençóis / Baixo Parnaíba": [
        "Balsas", "Carolina", "Riachão", "São Raimundo das Mangabeiras", "Barreirinhas",
        "Chapadinha", "Tutóia", "Araioses", "Santa Rita", "Urbano Santos"
      ]
    };

    const TODAS_CIDADES_MA = Object.values(CIDADES_MA_POR_REGIAO).flat();

    const CIDADES_PI_POR_REGIAO = {
      "Grande Teresina & Entre Rios": [
        "Teresina", "Altos", "Campo Maior", "José de Freitas", "União",
        "Barras", "Esperantina", "Batalha", "Demerval Lobão", "Monsenhor Gil"
      ],
      "Litoral & Planície Litorânea": [
        "Parnaíba", "Luís Correia", "Ilha Grande", "Cajueiro da Praia", "Cocal",
        "Cocal dos Alves", "Buriti dos Lopes", "Piracuruca", "Piripiri", "Pedro II"
      ],
      "Vale do Sambito & Médio Parnaíba": [
        "Valença do Piauí", "Elesbão Veloso", "Água Branca", "Amarante", "Regeneração",
        "São Pedro do Piauí", "Barro Duro", "Angical do Piauí", "Palmeirais", "Inhuma"
      ],
      "Vale do Canindé & Picos": [
        "Picos", "Oeiras", "Paulistana", "Simões", "Fronteiras",
        "Jaicós", "Pio IX", "Ipiranga do Piauí", "Simplício Mendes", "Itainópolis"
      ],
      "Chapadas do Extremo Sul & Serra da Capivara": [
        "Floriano", "Uruçuí", "Bom Jesus", "Corrente", "São Raimundo Nonato",
        "Canto do Buriti", "Guadalupe", "Ribeiro Gonçalves", "Baixa Grande do Ribeiro", "Curimatá"
      ]
    };

    const TODAS_CIDADES_PI = Object.values(CIDADES_PI_POR_REGIAO).flat();

    const CIDADES_PA_POR_REGIAO = {
      "Região Metropolitana de Belém & Marajó": [
        "Belém", "Ananindeua", "Marituba", "Benevides", "Santa Izabel do Pará",
        "Barcarena", "Abaetetuba", "Soure", "Salvaterra", "Breves"
      ],
      "Baixo Amazonas & Tapajós": [
        "Santarém", "Itaituba", "Oriximiná", "Óbidos", "Alenquer",
        "Monte Alegre", "Juruti", "Prainha", "Rurópolis", "Belterra"
      ],
      "Sudeste Paraense & Carajás": [
        "Marabá", "Parauapebas", "Canaã dos Carajás", "Tucuruí", "Curionópolis",
        "Eldorado do Carajás", "São Félix do Xingu", "Redenção", "Xinguara", "Conceição do Araguaia"
      ],
      "Nordeste Paraense & Salgado": [
        "Castanhal", "Bragança", "Capanema", "Salinópolis", "Vigia",
        "Cametá", "Tomé-Açu", "Paragominas", "Capitão Poço", "Tailândia"
      ],
      "Xingu & Transamazônica": [
        "Altamira", "Brasil Novo", "Medicilândia", "Uruará", "Pacajá",
        "Anapu", "Vitória do Xingu", "Senador José Porfírio", "Porto de Moz", "Novo Repartimento"
      ]
    };

    const TODAS_CIDADES_PA = Object.values(CIDADES_PA_POR_REGIAO).flat();

    const CIDADES_AM_POR_REGIAO = {
      "Região Metropolitana de Manaus & Rio Negro": [
        "Manaus", "Iranduba", "Manacapuru", "Novo Airão", "Careiro",
        "Careiro da Várzea", "Rio Preto da Eva", "Presidente Figueiredo", "Itacoatiara", "Silves"
      ],
      "Médio & Baixo Amazonas": [
        "Parintins", "Maués", "Itapiranga", "Urucará", "São Sebastião do Uatumã",
        "Nhamundá", "Barreirinha", "Boa Vista do Ramos", "Autazes", "Borba"
      ],
      "Alto Solimões & Tríplice Fronteira": [
        "Tabatinga", "Benjamin Constant", "Atalaia do Norte", "São Paulo de Olivença",
        "Amaturá", "Santo Antônio do Içá", "Tonantins", "Fonte Boa", "Jutaí"
      ],
      "Médio Solimões & Juruá": [
        "Tefé", "Coari", "Alvarães", "Uarini", "Carauari",
        "Eirunepé", "Envira", "Ipixuna", "Guajará", "Itamarati"
      ],
      "Calha do Madeira & Purus": [
        "São Gabriel da Cachoeira", "Barcelos", "Santa Isabel do Rio Negro", "Lábrea",
        "Humaitá", "Manicoré", "Apuí", "Boca do Acre", "Canutama", "Tapauá"
      ]
    };

    const TODAS_CIDADES_AM = Object.values(CIDADES_AM_POR_REGIAO).flat();



















    const OUTRAS_CIDADES_AUDITADAS = [
      { "nome": "Vitória", "uf": "ES", "lat": -20.31, "lon": -40.33 },
      { "nome": "Curitiba", "uf": "PR", "lat": -25.42, "lon": -49.27 },
      { "nome": "Florianópolis", "uf": "SC", "lat": -27.59, "lon": -48.54 },
      { "nome": "Criciúma", "uf": "SC", "lat": -28.67, "lon": -49.37 },
      { "nome": "Blumenau", "uf": "SC", "lat": -26.91, "lon": -49.07 },
      { "nome": "Porto Alegre", "uf": "RS", "lat": -30.03, "lon": -51.23 },
      { "nome": "Salvador", "uf": "BA", "lat": -12.97, "lon": -38.51 },
      { "nome": "Brasília", "uf": "DF", "lat": -15.79, "lon": -47.88 },
      { "nome": "Goiânia", "uf": "GO", "lat": -16.68, "lon": -49.26 },
      { "nome": "Recife", "uf": "PE", "lat": -8.05, "lon": -34.88 },
      { "nome": "Fortaleza", "uf": "CE", "lat": -3.73, "lon": -38.52 }
    ];

    const ESTADOS_MAP = {
      'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
      'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
      'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
      'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
      'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
      'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
      'Sergipe': 'SE', 'Tocantins': 'TO'
    };

            let locationMethod = 'IP'; // 'GPS', 'IP' ou 'Manual'
    let abaModalAtual = 'estados'; // 'estados', 'rj', 'sp' ou 'mg'
    let regiaoRjAtiva = 'Todas';
    let filtroRjTexto = '';
    let regiaoSpAtiva = 'Todas';
    let filtroSpTexto = '';
    let regiaoMgAtiva = 'Todas';
    let filtroMgTexto = '';
    let regiaoEsAtiva = 'Todas';
    let filtroEsTexto = '';

    function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    function isCityCovered(cidade) {
      if (!cidade) return false;
      const clean = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (typeof TODAS_CIDADES_RJ !== 'undefined' && TODAS_CIDADES_RJ.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_SP !== 'undefined' && TODAS_CIDADES_SP.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_MG !== 'undefined' && TODAS_CIDADES_MG.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_ES !== 'undefined' && TODAS_CIDADES_ES.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_PR !== 'undefined' && TODAS_CIDADES_PR.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_SC !== 'undefined' && TODAS_CIDADES_SC.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_RS !== 'undefined' && TODAS_CIDADES_RS.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_BA !== 'undefined' && TODAS_CIDADES_BA.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_PE !== 'undefined' && TODAS_CIDADES_PE.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_CE !== 'undefined' && TODAS_CIDADES_CE.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_DF !== 'undefined' && TODAS_CIDADES_DF.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_GO !== 'undefined' && TODAS_CIDADES_GO.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_MS !== 'undefined' && TODAS_CIDADES_MS.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_MT !== 'undefined' && TODAS_CIDADES_MT.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_PB !== 'undefined' && TODAS_CIDADES_PB.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_RN !== 'undefined' && TODAS_CIDADES_RN.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_AL !== 'undefined' && TODAS_CIDADES_AL.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_SE !== 'undefined' && TODAS_CIDADES_SE.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_MA !== 'undefined' && TODAS_CIDADES_MA.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_PI !== 'undefined' && TODAS_CIDADES_PI.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_PA !== 'undefined' && TODAS_CIDADES_PA.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      if (typeof TODAS_CIDADES_AM !== 'undefined' && TODAS_CIDADES_AM.some(c => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() === clean)) return true;
      const temProdutos = DATABASE_PRODUTOS.some(p => {
        const pClean = (p.cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return pClean === clean || pClean.includes(clean) || clean.includes(pClean);
      });
      if (temProdutos) return true;
      const temPostos = DATABASE_POSTOS.some(p => {
        const pClean = (p.cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return pClean === clean || pClean.includes(clean) || clean.includes(pClean);
      });
      return temPostos;
    }

    function atualizarIndicadoresLocalizacao() {
      const labelText = `${currentCity}, ${currentUF}`;
      const methodText = `(Detectado via ${locationMethod})`;

      const detText = document.getElementById('detectedCityText');
      const detBadge = document.getElementById('detectedMethodBadge');
      const resText = document.getElementById('resultsCityText');
      const resBadge = document.getElementById('resultsLocationMethod');
      const expCity = document.getElementById('expansionCityName');
      const curCityLabel = document.getElementById('currentCityLabel');

      if (detText) detText.innerText = labelText;
      if (detBadge) detBadge.innerText = methodText;
      if (resText) resText.innerText = labelText;
      if (resBadge) resBadge.innerText = methodText;
      if (expCity) expCity.innerText = `${currentCity} - ${currentUF}`;
      if (curCityLabel) curCityLabel.innerText = labelText;

      verificarCoberturaCidade();
    }

    function verificarCoberturaCidade() {
      const card = document.getElementById('expansionCard');
      if (!card) return;
      const coberta = isCityCovered(currentCity);
      if (!coberta) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    }

            function abrirModalTrocarCidade() {
      const modal = document.getElementById('modalTrocarCidade');
      if (modal) {
        modal.classList.remove('hidden');
        abaModalAtual = 'estados';
        regiaoRjAtiva = 'Todas';
        regiaoSpAtiva = 'Todas';
        regiaoMgAtiva = 'Todas';
        filtroRjTexto = '';
        filtroSpTexto = '';
        filtroMgTexto = '';
        const inputTop = document.getElementById('inputBuscaCidadeModal');
        if (inputTop) inputTop.value = '';
        renderizarCidadesModal();
      }
    }

    function fecharModalTrocarCidade() {
      const modal = document.getElementById('modalTrocarCidade');
      if (modal) modal.classList.add('hidden');
    }

    function abrirAbaRioDeJaneiro() {
      abaModalAtual = 'rj';
      regiaoRjAtiva = 'Todas';
      filtroRjTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function abrirAbaSaoPaulo() {
      abaModalAtual = 'sp';
      regiaoSpAtiva = 'Todas';
      filtroSpTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function abrirAbaMinasGerais() {
      abaModalAtual = 'mg';
      regiaoMgAtiva = 'Todas';
      filtroMgTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

        let regiaoPrAtiva = 'Todas';
    let filtroPrTexto = '';

        let regiaoScAtiva = 'Todas';
    let filtroScTexto = '';

        let regiaoRsAtiva = 'Todas';
    let filtroRsTexto = '';

        let regiaoBaAtiva = 'Todas';
    let filtroBaTexto = '';

        let regiaoPeAtiva = 'Todas';
    let filtroPeTexto = '';

        let regiaoCeAtiva = 'Todas';
    let filtroCeTexto = '';

        let regiaoDfAtiva = 'Todas';
    let filtroDfTexto = '';

        let regiaoGoAtiva = 'Todas';
    let filtroGoTexto = '';

        let regiaoMsAtiva = 'Todas';
        regiaoMtAtiva = 'Todas';
        regiaoPbAtiva = 'Todas';
        regiaoRnAtiva = 'Todas';
        regiaoAlAtiva = 'Todas';
        regiaoSeAtiva = 'Todas';
        regiaoMaAtiva = 'Todas';
        regiaoPiAtiva = 'Todas';
        regiaoPaAtiva = 'Todas';
        regiaoAmAtiva = 'Todas';
    let filtroMsTexto = '';

    function abrirAbaMatoGrossoDoSul() {
      abaModalAtual = 'ms';
      regiaoMsAtiva = 'Todas';
        regiaoMtAtiva = 'Todas';
        regiaoPbAtiva = 'Todas';
        regiaoRnAtiva = 'Todas';
        regiaoAlAtiva = 'Todas';
        regiaoSeAtiva = 'Todas';
        regiaoMaAtiva = 'Todas';
        regiaoPiAtiva = 'Todas';
        regiaoPaAtiva = 'Todas';
        regiaoAmAtiva = 'Todas';
      filtroMsTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoMs(regiao) {
      regiaoMsAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesMs(txt) {
      filtroMsTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaGoias() {
      abaModalAtual = 'go';
      regiaoGoAtiva = 'Todas';
      filtroGoTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoGo(regiao) {
      regiaoGoAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesGo(txt) {
      filtroGoTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaDistritoFederal() {
      abaModalAtual = 'df';
      regiaoDfAtiva = 'Todas';
      filtroDfTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoDf(regiao) {
      regiaoDfAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesDf(txt) {
      filtroDfTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaCeara() {
      abaModalAtual = 'ce';
      regiaoCeAtiva = 'Todas';
      filtroCeTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoCe(regiao) {
      regiaoCeAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesCe(txt) {
      filtroCeTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaPernambuco() {
      abaModalAtual = 'pe';
      regiaoPeAtiva = 'Todas';
      filtroPeTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoPe(regiao) {
      regiaoPeAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesPe(txt) {
      filtroPeTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaBahia() {
      abaModalAtual = 'ba';
      regiaoBaAtiva = 'Todas';
      filtroBaTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoBa(regiao) {
      regiaoBaAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesBa(txt) {
      filtroBaTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaRioGrandeDoSul() {
      abaModalAtual = 'rs';
      regiaoRsAtiva = 'Todas';
      filtroRsTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoRs(regiao) {
      regiaoRsAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesRs(txt) {
      filtroRsTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaSantaCatarina() {
      abaModalAtual = 'sc';
      regiaoScAtiva = 'Todas';
      filtroScTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoSc(regiao) {
      regiaoScAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesSc(txt) {
      filtroScTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaParana() {
      abaModalAtual = 'pr';
      regiaoPrAtiva = 'Todas';
      filtroPrTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoPr(regiao) {
      regiaoPrAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesPr(txt) {
      filtroPrTexto = txt || '';
      renderizarCidadesModal();
    }

    function abrirAbaEspiritoSanto() {
      abaModalAtual = 'es';
      regiaoEsAtiva = 'Todas';
      filtroEsTexto = '';
      const inputTop = document.getElementById('inputBuscaCidadeModal');
      if (inputTop) inputTop.value = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoEs(regiao) {
      regiaoEsAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesEs(txt) {
      filtroEsTexto = txt || '';
      renderizarCidadesModal();
    }

    function voltarParaEstadosModal() {
      abaModalAtual = 'estados';
      filtroRjTexto = '';
      filtroSpTexto = '';
      filtroMgTexto = '';
      filtroEsTexto = '';
      filtroPrTexto = '';
      filtroScTexto = '';
      filtroRsTexto = '';
      filtroBaTexto = '';
      filtroPeTexto = '';
      filtroCeTexto = '';
      filtroDfTexto = '';
      filtroGoTexto = '';
      filtroMsTexto = '';
      filtroMtTexto = '';
      filtroPbTexto = '';
      filtroRnTexto = '';
      filtroAlTexto = '';
      filtroSeTexto = '';
      filtroMaTexto = '';
      filtroPiTexto = '';
      filtroPaTexto = '';
      filtroAmTexto = '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoRj(regiao) {
      regiaoRjAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesRj(txt) {
      filtroRjTexto = txt || '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoSp(regiao) {
      regiaoSpAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesSp(txt) {
      filtroSpTexto = txt || '';
      renderizarCidadesModal();
    }

    function selecionarRegiaoMg(regiao) {
      regiaoMgAtiva = regiao;
      renderizarCidadesModal();
    }

    function filtrarCidadesMg(txt) {
      filtroMgTexto = txt || '';
      renderizarCidadesModal();
    }

    function renderizarCidadesModal(filtro = '') {
      const container = document.getElementById('listaCidadesModal');
      const headerLabel = document.getElementById('modalCidadesHeaderLabel');
      if (!container) return;

      const filtroTopClean = filtro.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

      // 1. CASO O USUÁRIO TENHA DIGITADO NO CAMPO GERAL DO TOPO
      if (filtroTopClean.length > 0) {
        if (headerLabel) headerLabel.innerText = 'Resultados da Pesquisa por Cidade:';
        
        // Busca em todas as cidades do RJ, SP, MG e capitais
        const rjMatch = TODAS_CIDADES_RJ.filter(nome => {
          const cClean = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return cClean.includes(filtroTopClean);
        }).map(nome => ({ nome, uf: 'RJ' }));

        const spMatch = TODAS_CIDADES_SP.filter(nome => {
          const cClean = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return cClean.includes(filtroTopClean);
        }).map(nome => ({ nome, uf: 'SP' }));

        const mgMatch = TODAS_CIDADES_MG.filter(nome => {
          const cClean = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return cClean.includes(filtroTopClean);
        }).map(nome => ({ nome, uf: 'MG' }));

        const esMatch = TODAS_CIDADES_ES.filter(nome => {
          const cClean = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return cClean.includes(filtroTopClean);
        }).map(nome => ({ nome, uf: 'ES' }));

        const outrosMatch = OUTRAS_CIDADES_AUDITADAS.filter(c => {
          const cClean = c.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
          return cClean.includes(filtroTopClean) || c.uf.toLowerCase().includes(filtroTopClean);
        });

        const totalEncontrado = [...rjMatch, ...spMatch, ...mgMatch, ...esMatch, ...outrosMatch];

        if (totalEncontrado.length === 0) {
          container.innerHTML = `
            <div class="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
              <p class="text-xs text-slate-300 mb-2 font-medium">Nenhum município auditado corresponde a "${filtro}".</p>
              <button type="button" onclick="selecionarCidade('${filtro}', 'BR', 'Manual'); fecharModalTrocarCidade();" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md">
                Definir "${filtro}" mesmo assim
              </button>
            </div>
          `;
          return;
        }

        container.innerHTML = totalEncontrado.map(c => {
          const isCurrent = c.nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold shadow-[0_0_10px_rgba(0,230,118,0.2)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          let badgeColor = 'bg-slate-900 text-slate-400';
          if (c.uf === 'SP') badgeColor = 'bg-cyan-950 text-cyan-400 border border-cyan-800';
          if (c.uf === 'MG') badgeColor = 'bg-amber-950 text-amber-400 border border-amber-800';
          if (c.uf === 'ES') badgeColor = 'bg-emerald-950 text-teal-400 border border-teal-800';

          return `
            <button type="button" onclick="selecionarCidade('${c.nome}', '${c.uf}', 'Manual'); fecharModalTrocarCidade();" class="p-2.5 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 font-medium">
                <span>📍</span>
                <span>${c.nome}</span>
              </span>
              <span class="text-[10px] px-1.5 py-0.5 rounded ${badgeColor} font-mono font-semibold">${c.uf}</span>
            </button>
          `;
        }).join('');
        return;
      }

      // 2. MODO ABA RIO DE JANEIRO (92 MUNICÍPIOS)
      if (abaModalAtual === 'rj') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Rio de Janeiro (92 Cidades)';

        let cidadesExibir = regiaoRjAtiva === 'Todas' ? TODAS_CIDADES_RJ : (CIDADES_RJ_POR_REGIAO[regiaoRjAtiva] || []);

        if (filtroRjTexto.trim()) {
          const fClean = filtroRjTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Metropolitana & Baixada", "Região dos Lagos", "Região Serrana", "Norte & Noroeste", "Médio Paraíba & Costa Verde"];

        const pílulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoRjAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '92' : (CIDADES_RJ_POR_REGIAO[reg] ? CIDADES_RJ_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoRj('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold shadow-[0_0_10px_rgba(0,230,118,0.2)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'RJ', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1 rounded bg-slate-900 font-mono text-slate-400">RJ</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 flex items-center justify-between pb-2 border-b border-slate-800/80 mb-1">
            <button type="button" onclick="voltarParaEstadosModal()" class="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
              <span>←</span>
              <span>Voltar para Todos os Estados</span>
            </button>
            <span class="text-[10px] text-slate-400 font-medium">92 Municípios Fluminenses</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Rio de Janeiro (Todo o Estado)', 'RJ', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌐</span>
                <span>Ver Cotações de Todo o Estado do RJ (Todas as 92 Cidades)</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">12.292 itens</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1.5">
            <input 
              type="text" 
              id="inputFiltroRj" 
              oninput="filtrarCidadesRj(this.value)" 
              value="${filtroRjTexto}"
              placeholder="🔍 Filtrar município fluminense (ex: Cabo Frio, Niterói, Petrópolis...)" 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-emerald-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 flex gap-1.5 overflow-x-auto pb-1.5 mb-1 custom-scrollbar">
            ${pílulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
            ${gridCidadesHtml || '<div class="col-span-2 p-3 text-center text-xs text-slate-400">Nenhum município encontrado com este nome.</div>'}
          </div>
        `;
        return;
      }

      // 3. MODO ABA SÃO PAULO (100 MUNICÍPIOS)
      if (abaModalAtual === 'sp') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de São Paulo (100 Cidades Auditadas)';

        let cidadesExibir = regiaoSpAtiva === 'Todas' ? TODAS_CIDADES_SP : (CIDADES_SP_POR_REGIAO[regiaoSpAtiva] || []);

        if (filtroSpTexto.trim()) {
          const fClean = filtroSpTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = [
          "Todas", "Grande SP & Capital", "Campinas, Jundiaí & Piracicaba", 
          "Baixada Santista & Litoral", "Vale do Paraíba & Bragantina", 
          "Ribeirão Preto, Franca & Central", "Sorocaba, Bauru & Interior"
        ];

        const pílulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoSpAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '100' : (CIDADES_SP_POR_REGIAO[reg] ? CIDADES_SP_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoSp('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'SP', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1 rounded bg-cyan-950/80 border border-cyan-800/60 font-mono text-cyan-300">SP</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 flex items-center justify-between pb-2 border-b border-slate-800/80 mb-1">
            <button type="button" onclick="voltarParaEstadosModal()" class="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
              <span>←</span>
              <span>Voltar para Todos os Estados</span>
            </button>
            <span class="text-[10px] text-cyan-400 font-semibold">100 Municípios Paulistas</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('São Paulo (Todo o Estado)', 'SP', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🏙️</span>
                <span>Ver Cotações de Todo o Estado de SP (Todas as 100 Cidades)</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">5.522 itens</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1.5">
            <input 
              type="text" 
              id="inputFiltroSp" 
              oninput="filtrarCidadesSp(this.value)" 
              value="${filtroSpTexto}"
              placeholder="🔍 Filtrar município paulista (ex: Campinas, Santos, Ribeirão Preto, Guarulhos...)" 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-cyan-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 flex gap-1.5 overflow-x-auto pb-1.5 mb-1 custom-scrollbar">
            ${pílulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
            ${gridCidadesHtml || '<div class="col-span-2 p-3 text-center text-xs text-slate-400">Nenhum município encontrado com este nome.</div>'}
          </div>
        `;
        return;
      }

      // 4. MODO ABA MINAS GERAIS (54 MUNICÍPIOS)
      if (abaModalAtual === 'mg') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de Minas Gerais (54 Cidades Auditadas)';

        let cidadesExibir = regiaoMgAtiva === 'Todas' ? TODAS_CIDADES_MG : (CIDADES_MG_POR_REGIAO[regiaoMgAtiva] || []);

        if (filtroMgTexto.trim()) {
          const fClean = filtroMgTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = [
          "Todas", "Metropolitana & Central", "Triângulo & Alto Paranaíba", 
          "Zona da Mata & Vertentes", "Sul & Sudoeste", "Centro-Oeste", 
          "Vale do Aço & Rio Doce", "Norte & Noroeste"
        ];

        const pílulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoMgAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '54' : (CIDADES_MG_POR_REGIAO[reg] ? CIDADES_MG_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoMg('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'MG', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1 rounded bg-amber-950/80 border border-amber-800/60 font-mono text-amber-300">MG</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 flex items-center justify-between pb-2 border-b border-slate-800/80 mb-1">
            <button type="button" onclick="voltarParaEstadosModal()" class="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
              <span>←</span>
              <span>Voltar para Todos os Estados</span>
            </button>
            <span class="text-[10px] text-amber-400 font-semibold">54 Municípios Mineiros</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Minas Gerais (Todo o Estado)', 'MG', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">⛰️</span>
                <span>Ver Cotações de Todo o Estado de MG (Todas as 54 Cidades)</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">1.691 itens</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1.5">
            <input 
              type="text" 
              id="inputFiltroMg" 
              oninput="filtrarCidadesMg(this.value)" 
              value="${filtroMgTexto}"
              placeholder="🔍 Filtrar município mineiro (ex: Belo Horizonte, Uberlândia, Juiz de Fora, Betim...)" 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 flex gap-1.5 overflow-x-auto pb-1.5 mb-1 custom-scrollbar">
            ${pílulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar p-0.5">
            ${gridCidadesHtml || '<div class="col-span-2 p-3 text-center text-xs text-slate-400">Nenhum município encontrado com este nome.</div>'}
          </div>
        `;
        return;
      }

      // 5. MODO ABA ESPÍRITO SANTO (78 MUNICÍPIOS)
      if (abaModalAtual === 'es') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Espírito Santo (78 Cidades)';

        let cidadesExibir = regiaoEsAtiva === 'Todas' ? TODAS_CIDADES_ES : (CIDADES_ES_POR_REGIAO[regiaoEsAtiva] || []);

        if (filtroEsTexto.trim()) {
          const fClean = filtroEsTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Grande Vitória & Central", "Norte, Noroeste & Rio Doce", "Sul & Litoral Sul", "Região Serrana & Caparaó"];

        const pílulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoEsAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '78' : (CIDADES_ES_POR_REGIAO[reg] ? CIDADES_ES_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoEs('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-teal-500/20 border-teal-500/50 text-white font-bold shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'ES', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-800/60 font-mono">ES</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-teal-400 font-bold font-mono">ES • 78 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Espírito Santo (Todo o Estado)', 'ES', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌊</span>
                <span>Buscar em Todo o Espírito Santo (Cotações & Postos de Todos os 78 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">78 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroEs" 
              value="${filtroEsTexto}" 
              oninput="filtrarCidadesEs(this.value)" 
              placeholder="Filtrar município do ES (ex: Vitória, Vila Velha, Linhares, Colatina)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-teal-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pílulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município capixaba encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }

            // 6. MODO ABA PARANÁ (73 MUNICÍPIOS)
      if (abaModalAtual === 'pr') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Paraná (73 Cidades)';

        let cidadesExibir = regiaoPrAtiva === 'Todas' ? TODAS_CIDADES_PR : (CIDADES_PR_POR_REGIAO[regiaoPrAtiva] || []);

        if (filtroPrTexto.trim()) {
          const fClean = filtroPrTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Curitiba & Região Metropolitana", "Campos Gerais & Centro-Sul", "Norte Central & Norte Pioneiro", "Oeste, Sudoeste & Noroeste", "Litoral Paranaense"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoPrAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-purple-500 text-slate-950 font-bold border-purple-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '73' : (CIDADES_PR_POR_REGIAO[reg] ? CIDADES_PR_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoPr('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'PR', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-800/60 font-mono">PR</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-purple-400 font-bold font-mono">PR • 73 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Paraná (Todo o Estado)', 'PR', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌲</span>
                <span>Buscar em Todo o Paraná (Cotações & Postos de Todos os 73 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">73 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroPr" 
              value="${filtroPrTexto}" 
              oninput="filtrarCidadesPr(this.value)" 
              placeholder="Filtrar município do PR (ex: Curitiba, Londrina, Maringá, Ponta Grossa, Cascavel)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-purple-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município paranaense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 7. MODO ABA SANTA CATARINA (66 MUNICÍPIOS)
      if (abaModalAtual === 'sc') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de Santa Catarina (66 Cidades)';

        let cidadesExibir = regiaoScAtiva === 'Todas' ? TODAS_CIDADES_SC : (CIDADES_SC_POR_REGIAO[regiaoScAtiva] || []);

        if (filtroScTexto.trim()) {
          const fClean = filtroScTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Grande Florianópolis & Litoral", "Vale do Itajaí & Foz", "Norte Catarinense & Planalto", "Sul Catarinense & Carbonífera", "Oeste, Meio-Oeste & Serra"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoScAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '66' : (CIDADES_SC_POR_REGIAO[reg] ? CIDADES_SC_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoSc('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'SC', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 font-mono">SC</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-sky-400 font-bold font-mono">SC • 66 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Santa Catarina (Todo o Estado)', 'SC', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">⛵</span>
                <span>Buscar em Toda Santa Catarina (Cotações & Postos de Todos os 66 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">66 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroSc" 
              value="${filtroScTexto}" 
              oninput="filtrarCidadesSc(this.value)" 
              placeholder="Filtrar município de SC (ex: Florianópolis, Joinville, Blumenau, Criciúma, Itajaí, Chapecó)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-sky-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município catarinense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 8. MODO ABA RIO GRANDE DO SUL (72 MUNICÍPIOS)
      if (abaModalAtual === 'rs') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Rio Grande do Sul (72 Cidades)';

        let cidadesExibir = regiaoRsAtiva === 'Todas' ? TODAS_CIDADES_RS : (CIDADES_RS_POR_REGIAO[regiaoRsAtiva] || []);

        if (filtroRsTexto.trim()) {
          const fClean = filtroRsTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Porto Alegre & Região Metropolitana", "Serra Gaúcha & Hortênsias", "Planalto, Missões & Alto Uruguai", "Centro, Vales & Fronteira Oeste", "Sul Gaúcho, Campanha & Litoral"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoRsAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-rose-500 text-slate-950 font-bold border-rose-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '72' : (CIDADES_RS_POR_REGIAO[reg] ? CIDADES_RS_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoRs('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'RS', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-mono">RS</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-rose-400 font-bold font-mono">RS • 72 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Rio Grande do Sul (Todo o Estado)', 'RS', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🧉</span>
                <span>Buscar em Todo o Rio Grande do Sul (Cotações & Postos de Todos os 72 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">72 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroRs" 
              value="${filtroRsTexto}" 
              oninput="filtrarCidadesRs(this.value)" 
              placeholder="Filtrar município do RS (ex: Porto Alegre, Caxias do Sul, Pelotas, Canoas, Santa Maria, Passo Fundo)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-rose-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município gaúcho encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 9. MODO ABA BAHIA (72 MUNICÍPIOS)
      if (abaModalAtual === 'ba') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado da Bahia (72 Cidades)';

        let cidadesExibir = regiaoBaAtiva === 'Todas' ? TODAS_CIDADES_BA : (CIDADES_BA_POR_REGIAO[regiaoBaAtiva] || []);

        if (filtroBaTexto.trim()) {
          const fClean = filtroBaTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Salvador, RMS & Recôncavo", "Feira de Santana & Portal do Sertão", "Sul & Costa do Cacau e Descobrimento", "Sudoeste, Serra Geral & Chapada", "Norte, Vale do São Francisco & Oeste"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoBaAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '72' : (CIDADES_BA_POR_REGIAO[reg] ? CIDADES_BA_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoBa('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'BA', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono">BA</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-amber-400 font-bold font-mono">BA • 72 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Bahia (Todo o Estado)', 'BA', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌴</span>
                <span>Buscar em Toda a Bahia (Cotações & Postos de Todos os 72 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">72 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroBa" 
              value="${filtroBaTexto}" 
              oninput="filtrarCidadesBa(this.value)" 
              placeholder="Filtrar município da BA (ex: Salvador, Feira de Santana, Vitória da Conquista, Ilhéus, Itabuna, Juazeiro, Barreiras)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município baiano encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 10. MODO ABA PERNAMBUCO (61 MUNICÍPIOS)
      if (abaModalAtual === 'pe') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de Pernambuco (61 Cidades)';

        let cidadesExibir = regiaoPeAtiva === 'Todas' ? TODAS_CIDADES_PE : (CIDADES_PE_POR_REGIAO[regiaoPeAtiva] || []);

        if (filtroPeTexto.trim()) {
          const fClean = filtroPeTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Recife & RMR", "Zona da Mata", "Agreste Pernambucano", "Sertão Central & Pajeú", "Sertão do São Francisco & Araripe"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoPeAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '61' : (CIDADES_PE_POR_REGIAO[reg] ? CIDADES_PE_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoPe('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'PE', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 font-mono">PE</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-sky-400 font-bold font-mono">PE • 61 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Pernambuco (Todo o Estado)', 'PE', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">☀️</span>
                <span>Buscar em Todo o Pernambuco (Cotações & Postos de Todos os 61 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">61 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroPe" 
              value="${filtroPeTexto}" 
              oninput="filtrarCidadesPe(this.value)" 
              placeholder="Filtrar município de PE (ex: Recife, Jaboatão, Olinda, Caruaru, Petrolina, Garanhuns)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-sky-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município pernambucano encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 11. MODO ABA CEARÁ (56 MUNICÍPIOS)
      if (abaModalAtual === 'ce') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Ceará (56 Cidades)';

        let cidadesExibir = regiaoCeAtiva === 'Todas' ? TODAS_CIDADES_CE : (CIDADES_CE_POR_REGIAO[regiaoCeAtiva] || []);

        if (filtroCeTexto.trim()) {
          const fClean = filtroCeTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Fortaleza & RMF", "Litoral Norte & Sobral", "Sertão Central & Inhamuns", "Vale do Jaguaribe", "Cariri & Centro-Sul"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoCeAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '56' : (CIDADES_CE_POR_REGIAO[reg] ? CIDADES_CE_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoCe('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-teal-500/20 border-teal-500/50 text-white font-bold shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'CE', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-800/60 font-mono">CE</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-teal-400 font-bold font-mono">CE • 56 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Ceará (Todo o Estado)', 'CE', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌊</span>
                <span>Buscar em Todo o Ceará (Cotações & Postos de Todos os 56 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">56 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroCe" 
              value="${filtroCeTexto}" 
              oninput="filtrarCidadesCe(this.value)" 
              placeholder="Filtrar município do CE (ex: Fortaleza, Caucaia, Juazeiro do Norte, Sobral, Iguatu, Crato)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-teal-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município cearense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 12. MODO ABA DISTRITO FEDERAL (40 REGIÕES E CIDADES)
      if (abaModalAtual === 'df') {
        if (headerLabel) headerLabel.innerText = 'Regiões Administrativas do Distrito Federal (40 Regiões)';

        let cidadesExibir = regiaoDfAtiva === 'Todas' ? TODAS_CIDADES_DF : (CIDADES_DF_POR_REGIAO[regiaoDfAtiva] || []);

        if (filtroDfTexto.trim()) {
          const fClean = filtroDfTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Plano Piloto & Central", "Oeste (Taguatinga & Ceilândia)", "Sudoeste & Sul (Águas Claras & Gama)", "Norte & Leste (Sobradinho & Planaltina)", "Entorno Metropolitano"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoDfAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-indigo-500 text-slate-950 font-bold border-indigo-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '40' : (CIDADES_DF_POR_REGIAO[reg] ? CIDADES_DF_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoDf('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-indigo-500/20 border-indigo-500/50 text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'DF', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 font-mono">DF</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-indigo-400 font-bold font-mono">DF • 40 Regiões</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Distrito Federal (Todo o DF)', 'DF', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🏛️</span>
                <span>Buscar em Todo o Distrito Federal (Cotações & Postos de Todas as 40 Regiões)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">40 REGIÕES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroDf" 
              value="${filtroDfTexto}" 
              oninput="filtrarCidadesDf(this.value)" 
              placeholder="Filtrar região do DF (ex: Brasília, Taguatinga, Ceilândia, Águas Claras, Guará, Asa Sul, Asa Norte)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-indigo-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhuma região encontrada com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 13. MODO ABA GOIÁS (55 MUNICÍPIOS)
      if (abaModalAtual === 'go') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de Goiás (55 Cidades)';

        let cidadesExibir = regiaoGoAtiva === 'Todas' ? TODAS_CIDADES_GO : (CIDADES_GO_POR_REGIAO[regiaoGoAtiva] || []);

        if (filtroGoTexto.trim()) {
          const fClean = filtroGoTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Goiânia & Região Metropolitana", "Centro & Eixo Anápolis", "Sul Goiano & Região das Águas", "Entorno do DF & Leste", "Norte & Noroeste"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoGoAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-yellow-500 text-slate-950 font-bold border-yellow-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '55' : (CIDADES_GO_POR_REGIAO[reg] ? CIDADES_GO_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoGo('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-yellow-500/20 border-yellow-500/50 text-white font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'GO', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-yellow-950/80 text-yellow-400 border border-yellow-800/60 font-mono">GO</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-yellow-400 font-bold font-mono">GO • 55 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Goiás (Todo o Estado)', 'GO', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/40 text-yellow-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌾</span>
                <span>Buscar em Todo o Estado de Goiás (Cotações & Postos de Todos os 55 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">55 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroGo" 
              value="${filtroGoTexto}" 
              oninput="filtrarCidadesGo(this.value)" 
              placeholder="Filtrar município de GO (ex: Goiânia, Aparecida de Goiânia, Anápolis, Rio Verde, Luziânia, Itumbiara)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-yellow-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município goiano encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 14. MODO ABA MATO GROSSO DO SUL (54 MUNICÍPIOS)
      if (abaModalAtual === 'ms') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Mato Grosso do Sul (54 Cidades)';

        let cidadesExibir = regiaoMsAtiva === 'Todas' ? TODAS_CIDADES_MS : (CIDADES_MS_POR_REGIAO[regiaoMsAtiva] || []);

        if (filtroMsTexto.trim()) {
          const fClean = filtroMsTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Campo Grande & Região Central", "Dourados & Sul Fronteira", "Leste & Vale da Celulose (Bolsão)", "Pantanal & Sudoeste / Bonito", "Norte & Alto Taquari"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoMsAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '54' : (CIDADES_MS_POR_REGIAO[reg] ? CIDADES_MS_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoMs('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'MS', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">MS</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-emerald-400 font-bold font-mono">MS • 54 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Mato Grosso do Sul (Todo o Estado)', 'MS', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🐆</span>
                <span>Buscar em Todo o Estado de MS (Cotações & Postos de Todos os 54 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">54 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroMs" 
              value="${filtroMsTexto}" 
              oninput="filtrarCidadesMs(this.value)" 
              placeholder="Filtrar município de MS (ex: Campo Grande, Dourados, Três Lagoas, Corumbá, Ponta Porã, Bonito)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-emerald-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município sul-mato-grossense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 15. MODO ABA MATO GROSSO (53 MUNICÍPIOS)
      if (abaModalAtual === 'mt') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Mato Grosso (53 Cidades)';

        let cidadesExibir = regiaoMtAtiva === 'Todas' ? TODAS_CIDADES_MT : (CIDADES_MT_POR_REGIAO[regiaoMtAtiva] || []);

        if (filtroMtTexto.trim()) {
          const fClean = filtroMtTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Cuiabá & Região Metropolitana", "Sul & Rondonópolis", "Médio-Norte & Eixo Agro", "Sudoeste & Vale do Guaporé", "Norte & Araguaia"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoMtAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '53' : (CIDADES_MT_POR_REGIAO[reg] ? CIDADES_MT_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoMt('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'MT', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 font-mono">MT</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-amber-400 font-bold font-mono">MT • 53 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Mato Grosso (Todo o Estado)', 'MT', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌿</span>
                <span>Buscar em Todo o Estado de MT (Cotações & Postos de Todos os 53 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">53 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroMt" 
              value="${filtroMtTexto}" 
              oninput="filtrarCidadesMt(this.value)" 
              placeholder="Filtrar município de MT (ex: Cuiabá, Várzea Grande, Rondonópolis, Sinop, Sorriso, Cáceres)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município mato-grossense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 16. MODO ABA PARAÍBA (52 MUNICÍPIOS)
      if (abaModalAtual === 'pb') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado da Paraíba (52 Cidades)';

        let cidadesExibir = regiaoPbAtiva === 'Todas' ? TODAS_CIDADES_PB : (CIDADES_PB_POR_REGIAO[regiaoPbAtiva] || []);

        if (filtroPbTexto.trim()) {
          const fClean = filtroPbTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "João Pessoa & Região Metropolitana", "Campina Grande & Borborema", "Sertão & Alto Piranhas", "Agreste & Brejo Paraibano", "Cariri & Curimataú"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoPbAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-rose-500 text-slate-950 font-bold border-rose-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '52' : (CIDADES_PB_POR_REGIAO[reg] ? CIDADES_PB_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoPb('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-rose-500/20 border-rose-500/50 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'PB', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-mono">PB</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-rose-400 font-bold font-mono">PB • 52 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Paraíba (Todo o Estado)', 'PB', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">☀️</span>
                <span>Buscar em Todo o Estado da Paraíba (Cotações & Postos de Todos os 52 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">52 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroPb" 
              value="${filtroPbTexto}" 
              oninput="filtrarCidadesPb(this.value)" 
              placeholder="Filtrar município da PB (ex: João Pessoa, Campina Grande, Patos, Cabedelo, Sousa, Cajazeiras)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-rose-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município paraibano encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 17. MODO ABA RIO GRANDE DO NORTE (50 MUNICÍPIOS)
      if (abaModalAtual === 'rn') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Rio Grande do Norte (50 Cidades)';

        let cidadesExibir = regiaoRnAtiva === 'Todas' ? TODAS_CIDADES_RN : (CIDADES_RN_POR_REGIAO[regiaoRnAtiva] || []);

        if (filtroRnTexto.trim()) {
          const fClean = filtroRnTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Natal & Região Metropolitana", "Oeste Potiguar & Costa Branca", "Agreste & Litoral Sul", "Seridó Potiguar", "Alto Oeste & Sertão"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoRnAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '50' : (CIDADES_RN_POR_REGIAO[reg] ? CIDADES_RN_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoRn('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'RN', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">RN</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-cyan-400 font-bold font-mono">RN • 50 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Rio Grande do Norte (Todo o Estado)', 'RN', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🏖️</span>
                <span>Buscar em Todo o Estado do RN (Cotações & Postos de Todos os 50 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">50 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroRn" 
              value="${filtroRnTexto}" 
              oninput="filtrarCidadesRn(this.value)" 
              placeholder="Filtrar município do RN (ex: Natal, Mossoró, Parnamirim, Caicó, Ceará-Mirim, Assú)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-cyan-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município potiguar encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 18. MODO ABA ALAGOAS (50 MUNICÍPIOS)
      if (abaModalAtual === 'al') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de Alagoas (50 Cidades)';

        let cidadesExibir = regiaoAlAtiva === 'Todas' ? TODAS_CIDADES_AL : (CIDADES_AL_POR_REGIAO[regiaoAlAtiva] || []);

        if (filtroAlTexto.trim()) {
          const fClean = filtroAlTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Maceió & Região Metropolitana", "Agreste & Arapiraca", "Litoral & Costa dos Corais", "Zona da Mata & Vale do Mundaú", "Sertão Alagoano"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoAlAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '50' : (CIDADES_AL_POR_REGIAO[reg] ? CIDADES_AL_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoAl('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-teal-500/20 border-teal-500/50 text-white font-bold shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'AL', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-950/80 text-teal-400 border border-teal-800/60 font-mono">AL</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-teal-400 font-bold font-mono">AL • 50 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Alagoas (Todo o Estado)', 'AL', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌴</span>
                <span>Buscar em Todo o Estado de Alagoas (Cotações & Postos de Todos os 50 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">50 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroAl" 
              value="${filtroAlTexto}" 
              oninput="filtrarCidadesAl(this.value)" 
              placeholder="Filtrar município de AL (ex: Maceió, Arapiraca, Palmeira dos Índios, Rio Largo, Maragogi, Penedo)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-teal-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município alagoano encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 19. MODO ABA SERGIPE (47 MUNICÍPIOS)
      if (abaModalAtual === 'se') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado de Sergipe (47 Cidades)';

        let cidadesExibir = regiaoSeAtiva === 'Todas' ? TODAS_CIDADES_SE : (CIDADES_SE_POR_REGIAO[regiaoSeAtiva] || []);

        if (filtroSeTexto.trim()) {
          const fClean = filtroSeTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Grande Aracaju & Litoral", "Agreste Central & Itabaiana", "Sul Sergipano & Litoral Sul", "Alto Sertão & Baixo São Francisco", "Médio Sertão & Cotinguiba"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoSeAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '47' : (CIDADES_SE_POR_REGIAO[reg] ? CIDADES_SE_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoSe('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-sky-500/20 border-sky-500/50 text-white font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'SE', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-800/60 font-mono">SE</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-sky-400 font-bold font-mono">SE • 47 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Sergipe (Todo o Estado)', 'SE', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🦀</span>
                <span>Buscar em Todo o Estado de Sergipe (Cotações & Postos de Todos os 47 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">47 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroSe" 
              value="${filtroSeTexto}" 
              oninput="filtrarCidadesSe(this.value)" 
              placeholder="Filtrar município de SE (ex: Aracaju, Nossa Senhora do Socorro, Itabaiana, Lagarto, Estância)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-sky-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município sergipano encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 20. MODO ABA MARANHÃO (50 MUNICÍPIOS)
      if (abaModalAtual === 'ma') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Maranhão (50 Cidades)';

        let cidadesExibir = regiaoMaAtiva === 'Todas' ? TODAS_CIDADES_MA : (CIDADES_MA_POR_REGIAO[regiaoMaAtiva] || []);

        if (filtroMaTexto.trim()) {
          const fClean = filtroMaTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Grande Ilha de São Luís & Baixada", "Região Tocantina & Imperatriz", "Cocais & Leste Maranhense", "Médio Mearim & Vale do Pindaré", "Sul & Lençóis / Baixo Parnaíba"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoMaAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-orange-500 text-slate-950 font-bold border-orange-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '50' : (CIDADES_MA_POR_REGIAO[reg] ? CIDADES_MA_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoMa('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-orange-500/20 border-orange-500/50 text-white font-bold shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'MA', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-800/60 font-mono">MA</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-orange-400 font-bold font-mono">MA • 50 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Maranhão (Todo o Estado)', 'MA', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 text-orange-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🏰</span>
                <span>Buscar em Todo o Estado do Maranhão (Cotações & Postos de Todos os 50 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">50 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroMa" 
              value="${filtroMaTexto}" 
              oninput="filtrarCidadesMa(this.value)" 
              placeholder="Filtrar município do MA (ex: São Luís, Imperatriz, Caxias, Timon, Codó, Açailândia)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-orange-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município maranhense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 21. MODO ABA PIAUÍ (50 MUNICÍPIOS)
      if (abaModalAtual === 'pi') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Piauí (50 Cidades)';

        let cidadesExibir = regiaoPiAtiva === 'Todas' ? TODAS_CIDADES_PI : (CIDADES_PI_POR_REGIAO[regiaoPiAtiva] || []);

        if (filtroPiTexto.trim()) {
          const fClean = filtroPiTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Grande Teresina & Entre Rios", "Litoral & Planície Litorânea", "Vale do Sambito & Médio Parnaíba", "Vale do Canindé & Picos", "Chapadas do Extremo Sul & Serra da Capivara"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoPiAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-lime-500 text-slate-950 font-bold border-lime-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '50' : (CIDADES_PI_POR_REGIAO[reg] ? CIDADES_PI_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoPi('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-lime-500/20 border-lime-500/50 text-white font-bold shadow-[0_0_10px_rgba(132,204,22,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'PI', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-lime-950/80 text-lime-400 border border-lime-800/60 font-mono">PI</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-lime-400 font-bold font-mono">PI • 50 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Piauí (Todo o Estado)', 'PI', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-lime-500/15 hover:bg-lime-500/25 border border-lime-500/40 text-lime-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🏜️</span>
                <span>Buscar em Todo o Estado do Piauí (Cotações & Postos de Todos os 50 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/40">50 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroPi" 
              value="${filtroPiTexto}" 
              oninput="filtrarCidadesPi(this.value)" 
              placeholder="Filtrar município do PI (ex: Teresina, Parnaíba, Picos, Piripiri, Floriano, Campo Maior)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-lime-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município piauiense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 22. MODO ABA PARÁ (50 MUNICÍPIOS)
      if (abaModalAtual === 'pa') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Pará (50 Cidades)';

        let cidadesExibir = regiaoPaAtiva === 'Todas' ? TODAS_CIDADES_PA : (CIDADES_PA_POR_REGIAO[regiaoPaAtiva] || []);

        if (filtroPaTexto.trim()) {
          const fClean = filtroPaTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Região Metropolitana de Belém & Marajó", "Baixo Amazonas & Tapajós", "Sudeste Paraense & Carajás", "Nordeste Paraense & Salgado", "Xingu & Transamazônica"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoPaAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-red-500 text-slate-950 font-bold border-red-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '50' : (CIDADES_PA_POR_REGIAO[reg] ? CIDADES_PA_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoPa('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-red-500/20 border-red-500/50 text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'PA', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-mono">PA</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-red-400 font-bold font-mono">PA • 50 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Pará (Todo o Estado)', 'PA', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🥭</span>
                <span>Buscar em Todo o Estado do Pará (Cotações & Postos de Todos os 50 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">50 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroPa" 
              value="${filtroPaTexto}" 
              oninput="filtrarCidadesPa(this.value)" 
              placeholder="Filtrar município do PA (ex: Belém, Ananindeua, Santarém, Marabá, Parauapebas, Castanhal)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-red-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município paraense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


            // 23. MODO ABA AMAZONAS (49 MUNICÍPIOS)
      if (abaModalAtual === 'am') {
        if (headerLabel) headerLabel.innerText = 'Municípios do Estado do Amazonas (49 Cidades)';

        let cidadesExibir = regiaoAmAtiva === 'Todas' ? TODAS_CIDADES_AM : (CIDADES_AM_POR_REGIAO[regiaoAmAtiva] || []);

        if (filtroAmTexto.trim()) {
          const fClean = filtroAmTexto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          cidadesExibir = cidadesExibir.filter(nome => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(fClean));
        }

        const regioesNomes = ["Todas", "Região Metropolitana de Manaus & Rio Negro", "Médio & Baixo Amazonas", "Alto Solimões & Tríplice Fronteira", "Médio Solimões & Juruá", "Calha do Madeira & Purus"];

        const pilulasHtml = regioesNomes.map(reg => {
          const isAtiva = regiaoAmAtiva === reg;
          const estilo = isAtiva 
            ? 'bg-green-500 text-slate-950 font-bold border-green-400 shadow-sm' 
            : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700';
          const qtd = reg === 'Todas' ? '49' : (CIDADES_AM_POR_REGIAO[reg] ? CIDADES_AM_POR_REGIAO[reg].length : '');
          return `
            <button type="button" onclick="selecionarRegiaoAm('${reg}')" class="px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${estilo}">
              <span>${reg}</span>
              <span class="text-[9px] opacity-75 font-mono">(${qtd})</span>
            </button>
          `;
        }).join('');

        const gridCidadesHtml = cidadesExibir.map(nome => {
          const isCurrent = nome.toLowerCase() === currentCity.toLowerCase();
          const activeClass = isCurrent 
            ? 'bg-green-500/20 border-green-500/50 text-white font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
          
          return `
            <button type="button" onclick="selecionarCidade('${nome}', 'AM', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
              <span class="flex items-center gap-1.5 truncate">
                <span class="text-xs">📍</span>
                <span class="truncate">${nome}</span>
              </span>
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-green-950/80 text-green-400 border border-green-800/60 font-mono">AM</span>
            </button>
          `;
        }).join('');

        container.innerHTML = `
          <div class="col-span-1 sm:col-span-2 mb-2 flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2">
            <button type="button" onclick="voltarParaEstadosModal()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer">
              <span>←</span>
              <span>Voltar aos Estados</span>
            </button>
            <span class="text-[11px] text-green-400 font-bold font-mono">AM • 49 Cidades</span>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-1">
            <button type="button" onclick="selecionarCidade('Amazonas (Todo o Estado)', 'AM', 'Manual'); fecharModalTrocarCidade();" class="w-full p-2.5 rounded-xl bg-green-500/15 hover:bg-green-500/25 border border-green-500/40 text-green-300 hover:text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-sm">
              <span class="flex items-center gap-2">
                <span class="text-base">🌳</span>
                <span>Buscar em Todo o Estado do Amazonas (Cotações & Postos de Todos os 49 Municípios)</span>
              </span>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40">49 CIDADES</span>
            </button>
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2">
            <input 
              type="text" 
              id="inputFiltroAm" 
              value="${filtroAmTexto}" 
              oninput="filtrarCidadesAm(this.value)" 
              placeholder="Filtrar município do AM (ex: Manaus, Parintins, Itacoatiara, Manacapuru, Coari, Tefé)..." 
              class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-green-400"
            />
          </div>

          <div class="col-span-1 sm:col-span-2 mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            ${pilulasHtml}
          </div>

          <div class="col-span-1 sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            ${gridCidadesHtml || '<p class="col-span-3 text-center text-xs text-slate-400 py-4">Nenhum município amazonense encontrado com este filtro.</p>'}
          </div>
        `;
        return;
      }


      // 5. MODO VISÃO ESTADOS (RIO DE JANEIRO + SÃO PAULO + MINAS GERAIS + DEMAIS CAPITAIS)
      if (headerLabel) headerLabel.innerText = 'Cidades e Estados com Auditoria Ativa';

      const cardRioDeJaneiro = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-lg mb-0.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25">🏖️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Rio de Janeiro (Estado RJ)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">92 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Lagos, Serrana, Baixada, Norte e Sul Fluminense</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaRioDeJaneiro()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 92 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardSaoPaulo = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-lg mb-0.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25">🏙️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>São Paulo (Estado SP)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40">100 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Capital, Campinas, Baixada, Vale, Ribeirão e Interior</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaSaoPaulo()" class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 100 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardMinasGerais = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/40 hover:border-amber-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/25">⛰️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Minas Gerais (Estado MG)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40">54 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Grande BH, Triângulo, Zona da Mata, Sul e Centro-Oeste</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaMinasGerais()" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 54 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardEspiritoSanto = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border border-teal-500/40 hover:border-teal-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-teal-500/15 border border-teal-500/25">🌊</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Espírito Santo (Estado ES)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/25 text-teal-300 font-bold border border-teal-500/40">78 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Grande Vitória, Litoral Norte, Sul Capixaba e Região Serrana</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaEspiritoSanto()" class="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 78 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

            const cardParana = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/40 hover:border-purple-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-purple-500/15 border border-purple-500/25">🌲</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Paraná (Estado PR)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 font-bold border border-purple-500/40">73 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Curitiba & RMC, Campos Gerais, Norte, Oeste, Sudoeste e Litoral</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaParana()" class="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 73 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardSantaCatarina = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border border-sky-500/40 hover:border-sky-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-sky-500/15 border border-sky-500/25">⛵</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Santa Catarina (Estado SC)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40">66 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Florianópolis, Joinville, Blumenau, Itajaí, Criciúma, Chapecó e Lages</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaSantaCatarina()" class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 66 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardRioGrandeDoSul = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/40 hover:border-rose-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-rose-500/15 border border-rose-500/25">🧉</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Rio Grande do Sul (Estado RS)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 font-bold border border-rose-500/40">72 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Porto Alegre & RMPA, Serra Gaúcha, Caxias, Pelotas, Santa Maria e Passo Fundo</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaRioGrandeDoSul()" class="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 72 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardBahia = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/40 hover:border-amber-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-amber-500/15 border border-amber-500/25">🌴</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Bahia (Estado BA)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40">72 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Salvador & RMS, Feira de Santana, Conquista, Ilhéus, Itabuna, Juazeiro e Barreiras</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaBahia()" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 72 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardPernambuco = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border border-sky-500/40 hover:border-sky-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-sky-500/15 border border-sky-500/25">☀️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Pernambuco (Estado PE)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40">61 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Recife & RMR, Olinda, Caruaru, Petrolina, Garanhuns e Sertão</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaPernambuco()" class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 61 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardCeara = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border border-teal-500/40 hover:border-teal-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-teal-500/15 border border-teal-500/25">🌊</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Ceará (Estado CE)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/25 text-teal-300 font-bold border border-teal-500/40">56 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Fortaleza & RMF, Sobral, Juazeiro do Norte, Cariri, Iguatu e Litoral</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaCeara()" class="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 56 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardDistritoFederal = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25">🏛️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Distrito Federal (Estado DF)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 font-bold border border-indigo-500/40">40 Regiões</span>
                </div>
                <div class="text-[10px] text-slate-400">Brasília (Plano Piloto), Taguatinga, Ceilândia, Águas Claras, Guará e Entorno</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaDistritoFederal()" class="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 40 Regiões</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardGoias = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-yellow-950/70 via-slate-900 to-slate-900 border border-yellow-500/40 hover:border-yellow-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-yellow-500/15 border border-yellow-500/25">🌾</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Goiás (Estado GO)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-yellow-500/25 text-yellow-300 font-bold border border-yellow-500/40">55 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Goiânia & RMG, Anápolis, Rio Verde, Itumbiara, Catalão e Jataí</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaGoias()" class="px-3 py-1.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 55 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardMatoGrossoDoSul = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25">🐆</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Mato Grosso do Sul (Estado MS)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40">54 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Campo Grande, Dourados, Três Lagoas, Corumbá, Ponta Porã e Bonito</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaMatoGrossoDoSul()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 54 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardParaiba = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-900 border border-rose-500/40 hover:border-rose-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-rose-500/15 border border-rose-500/25">☀️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Paraíba (Estado PB)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 font-bold border border-rose-500/40">52 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">João Pessoa, Campina Grande, Patos, Cabedelo, Bayeux, Santa Rita e Sousa</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaParaiba()" class="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 52 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardRioGrandeDoNorte = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25">🏖️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Rio Grande do Norte (Estado RN)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40">50 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Natal, Mossoró, Parnamirim, São Gonçalo, Macaíba, Caicó e Assú</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaRioGrandeDoNorte()" class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 50 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardAlagoas = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-900 border border-teal-500/40 hover:border-teal-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-teal-500/15 border border-teal-500/25">🌴</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Alagoas (Estado AL)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/25 text-teal-300 font-bold border border-teal-500/40">50 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Maceió, Arapiraca, Rio Largo, Palmeira dos Índios, Maragogi e Penedo</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaAlagoas()" class="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 50 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardSergipe = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border border-sky-500/40 hover:border-sky-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-sky-500/15 border border-sky-500/25">🦀</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Sergipe (Estado SE)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40">47 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Aracaju, Socorro, Itabaiana, Lagarto, Estância e São Cristóvão</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaSergipe()" class="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 47 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardMaranhao = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-orange-950/70 via-slate-900 to-slate-900 border border-orange-500/40 hover:border-orange-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-orange-500/15 border border-orange-500/25">🏰</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Maranhão (Estado MA)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/25 text-orange-300 font-bold border border-orange-500/40">50 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">São Luís, Imperatriz, Caxias, Timon, Codó, Açailândia e Bacabal</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaMaranhao()" class="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 50 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardPiaui = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-lime-950/70 via-slate-900 to-slate-900 border border-lime-500/40 hover:border-lime-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-lime-500/15 border border-lime-500/25">🏜️</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Piauí (Estado PI)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-lime-500/25 text-lime-300 font-bold border border-lime-500/40">50 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Teresina, Parnaíba, Picos, Piripiri, Floriano, Campo Maior e Barras</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaPiaui()" class="px-3 py-1.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 50 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

      const cardAmazonas = `
        <div class="col-span-1 sm:col-span-2 p-3 rounded-2xl bg-gradient-to-r from-green-950/70 via-slate-900 to-slate-900 border border-green-500/40 hover:border-green-400 transition-all shadow-lg mb-1">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-xl p-2 rounded-xl bg-green-500/15 border border-green-500/25">🌳</span>
              <div>
                <div class="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Amazonas (Estado AM)</span>
                  <span class="text-[9px] px-2 py-0.5 rounded-full bg-green-500/25 text-green-300 font-bold border border-green-500/40">49 Cidades</span>
                </div>
                <div class="text-[10px] text-slate-400">Manaus, Parintins, Itacoatiara, Manacapuru, Coari, Tefé e Tabatinga</div>
              </div>
            </div>
            <button type="button" onclick="abrirAbaAmazonas()" class="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shrink-0">
              <span>Abrir 49 Cidades</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;

const headerOutros = `
        <div class="col-span-1 sm:col-span-2 pt-1 pb-1">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Demais Estados e Capitais Integradas</span>
        </div>
      `;

      const cardsOutrosEstados = OUTRAS_CIDADES_AUDITADAS.map(c => {
        const isCurrent = c.nome.toLowerCase() === currentCity.toLowerCase();
        const activeClass = isCurrent 
          ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold shadow-[0_0_10px_rgba(0,230,118,0.2)]' 
          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white';
        return `
          <button type="button" onclick="selecionarCidade('${c.nome}', '${c.uf}', 'Manual'); fecharModalTrocarCidade();" class="p-2 rounded-xl border ${activeClass} flex justify-between items-center text-left text-xs transition-colors cursor-pointer">
            <span class="flex items-center gap-1.5 font-medium truncate">
              <span>📍</span>
              <span class="truncate">${c.nome}</span>
            </span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 font-mono text-slate-400 font-semibold">${c.uf}</span>
          </button>
        `;
      }).join('');

      container.innerHTML = cardRioDeJaneiro + cardSaoPaulo + cardMinasGerais + cardEspiritoSanto + cardParana + cardSantaCatarina + cardRioGrandeDoSul + cardBahia + cardPernambuco + cardCeara + cardDistritoFederal + cardGoias + cardMatoGrossoDoSul + headerOutros + cardsOutrosEstados;
    }

    function filtrarCidadesModal() {
      const input = document.getElementById('inputBuscaCidadeModal');
      renderizarCidadesModal(input ? input.value : '');
    }

    async function solicitarGpsManual() {
      const btnText = document.getElementById('btnGpsManualText');
      if (btnText) btnText.innerText = "Consultando satélites GPS...";
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            try {
              const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
              if (resp.ok) {
                const geo = await resp.json();
                const cid = geo.city || geo.locality;
                let uf = 'RJ';
                if (geo.principalSubdivisionCode && geo.principalSubdivisionCode.startsWith('BR-')) {
                  uf = geo.principalSubdivisionCode.replace('BR-', '');
                }
                if (cid) {
                  selecionarCidade(cid, uf, 'GPS');
                  fecharModalTrocarCidade();
                  return;
                }
              }
            } catch(e) {}
            // Fallback para cidade mais próxima
            selecionarCidade('Cabo Frio', 'RJ', 'GPS');
            fecharModalTrocarCidade();
          },
          (err) => {
            if (btnText) btnText.innerText = "GPS Bloqueado (Selecione Manualmente)";
          },
          { timeout: 7000, enableHighAccuracy: true }
        );
      }
    }

    async function detectarViaIp() {
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.city) {
            let uf = 'RJ';
            if (data.region && ESTADOS_MAP[data.region]) {
              uf = ESTADOS_MAP[data.region];
            } else if (data.region && data.region.length === 2) {
              uf = data.region.toUpperCase();
            }
            selecionarCidade(data.city, uf, 'IP');
          }
        }
      } catch (e) {
        console.warn('Detecção via IP offline, mantendo praça padrão:', e);
        atualizarIndicadoresLocalizacao();
      }
    }

    async function detectarLocalizacaoAutomatica() {
      const salva = localStorage.getItem('nutri_user_location');
      if (salva) {
        try {
          const loc = JSON.parse(salva);
          if (loc.cidade && loc.uf) {
            currentCity = loc.cidade;
            currentUF = loc.uf;
            locationMethod = loc.metodo || 'Manual';
            atualizarIndicadoresLocalizacao();
            if (typeof carregarCombustiveisOnline === 'function') carregarCombustiveisOnline(currentUF);
            return;
          }
        } catch(e) {}
      }

      // 1. Fallback instantâneo por IP (resiliente, não trava a tela)
      detectarViaIp();

      // 2. Coleta precisa por GPS (se autorizado)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              let reverseDone = false;
              try {
                const resp = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
                if (resp.ok) {
                  const geo = await resp.json();
                  const cid = geo.city || geo.locality;
                  let uf = 'RJ';
                  if (geo.principalSubdivisionCode && geo.principalSubdivisionCode.startsWith('BR-')) {
                    uf = geo.principalSubdivisionCode.replace('BR-', '');
                  } else if (geo.principalSubdivision && ESTADOS_MAP[geo.principalSubdivision]) {
                    uf = ESTADOS_MAP[geo.principalSubdivision];
                  }
                  if (cid) {
                    selecionarCidade(cid, uf, 'GPS');
                    reverseDone = true;
                  }
                }
              } catch(e) {}

              if (!reverseDone) {
                let maisProxima = null;
                let menorDist = Infinity;
                CIDADES_AUDITADAS.forEach(c => {
                  const d = calcularDistanciaKm(lat, lon, c.lat, c.lon);
                  if (d < menorDist) {
                    menorDist = d;
                    maisProxima = c;
                  }
                });
                if (maisProxima && menorDist < 80) {
                  selecionarCidade(maisProxima.nome, maisProxima.uf, 'GPS');
                }
              }
            } catch(e) {}
          },
          (err) => {},
          { timeout: 7000, maximumAge: 300000, enableHighAccuracy: false }
        );
      }
    }

    function selecionarCidade(cidade, uf, metodo = 'Manual') {
      currentCity = cidade;
      currentUF = uf;
      locationMethod = metodo;

      if (metodo === 'Manual' || metodo === 'GPS') {
        try {
          localStorage.setItem('nutri_user_location', JSON.stringify({ cidade, uf, metodo }));
        } catch(e) {}
      }

      atualizarIndicadoresLocalizacao();
      fecharModalTrocarCidade();

      if (typeof carregarCombustiveisOnline === 'function') {
        carregarCombustiveisOnline(uf);
      }

      if (document.body.classList.contains('in-results')) {
        executarBusca();
      }
    }

    async function enviarSugestaoMercado(event, source = 'home') {
      if (event) event.preventDefault();
      const input = source === 'home' 
        ? document.getElementById('inputSugestaoMercado') 
        : document.getElementById('inputSugestaoMercadoResults');
      const feedback = source === 'home' 
        ? document.getElementById('sugestaoFeedback') 
        : document.getElementById('sugestaoFeedbackResults');

      if (!input || !input.value.trim()) return;
      const texto = input.value.trim();

      // Salvar no localStorage
      try {
        const list = JSON.parse(localStorage.getItem('nutri_sugestoes_mercados') || '[]');
        list.push({
          cidade: currentCity,
          uf: currentUF,
          sugestao: texto,
          modo: searchMode,
          origem: source,
          data: new Date().toISOString()
        });
        localStorage.setItem('nutri_sugestoes_mercados', JSON.stringify(list));
      } catch(e) {}

      // Salvar no Supabase Telemetria
      try {
        fetch(`${TELEMETRIA_CONFIG.url}/rest/v1/app_telemetria`, {
          method: 'POST',
          headers: {
            'apikey': TELEMETRIA_CONFIG.key,
            'Authorization': `Bearer ${TELEMETRIA_CONFIG.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            device_id: getOrCreateDeviceId(),
            evento: 'sugestao_expansao_mercado',
            cidade: `${currentCity} - ${currentUF}`,
            metadata: {
              sugestao: texto,
              cidade: currentCity,
              uf: currentUF,
              modo: searchMode,
              origem: source
            },
            created_at: new Date().toISOString()
          })
        }).catch(() => {});
      } catch(e) {}

      input.value = '';
      if (feedback) {
        feedback.classList.remove('hidden');
        setTimeout(() => feedback.classList.add('hidden'), 5000);
      }
    }
    
    function voltarParaHome() {
      document.body.classList.remove('in-results');
      document.getElementById('resultsContainer').classList.add('hidden');
      searchInput.value = '';
      btnClear.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function buscarTermo(termo) {
      searchInput.value = termo;
      btnClear.classList.remove('hidden');
      executarBusca();
    }

    // PROCESSAMENTO INTELIGENTE DA BUSCA
    function executarBusca(e) {
      if (e) e.preventDefault();
      
      const queryOriginal = searchInput.value.trim();
      let query = queryOriginal.toLowerCase();

            // PARSER DE CIDADE (12 ESTADOS)
      if (query.includes('recife')) { selecionarCidade('Recife', 'PE'); }
      else if (query.includes('cabo frio')) { selecionarCidade('Cabo Frio', 'RJ'); }
      else if (query.includes('niterói') || query.includes('niteroi')) { selecionarCidade('Niterói', 'RJ'); }
      else if (query.includes('são gonçalo') || query.includes('sao goncalo')) { selecionarCidade('São Gonçalo', 'RJ'); }
      else if (query.includes('duque de caxias') || query.includes('caxias')) { selecionarCidade('Duque de Caxias', 'RJ'); }
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
      else if (query.includes('fortaleza')) { selecionarCidade('Fortaleza', 'CE'); }

      // Se a pessoa pesquisou por gasolina/etanol/diesel estando no modo comida, chaveia automaticamente!
      if (query.includes('gasolina') || query.includes('etanol') || query.includes('diesel') || query.includes('gnv') || query.includes('combustivel') || query.includes('posto')) {
        if (searchMode !== 'fuel') setSearchMode('fuel');
      }

      // Limpa palavras auxiliares de voz com word boundaries
      const termosLimpos = query
        .replace(/\b(quanto|que|está|esta|ta|tá|o|a|os|as|um|uma|quilo|kg|litro|l|do|da|de|em|no|na|nos|nas|mais|barato|barata|menor|preço|preco|onde|comprar|abastecer|supermercado|mercado|posto)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const termoBusca = termosLimpos.length > 0 ? termosLimpos : query;

      document.body.classList.add('in-results');
      document.getElementById('resultsContainer').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (searchMode === 'fuel') {
        renderizarResultadosCombustivel(termoBusca, queryOriginal);
      } else {
        renderizarResultadosComida(termoBusca, queryOriginal);
      }
    }

    // CONTROLE DE VALIDADE DE OFERTAS
    
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

    function obterBadgeValidade(valido_ate) {
      if (!valido_ate) return { texto: '🟢 Oferta Vigente', classe: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
      const limite = new Date(valido_ate);
      const agora = new Date();
      const diffHoras = (limite - agora) / (1000 * 60 * 60);
      
      const dia = String(limite.getDate()).padStart(2, '0');
      const mes = String(limite.getMonth() + 1).padStart(2, '0');
      
      if (diffHoras < 0) {
        return { texto: '❌ Expirada', classe: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
      }
      if (diffHoras < 24) {
        return { texto: `⚡ Expira hoje (${dia}/${mes})`, classe: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };
      }
      return { texto: `🟢 Válido até ${dia}/${mes}`, classe: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    }

    // ==============================================================================
    // ROTINA EXCLUSIVA: CESTA BÁSICA INTELIGENTE POR CIDADE (MENOR PREÇO POR ITEM)
    // Calcula a cesta básica exclusiva de cada cidade cruzando preços dos mercados locais
    // ==============================================================================
    const CATEGORIAS_CESTA_BASICA = [
      { id: 'arroz', nome: 'Arroz 1kg/5kg', icon: '🌾', regex: /arroz/i },
      { id: 'feijao', nome: 'Feijão 1kg', icon: '🫘', regex: /feij[aã]o/i },
      { id: 'leite', nome: 'Leite 1L', icon: '🥛', regex: /leite/i },
      { id: 'cafe', nome: 'Café 250g/500g', icon: '☕', regex: /caf[eé]/i },
      { id: 'oleo', nome: 'Óleo de Soja 900ml', icon: '🌻', regex: /[oó]leo/i },
      { id: 'acucar', nome: 'Açúcar 1kg', icon: '🧂', regex: /a[cç][uú]car/i },
      { id: 'macarrao', nome: 'Macarrão 500g/1kg', icon: '🍝', regex: /macarr[aã]o|espaguete/i },
      { id: 'farinha', nome: 'Farinha de Trigo 1kg', icon: '🥖', regex: /farinha/i },
      { id: 'proteina', nome: 'Carne / Frango / Ovos', icon: '🥩', regex: /frango|carne|alcatra|bovin|ovos|ovo/i },
      { id: 'manteiga', nome: 'Manteiga / Margarina', icon: '🧈', regex: /manteiga|margarina/i },
      { id: 'limpeza', nome: 'Higiene & Sabão', icon: '🧼', regex: /sab[aã]o|detergente|papel higi/i }
    ];

    function renderizarCestaBasicaDaCidade() {
      const container = document.getElementById('productsList');
      const countText = document.getElementById('resultsCountText');
      const aiBody = document.getElementById('aiOverviewBody');
      const aiBadge = document.getElementById('aiCardBadge');

      aiBadge.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wide";
      aiBadge.innerHTML = `<span>🧺</span><span>Cesta Básica Inteligente • ${currentCity} (${currentUF})</span>`;

      const curClean = (currentCity || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      let produtosCidade;
      if (curClean.includes('todo o estado') || curClean.includes('todas as cidades') || curClean === 'rio de janeiro (estado)' || curClean === 'rj') {
        produtosCidade = DATABASE_PRODUTOS.filter(p => p.uf === 'RJ');
      } else {
        produtosCidade = DATABASE_PRODUTOS.filter(p => {
        const pCidClean = (p.cidade || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        if (curClean === 'rio de janeiro' && pCidClean !== 'rio de janeiro') return false;
        return pCidClean === curClean || pCidClean.includes(curClean) || curClean.includes(pCidClean);
      });
      }

      // Filtro de validade obrigatório (descarta automaticamente ofertas vencidas)
      const agora = new Date();
      produtosCidade = produtosCidade.filter(p => {
        if (!p.valido_ate) return true;
        return new Date(p.valido_ate) >= agora;
      });

      if (produtosCidade.length === 0) {
        countText.innerHTML = `Nenhuma cotação de cesta básica ativa em ${currentCity} - ${currentUF}.`;
        currentAiSummary = `O NutriPreço está expandindo para ${currentCity} - ${currentUF}! Nossos sistemas estão mapeando os supermercados locais para compor a cesta básica da cidade.`;
        aiBody.innerHTML = `
          <div class="flex items-start gap-3">
            <span class="text-2xl">🚧</span>
            <div>
              <p class="text-amber-300 font-bold mb-1 text-base">O NutriPreço está expandindo para ${currentCity} - ${currentUF}!</p>
              <p class="text-slate-300 text-sm">Ainda não temos cotações ativas dos mercados locais de ${currentCity} para calcular a cesta básica.</p>
            </div>
          </div>
        `;
        container.innerHTML = `
          <div class="rounded-3xl bg-slate-900/80 border border-amber-500/30 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-2xl">
            <div class="text-4xl mb-3">🚧</div>
            <h3 class="text-lg sm:text-xl font-bold text-white mb-2">O NutriPreço está expandindo para ${currentCity} - ${currentUF}!</h3>
            <p class="text-slate-300 text-sm mb-6">Indique os supermercados e atacadões da sua cidade para montarmos a cesta básica local.</p>
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-left">
              <div class="font-bold text-amber-300 text-sm flex items-center gap-1.5 mb-2">
                <span>💡</span>
                <span>Quer ver os preços dos mercados da sua cidade aqui? Indique agora!</span>
              </div>
              <form onsubmit="enviarSugestaoMercado(event, 'results')" class="mt-3 flex flex-col sm:flex-row gap-2">
                <input type="text" id="inputSugestaoMercadoResults" placeholder="Nome do supermercado e bairro..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400" required />
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer">Indicar Mercado</button>
              </form>
              <div id="sugestaoFeedbackResults" class="hidden mt-2.5 text-xs text-emerald-400 font-semibold">✓ Muito obrigado! Sugestão enviada à nossa equipe de expansão.</div>
            </div>
          </div>
        `;
        return;
      }

      // Agrupa e calcula menor preço por categoria da cesta básica
      let itensCesta = [];
      let totalEconomizadoGeral = 0;

      CATEGORIAS_CESTA_BASICA.forEach(cat => {
        const prods = produtosCidade.filter(p => {
          if (!cat.regex.test(p.nome)) return false;
          if (cat.id === 'proteina') {
            const n = p.nome.toLowerCase();
            if (n.includes('macarr') || n.includes('espaguete')) return false;
          }
          return true;
        });
        if (prods.length > 0) {
          prods.sort((a, b) => a.preco - b.preco);
          const menor = prods[0];
          const maior = prods[prods.length - 1];
          const diff = Math.max(0, maior.preco - menor.preco);
          totalEconomizadoGeral += diff;
          itensCesta.push({
            categoria: cat.nome,
            icon: cat.icon,
            menor: menor,
            maiorPreco: maior.preco,
            economiaItem: diff,
            totalOpcoes: prods.length
          });
        }
      });

      if (itensCesta.length === 0) {
        produtosCidade.sort((a, b) => a.preco - b.preco);
        const top5 = produtosCidade.slice(0, 5);
        top5.forEach((p, idx) => {
          itensCesta.push({
            categoria: `Item Essencial ${idx + 1}`,
            icon: '🛒',
            menor: p,
            maiorPreco: p.preco,
            economiaItem: 0,
            totalOpcoes: 1
          });
        });
      }

      const totalCesta = itensCesta.reduce((acc, it) => acc + it.menor.preco, 0);
      const totalSemEconomia = itensCesta.reduce((acc, it) => acc + it.maiorPreco, 0);
      const economiaTotal = Math.max(0, totalSemEconomia - totalCesta).toFixed(2);
      const mercadosUtilizados = [...new Set(itensCesta.map(it => it.menor.mercado))];

      currentAiSummary = `Em ${currentCity}, a Cesta Básica Inteligente com menor preço totaliza R$ ${totalCesta.toFixed(2).replace('.', ',')} reunindo ${itensCesta.length} itens essenciais auditados. Pesquisando os melhores mercados, você economiza até R$ ${economiaTotal.replace('.', ',')}.`;

      aiBody.innerHTML = `
        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Cesta Básica Mais Barata • ${currentCity} (${currentUF})</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">${itensCesta.length} itens</span>
              </div>
              <p class="text-white text-xl sm:text-2xl font-black mt-1">
                Valor Total Otimizado: <span class="text-emerald-400">R$ ${totalCesta.toFixed(2).replace('.', ',')}</span>
              </p>
            </div>
            <div class="text-left sm:text-right">
              <span class="text-[11px] text-slate-400">Economia apurada na praça:</span>
              <div class="text-sm sm:text-base font-bold text-amber-400">Até R$ ${economiaTotal.replace('.', ',')} de economia</div>
            </div>
          </div>
          
          <p class="text-slate-300 text-xs sm:text-sm">
            Montamos a cesta básica de <strong>${currentCity}</strong> selecionando o menor preço auditado para cada item de primeira necessidade nos supermercados da sua cidade:
          </p>

          <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span class="font-semibold text-slate-300">Onde comprar mais barato nesta cidade:</span>
            ${mercadosUtilizados.map(m => `<span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700/60 font-medium">${m}</span>`).join('')}
          </div>
        </div>
      `;

      countText.innerHTML = `Cesta Básica calculada para <strong class="text-emerald-400">${currentCity} - ${currentUF}</strong> com <strong class="text-white">${itensCesta.length}</strong> itens auditados`;

      let html = `
        <!-- CARD RESUMO TOTAL DA CESTA BÁSICA -->
        <div class="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-slate-900 border-2 border-emerald-500/80 shadow-2xl mb-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-emerald-500/30">
                🧺
              </div>
              <div>
                <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Cesta Básica Completa • Menor Custo</span>
                <h3 class="text-lg sm:text-xl font-bold text-white mt-0.5">${currentCity} — Todos os Itens Essenciais</h3>
                <p class="text-xs text-slate-400 mt-1">Cálculo automatizado cruzando preços de todos os mercados auditados da praça.</p>
              </div>
            </div>
            <div class="text-left md:text-right shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
              <div class="text-[10px] text-slate-400 font-bold uppercase">Custo Total da Cesta</div>
              <div class="text-3xl font-black text-emerald-400">R$ ${totalCesta.toFixed(2).replace('.', ',')}</div>
              <div class="text-[11px] text-emerald-300 font-semibold mt-0.5">💰 Economia de até R$ ${economiaTotal.replace('.', ',')}</div>
            </div>
          </div>
        </div>

        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Composição da Cesta Básica Item a Item em ${currentCity}:
        </div>
      `;

      itensCesta.forEach((item, idx) => {
        const prod = item.menor;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prod.mercado + ' ' + prod.endereco + ' ' + prod.cidade)}`;
        const validade = obterBadgeValidade(prod.valido_ate);

        html += `
          <div class="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all mb-3 shadow-md">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-base shrink-0">
                  ${item.icon}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ${item.categoria}
                    </span>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      ${obterMarcaExibicao(prod.nome, prod.marca)}
                    </span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${validade.classe}">
                      ${validade.texto}
                    </span>
                  </div>
                  <h4 class="text-base sm:text-lg font-bold text-white mt-1">${prod.nome}</h4>
                  <p class="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <span class="text-emerald-300 font-bold">${prod.mercado}</span> — ${prod.endereco}
                  </p>
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div class="text-left sm:text-right">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">Menor Preço na Cidade</div>
                  <div class="text-2xl sm:text-3xl font-black text-emerald-400">
                    R$ ${prod.preco.toFixed(2).replace('.', ',')}
                  </div>
                  ${item.economiaItem > 0 ? `
                  <div class="text-[10px] text-amber-400 font-bold mt-0.5">
                    Economiza R$ ${item.economiaItem.toFixed(2).replace('.', ',')} vs outros
                  </div>` : ''}
                </div>

                <div class="flex items-center gap-2">
                  <a 
                    href="${mapsUrl}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Abrir rota no Google Maps">
                    <span>🗺️</span>
                    <span>Rota</span>
                  </a>
                  <span class="px-2.5 py-1.5 rounded-xl bg-slate-800/80 text-emerald-400 font-semibold border border-emerald-500/30 text-[11px] flex items-center gap-1 select-none" title="Cotação Auditada • Coleta Pública Oficial">
                    <span>✓</span>
                    <span>Auditado</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    // RENDERIZADOR 1: MODO SUPERMERCADOS (NUTRIPREÇO)
    function renderizarResultadosComida(termo, queryOriginal) {
      const container = document.getElementById('productsList');
      const countText = document.getElementById('resultsCountText');
      const aiBody = document.getElementById('aiOverviewBody');
      const aiBadge = document.getElementById('aiCardBadge');

      // Se a pesquisa for Cesta Básica, direciona para o agrupador inteligente por cidade
      const termoLimpo = (termo || '').toLowerCase();
      const queryLimpa = (queryOriginal || '').toLowerCase();
      if (termoLimpo.includes('cesta') || termoLimpo.includes('basica') || termoLimpo.includes('básica') || queryLimpa.includes('cesta') || queryLimpa.includes('basica') || queryLimpa.includes('básica')) {
        renderizarCestaBasicaDaCidade();
        return;
      }

      aiBadge.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wide";
      aiBadge.innerHTML = "<span>✨</span><span>Síntese de Inteligência Artificial • Helena IA</span>";

      const curClean = (currentCity || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      let produtos = DATABASE_PRODUTOS.filter(p => {
        const pCidClean = (p.cidade || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        if (curClean === 'rio de janeiro' && pCidClean !== 'rio de janeiro') return false;
        return pCidClean === curClean || pCidClean.includes(curClean) || curClean.includes(pCidClean);
      });

      // Fallback Inteligente por Estado (Atendimento Regional / Estadual)
      if (produtos.length === 0 && currentUF) {
        produtos = DATABASE_PRODUTOS.filter(p => (p.uf || '').toUpperCase() === currentUF.toUpperCase());
      }

      // ==============================================================================
      // MECANISMO DE GOVERNANÇA: EXPIRAÇÃO AUTOMÁTICA DE OFERTAS
      // Ofertas com data de validade vencida são descartadas automaticamente das buscas!
      // ==============================================================================
      const agora = new Date();
      produtos = produtos.filter(p => {
        if (!p.valido_ate) return true;
        const limite = new Date(p.valido_ate);
        return limite >= agora; // Retorna true APENAS se a validade ainda não tiver expirado!
      });

      if (termo && termo.length > 0) {
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
        const normNome = (p.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const normMercado = (p.mercado || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

      produtos.sort((a, b) => a.preco - b.preco);

      if (produtos.length === 0) {
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

        const curCityClean = (currentCity || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let sugestoesCidade = DATABASE_PRODUTOS.filter(p => {
          const pCidClean = (p.cidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
      }

      const menor = produtos[0];
      const maior = produtos[produtos.length - 1];
      const media = (produtos.reduce((acc, p) => acc + p.preco, 0) / produtos.length).toFixed(2);
      const economiaPorcento = (((maior.preco - menor.preco) / maior.preco) * 100).toFixed(0);

      currentAiSummary = `Em ${currentCity}, o menor preço auditado para ${menor.nome} é de R$ ${menor.preco.toFixed(2).replace('.', ',')} no ${menor.mercado}. A média da cidade está em R$ ${media.replace('.', ',')}, gerando até ${economiaPorcento}% de economia.`;

      aiBody.innerHTML = `
        <p class="text-slate-100 text-sm sm:text-base mb-2">
          Em <strong class="text-emerald-400 font-bold">${currentCity}</strong>, o menor preço auditado para <strong class="text-white">${menor.nome}</strong> está saindo por <strong class="text-emerald-400 font-black text-lg">R$ ${menor.preco.toFixed(2).replace('.', ',')}</strong> no <strong class="text-white underline decoration-emerald-500 underline-offset-4">${menor.mercado}</strong>.
        </p>
        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
          <div>📊 Média da Cidade: <span class="font-bold text-white">R$ ${media.replace('.', ',')}</span></div>
          <div>💰 Economia: <span class="font-bold text-amber-400">Até ${economiaPorcento}%</span></div>
          <div>🛡️ Fonte: <span class="font-semibold text-emerald-300">${menor.data}</span></div>
        </div>
      `;

      const mercadosUnicosCount = new Set(produtos.map(p => (p.mercado || '').trim().toLowerCase())).size;
      const labelMercados = mercadosUnicosCount === 1 ? '1 supermercado' : `${mercadosUnicosCount} supermercados`;
      const labelOfertas = produtos.length === 1 ? '1 oferta' : `${produtos.length} ofertas`;
      countText.innerHTML = `Encontradas <strong class="text-white">${labelOfertas}</strong> em <strong class="text-emerald-400">${labelMercados}</strong> com cotação auditada em <strong class="text-emerald-400">${currentCity}</strong>`;

      let html = '';
      produtos.forEach((prod, idx) => {
        const isWinner = idx === 0;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prod.mercado + ' ' + prod.endereco + ' ' + prod.cidade)}`;
        
        html += `
          <div class="rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all ${
            isWinner 
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-900 border-2 border-emerald-500/70 shadow-xl shadow-emerald-950/40' 
              : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
          }">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl ${isWinner ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'} flex items-center justify-center font-black text-sm shrink-0">
                  ${isWinner ? '🥇 1º' : `${idx + 1}º`}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-md ${isWinner ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
                      ${obterMarcaExibicao(prod.nome, prod.marca)}
                    </span>
                    <span class="text-xs text-slate-500">• ${prod.data}</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${obterBadgeValidade(prod.valido_ate).classe}">
                      ${obterBadgeValidade(prod.valido_ate).texto}
                    </span>
                  </div>
                  <h4 class="text-base sm:text-lg font-bold text-white mt-0.5">${prod.nome}</h4>
                  <p class="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <span class="text-slate-300 font-semibold">${prod.mercado}</span> — ${prod.endereco}
                  </p>
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div class="text-left sm:text-right">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">Preço Auditado</div>
                  <div class="text-2xl sm:text-3xl font-black ${isWinner ? 'text-emerald-400' : 'text-slate-200'}">
                    R$ ${prod.preco.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div class="flex items-center gap-2">
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
                  <span class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-800/80 text-emerald-400 font-semibold border border-emerald-500/30 text-xs flex items-center gap-1.5 select-none" title="Cotação Auditada • Coleta Pública Oficial">
                    <span>✓</span>
                    <span>Auditado</span>
                  </span>
                  <a 
                    href="https://www.amazon.com.br/s?k=${encodeURIComponent(prod.nome)}&tag=mestrepratico-20" 
                    target="_blank" 
                    rel="sponsored nofollow" 
                    class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-amber-500/20"
                    title="Pesquisar e Comparar este produto na Amazon">
                    <span>📦</span>
                    <span>Amazon</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    // RENDERIZADOR 2: MODO COMBUSTÍVEIS (NUTRICOMBUST ANP)
    function renderizarResultadosCombustivel(termo, queryOriginal) {
      const container = document.getElementById('productsList');
      const countText = document.getElementById('resultsCountText');
      const aiBody = document.getElementById('aiOverviewBody');
      const aiBadge = document.getElementById('aiCardBadge');

      aiBadge.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wide";
      aiBadge.innerHTML = "<span>⛽</span><span>Auditoria Oficial de Bombas • NutriCombust IA</span>";

      // Identifica o combustível foco pesquisado (padrão: Gasolina Comum)
      let tipoCombustivel = 'gasolina_comum';
      let nomeCombustivel = 'Gasolina Comum';

      if (termo.includes('etanol') || termo.includes('alcool')) {
        tipoCombustivel = 'etanol';
        nomeCombustivel = 'Etanol Hidratado';
      } else if (termo.includes('diesel')) {
        tipoCombustivel = 'diesel_s10';
        nomeCombustivel = 'Diesel S10';
      } else if (termo.includes('gnv') || termo.includes('gas natural')) {
        tipoCombustivel = 'gnv';
        nomeCombustivel = 'GNV';
      } else if (termo.includes('aditivada')) {
        tipoCombustivel = 'gasolina_aditivada';
        nomeCombustivel = 'Gasolina Aditivada';
      }

      // Filtra postos pela cidade ativa e que tenham preço maior que zero no combustível foco
      let postos = DATABASE_POSTOS.filter(p => 
        p.cidade.toLowerCase() === currentCity.toLowerCase() && 
        p[tipoCombustivel] > 0
      );

      // Se pesquisou por bandeira (ex: Shell, Ipiranga)
      if (termo && !termo.includes('gasolina') && !termo.includes('etanol') && !termo.includes('diesel') && !termo.includes('gnv')) {
        const postosBandeira = postos.filter(p => 
          p.posto.toLowerCase().includes(termo) || 
          p.bandeira.toLowerCase().includes(termo)
        );
        if (postosBandeira.length > 0) postos = postosBandeira;
      }

      // Ordena rigorosamente pelo menor preço na bomba
      postos.sort((a, b) => a[tipoCombustivel] - b[tipoCombustivel]);

      if (postos.length === 0) {
        countText.innerHTML = `Nenhum posto com ${nomeCombustivel} encontrado em ${currentCity} - ${currentUF}.`;
        currentAiSummary = `O NutriCombust está expandindo para ${currentCity} - ${currentUF}! Nossos sistemas estão mapeando os postos da região.`;
        aiBody.innerHTML = `
          <div class="flex items-start gap-3">
            <span class="text-2xl">🚧</span>
            <div>
              <p class="text-amber-300 font-bold mb-1 text-base">O NutriCombust está expandindo para ${currentCity} - ${currentUF}!</p>
              <p class="text-slate-300 text-sm">Ainda não encontramos registros ativos de ${nomeCombustivel} em ${currentCity}.</p>
            </div>
          </div>
        `;
        container.innerHTML = `
          <div class="rounded-3xl bg-slate-900/80 border border-amber-500/30 p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-2xl">
            <div class="text-4xl mb-3">🚧</div>
            <h3 class="text-lg sm:text-xl font-bold text-white mb-2">O NutriCombust está expandindo para ${currentCity} - ${currentUF}!</h3>
            <p class="text-slate-300 text-sm mb-6">Indique os postos da sua cidade para priorizarmos a auditoria dos preços na bomba.</p>
            <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-left">
              <div class="font-bold text-amber-300 text-sm flex items-center gap-1.5 mb-2">
                <span>💡</span>
                <span>Quer ver os preços do posto da sua esquina aqui? Indique o posto da sua região!</span>
              </div>
              <form onsubmit="enviarSugestaoMercado(event, 'results')" class="mt-3 flex flex-col sm:flex-row gap-2">
                <input type="text" id="inputSugestaoMercadoResults" placeholder="Nome do posto, bandeira e bairro..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs outline-none focus:border-amber-400" required />
                <button type="submit" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 cursor-pointer">Indicar Posto</button>
              </form>
              <div id="sugestaoFeedbackResults" class="hidden mt-2.5 text-xs text-emerald-400 font-semibold">✓ Muito obrigado! Sugestão enviada à nossa equipe de expansão.</div>
            </div>
          </div>
        `;
        return;
      }

      const menor = postos[0];
      const maior = postos[postos.length - 1];
      const media = (postos.reduce((acc, p) => acc + p[tipoCombustivel], 0) / postos.length).toFixed(2);
      const economiaLitro = (maior[tipoCombustivel] - menor[tipoCombustivel]).toFixed(2);

      currentAiSummary = `Em ${currentCity}, o menor preço de ${nomeCombustivel} está saindo por R$ ${menor[tipoCombustivel].toFixed(2).replace('.', ',')} no ${menor.posto} (${menor.bandeira}). A média da cidade está em R$ ${media.replace('.', ',')}. Abastecer um tanque de 50 litros no melhor posto gera economia de até R$ ${(economiaLitro * 50).toFixed(2).replace('.', ',')}.`;

      aiBody.innerHTML = `
        <p class="text-slate-100 text-sm sm:text-base mb-2">
          Em <strong class="text-amber-400 font-bold">${currentCity}</strong>, o menor preço auditado para <strong class="text-white">${nomeCombustivel}</strong> está no posto <strong class="text-white underline decoration-amber-500 underline-offset-4">${menor.posto}</strong> (${menor.bandeira}) por apenas <strong class="text-amber-400 font-black text-lg">R$ ${menor[tipoCombustivel].toFixed(2).replace('.', ',')}/L</strong>.
        </p>
        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
          <div>📊 Média Local: <span class="font-bold text-white">R$ ${media.replace('.', ',')}/L</span></div>
          <div>⛽ Economia por Tanque (50L): <span class="font-bold text-emerald-400">R$ ${(economiaLitro * 50).toFixed(2).replace('.', ',')} de economia</span></div>
          <div>🛡️ Dados: <span class="font-semibold text-amber-300">${menor.data}</span></div>
        </div>
      `;

      countText.innerHTML = `Encontrados <strong class="text-white">${postos.length}</strong> postos com <strong class="text-amber-400">${nomeCombustivel}</strong> auditada em <strong class="text-white">${currentCity}</strong>`;

      let html = '';
      postos.forEach((p, idx) => {
        const isWinner = idx === 0;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.posto + ' ' + p.endereco + ' ' + p.cidade)}`;
        
        let termoAmazonCombustivel = 'aditivo combustivel limpa bicos';
        if (tipoCombustivel === 'gasolina_comum' || tipoCombustivel === 'gasolina_aditivada') {
          termoAmazonCombustivel = 'aditivo gasolina koube';
        } else if (tipoCombustivel === 'etanol') {
          termoAmazonCombustivel = 'aditivo etanol flex';
        } else if (tipoCombustivel === 'diesel_s10') {
          termoAmazonCombustivel = 'aditivo diesel s10 koube';
        } else if (tipoCombustivel === 'gnv') {
          termoAmazonCombustivel = 'oleo motor 5w30 lubrificante';
        }
        const amazonCombustivelUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(termoAmazonCombustivel)}&tag=mestrepratico-20`;
        
        html += `
          <div class="rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all ${
            isWinner 
              ? 'bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900 border-2 border-amber-500/70 shadow-xl shadow-amber-950/40' 
              : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
          }">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3.5">
                <div class="w-10 h-10 rounded-xl ${isWinner ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'} flex items-center justify-center font-black text-sm shrink-0">
                  ${isWinner ? '🥇 1º' : `${idx + 1}º`}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-bold px-2 py-0.5 rounded-md ${isWinner ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">
                      ${p.bandeira}
                    </span>
                    <span class="text-xs text-slate-500">• ${p.bairro}</span>
                  </div>
                  <h4 class="text-base sm:text-lg font-bold text-white mt-0.5">${p.posto}</h4>
                  <p class="text-xs sm:text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <span>📍</span> ${p.endereco}
                  </p>
                  
                  <!-- Outros Combustíveis do Posto -->
                  <div class="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
                    ${p.gasolina_comum > 0 ? `<span>Gasolina: <strong class="text-slate-200">R$ ${p.gasolina_comum.toFixed(2).replace('.', ',')}</strong></span>` : ''}
                    ${p.etanol > 0 ? `<span>Etanol: <strong class="text-slate-200">R$ ${p.etanol.toFixed(2).replace('.', ',')}</strong></span>` : ''}
                    ${p.diesel_s10 > 0 ? `<span>Diesel S10: <strong class="text-slate-200">R$ ${p.diesel_s10.toFixed(2).replace('.', ',')}</strong></span>` : ''}
                    ${p.gnv > 0 ? `<span>GNV: <strong class="text-slate-200">R$ ${p.gnv.toFixed(2).replace('.', ',')}</strong></span>` : ''}
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div class="text-left sm:text-right mr-1">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">${nomeCombustivel}</div>
                  <div class="text-2xl sm:text-3xl font-black ${isWinner ? 'text-amber-400' : 'text-slate-200'}">
                    R$ ${p[tipoCombustivel].toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-wrap">
                  <!-- BOTÃO FONTE OFICIAL ANP -->
                  <a 
                    href="https://preco.anp.gov.br" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Levantamento Oficial de Precos de Combustiveis ANP">
                    <span>📋</span>
                    <span>Fonte ANP</span>
                  </a>

                  <!-- BOTÃO AMAZON AFILIADO -->
                  <a 
                    href="${amazonCombustivelUrl}" 
                    target="_blank" 
                    rel="sponsored nofollow" 
                    class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-amber-500/20"
                    title="Economize na Manutencao: Acessorios e Aditivos Automotivos na Amazon">
                    <span>📦</span>
                    <span>Amazon</span>
                  </a>

                  <!-- BOTÃO MAPA / ROTA -->
                  <a 
                    href="${mapsUrl}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl ${
                      isWinner 
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700'
                    } text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    title="Abrir Rota e Localizacao do Posto no Google Maps">
                    <span>🗺️</span>
                    <span>Ver no Mapa</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    // PESQUISA POR VOZ VIA WEB SPEECH API COM ONDA SONORA
    function iniciarPesquisaVoz() {
      const btnMic = document.getElementById('btnMic');
      const wave = document.getElementById('waveContainer');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Seu navegador não possui suporte à API de voz. Digite sua pesquisa na barra!");
        return;
      }

      if (isListening) {
        if (recognition) recognition.stop();
        return;
      }

      try {
        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isListening = true;
          btnMic.classList.add('mic-recording');
          wave.classList.remove('hidden');
          wave.classList.add('flex');
          searchInput.placeholder = '🎙️ Ouvindo... Pode falar agora!';
        };

        recognition.onresult = (event) => {
          const fala = event.results[0][0].transcript;
          searchInput.value = fala;
          btnClear.classList.remove('hidden');
          executarBusca();
        };

        recognition.onerror = () => {
          pararGravacaoVisual();
        };

        recognition.onend = () => {
          pararGravacaoVisual();
        };

        recognition.start();
      } catch (err) {
        console.error('Falha ao iniciar SpeechRecognition:', err);
        pararGravacaoVisual();
      }
    }

    function pararGravacaoVisual() {
      isListening = false;
      const btnMic = document.getElementById('btnMic');
      const wave = document.getElementById('waveContainer');
      btnMic.classList.remove('mic-recording');
      wave.classList.add('hidden');
      wave.classList.remove('flex');
      searchInput.placeholder = 'Digite o que procura ou fale no microfone...';
    }

    // SISTEMA DE ÁUDIO EXCLUSIVO DA THALITA AMIGA (OPÇÃO 3 OFICIAL)
    let activeThalitaSearchAudio = null;

    function pararTodosAudios() {
      // 1. Pausa áudio de resumo da IA
      if (activeThalitaSearchAudio) {
        activeThalitaSearchAudio.pause();
        activeThalitaSearchAudio.currentTime = 0;
        activeThalitaSearchAudio = null;
      }
      const btnText = document.getElementById('btnSpeakText');
      if (btnText) btnText.innerText = "Ouvir Resumo";

      // 2. Cancela qualquer síntese residual do navegador
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    // PLAYER 2: RESPOSTA DINÂMICA DA IA NA VOZ DA THALITA (ELIMINA VOZ ROBÓTICA DO NAVEGADOR)
    function falarRespostaIA() {
      const btnText = document.getElementById('btnSpeakText');

      // Se já estiver tocando o áudio da Thalita, pausa
      if (activeThalitaSearchAudio && !activeThalitaSearchAudio.paused) {
        activeThalitaSearchAudio.pause();
        if (btnText) btnText.innerText = "Ouvir Resumo";
        return;
      }

      pararTodosAudios();

      // Mapeamento inteligente do áudio masterizado da Thalita pelo termo pesquisado
      const termo = (searchInput.value || '').toLowerCase();
      let audioFile = 'audio_thalita_resumo_geral.mp3';

      if (searchMode === 'fuel') {
        if (termo.includes('etanol') || termo.includes('álcool') || termo.includes('alcool')) {
          audioFile = 'audio_thalita_etanol.mp3';
        } else if (termo.includes('diesel')) {
          audioFile = 'audio_thalita_diesel.mp3';
        } else if (termo.includes('gnv') || termo.includes('gás')) {
          audioFile = 'audio_thalita_gnv.mp3';
        } else {
          audioFile = 'audio_thalita_gasolina.mp3';
        }
      } else {
        if (termo.includes('arroz')) {
          audioFile = 'audio_thalita_arroz.mp3';
        } else if (termo.includes('feij') || termo.includes('feijao') || termo.includes('feijão')) {
          audioFile = 'audio_thalita_feijao.mp3';
        } else if (termo.includes('leite')) {
          audioFile = 'audio_thalita_leite.mp3';
        } else if (termo.includes('caf') || termo.includes('cafe') || termo.includes('café')) {
          audioFile = 'audio_thalita_cafe.mp3';
        } else if (termo.includes('óleo') || termo.includes('oleo') || termo.includes('soja')) {
          audioFile = 'audio_thalita_oleo.mp3';
        } else if (termo.includes('carn') || termo.includes('carne') || termo.includes('açougue') || termo.includes('acougue')) {
          audioFile = 'audio_thalita_carne.mp3';
        } else if (termo.includes('cesta') || termo.includes('basica') || termo.includes('básica')) {
          audioFile = 'audio_thalita_cesta_basica.mp3';
        } else {
          audioFile = 'audio_thalita_resumo_geral.mp3';
        }
      }

      activeThalitaSearchAudio = new Audio(audioFile + '?v=' + Date.now());
      activeThalitaSearchAudio.play().then(() => {
        if (btnText) btnText.innerText = "Pausar Voz";
      }).catch((e) => {
        console.warn("Autoplay bloqueado:", e);
        if (btnText) btnText.innerText = "Ouvir Resumo";
      });

      activeThalitaSearchAudio.onended = () => {
        if (btnText) btnText.innerText = "Ouvir Resumo";
        activeThalitaSearchAudio = null;
      };

      activeThalitaSearchAudio.onerror = () => {
        if (btnText) btnText.innerText = "Ouvir Resumo";
        activeThalitaSearchAudio = null;
      };
    }

    function perguntarHelenaIA() {
      const q = searchInput.value.trim();
      if (!q) {
        searchInput.value = searchMode === 'fuel' ? "Gasolina comum mais barata" : "Cesta básica mais econômica";
      }
      executarBusca();
      // Ao perguntar à Helena, reproduz a voz oficial da Thalita com a resposta
      setTimeout(() => {
        falarRespostaIA();
      }, 400);
    }

    // INSTALAÇÃO DO APLICATIVO (PWA)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    function instalarAplicativo() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('Usuário aceitou instalar o PWA');
          }
          deferredPrompt = null;
        });
      } else {
        // Exibe modal com orientação simples
        document.getElementById('modalInstall').classList.remove('hidden');
      }
    }

    function fecharModalInstall() {
      document.getElementById('modalInstall').classList.add('hidden');
    }

    // ==============================================================================
    // SISTEMA DE TELEMETRIA E CONTAGEM CONFIÁVEL DE VISITANTES AO VIVO (SUPABASE)
    // DIRETRIZ ESTRATÉGICA OFICIAL
    // ==============================================================================
    const TELEMETRIA_CONFIG = {
      url: 'https://fzoyldcfyiigwyxxhosd.supabase.co',
      key: 'sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv'
    };

    function getOrCreateDeviceId() {
      let id = localStorage.getItem('nutri_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
        localStorage.setItem('nutri_device_id', id);
      }
      return id;
    }

    async function enviarPingTelemetria(evento = 'pageview') {
      try {
        const payload = {
          device_id: getOrCreateDeviceId(),
          evento: evento,
          cidade: `${currentCity} - ${currentUF}`,
          metadata: {
            modo: searchMode,
            path: window.location.pathname,
            largura: window.innerWidth,
            ref: document.referrer || 'direto'
          },
          created_at: new Date().toISOString()
        };

        fetch(`${TELEMETRIA_CONFIG.url}/rest/v1/app_telemetria`, {
          method: 'POST',
          headers: {
            'apikey': TELEMETRIA_CONFIG.key,
            'Authorization': `Bearer ${TELEMETRIA_CONFIG.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (e) {}
    }

    async function atualizarContadorAoVivo(mostrarFeedback = false) {
      const hOnline = document.getElementById('liveOnlineCountHeader');
      const mOnline = document.getElementById('modalOnlineCount');
      const mVisitas = document.getElementById('modalTotalVisitas');
      const cityList = document.getElementById('telemetryCityList');

      if (mostrarFeedback && hOnline) {
        hOnline.innerText = '...';
      }

      try {
        // 1. Visitantes Ativos nos últimos 5 minutos (100% reais, sem mocks)
        const fiveMinAgoIso = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const urlOnline = `${TELEMETRIA_CONFIG.url}/rest/v1/app_telemetria?select=device_id,cidade&created_at=gte.${encodeURIComponent(fiveMinAgoIso)}`;

        const resOnline = await fetch(urlOnline, {
          headers: {
            'apikey': TELEMETRIA_CONFIG.key,
            'Authorization': `Bearer ${TELEMETRIA_CONFIG.key}`
          }
        });

        if (resOnline.ok) {
          const rows = await resOnline.json();
          if (Array.isArray(rows)) {
            const uniqueDevices = new Set(rows.map(r => r.device_id).filter(Boolean)).size;
            const countDisplay = Math.max(uniqueDevices, 1);

            if (hOnline) hOnline.innerText = countDisplay;
            if (mOnline) mOnline.innerText = countDisplay;
            const topOnline = document.getElementById('liveOnlineCountTop');
            if (topOnline) topOnline.innerText = countDisplay;

            // Cidades ativas
            const cidades = Array.from(new Set(rows.map(r => r.cidade).filter(Boolean)));
            if (cityList) {
              if (cidades.length > 0) {
                cityList.innerHTML = cidades.map(c => `
                  <span class="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    ${c}
                  </span>
                `).join('');
              } else {
                cityList.innerHTML = `<span class="text-[11px] text-slate-400">${selectedCityName || 'Sua cidade conectada'}</span>`;
              }
            }
          }
        }

        // 2. Total Acumulado de Visitas Auditadas (100% real de Supabase)
        const resTotal = await fetch(`${TELEMETRIA_CONFIG.url}/rest/v1/app_telemetria?select=id`, {
          headers: {
            'apikey': TELEMETRIA_CONFIG.key,
            'Authorization': `Bearer ${TELEMETRIA_CONFIG.key}`,
            'Range-Unit': 'items',
            'Range': '0-0',
            'Prefer': 'count=exact'
          }
        });

        if (resTotal.status === 206 || resTotal.ok) {
          const contentRange = resTotal.headers.get('content-range');
          if (contentRange && contentRange.includes('/')) {
            const total = parseInt(contentRange.split('/')[1], 10) || 0;
            const formatado = total.toLocaleString('pt-BR');
            if (mVisitas) mVisitas.innerText = formatado;
            const bVisitas = document.getElementById('liveTotalVisitasBadge');
            if (bVisitas) bVisitas.innerText = formatado;
            const topVisitas = document.getElementById('liveTotalVisitasTop');
            if (topVisitas) topVisitas.innerText = formatado;
          }
        }
      } catch (err) {
        console.warn('Erro ao atualizar telemetria:', err);
      }
    }

    function abrirModalTelemetria() {
      document.getElementById('modalTelemetria').classList.remove('hidden');
      atualizarContadorAoVivo(true);
    }

    function fecharModalTelemetria() {
      document.getElementById('modalTelemetria').classList.add('hidden');
    }

    // INICIALIZAÇÃO
    renderChips();
    runTypewriter();

    const seoCid = document.body.dataset.seoCidade;
    const seoUf = document.body.dataset.seoUf;
    if (seoCid && seoUf && typeof selecionarCidade === 'function') {
      selecionarCidade(seoCid, seoUf, 'SEO Programatico');
    } else {
      detectarLocalizacaoAutomatica();
    }

    // Inicia Telemetria Real Supabase
    enviarPingTelemetria('pageview');
    atualizarContadorAoVivo();
    setInterval(() => enviarPingTelemetria('heartbeat'), 120000); // Heartbeat a cada 2 min
    setInterval(() => atualizarContadorAoVivo(), 30000); // Atualiza contador a cada 30s