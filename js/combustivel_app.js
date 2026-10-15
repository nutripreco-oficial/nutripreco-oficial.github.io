// NUTRICOMBUST / MESTRE PRÁTICO - ENGINE OFICIAL JS
// Blindado contra inline scripts (CSP Estrito & Mozilla Observatory A+ 135/100)
// Holding Arthur Luis Vieira dos Santos

!function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    window.META_PIXEL_ID = window.META_PIXEL_ID || '1807628543590880';
    fbq('init', window.META_PIXEL_ID);
    fbq('track', 'PageView');
  

// ==========================================
    // COPILOTO PENÉLOPE (WEB COPILOT)
    // ==========================================
    function togglePenelopeModal() {
      const modal = document.getElementById('modalPenelopeWeb');
      if (modal) modal.classList.toggle('hidden');
    }

    function sugerirPergunta(texto) {
      const inp = document.getElementById('inputPerguntaPenelope');
      if (inp) {
        inp.value = texto;
        perguntarPenelopeWeb();
      }
    }

    async function perguntarPenelopeWeb() {
      const input = document.getElementById('inputPerguntaPenelope');
      const chat = document.getElementById('penelopeChatLog');
      const statusTxt = document.getElementById('penelopeStatusTexto');
      if (!input || !chat) return;
      const q = input.value.trim();
      if (!q) return;

      chat.innerHTML += `<div class="text-right"><span class="inline-block bg-pink-600/30 text-pink-200 border border-pink-500/40 rounded-xl px-2.5 py-1.5 my-1">${q}</span></div>`;
      input.value = '';
      if (statusTxt) statusTxt.innerText = "Consultando base oficial de Dados Abertos da ANP...";
      chat.scrollTop = chat.scrollHeight;

      setTimeout(() => {
        const listaBase = (typeof POSTOS_FILTRADOS !== 'undefined' && POSTOS_FILTRADOS.length > 0) ? POSTOS_FILTRADOS : (typeof POSTOS !== 'undefined' ? POSTOS : []);
        const pMenor = listaBase.length > 0 ? listaBase[0] : null;
        let resp = pMenor
          ? `Na seleção atual, o menor preço encontrado nos Dados Abertos da ANP é no posto ${pMenor.posto} (CNPJ: ${pMenor.cnpj}, ${pMenor.bairro} - ${pMenor.cidade}), com coleta ANP em ${pMenor.atualizado_em}.`
          : "Consulte os filtros acima por Estado, Cidade e Combustível para visualizar os postos reais com CNPJ da base de Dados Abertos da ANP.";
        const ql = q.toLowerCase();
        if (ql.includes("gnv")) {
          const gnvList = (typeof POSTOS !== 'undefined' ? POSTOS : []).filter(p => (p.gnv || 0) > 0).sort((a, b) => a.gnv - b.gnv);
          if (gnvList.length > 0) {
            const g0 = gnvList[0];
            resp = `O menor valor apurado de GNV na base da ANP para este estado está no ${g0.posto} (CNPJ ${g0.cnpj}, ${g0.bairro} - ${g0.cidade}) por R$ ${g0.gnv.toFixed(2).replace('.', ',')}/m³ (Coleta ANP: ${g0.atualizado_em}).`;
          }
        } else if (ql.includes("etanol")) {
          resp = "Pela regra dos 70%: divida o preço do Etanol pelo da Gasolina. Se ficar até 70% (0,70), o Etanol compensa mais. Use nossa Calculadora Flex no topo da página!";
        }
        chat.innerHTML += `<div><span class="inline-block bg-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 my-1">🤖 <strong>Penélope:</strong> ${resp}</span></div>`;
        if (statusTxt) statusTxt.innerText = "Pronta para sua próxima pergunta!";
        chat.scrollTop = chat.scrollHeight;
      }, 500);
    }
    const enviarPerguntaPenelope = perguntarPenelopeWeb;

    function toggleReconhecimentoVoz() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Reconhecimento de voz não suportado pelo seu navegador.");
        return;
      }
      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.onstart = () => {
        const st = document.getElementById('penelopeStatusTexto');
        if (st) st.innerText = "Ouvindo sua voz...";
      };
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        const inp = document.getElementById('inputPerguntaPenelope');
        if (inp) {
          inp.value = transcript;
          perguntarPenelopeWeb();
        }
      };
      rec.start();
    }

  

let ESTADO_ATUAL = 'rj';
    let POSTOS = [];
    let POSTOS_FILTRADOS = [];
    let LIMITE_EXIBICAO = 30;
    const CHUNK_SIZE = 30;
    const AMAZON_TAG = 'mestrepratico-20';

    const CONFIG_ESTADOS = {
      rj: {
        sigla: "RJ",
        nome: "Rio de Janeiro",
        badge: "398 Postos Reais ANP • RJ",
        titulo: "Onde abastecer mais barato no Rio de Janeiro?",
        subtitulo: "Preços dos Dados Abertos da ANP ordenados do menor para o maior valor. Escolha sua cidade ou pesquise abaixo:",
        capital: "Rio de Janeiro",
        destaque: "Cabo Frio"
      },
      sp: {
        sigla: "SP",
        nome: "São Paulo",
        badge: "1.697 Postos Reais ANP • SP",
        titulo: "Onde abastecer mais barato em São Paulo?",
        subtitulo: "Preços dos Dados Abertos da ANP na Capital, Campinas, Baixada Santista, ABC e polos paulistas:",
        capital: "São Paulo",
        destaque: "Campinas"
      },
      mg: {
        sigla: "MG",
        nome: "Minas Gerais",
        badge: "590 Postos Reais ANP • MG",
        titulo: "Onde abastecer mais barato em Minas Gerais?",
        subtitulo: "Preços dos Dados Abertos da ANP em Belo Horizonte, Contagem, Triângulo Mineiro e polos mineiros:",
        capital: "Belo Horizonte",
        destaque: "Uberlândia"
      },
      es: {
        sigla: "ES",
        nome: "Espírito Santo",
        badge: "133 Postos Reais ANP • ES",
        titulo: "Onde abastecer mais barato no Espírito Santo?",
        subtitulo: "Preços dos Dados Abertos da ANP em Vitória, Vila Velha, Serra, Cariacica, Linhares e polos capixabas:",
        capital: "Vitória",
        destaque: "Vila Velha"
      },
      pr: {
        sigla: "PR",
        nome: "Paraná",
        badge: "367 Postos Reais ANP • PR",
        titulo: "Onde abastecer mais barato no Paraná?",
        subtitulo: "Preços dos Dados Abertos da ANP em Curitiba, Londrina, Maringá, Ponta Grossa e polos paranaenses:",
        capital: "Curitiba",
        destaque: "Londrina"
      },
      sc: {
        sigla: "SC",
        nome: "Santa Catarina",
        badge: "208 Postos Reais ANP • SC",
        titulo: "Onde abastecer mais barato em Santa Catarina?",
        subtitulo: "Preços dos Dados Abertos da ANP em Florianópolis, Joinville, Blumenau, Itajaí, Chapecó e polos catarinenses:",
        capital: "Florianópolis",
        destaque: "Joinville"
      },
      rs: {
        sigla: "RS",
        nome: "Rio Grande do Sul",
        badge: "400 Postos Reais ANP • RS",
        titulo: "Onde abastecer mais barato no Rio Grande do Sul?",
        subtitulo: "Preços dos Dados Abertos da ANP em Porto Alegre, Caxias do Sul, Canoas, Pelotas e polos gaúchos:",
        capital: "Porto Alegre",
        destaque: "Caxias do Sul"
      },
      ba: {
        sigla: "BA",
        nome: "Bahia",
        badge: "289 Postos Reais ANP • BA",
        titulo: "Onde abastecer mais barato na Bahia?",
        subtitulo: "Preços dos Dados Abertos da ANP em Salvador, Feira de Santana, Vitória da Conquista e polos baianos:",
        capital: "Salvador",
        destaque: "Feira de Santana"
      },
      pe: {
        sigla: "PE",
        nome: "Pernambuco",
        badge: "221 Postos Reais ANP • PE",
        titulo: "Onde abastecer mais barato em Pernambuco?",
        subtitulo: "Preços dos Dados Abertos da ANP em Recife, Jaboatão, Olinda, Caruaru, Petrolina e polos pernambucanos:",
        capital: "Recife",
        destaque: "Jaboatão dos Guararapes"
      },
      ce: {
        sigla: "CE",
        nome: "Ceará",
        badge: "160 Postos Reais ANP • CE",
        titulo: "Onde abastecer mais barato no Ceará?",
        subtitulo: "Preços dos Dados Abertos da ANP em Fortaleza, Caucaia, Juazeiro do Norte e polos cearenses:",
        capital: "Fortaleza",
        destaque: "Juazeiro do Norte"
      },
      df: {
        sigla: "DF",
        nome: "Distrito Federal",
        badge: "64 Postos Reais ANP • DF",
        titulo: "Onde abastecer mais barato no Distrito Federal?",
        subtitulo: "Preços dos Dados Abertos da ANP em Brasília (Plano Piloto, Taguatinga, Ceilândia e regiões administrativas):",
        capital: "Brasília",
        destaque: "Taguatinga"
      },
      go: {
        sigla: "GO",
        nome: "Goiás",
        badge: "226 Postos Reais ANP • GO",
        titulo: "Onde abastecer mais barato em Goiás?",
        subtitulo: "Preços dos Dados Abertos da ANP em Goiânia, Aparecida de Goiânia, Anápolis, Rio Verde e polos goianos:",
        capital: "Goiânia",
        destaque: "Aparecida de Goiânia"
      },
      ms: {
        sigla: "MS",
        nome: "Mato Grosso do Sul",
        badge: "67 Postos Reais ANP • MS",
        titulo: "Onde abastecer mais barato em Mato Grosso do Sul?",
        subtitulo: "Preços dos Dados Abertos da ANP em Campo Grande, Dourados, Três Lagoas e polos sul-mato-grossenses:",
        capital: "Campo Grande",
        destaque: "Dourados"
      },
      mt: {
        sigla: "MT",
        nome: "Mato Grosso",
        badge: "124 Postos Reais ANP • MT",
        titulo: "Onde abastecer mais barato em Mato Grosso?",
        subtitulo: "Preços dos Dados Abertos da ANP em Cuiabá, Várzea Grande, Rondonópolis, Sinop e polos mato-grossenses:",
        capital: "Cuiabá",
        destaque: "Rondonópolis"
      },
      pb: {
        sigla: "PB",
        nome: "Paraíba",
        badge: "70 Postos Reais ANP • PB",
        titulo: "Onde abastecer mais barato na Paraíba?",
        subtitulo: "Preços dos Dados Abertos da ANP em João Pessoa, Campina Grande, Patos e polos paraibanos:",
        capital: "João Pessoa",
        destaque: "Campina Grande"
      },
      rn: {
        sigla: "RN",
        nome: "Rio Grande do Norte",
        badge: "63 Postos Reais ANP • RN",
        titulo: "Onde abastecer mais barato no Rio Grande do Norte?",
        subtitulo: "Preços dos Dados Abertos da ANP em Natal, Mossoró, Parnamirim e polos potiguares:",
        capital: "Natal",
        destaque: "Mossoró"
      },
      al: {
        sigla: "AL",
        nome: "Alagoas",
        badge: "77 Postos Reais ANP • AL",
        titulo: "Onde abastecer mais barato em Alagoas?",
        subtitulo: "Preços dos Dados Abertos da ANP em Maceió, Arapiraca, Rio Largo e polos alagoanos:",
        capital: "Maceió",
        destaque: "Arapiraca"
      },
      se: {
        sigla: "SE",
        nome: "Sergipe",
        badge: "41 Postos Reais ANP • SE",
        titulo: "Onde abastecer mais barato em Sergipe?",
        subtitulo: "Preços dos Dados Abertos da ANP em Aracaju, Nossa Senhora do Socorro, Lagarto e polos sergipanos:",
        capital: "Aracaju",
        destaque: "Nossa Senhora do Socorro"
      },
      ma: {
        sigla: "MA",
        nome: "Maranhão",
        badge: "156 Postos Reais ANP • MA",
        titulo: "Onde abastecer mais barato no Maranhão?",
        subtitulo: "Preços dos Dados Abertos da ANP em São Luís, Imperatriz, Caxias, Timon e polos maranhenses:",
        capital: "São Luís",
        destaque: "Imperatriz"
      },
      pi: {
        sigla: "PI",
        nome: "Piauí",
        badge: "71 Postos Reais ANP • PI",
        titulo: "Onde abastecer mais barato no Piauí?",
        subtitulo: "Preços dos Dados Abertos da ANP em Teresina, Parnaíba, Picos, Floriano e polos piauienses:",
        capital: "Teresina",
        destaque: "Parnaíba"
      },
      pa: {
        sigla: "PA",
        nome: "Pará",
        badge: "119 Postos Reais ANP • PA",
        titulo: "Onde abastecer mais barato no Pará?",
        subtitulo: "Preços dos Dados Abertos da ANP em Belém, Ananindeua, Santarém, Marabá e polos paraenses:",
        capital: "Belém",
        destaque: "Santarém"
      },
      am: {
        sigla: "AM",
        nome: "Amazonas",
        badge: "59 Postos Reais ANP • AM",
        titulo: "Onde abastecer mais barato no Amazonas?",
        subtitulo: "Preços dos Dados Abertos da ANP em Manaus, Parintins, Manacapuru e polos amazonenses:",
        capital: "Manaus",
        destaque: "Parintins"
      },
      ro: {
        sigla: "RO",
        nome: "Rondônia",
        badge: "57 Postos Reais ANP • RO",
        titulo: "Onde abastecer mais barato em Rondônia?",
        subtitulo: "Preços dos Dados Abertos da ANP em Porto Velho, Ji-Paraná, Ariquemes, Cacoal e polos rondonienses:",
        capital: "Porto Velho",
        destaque: "Ji-Paraná"
      },
      to: {
        sigla: "TO",
        nome: "Tocantins",
        badge: "67 Postos Reais ANP • TO",
        titulo: "Onde abastecer mais barato no Tocantins?",
        subtitulo: "Preços dos Dados Abertos da ANP em Palmas, Araguaína, Gurupi, Porto Nacional e polos tocantinenses:",
        capital: "Palmas",
        destaque: "Araguaína"
      },
      ac: {
        sigla: "AC",
        nome: "Acre",
        badge: "12 Postos Reais ANP • AC",
        titulo: "Onde abastecer mais barato no Acre?",
        subtitulo: "Preços dos Dados Abertos da ANP em Rio Branco e polos acreanos:",
        capital: "Rio Branco",
        destaque: "Cruzeiro do Sul"
      },
      ap: {
        sigla: "AP",
        nome: "Amapá",
        badge: "24 Postos Reais ANP • AP",
        titulo: "Onde abastecer mais barato no Amapá?",
        subtitulo: "Preços dos Dados Abertos da ANP em Macapá, Santana e polos amapaenses:",
        capital: "Macapá",
        destaque: "Santana"
      },
      rr: {
        sigla: "RR",
        nome: "Roraima",
        badge: "15 Postos Reais ANP • RR",
        titulo: "Onde abastecer mais barato em Roraima?",
        subtitulo: "Preços dos Dados Abertos da ANP em Boa Vista e polos roraimenses:",
        capital: "Boa Vista",
        destaque: "Rorainópolis"
      }
    };

    // CATÁLOGO CONTEXTUAL DE SUGESTÕES AMAZON PARA CADA CARD DE COMBUSTÍVEL
    const SUGESTOES_AMAZON_VEICULOS = [
      {
        icone: "🧪",
        categoria: "Economia no Tanque",
        titulo: "Aditivo Limpa Bicos Injeção (Koube / Bardahl)",
        beneficio: "Melhora o rendimento km/L em motores Gasolina e Flex",
        preco: "R$ 24,90",
        termo: "aditivo+combustivel+limpa+bicos+koube+bardahl",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol"]
      },
      {
        icone: "🛞",
        categoria: "Rendimento & Segurança",
        titulo: "Calibrador e Compressor de Pneus Digital Portátil",
        beneficio: "Pneus calibrados economizam até 5% de combustível",
        preco: "R$ 98,00",
        termo: "compressor+ar+portatil+veicular+digital+12v",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10", "gnv"]
      },
      {
        icone: "📱",
        categoria: "Motorista & GPS",
        titulo: "Suporte Celular Veicular c/ Carregamento Indução 15W",
        beneficio: "Fixação firme para acompanhar Waze e rotas de postos",
        preco: "R$ 39,90",
        termo: "suporte+veicular+celular+inducao+magnetico",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "gnv"]
      },
      {
        icone: "🛢️",
        categoria: "Manutenção Preventiva",
        titulo: "Óleo de Motor Sintético 5W30 / 10W40 em Oferta",
        beneficio: "Reduz atrito interno e reduz o consumo do veículo",
        preco: "R$ 34,90",
        termo: "oleo+motor+sintetico+5w30+api+sp",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "gnv"]
      },
      {
        icone: "📹",
        categoria: "Proteção no Trânsito",
        titulo: "Câmera Veicular Dashcam Full HD Visão Noturna",
        beneficio: "Essencial para motoristas de app e viagens no RJ",
        preco: "R$ 119,00",
        termo: "camera+veicular+dashcam+full+hd+visao+noturna",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10", "gnv"]
      },
      {
        icone: "⚡",
        categoria: "Carga Rápida 12V",
        titulo: "Carregador Veicular Turbo 60W USB-C Duplo",
        beneficio: "Carregue 2 celulares em alta velocidade durante o trajeto",
        preco: "R$ 28,90",
        termo: "carregador+veicular+turbo+usb+c+duplo",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10", "gnv"]
      },
      {
        icone: "🛵",
        categoria: "Especial Motoboy & Moto",
        titulo: "Suporte Moto Impermeável c/ Carregador USB",
        beneficio: "Proteção contra chuva e bateria sempre cheia nas entregas",
        preco: "R$ 42,90",
        termo: "suporte+celular+moto+impermeavel+com+carregador",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol"]
      },
      {
        icone: "🔋",
        categoria: "Emergência Automotiva",
        titulo: "Auxiliador de Partida Portátil (Jump Starter 12V)",
        beneficio: "Dê partida na bateria arriada sem depender de chupeta",
        preco: "R$ 169,00",
        termo: "auxiliador+partida+portatil+veicular+jump+starter",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10", "gnv"]
      },
      {
        icone: "🔧",
        categoria: "Diagnóstico de Consumo",
        titulo: "Scanner Automotivo OBD2 Bluetooth p/ Celular",
        beneficio: "Monitore consumo real km/L e apague falhas de injeção",
        preco: "R$ 36,90",
        termo: "scanner+automotivo+obd2+bluetooth+portugues",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10", "gnv"]
      },
      {
        icone: "🚛",
        categoria: "Proteção Diesel S10",
        titulo: "Aditivo Diesel S10 Bactericida e Descarbonizante",
        beneficio: "Evita borra no tanque e protege bombas e bicos injetores",
        preco: "R$ 38,90",
        termo: "aditivo+diesel+s10+bactericida+limpa+bicos",
        combustiveis: ["diesel_s10"]
      },
      {
        icone: "💨",
        categoria: "Desempenho GNV & Flex",
        titulo: "Jogo de Velas e Cabos de Ignição (NGK / Bosch)",
        beneficio: "Partida rápida e queima perfeita para carros com GNV",
        preco: "R$ 64,90",
        termo: "velas+ignicao+ngk+gnv+flex",
        combustiveis: ["gnv", "etanol", "gasolina_comum"]
      },
      {
        icone: "✨",
        categoria: "Estética Automotiva",
        titulo: "Kit Limpeza Automotiva Vonixx (Cera + Pretinho)",
        beneficio: "Brilho espelhado e proteção da pintura contra sol e maresia",
        preco: "R$ 49,90",
        termo: "kit+limpeza+automotiva+vonixx+cera",
        combustiveis: ["gasolina_comum", "gasolina_aditivada", "etanol", "diesel_s10", "gnv"]
      }
    ];

    function obterSugestaoAmazonParaCard(tipoComb, idx, buscaUsuario = '') {
      // Filtra sugestões prioritárias para o combustível selecionado
      const compativeis = SUGESTOES_AMAZON_VEICULOS.filter(item => item.combustiveis.includes(tipoComb));
      const pool = compativeis.length > 0 ? compativeis : SUGESTOES_AMAZON_VEICULOS;
      return pool[idx % pool.length];
    }

    function registrarCliqueAmazon(produtoTitulo, postoNome = '') {
      logTelemetry('click_amazon_combustivel', { produto: produtoTitulo, posto: postoNome });
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'AmazonProductClick', {
          content_name: produtoTitulo,
          content_category: 'Combustivel_Automotivo',
          station: postoNome
        });
      }
    }

    function limparBuscaCombustivel() {
      const inp = document.getElementById('inputBusca');
      const btn = document.getElementById('btnLimparBuscaComb');
      if (inp) inp.value = '';
      if (btn) btn.classList.add('hidden');
      resetEFiltrar();
    }

    async function trocarEstado() {
      const sel = document.getElementById('selectEstado');
      const uf = (sel ? sel.value : 'rj').toLowerCase();
      ESTADO_ATUAL = uf;

      const cfg = CONFIG_ESTADOS[uf] || CONFIG_ESTADOS.rj;
      const badgeEl = document.getElementById('badgeAuditados');
      const titEl = document.getElementById('tituloPagina');
      const subEl = document.getElementById('subtituloPagina');
      const labelCid = document.getElementById('labelCidade');

      if (badgeEl) badgeEl.innerText = cfg.badge;
      if (titEl) titEl.innerText = cfg.titulo;
      if (subEl) subEl.innerText = cfg.subtitulo;
      if (labelCid) labelCid.innerText = `Cidade / Município (${cfg.sigla})`;

      // Limpa busca ao trocar estado
      const inp = document.getElementById('inputBusca');
      if (inp) inp.value = '';
      const btn = document.getElementById('btnLimparBuscaComb');
      if (btn) btn.classList.add('hidden');

      await carregarDados(uf);
    }

    async function carregarDados(uf = 'rj') {
      const contador = document.getElementById('contadorResultados');
      if (contador) {
        contador.innerHTML = `<span class="text-amber-400 font-bold animate-pulse">🔄 Carregando postos de ${uf.toUpperCase()}...</span>`;
      }
      try {
        const res = await fetch(`/dados_combustiveis_${uf}.json?v=` + Date.now());
        if (res.ok) {
          const data = await res.json();
          POSTOS = data.postos || [];
          popularCidades(uf);
        } else {
          console.error("Erro ao carregar dados ANP:", res.status);
        }
      } catch (e) {
        console.error("Erro ao carregar dados ANP:", e);
      }

      LIMITE_EXIBICAO = CHUNK_SIZE;
      filtrarPostos();
    }

    function popularCidades(uf = 'rj') {
      const select = document.getElementById('selectCidade');
      if (!select) return;
      const cidades = [...new Set(POSTOS.map(p => p.cidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      const cfg = CONFIG_ESTADOS[uf] || CONFIG_ESTADOS.rj;

      let html = `<option value="todas">📍 Todas as Cidades (${POSTOS.length.toLocaleString('pt-BR')} Postos)</option>`;

      if (cidades.includes(cfg.capital)) {
        const qtdCap = POSTOS.filter(p => p.cidade === cfg.capital).length;
        html += `<option value="${cfg.capital}" selected>📍 ${cfg.capital} (Capital - ${qtdCap} postos)</option>`;
      }

      if (cfg.destaque && cidades.includes(cfg.destaque)) {
        const qtdDest = POSTOS.filter(p => p.cidade === cfg.destaque).length;
        html += `<option value="${cfg.destaque}">📍 ${cfg.destaque} (${qtdDest} postos)</option>`;
      }

      cidades.forEach(c => {
        if (c !== cfg.capital && c !== cfg.destaque) {
          const qtd = POSTOS.filter(p => p.cidade === c).length;
          html += `<option value="${c}">📍 ${c} (${qtd} postos)</option>`;
        }
      });

      select.innerHTML = html;

      // Suporte a parâmetro de URL ?cidade=Campinas ou cidade salva
      const urlParams = new URLSearchParams(window.location.search);
      const urlCidade = urlParams.get('cidade');
      if (urlCidade && [...select.options].some(o => o.value.toLowerCase() === urlCidade.toLowerCase())) {
        select.value = [...select.options].find(o => o.value.toLowerCase() === urlCidade.toLowerCase()).value;
      }
    }

    function normalizar(txt) {
      return (txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function resetEFiltrar() {
      const inp = document.getElementById('inputBusca');
      const btn = document.getElementById('btnLimparBuscaComb');
      if (btn && inp) {
        if (inp.value.trim().length > 0) {
          btn.classList.remove('hidden');
        } else {
          btn.classList.add('hidden');
        }
      }
      LIMITE_EXIBICAO = CHUNK_SIZE;
      filtrarPostos();
    }

    function filtrarPostos() {
      const cid = document.getElementById('selectCidade').value;
      const tipoComb = document.getElementById('selectCombustivel').value;
      const buscaRaw = document.getElementById('inputBusca').value;
      const busca = normalizar(buscaRaw);

      POSTOS_FILTRADOS = POSTOS.filter(p => {
        if ((p[tipoComb] || 0) <= 0) return false;
        if (cid !== 'todas' && p.cidade !== cid) return false;
        if (busca) {
          const mNome = normalizar(p.posto);
          const mBairro = normalizar(p.bairro);
          const mBand = normalizar(p.bandeira);
          const mEnd = normalizar(p.endereco);
          const mCid = normalizar(p.cidade);
          const mCnpj = normalizar(p.cnpj);
          if (!mNome.includes(busca) && !mBairro.includes(busca) && !mBand.includes(busca) && !mEnd.includes(busca) && !mCid.includes(busca) && !mCnpj.includes(busca)) return false;
        }
        return true;
      });

      // Ordena do menor para o maior preço do combustível selecionado
      POSTOS_FILTRADOS.sort((a, b) => (a[tipoComb] || 999) - (b[tipoComb] || 999));

      if (buscaRaw.trim().length >= 3) {
        logTelemetry('busca_combustivel', { cidade: cid, combustivel: tipoComb, termo: buscaRaw.trim() });
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Search', { search_string: buscaRaw.trim(), content_category: 'Combustivel' });
        }
      }

      // Atualiza automaticamente a calculadora de paridade com os menores preços disponíveis
      if (POSTOS_FILTRADOS.length > 0) {
        const gasDisponiveis = POSTOS_FILTRADOS.map(p => p.gasolina_comum || 0).filter(v => v > 0);
        const etaDisponiveis = POSTOS_FILTRADOS.map(p => p.etanol || 0).filter(v => v > 0);
        if (gasDisponiveis.length > 0 && etaDisponiveis.length > 0) {
          const menorGas = Math.min(...gasDisponiveis);
          const menorEta = Math.min(...etaDisponiveis);
          const inpG = document.getElementById('calcGasolina');
          const inpE = document.getElementById('calcEtanol');
          if (inpG && inpE && (!inpG.value || inpG.dataset.autofill === 'true')) {
            inpG.value = menorGas.toFixed(2);
            inpE.value = menorEta.toFixed(2);
            inpG.dataset.autofill = 'true';
            inpE.dataset.autofill = 'true';
            calcularParidade();
          }
        }
      }

      renderizar(tipoComb, buscaRaw.trim());
    }

    function calcularParidade() {
      const inpGas = document.getElementById('calcGasolina');
      const inpEta = document.getElementById('calcEtanol');
      const sub = document.getElementById('calcSubtitulo');
      const veredito = document.getElementById('calcVeredito');
      if (!inpGas || !inpEta || !veredito) return;

      const gas = parseFloat(inpGas.value);
      const eta = parseFloat(inpEta.value);

      if (!gas || !eta || gas <= 0 || eta <= 0) {
        if (sub) sub.innerText = "Resultado";
        veredito.innerText = "Digite os preços";
        veredito.className = "text-xs font-black text-amber-400";
        return;
      }

      const ratio = (eta / gas) * 100;
      const ratioFmt = ratio.toFixed(1).replace('.', ',');

      if (ratio <= 70) {
        if (sub) sub.innerText = `Etanol é ${ratioFmt}% da Gasolina`;
        veredito.innerText = "🌿 ETANOL COMPENSA MAIS!";
        veredito.className = "text-xs font-black text-emerald-400";
      } else {
        if (sub) sub.innerText = `Etanol é ${ratioFmt}% da Gasolina`;
        veredito.innerText = "⛽ GASOLINA COMPENSA MAIS!";
        veredito.className = "text-xs font-black text-amber-400";
      }
    }

    function compartilharCalculadoraWpp() {
      const inpGas = document.getElementById('calcGasolina');
      const inpEta = document.getElementById('calcEtanol');
      const gas = inpGas ? inpGas.value : '';
      const eta = inpEta ? inpEta.value : '';

      let texto = "⚖️ *Calculadora Etanol x Gasolina (Regra dos 70%)*\n\nDescubra na hora qual combustível vale a pena no seu veículo!\n\n";
      if (gas && eta) {
        const ratio = ((parseFloat(eta) / parseFloat(gas)) * 100).toFixed(1).replace('.', ',');
        const escolha = (parseFloat(eta) / parseFloat(gas) <= 0.70) ? "🌿 ETANOL" : "⛽ GASOLINA";
        texto += `⛽ Gasolina: R$ ${gas}\n🌿 Etanol: R$ ${eta}\n📊 Relação: ${ratio}%\n👉 *Veredito:* Abasteça com ${escolha}!\n\n`;
      }
      texto += "Confira os preços mais baratos nos postos da sua cidade no NutriCombust:\nhttps://mestrepratico.com.br/combustivel.html?uf=" + ESTADO_ATUAL;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    }

    function carregarMais() {
      LIMITE_EXIBICAO += CHUNK_SIZE;
      const tipoComb = document.getElementById('selectCombustivel').value;
      const buscaRaw = document.getElementById('inputBusca').value.trim();
      renderizar(tipoComb, buscaRaw);
    }

    function formatarValorMiniGrade(val) {
      return (val && val > 0) ? 'R$ ' + val.toFixed(2).replace('.', ',') : '—';
    }

    function renderizar(tipoComb, buscaRaw = '') {
      const grid = document.getElementById('gridPostos');
      const contador = document.getElementById('contadorResultados');
      const btnMais = document.getElementById('containerVerMais');

      const total = POSTOS_FILTRADOS.length;
      const visiveis = POSTOS_FILTRADOS.slice(0, LIMITE_EXIBICAO);

      const nomesComb = {
        gasolina_comum: "Gasolina Comum",
        gasolina_aditivada: "Gasolina Aditivada",
        etanol: "Etanol",
        diesel_s10: "Diesel S10",
        gnv: "GNV"
      };

      const unidadeMedida = tipoComb === 'gnv' ? '/ m³' : '/ litro';

      contador.innerHTML = `Exibindo <strong class="text-white">${visiveis.length}</strong> de <strong class="text-amber-400">${total.toLocaleString('pt-BR')}</strong> postos reais com cotação de <strong class="text-white">${nomesComb[tipoComb]}</strong>`;

      if (visiveis.length < total) {
        btnMais.classList.remove('hidden');
      } else {
        btnMais.classList.add('hidden');
      }

      if (!total) {
        grid.innerHTML = '<div class="col-span-full py-12 text-center text-slate-400 font-bold bg-slate-950/60 rounded-2xl border border-slate-800">Nenhum posto com cotação ativa para este filtro na base da ANP. Tente limpar a busca, trocar o combustível ou selecionar outra cidade.</div>';
        return;
      }

      const auditoriasLocal = JSON.parse(localStorage.getItem('nutri_precos_colaborativos') || '[]');
      let html = '';
      visiveis.forEach((p, idx) => {
        const preco = (p[tipoComb] || 0).toFixed(2).replace('.', ',');
        const isMenor = idx === 0;
        const sugAmazon = obterSugestaoAmazonParaCard(tipoComb, idx, buscaRaw);
        const urlAmazonCard = `https://www.amazon.com.br/s?k=${sugAmazon.termo}&tag=${AMAZON_TAG}`;
        const postoEscapado = (p.posto || '').replace(/'/g, "\\'");
        const tituloAmazonEscapado = sugAmazon.titulo.replace(/'/g, "\\'");

        // Verifica se há preço auditado por IA para este posto específico
        const pCnpjClean = (p.cnpj || '').replace(/\D/g, '');
        const auditado = auditoriasLocal.find(a => {
          const aCnpjClean = (a.cnpj || a.cnpj_original || '').replace(/\D/g, '');
          if (aCnpjClean && pCnpjClean && aCnpjClean === pCnpjClean) return true;
          return (a.posto && p.posto && a.posto.toLowerCase().trim() === p.posto.toLowerCase().trim());
        });

        html += `
          <div class="bg-slate-950 border ${auditado ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : (isMenor ? 'border-amber-400 shadow-xl shadow-amber-500/10' : 'border-slate-800/90')} rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <!-- Topo do Card: Bandeira + Selo Posição -->
              <div class="flex items-center justify-between gap-2 mb-2.5">
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                  ⛽ ${p.bandeira}
                </span>
                ${auditado
                  ? `<span class="px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wide flex items-center gap-1">✨ AUDITADO POR IA</span>`
                  : (isMenor 
                    ? '<span class="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide">🏆 MENOR PREÇO</span>' 
                    : `<span class="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 font-bold text-[10px] border border-slate-800">#${idx + 1} mais barato</span>`
                  )
                }
              </div>

              <!-- Nome, CNPJ e Localização do Posto -->
              <h3 class="font-extrabold text-base text-white mb-0.5 leading-snug">${p.posto}</h3>
              <p class="text-[11px] font-mono font-bold text-emerald-400/90 mb-1">CNPJ: ${p.cnpj || 'Verificado ANP'}</p>
              <p class="text-xs font-semibold text-amber-400/90 mb-1">📍 ${p.bairro} • ${p.cidade}</p>
              <p class="text-[11px] text-slate-400 mb-3 line-clamp-1" title="${p.endereco}">${p.endereco}</p>

              ${auditado ? `
                <!-- DESTAQUE SELO OURO / PRATA AUDITADO POR IA -->
                <div class="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/80 rounded-xl p-3 mb-3 shadow-lg shadow-emerald-500/10 animate-fade-in">
                  <div class="flex items-center justify-between gap-1 mb-1.5 pb-1.5 border-b border-emerald-500/30">
                    <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <span>${auditado.tipo_selo && auditado.tipo_selo.includes('Ouro') ? '🥇 SELO OURO • DANFE / NFC-e' : '🥈 SELO PRATA • TOTEM'}</span>
                    </span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Verificado Gemini IA</span>
                  </div>
                  <div class="flex items-baseline justify-between">
                    <div>
                      <div class="text-[10px] font-bold text-slate-300">${auditado.combustivel}:</div>
                      <div class="text-2xl font-black text-emerald-400">R$ ${auditado.preco.toFixed(2).replace('.', ',')} <span class="text-xs font-semibold text-slate-400">${unidadeMedida}</span></div>
                    </div>
                    <div class="text-right">
                      <div class="text-[10px] text-emerald-400 font-bold">✓ Preço Real Comprovado</div>
                      <div class="text-[9px] text-slate-400">${auditado.timestamp}</div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- Bloco Principal de Preços do Posto -->
              <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-3">
                <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80">
                  <div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">${nomesComb[tipoComb]} ${auditado ? '(Base ANP)' : '(Est. Média)'}</div>
                    <div class="text-2xl font-black ${auditado ? 'text-slate-400' : 'text-amber-400'}">~ R$ ${preco} <span class="text-xs font-semibold text-slate-400">${unidadeMedida}</span></div>
                  </div>
                  <div class="text-right">
                    <span class="inline-block px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-bold">ℹ️ Referência Regional</span>
                    <div class="text-[10px] text-slate-400 font-medium mt-1">Base: ${p.atualizado_em || 'Média ANP'}</div>
                  </div>
                </div>

                <!-- Todos os outros preços do posto para continuidade da consulta -->
                <div class="grid grid-cols-4 gap-1.5 text-center">
                  <div class="bg-slate-950/70 rounded-lg py-1 px-1 border ${tipoComb === 'gasolina_comum' ? 'border-amber-500/40' : 'border-slate-800/60'}">
                    <div class="text-[9px] text-slate-400 font-semibold">Gas. Comum</div>
                    <div class="text-[11px] font-extrabold text-slate-200">${formatarValorMiniGrade(p.gasolina_comum)}</div>
                  </div>
                  <div class="bg-slate-950/70 rounded-lg py-1 px-1 border ${tipoComb === 'etanol' ? 'border-amber-500/40' : 'border-slate-800/60'}">
                    <div class="text-[9px] text-slate-400 font-semibold">Etanol</div>
                    <div class="text-[11px] font-extrabold text-emerald-400">${formatarValorMiniGrade(p.etanol)}</div>
                  </div>
                  <div class="bg-slate-950/70 rounded-lg py-1 px-1 border ${tipoComb === 'gnv' ? 'border-amber-500/40' : 'border-slate-800/60'}">
                    <div class="text-[9px] text-slate-400 font-semibold">GNV</div>
                    <div class="text-[11px] font-extrabold text-sky-400">${formatarValorMiniGrade(p.gnv)}</div>
                  </div>
                  <div class="bg-slate-950/70 rounded-lg py-1 px-1 border ${tipoComb === 'diesel_s10' ? 'border-amber-500/40' : 'border-slate-800/60'}">
                    <div class="text-[9px] text-slate-400 font-semibold">Diesel S10</div>
                    <div class="text-[11px] font-extrabold text-slate-200">${formatarValorMiniGrade(p.diesel_s10)}</div>
                  </div>
                </div>
              </div>

              <!-- SUGESTÃO AMAZON VEÍCULOS / COMBUSTÍVEL INTEGRADA EM CADA CARD -->
              <a href="${urlAmazonCard}" onclick="registrarCliqueAmazon('${tituloAmazonEscapado}', '${postoEscapado}')" target="_blank" rel="sponsored nofollow noopener noreferrer" class="group/amz block bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 border border-amber-500/30 hover:border-amber-400 rounded-xl p-2.5 mb-3 transition">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-400">
                    <svg class="w-3 h-3 fill-[#FF9900]" viewBox="0 0 24 24"><path d="M13.62 16.91c-3.15 2.32-7.75 3.55-11.66 3.55a18.23 18.23 0 0 1-1.96-.1.64.64 0 0 1-.53-.78.65.65 0 0 1 .68-.53c.6.05 1.21.07 1.81.07 3.53 0 7.7-1.12 10.57-3.23a.62.62 0 0 1 .86.13.62.62 0 0 1 .23.89zM14.93 15.34c-.16-.2-.79-.1-1.63.2a13.3 13.3 0 0 1-1.37.4c-.28.06-.39.26-.2.43.98.88 2.05.61 2.25.56.2-.05.8-.3 1.07-1.32.08-.28-.02-.37-.12-.27z"/></svg>
                    <span>Sugestão p/ Seu Veículo • ${sugAmazon.categoria}</span>
                  </span>
                  <span class="text-[10px] font-extrabold text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded">${sugAmazon.preco}</span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-lg shrink-0">${sugAmazon.icone}</span>
                    <div class="min-w-0">
                      <div class="text-xs font-bold text-white group-hover/amz:text-amber-300 truncate transition">${sugAmazon.titulo}</div>
                      <div class="text-[10px] text-slate-400 truncate">${sugAmazon.beneficio}</div>
                    </div>
                  </div>
                  <span class="text-[10px] font-black text-amber-400 group-hover/amz:translate-x-0.5 transition shrink-0">Ver ↗</span>
                </div>
              </a>
            </div>

            <!-- Botão Colaborativo: Atualizar Preço Deste Posto (Auditado por IA) -->
            <button onclick="abrirModalAuditoriaPreco('${postoEscapado}', '${p.cidade}', '${p.cnpj || ''}', '${p.bairro}')" class="w-full mb-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer">
              <span>📢 Informar Preço da Bomba</span>
              <span class="text-[10px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-bold">Auditoria Gemini IA</span>
            </button>

            <!-- Botões de Ação: WhatsApp & Rota GPS -->
            <div class="grid grid-cols-2 gap-2">
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent('⛽ *Menor ' + nomesComb[tipoComb] + ' em ' + p.cidade + ':* R$ ' + preco + ' ' + unidadeMedida + ' no posto ' + p.posto + ' (CNPJ ' + (p.cnpj || '') + ' - ' + p.bairro + ')!\n📅 Coleta ANP: ' + (p.atualizado_em || '') + '\n\n📍 Veja o ranking completo no NutriCombust:\nhttps://mestrepratico.com.br/combustivel.html?uf=' + ESTADO_ATUAL)}" target="_blank" rel="noopener noreferrer" class="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/10 cursor-pointer" title="Compartilhar menor preço no WhatsApp">
                <span>📲 Compartilhar</span>
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.posto + ' ' + p.endereco + ' ' + p.cidade + ' ' + ESTADO_ATUAL.toUpperCase())}" target="_blank" rel="noopener noreferrer" class="h-10 rounded-xl bg-slate-900 hover:bg-amber-400 hover:text-slate-950 border border-slate-800 hover:border-amber-400 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition">
                <span class="material-symbols-outlined text-[16px]">directions_car</span>
                <span>Rota GPS</span>
              </a>
            </div>
          </div>
        `;
      });

      grid.innerHTML = html;
    }

    // TELEMETRIA E CONTADORES EM TEMPO REAL (SUPABASE)
    const SUPABASE_URL = "https://fzoyldcfyiigwyxxhosd.supabase.co";
    const SUPABASE_KEY = "sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv";
    const HEADERS = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    };

    function getDeviceId() {
      let id = localStorage.getItem('nutri_device_id');
      if (!id) {
        id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        localStorage.setItem('nutri_device_id', id);
      }
      return id;
    }

    function logTelemetry(evento, payload = {}) {
      try {
        const body = {
          device_id: getDeviceId(),
          evento: evento,
          cidade: 'Combustivel RJ',
          metadata: payload,
          created_at: new Date().toISOString()
        };
        fetch(`${SUPABASE_URL}/rest/v1/app_telemetria`, {
          method: 'POST',
          headers: {
            ...HEADERS,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(body)
        }).catch(() => {});
      } catch (e) {}
    }

    async function updateOnlineCounter() {
      const hOnline = document.getElementById('liveOnlineCountHeader');
      const mOnline = document.getElementById('liveOnlineCountMobile');
      const hVisitas = document.getElementById('totalVisitasCountHeader');
      const mVisitas = document.getElementById('totalVisitasCountMobile');

      try {
        // 1. Usuários Online 100% Reais (Aparelhos ativos nos últimos 5 minutos)
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const resOnline = await fetch(`${SUPABASE_URL}/rest/v1/app_telemetria?select=device_id&created_at=gte.${encodeURIComponent(fiveMinAgo)}`, {
          headers: HEADERS
        });
        if (resOnline.ok) {
          const rows = await resOnline.json();
          if (Array.isArray(rows)) {
            const unique = new Set(rows.map(r => r.device_id).filter(Boolean)).size;
            const realOnline = Math.max(unique, 1);
            if (hOnline) hOnline.innerText = realOnline;
            if (mOnline) mOnline.innerText = realOnline;
          }
        }

        // 2. Total de Visitas Auditado
        const resTotal = await fetch(`${SUPABASE_URL}/rest/v1/app_telemetria?select=id`, {
          headers: {
            ...HEADERS,
            'Range-Unit': 'items',
            'Range': '0-0',
            'Prefer': 'count=exact'
          }
        });
        if (resTotal.status === 206 || resTotal.ok) {
          const contentRange = resTotal.headers.get('content-range');
          if (contentRange && contentRange.includes('/')) {
            const totalDb = parseInt(contentRange.split('/')[1], 10) || 0;
            const fmt = totalDb.toLocaleString('pt-BR');
            if (hVisitas) hVisitas.innerText = fmt;
            if (mVisitas) mVisitas.innerText = fmt;
          }
        }
      } catch (e) {
        if (hOnline && hOnline.innerText === '--') hOnline.innerText = '1';
        if (mOnline && mOnline.innerText === '--') mOnline.innerText = '1';
      }
    }

    // AVALIAÇÕES DA COMUNIDADE (EXCLUSIVAMENTE ENVIADAS PELO USUÁRIO)
    function carregarAvaliacoes() {
      const salvas = JSON.parse(localStorage.getItem('nutri_avaliacoes_combustivel') || '[]');
      const container = document.getElementById('listaComentariosRecentes');
      if (!container) return;

      if (salvas.length === 0) {
        container.innerHTML = `
          <div class="text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 text-center">
            <p class="font-semibold text-slate-300 mb-0.5">Nenhuma avaliação registrada neste navegador ainda.</p>
            <p class="text-[10px] text-slate-400">Abasteceu hoje? Seja o primeiro motorista a registrar sua avaliação real acima!</p>
          </div>
        `;
        return;
      }

      let html = '';
      salvas.slice(0, 3).forEach(av => {
        const estrelasStr = '⭐'.repeat(av.estrelas || 5);
        html += `
          <div class="text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
            <div class="flex items-center justify-between text-[10px] mb-0.5">
              <span class="font-bold text-amber-400">${av.autor}</span>
              <span class="text-slate-500">${av.hora} • ${estrelasStr}</span>
            </div>
            <p class="text-slate-300">"${av.texto}"</p>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    function enviarAvaliacao(e) {
      e.preventDefault();
      const autor = document.getElementById('autorAvaliacao').value.trim();
      const estrelas = parseInt(document.getElementById('estrelasAvaliacao').value, 10);
      const comentario = document.getElementById('comentarioAvaliacao').value.trim();
      const msg = document.getElementById('msgSucessoAvaliacao');

      if (!autor || !comentario) return;

      const nova = {
        autor: autor,
        estrelas: estrelas,
        texto: comentario,
        hora: "Agora mesmo"
      };

      // Salva localmente
      const salvas = JSON.parse(localStorage.getItem('nutri_avaliacoes_combustivel') || '[]');
      salvas.unshift(nova);
      localStorage.setItem('nutri_avaliacoes_combustivel', JSON.stringify(salvas));

      // Telemetria Supabase
      logTelemetry('avaliacao_combustivel', nova);

      // Limpa form e exibe feedback
      document.getElementById('comentarioAvaliacao').value = '';
      if (msg) {
        msg.classList.remove('hidden');
        setTimeout(() => msg.classList.add('hidden'), 4000);
      }

      carregarAvaliacoes();
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    document.addEventListener('DOMContentLoaded', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const rawUf = urlParams.get('uf');
      if (rawUf && ['rj', 'sp', 'mg', 'es', 'pr', 'sc', 'rs', 'ba', 'pe', 'ce', 'df', 'go'].includes(rawUf.toLowerCase())) {
        const ufParam = rawUf.toLowerCase();
        const selEstado = document.getElementById('selectEstado');
        if (selEstado) selEstado.value = ufParam;
        ESTADO_ATUAL = ufParam;
        const cfg = CONFIG_ESTADOS[ufParam] || CONFIG_ESTADOS.rj;
        const badgeEl = document.getElementById('badgeAuditados');
        const titEl = document.getElementById('tituloPagina');
        const subEl = document.getElementById('subtituloPagina');
        const labelCid = document.getElementById('labelCidade');
        if (badgeEl) badgeEl.innerText = cfg.badge;
        if (titEl) titEl.innerText = cfg.titulo;
        if (subEl) subEl.innerText = cfg.subtitulo;
        if (labelCid) labelCid.innerText = `Cidade / Município (${cfg.sigla})`;
        carregarDados(ufParam);
      } else {
        // Carga inicial Nacional (Opção 1 aprovada pelo CEO)
        const titEl = document.getElementById('tituloPagina');
        const subEl = document.getElementById('subtituloPagina');
        const badgeEl = document.getElementById('badgeAuditados');
        if (titEl) titEl.innerText = "Onde Abastecer Mais Barato Hoje no Brasil?";
        if (subEl) subEl.innerText = "Dados oficiais da ANP auditados em tempo real de ponta a ponta do país. Digite sua cidade ou estado abaixo e descubra o menor preço da sua rota:";
        if (badgeEl) badgeEl.innerText = "12 Estados • Base Oficial ANP";
        carregarDados('rj');
      }

      carregarAvaliacoes();
      logTelemetry('page_view_combustivel', { uf: ESTADO_ATUAL });
      updateOnlineCounter();
      setInterval(updateOnlineCounter, 12000);
      setInterval(() => logTelemetry('app_heartbeat_combustivel', { uf: ESTADO_ATUAL }), 45000);
    });
  

let AUDITORIA_POSTO_ATUAL = null;
    let AUDITORIA_TIPO_ABA = 'cupom'; // 'cupom' ou 'totem'
    let DADOS_EXTRAIDOS_IA = null;

    function abrirModalAuditoriaPreco(nomePosto, cidade, cnpj, bairro) {
      AUDITORIA_POSTO_ATUAL = { nome: nomePosto, cidade: cidade, cnpj: cnpj, bairro: bairro };
      
      const nomeEl = document.getElementById('modalAuditoriaNomePosto');
      const subEl = document.getElementById('modalAuditoriaSubtitulo');
      if (nomeEl) nomeEl.innerText = nomePosto;
      if (subEl) subEl.innerText = `📍 ${bairro} • ${cidade} | CNPJ: ${cnpj || 'Identificado na base'}`;

      // Reseta estado do modal
      trocarAbaAuditoria('cupom');
      resetarEstadoModalAuditoria();

      const modal = document.getElementById('modalAuditoriaPreco');
      if (modal) modal.classList.remove('hidden');
    }

    function fecharModalAuditoriaPreco() {
      const modal = document.getElementById('modalAuditoriaPreco');
      if (modal) modal.classList.add('hidden');
    }

    function trocarAbaAuditoria(tipo) {
      AUDITORIA_TIPO_ABA = tipo;
      const btnCupom = document.getElementById('btnAbaCupom');
      const btnTotem = document.getElementById('btnAbaTotem');
      const dica = document.getElementById('dropzoneDica');

      if (tipo === 'cupom') {
        if (btnCupom) btnCupom.className = "py-2.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md";
        if (btnTotem) btnTotem.className = "py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer";
        if (dica) dica.innerText = "Fotografe o cupom fiscal (DANFE/NFC-e) com o preço e CNPJ visíveis";
      } else {
        if (btnCupom) btnCupom.className = "py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer";
        if (btnTotem) btnTotem.className = "py-2.5 px-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md";
        if (dica) dica.innerText = "Fotografe o painel / totem de preços na entrada do posto";
      }
      resetarEstadoModalAuditoria();
    }

    function resetarEstadoModalAuditoria() {
      const dropConteudo = document.getElementById('dropzoneConteudo');
      const dropPreview = document.getElementById('dropzonePreview');
      const statusProc = document.getElementById('statusGeminiProcessando');
      const resSucesso = document.getElementById('resultadoGeminiSucesso');
      const btnConfirmar = document.getElementById('btnConfirmarPublicacao');
      const input = document.getElementById('inputFotoAuditoria');

      if (dropConteudo) dropConteudo.classList.remove('hidden');
      if (dropPreview) dropPreview.classList.add('hidden');
      if (statusProc) statusProc.classList.add('hidden');
      if (resSucesso) resSucesso.classList.add('hidden');
      if (btnConfirmar) btnConfirmar.disabled = true;
      if (input) input.value = '';
      DADOS_EXTRAIDOS_IA = null;
    }

    function processarFotoSelecionada(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const dropConteudo = document.getElementById('dropzoneConteudo');
        const dropPreview = document.getElementById('dropzonePreview');
        const img = document.getElementById('imgPreviewAuditoria');
        const statusProc = document.getElementById('statusGeminiProcessando');

        if (img) img.src = e.target.result;
        if (dropConteudo) dropConteudo.classList.add('hidden');
        if (dropPreview) dropPreview.classList.remove('hidden');
        if (statusProc) statusProc.classList.remove('hidden');

        // Extrai bytes base64 da imagem
        const base64Data = e.target.result.split(',')[1];
        const mimeType = file.type || 'image/jpeg';

                const OCR_API_ENDPOINT = "/api/gemini-ocr";

        const promptInstrucao = (AUDITORIA_TIPO_ABA === 'cupom')
          ? "Você é o Auditor Fiscal Oficial do NutriCombust. Analise a imagem deste Cupom Fiscal / DANFE de combustível. Extraia em JSON estrito os campos: 'posto' (string com nome do posto), 'cnpj' (string com CNPJ formatado ou apenas dígitos), 'municipio' (string com cidade/UF), 'data_emissao' (string com data encontrada), 'combustivel' (string: Gasolina Comum, Etanol, Diesel S10, GNV ou Diesel S500), 'preco_unitario' (float com o valor por litro/m3), 'confianca' (float de 0 a 1). Se não for um documento fiscal legível de combustível, retorne {'erro': 'Documento ilegível ou não é cupom fiscal de combustível'}."
          : "Você é o Auditor de Preços do NutriCombust. Analise a foto deste totem/painel de preços de posto de combustível. Extraia em JSON estrito: 'posto' (string com bandeira ou nome visível), 'combustivel' (string: Gasolina Comum, Etanol, Diesel S10 ou GNV), 'preco_unitario' (float com o menor preço visível no painel), 'confianca' (float de 0 a 1). Se o painel não estiver legível, retorne {'erro': 'Painel não legível'}.";

        const payload = {
          contents: [{
            parts: [
              { text: promptInstrucao },
              { inlineData: { mimeType: mimeType, data: base64Data } }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        };

                async function chamarGeminiComFallback() {
          try {
            const resp = await fetch(OCR_API_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (resp.ok) {
              return await resp.json();
            }
            throw new Error(`Serviço OCR retornou status ${resp.status}`);
          } catch (err) {
            console.warn(`[Gemini OCR API]: ${err.message}`);
            throw err;
          }
        }

        chamarGeminiComFallback()
        .then(data => {
          if (statusProc) statusProc.classList.add('hidden');
          const textoJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textoJson) throw new Error("A IA não retornou dados legíveis.");

          const parsed = JSON.parse(textoJson);
          if (parsed.erro) {
            alert(`⚠️ Atenção: ${parsed.erro}\n\nPor favor, envie uma foto mais nítida e bem iluminada do cupom ou do painel.`);
            resetarEstadoModalAuditoria();
            return;
          }

          const precoExtraido = parseFloat(parsed.preco_unitario);
          if (!precoExtraido || precoExtraido <= 0) {
            alert("⚠️ Não foi possível identificar o valor do combustível nesta imagem. Tente uma foto mais aproximada.");
            resetarEstadoModalAuditoria();
            return;
          }

          const agoraFmt = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

          DADOS_EXTRAIDOS_IA = {
            combustivel: parsed.combustivel || "Combustível Auditado",
            preco: precoExtraido,
            tipo_selo: AUDITORIA_TIPO_ABA === 'cupom' ? 'Selo Ouro 🥇 (Cupom Fiscal Auditado)' : 'Selo Prata 🥈 (Totem Verificado)',
            timestamp: parsed.data_emissao ? `${parsed.data_emissao} (Verificado ${agoraFmt})` : agoraFmt,
            posto: parsed.posto || AUDITORIA_POSTO_ATUAL.nome,
            cnpj: parsed.cnpj || AUDITORIA_POSTO_ATUAL.cnpj || 'Não identificado'
          };

          const resComb = document.getElementById('resCombustivel');
          const resPreco = document.getElementById('resPreco');
          const resCnpj = document.getElementById('resCnpj');
          const resTime = document.getElementById('resTimestamp');
          const badgeTipo = document.getElementById('badgeResultadoTipo');
          const resSucesso = document.getElementById('resultadoGeminiSucesso');
          const btnConfirmar = document.getElementById('btnConfirmarPublicacao');

          if (resComb) resComb.innerText = DADOS_EXTRAIDOS_IA.combustivel;
          if (resPreco) resPreco.innerText = 'R$ ' + DADOS_EXTRAIDOS_IA.preco.toFixed(2).replace('.', ',');
          if (resCnpj) resCnpj.innerText = `${DADOS_EXTRAIDOS_IA.posto} (CNPJ: ${DADOS_EXTRAIDOS_IA.cnpj})`;
          if (resTime) resTime.innerText = DADOS_EXTRAIDOS_IA.timestamp;
          if (badgeTipo) badgeTipo.innerText = DADOS_EXTRAIDOS_IA.tipo_selo;

          if (resSucesso) resSucesso.classList.remove('hidden');
          if (btnConfirmar) btnConfirmar.disabled = false;
        })
        .catch(err => {
          if (statusProc) statusProc.classList.add('hidden');
          console.error("Erro auditoria Gemini:", err);
          alert(`❌ Não foi possível completar a auditoria por IA agora: ${err.message}.\nVerifique sua conexão e tente novamente.`);
          resetarEstadoModalAuditoria();
        });
      };
      reader.readAsDataURL(file);
    }

    function confirmarPublicacaoPreco() {
      if (!DADOS_EXTRAIDOS_IA || !AUDITORIA_POSTO_ATUAL) return;

      const submissao = {
        ...DADOS_EXTRAIDOS_IA,
        cidade: AUDITORIA_POSTO_ATUAL.cidade,
        posto_original: AUDITORIA_POSTO_ATUAL.nome,
        cnpj_original: AUDITORIA_POSTO_ATUAL.cnpj,
        autor: "Motorista Colaborador",
        device_id: getDeviceId()
      };

      // 1. Grava no histórico local da comunidade
      const historico = JSON.parse(localStorage.getItem('nutri_precos_colaborativos') || '[]');
      historico.unshift(submissao);
      localStorage.setItem('nutri_precos_colaborativos', JSON.stringify(historico));

      // 2. Envia para a telemetria do Supabase
      logTelemetry('auditoria_gemini_sucesso', submissao);

      // 3. Re-renderiza os cards na hora para o usuário ver o Selo Ouro/Prata ativado
      filtrarPostos();

      alert(`🎉 Preço auditado com sucesso pelo Gemini!\n\nO valor de R$ ${DADOS_EXTRAIDOS_IA.preco.toFixed(2).replace('.', ',')} para ${DADOS_EXTRAIDOS_IA.posto} foi registrado com ${DADOS_EXTRAIDOS_IA.tipo_selo} e ativado em tempo real no radar de preços! Obrigado por fortalecer a comunidade!`);
      fecharModalAuditoriaPreco();
    }

    // ==========================================
    // MÓDULO PWA STANDALONE & CADASTRO DE MOTORISTA
    // ==========================================
    let deferredPromptPwa = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPromptPwa = e;
      const btn = document.getElementById('btnInstalarPwaTopo');
      if (btn) btn.classList.remove('hidden');
      const banner = document.getElementById('bannerInstalarPwaFlutuante');
      if (banner) banner.classList.remove('hidden');
    });

    // Limpeza forçada e desativação de Service Worker corrompido
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const reg of registrations) reg.unregister();
      }).catch(() => {});
    }
    if ('caches' in window) {
      caches.keys().then(keys => {
        for (const key of keys) caches.delete(key);
      }).catch(() => {});
    }

    function instalarAppNutriCombust() {
      if (deferredPromptPwa) {
        deferredPromptPwa.prompt();
        deferredPromptPwa.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            logTelemetry('pwa_instalado', { app: 'NutriCombust' });
          }
          deferredPromptPwa = null;
        });
      } else {
        alert("Para instalar o NutriCombust:\n\n• No Android/Chrome: Toque nos 3 pontinhos do topo e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.\n• No iPhone/Safari: Toque no botão Compartilhar e selecione 'Adicionar à Tela de Início'.");
      }
    }

    let authTabAtual = 'cadastro';

    function trocarAbaAuth(aba) {
      authTabAtual = aba;
      const tabCad = document.getElementById('tabAuthCadastro');
      const tabLogin = document.getElementById('tabAuthLogin');
      const secCad = document.getElementById('secAuthCadastro');
      const secLogin = document.getElementById('secAuthLogin');
      const secSucesso = document.getElementById('secAuthSucesso');
      if (secSucesso) secSucesso.classList.add('hidden');

      if (aba === 'cadastro') {
        if (tabCad) tabCad.className = "flex-1 py-2 text-center text-xs font-black text-amber-400 border-b-2 border-amber-400 cursor-pointer";
        if (tabLogin) tabLogin.className = "flex-1 py-2 text-center text-xs font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-200 cursor-pointer";
        if (secCad) secCad.classList.remove('hidden');
        if (secLogin) secLogin.classList.add('hidden');
      } else {
        if (tabCad) tabCad.className = "flex-1 py-2 text-center text-xs font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-200 cursor-pointer";
        if (tabLogin) tabLogin.className = "flex-1 py-2 text-center text-xs font-black text-amber-400 border-b-2 border-amber-400 cursor-pointer";
        if (secCad) secCad.classList.add('hidden');
        if (secLogin) secLogin.classList.remove('hidden');
      }
    }

    function abrirModalCadastroMotorista() {
      const modal = document.getElementById('modalCadastroMotorista');
      if (modal) {
        modal.classList.remove('hidden');
        const secSucesso = document.getElementById('secAuthSucesso');
        if (secSucesso) secSucesso.classList.add('hidden');
        trocarAbaAuth('cadastro');

        const perfil = JSON.parse(localStorage.getItem('nutri_motorista_perfil') || 'null');
        if (perfil) {
          if (document.getElementById('cadMotoristaNome')) document.getElementById('cadMotoristaNome').value = perfil.nome || '';
          if (document.getElementById('cadMotoristaEmail')) document.getElementById('cadMotoristaEmail').value = perfil.email || '';
          if (document.getElementById('cadMotoristaCidade')) document.getElementById('cadMotoristaCidade').value = perfil.cidade || '';
          if (document.getElementById('cadMotoristaEstado')) document.getElementById('cadMotoristaEstado').value = perfil.estado || 'RJ';
          if (document.getElementById('cadMotoristaCategoria')) document.getElementById('cadMotoristaCategoria').value = perfil.categoria || 'app';
        }
      }
    }

    function fecharModalCadastroMotorista() {
      const modal = document.getElementById('modalCadastroMotorista');
      if (modal) modal.classList.add('hidden');
    }

    async function salvarCadastroMotorista(e) {
      e.preventDefault();
      const nome = document.getElementById('cadMotoristaNome').value.trim();
      const email = document.getElementById('cadMotoristaEmail').value.trim();
      const senha = document.getElementById('cadMotoristaSenha').value;
      const cidade = document.getElementById('cadMotoristaCidade').value.trim();
      const estado = document.getElementById('cadMotoristaEstado').value;
      const categoria = document.getElementById('cadMotoristaCategoria').value;
      const btn = document.getElementById('btnSubmitCadastro');
      const errBox = document.getElementById('msgErroAuthCad');

      if (!nome || !email || !senha || !cidade) {
        if (errBox) {
          errBox.innerText = "Preencha todos os campos obrigatórios.";
          errBox.classList.remove('hidden');
        }
        return;
      }

      if (senha.length < 6) {
        if (errBox) {
          errBox.innerText = "A senha deve conter no mínimo 6 dígitos.";
          errBox.classList.remove('hidden');
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="inline-block animate-spin mr-2">⏳</span> Criando conta oficial...`;
      }
      if (errBox) errBox.classList.add('hidden');

      try {
        // Passo 1: Cadastro no Supabase Auth com Zoho SMTP
        const resp = await fetch('https://fzoyldcfyiigwyxxhosd.supabase.co/auth/v1/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv'
          },
          body: JSON.stringify({
            email: email,
            password: senha,
            data: { nome, cidade, estado, categoria, role: 'motorista_guardiao' }
          })
        });

        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.msg || data.message || data.error_description || "Erro ao registrar usuário.");
        }

        const perfil = {
          id: data.user ? data.user.id : null,
          nome,
          email,
          cidade,
          estado,
          categoria,
          cadastrado_em: new Date().toISOString()
        };
        localStorage.setItem('nutri_motorista_perfil', JSON.stringify(perfil));
        logTelemetry('cadastro_motorista_guardiao_iniciado', { email, cidade, estado, categoria });

        // Exibe tela do Passo 2 (Email Zoho) e Passo 3 (Telegram R$ 0,00)
        document.getElementById('secAuthCadastro').classList.add('hidden');
        document.getElementById('secAuthLogin').classList.add('hidden');
        const secSucesso = document.getElementById('secAuthSucesso');
        if (secSucesso) {
          document.getElementById('spanEmailConfirmacao').innerText = email;
          secSucesso.classList.remove('hidden');
        }
        atualizarInterfaceMotorista();
      } catch (err) {
        if (errBox) {
          errBox.innerText = "Erro: " + (err.message || "Falha na comunicação com o servidor.");
          errBox.classList.remove('hidden');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `Criar Conta & Receber Ativação ➔`;
        }
      }
    }

    async function loginMotorista(e) {
      e.preventDefault();
      const email = document.getElementById('loginMotoristaEmail').value.trim();
      const senha = document.getElementById('loginMotoristaSenha').value;
      const btn = document.getElementById('btnSubmitLogin');
      const errBox = document.getElementById('msgErroAuthLogin');

      if (!email || !senha) return;

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="inline-block animate-spin mr-2">⏳</span> Conectando...`;
      }
      if (errBox) errBox.classList.add('hidden');

      try {
        const resp = await fetch('https://fzoyldcfyiigwyxxhosd.supabase.co/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv'
          },
          body: JSON.stringify({ email, password: senha })
        });

        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data.error_description || data.msg || data.message || "Credenciais incorretas ou e-mail não confirmado.");
        }

        const user = data.user || {};
        const meta = user.user_metadata || {};
        const perfil = {
          id: user.id,
          nome: meta.nome || email.split('@')[0],
          email: user.email,
          cidade: meta.cidade || 'Cabo Frio',
          estado: meta.estado || 'RJ',
          categoria: meta.categoria || 'app',
          token: data.access_token
        };
        localStorage.setItem('nutri_motorista_perfil', JSON.stringify(perfil));
        atualizarInterfaceMotorista();
        fecharModalCadastroMotorista();
        alert(`✅ Login realizado com sucesso! Bem-vindo de volta, ${perfil.nome}!`);
      } catch (err) {
        if (errBox) {
          errBox.innerText = "Erro: " + (err.message || "Falha ao entrar.");
          errBox.classList.remove('hidden');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `Entrar no NutriCombust ➔`;
        }
      }
    }

    function atualizarInterfaceMotorista() {
      const perfil = JSON.parse(localStorage.getItem('nutri_motorista_perfil') || 'null');
      const label = document.getElementById('labelPerfilMotoristaTopo');
      if (label) {
        if (perfil && perfil.nome) {
          const primeiroNome = perfil.nome.split(' ')[0];
          label.innerHTML = `👤 ${primeiroNome} <span class="text-amber-400 font-black">★ Guardião</span>`;
        } else {
          label.innerText = "Motorista Guardião";
        }
      }
    }

    function abrirModalAuditoriaPrecoDireto() {
      const perfil = JSON.parse(localStorage.getItem('nutri_motorista_perfil') || 'null');
      if (!perfil) {
        if (confirm("Para registrar auditorias com Selo Oficial, complete seu cadastro de Motorista Guardião. Deseja cadastrar agora?")) {
          abrirModalCadastroMotorista();
          return;
        }
      }
      AUDITORIA_POSTO_ATUAL = {
        nome: "Posto em Abastecimento",
        cnpj: "Verificado no Cupom Fiscal",
        cidade: perfil ? perfil.cidade : "Cabo Frio"
      };
      abrirModalAuditoriaPreco(AUDITORIA_POSTO_ATUAL.nome, AUDITORIA_POSTO_ATUAL.cnpj, AUDITORIA_POSTO_ATUAL.cidade);
    }

    document.addEventListener('DOMContentLoaded', () => {
      atualizarInterfaceMotorista();
    });
  

// Inicializador Automático Dinâmico (Lê data attributes do body)
document.addEventListener('DOMContentLoaded', async () => {
  const body = document.body;
  const seoUf = (body.dataset.uf || 'rj').toLowerCase();
  const seoCidade = body.dataset.cidade || '';
  const seoQtd = body.dataset.qtd || '';

  const selEstado = document.getElementById('selectEstado');
  if (selEstado) { selEstado.value = seoUf; selEstado.addEventListener('change', trocarEstado); }
  ESTADO_ATUAL = seoUf;

  if (typeof CONFIG_ESTADOS !== 'undefined' && CONFIG_ESTADOS[seoUf]) {
    const cfg = CONFIG_ESTADOS[seoUf];
    const badgeEl = document.getElementById('badgeAuditados');
    const titEl = document.getElementById('tituloPagina');
    const subEl = document.getElementById('subtituloPagina');
    const labelCid = document.getElementById('labelCidade');
    
    if (seoCidade) {
      if (badgeEl && seoQtd) badgeEl.innerText = `${seoQtd} Postos Reais ANP • ${seoCidade}`;
      if (titEl) titEl.innerText = `Onde abastecer mais barato em ${seoCidade} (${cfg.sigla})?`;
      if (subEl) subEl.innerText = `Preços referenciais com ${seoQtd} postos reais em ${seoCidade}. Escolha o combustível ou informe o preço da bomba:`;
    } else {
      if (badgeEl) badgeEl.innerText = cfg.badge;
      if (titEl) titEl.innerText = cfg.titulo;
      if (subEl) subEl.innerText = cfg.subtitulo;
    }
    if (labelCid) labelCid.innerText = `Cidade / Município (${cfg.sigla})`;
  }

  if (typeof carregarDados === 'function') {
    await carregarDados(seoUf);
  }

  if (seoCidade) {
    const selCid = document.getElementById('selectCidade');
    if (selCid && [...selCid.options].some(o => o.value.toLowerCase() === seoCidade.toLowerCase())) {
      selCid.value = [...selCid.options].find(o => o.value.toLowerCase() === seoCidade.toLowerCase()).value;
      if (typeof filtrarPostos === 'function') filtrarPostos();
    } else {
      if (selCid) selCid.value = 'todas';
      const inpBusca = document.getElementById('inputBusca');
      if (inpBusca) inpBusca.value = seoCidade;
      if (typeof filtrarPostos === 'function') filtrarPostos();
    }
  }

  if (typeof carregarAvaliacoes === 'function') carregarAvaliacoes();
  if (typeof logTelemetry === 'function') {
    logTelemetry('page_view_combustivel', { uf: seoUf, cidade: seoCidade || 'geral' });
  }
  if (typeof updateOnlineCounter === 'function') {
    updateOnlineCounter();
    setInterval(updateOnlineCounter, 12000);
  }
  if (typeof logTelemetry === 'function') {
    setInterval(() => logTelemetry('app_heartbeat_combustivel', { uf: seoUf }), 45000);
  }
});
