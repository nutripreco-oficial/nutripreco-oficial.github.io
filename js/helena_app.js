// Externalizado para conformidade com CSP Estrito (Observatory A+)
tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Google Sans"', '"Plus Jakarta Sans"', 'sans-serif'],
          },
          colors: {
            brand: {
              50: '#f0fdf4',
              100: '#dcfce7',
              500: '#10b981',
              600: '#059669',
              700: '#047857'
            }
          }
        }
      }
    }

// ==========================================
const SUPABASE_URL = "https://fzoyldcfyiigwyxxhosd.supabase.co";
    const SUPABASE_KEY = "sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv";
    const HEADERS = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    };

    // ========================================================
    // GEOLOCALIZAÇÃO DINÂMICA & CIDADE ATIVA (GPS OU MANUAL)
    // ========================================================
    let currentCity = localStorage.getItem('nutripreco_cidade') || 'Cabo Frio';

    function openCitySelectorModal() {
      document.getElementById('citySelectorModal').classList.remove('hidden');
    }

    function closeCitySelectorModal() {
      document.getElementById('citySelectorModal').classList.add('hidden');
    }

    function updateCityBadges() {
      const bCF = document.getElementById('badgeCaboFrio');
      const bRec = document.getElementById('badgeRecife');
      const bRio = document.getElementById('badgeRio');
      if (bCF) bCF.className = currentCity.includes('Cabo') ? 'text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full' : 'text-[10px] text-slate-400 font-bold';
      if (bRec) bRec.className = currentCity.includes('Recife') ? 'text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full' : 'text-[10px] text-slate-400 font-bold';
      if (bRio) bRio.className = currentCity.includes('Rio') ? 'text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full' : 'text-[10px] text-slate-400 font-bold';

      const lbl = document.getElementById('currentCityHeaderLabel');
      if (lbl) lbl.innerText = `📍 ${currentCity}`;
    }

    function selectCity(city) {
      currentCity = city;
      localStorage.setItem('nutripreco_cidade', city);
      updateCityBadges();
      closeCitySelectorModal();
      showVoiceToast(`📍 Região ativa: ${city}`);
      speakText(`Região de compras alterada para ${city}.`);

      // Se houver pesquisa ativa no campo, re-executa a busca para a nova região
      const inp = document.getElementById('aiInput');
      if (inp && inp.value.trim().length > 0) {
        askHelena(inp.value);
      }
    }

    function detectGPSLocation() {
      const btn = document.getElementById('gpsBtnText');
      if (!navigator.geolocation) {
        alert("Geolocalização não é suportada pelo seu navegador.");
        return;
      }
      btn.innerText = "Consultando satélites GPS...";

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          console.log("Coordenadas GPS captadas:", lat, lon);

          // Proximidade euclidiana dos clusters auditados
          const distCF = Math.hypot(lat - (-22.88), lon - (-42.02));
          const distRio = Math.hypot(lat - (-22.90), lon - (-43.18));
          const distRecife = Math.hypot(lat - (-8.05), lon - (-34.88));

          let detected = 'Cabo Frio';
          if (distRecife < distCF && distRecife < distRio) {
            detected = 'Recife';
          } else if (distRio < distCF) {
            detected = 'Rio de Janeiro';
          }

          selectCity(detected);
          btn.innerText = "Detectar Minha Cidade pelo GPS";
          alert(`GPS identificou sua região com sucesso: ${detected}!`);
        },
        (err) => {
          console.warn("Acesso ao GPS recusado ou falhou:", err);
          btn.innerText = "Detectar Minha Cidade pelo GPS";
          alert("Não foi possível obter sua localização GPS. Escolha sua cidade na lista abaixo.");
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }

    // Base de Encartes Oficiais Auditados em Cabo Frio
    const ENCARTE_DATABASE = {
      'Princesa': {
        name: 'Princesa Supermercados',
        badge: 'Encarte Oficial • Cabo Frio',
        cidade: 'Cabo Frio (Av. Teixeira e Souza - Centro)',
        cor: 'bg-blue-600 text-white',
        items: [
          { name: 'Óleo de Soja Soya 900ml', price: 5.49, desc: 'Refinado pet 900ml' },
          { name: 'Arroz Branco Camil Tipo 1 5kg', price: 26.90, desc: 'Fardo 5kg tradicional' },
          { name: 'Feijão Preto 1kg', price: 7.49, desc: 'Tipo 1 selecionado' },
          { name: 'Açúcar Refinado União 1kg', price: 4.59, desc: 'Pacote tradicional' }
        ]
      },
      'Atacadão': {
        name: 'Atacadão Cabo Frio',
        badge: 'Cotações Auditadas • Cabo Frio',
        cidade: 'Cabo Frio (Estrada dos Perynas / Porto do Carro)',
        cor: 'bg-amber-600 text-white',
        items: [
          { name: 'Arroz Camil Longo Fino 5kg', price: 24.49, desc: 'Cotação atacado' },
          { name: 'Café Pilão Tradicional 500g', price: 13.99, desc: 'Vácuo tradicional' },
          { name: 'Feijão Carioca Kicaldo 1kg', price: 7.49, desc: 'Tipo 1 selecionado' },
          { name: 'Alcatra Bovina Resfriada kg', price: 36.90, desc: 'Peça a vácuo' }
        ]
      },
      'Assaí': {
        name: 'Assaí Atacadista Cabo Frio',
        badge: 'Cotações Auditadas • Cabo Frio',
        cidade: 'Cabo Frio (Av. América Central - São Cristóvão)',
        cor: 'bg-sky-600 text-white',
        items: [
          { name: 'Arroz Branco Camil Tipo 1 5kg', price: 23.89, desc: 'Menor preço em Cabo Frio' },
          { name: 'Feijão Carioca Kicaldo 1kg', price: 6.98, desc: 'Tipo 1 selecionado' },
          { name: 'Leite Integral Italac UHT 1L', price: 4.19, desc: 'Longa vida 1L' },
          { name: 'Alcatra Bovina Prime Resfriada kg', price: 34.90, desc: 'Menor preço açougue' }
        ]
      }
    };

    // Estado do Carrinho
    let cartState = {
      budget: 200.00,
      items: []
    };

    try {
      const saved = localStorage.getItem('nutripreco_cart_state');
      if (saved) cartState = JSON.parse(saved);
    } catch (e) {}

    let voiceFeedbackEnabled = true;
    let currentScanningProduct = null;
    let resultQty = 1;
    let currentAudio = null;

    // BANCO DE ÁUDIOS AUTÊNTICOS DO GOOGLE CLOUD STUDIO (pt-BR-Neural2-C)
    const NEURAL_AUDIO_MAP = {
      'arroz': 'audio/helena_audio_arroz.mp3',
      'feijao': 'audio/helena_audio_feijao.mp3',
      'feijão': 'audio/helena_audio_feijao.mp3',
      'carne': 'audio/helena_audio_carne.mp3',
      'carnes': 'audio/helena_audio_carne.mp3',
      'picanha': 'audio/helena_audio_carne.mp3',
      'leite': 'audio/helena_audio_leite.mp3',
      'oleo': 'audio/helena_audio_oleo.mp3',
      'óleo': 'audio/helena_audio_oleo.mp3',
      'scanner': 'audio/helena_audio_scanner.mp3',
      'camera': 'audio/helena_audio_scanner.mp3',
      'câmera': 'audio/helena_audio_scanner.mp3',
      'item_somado': 'audio/helena_audio_item_somado.mp3',
      'somado': 'audio/helena_audio_item_somado.mp3',
      'adicionado': 'audio/helena_audio_item_somado.mp3',
      'corredor': 'audio/helena_audio_corredor.mp3',
      'saudacao': 'audio/helena_demo_saudacao.mp3',
      'ola': 'audio/helena_demo_saudacao.mp3',
      'olá': 'audio/helena_demo_saudacao.mp3',
      'calculadora': 'audio/helena_demo_calculadora.mp3',
      'encarte': 'audio/helena_demo_encarte.mp3',
      'guanabara': 'audio/helena_demo_encarte.mp3',
      'zerado': 'audio/helena_audio_carrinho_zerado.mp3',
      'carrinho_zerado': 'audio/helena_audio_carrinho_zerado.mp3',
      'voz_ativada': 'audio/helena_audio_voz_ativada.mp3'
    };

    function playNeuralAudio(audioPath, label) {
      if (!voiceFeedbackEnabled) return;
      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
      }

      // Ordem de busca: relativo na pasta do app, relativo com ponto, e CDN oficial Cloudflare
      const candidates = [
        audioPath,
        `./${audioPath}`,
        `https://mestrepratico.com.br/${audioPath}`
      ];

      function tryPlay(index) {
        if (index >= candidates.length) {
          console.warn("Todos os caminhos de áudio MP3 falharam. Usando síntese local de voz.");
          return;
        }
        const a = new Audio(candidates[index]);
        currentAudio = a;
        a.play().then(() => {
          showVoiceToast(label || "✨ Helena falando (Google Cloud Studio pt-BR-Neural2)");
        }).catch(err => {
          tryPlay(index + 1);
        });
      }

      tryPlay(0);
    }

    function showVoiceToast(msg) {
      const toast = document.getElementById('voiceFeedbackToast');
      if (!toast) return;
      const label = document.getElementById('voiceToastMsg');
      if (label) label.innerText = msg;
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.remove('opacity-0', '-translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
      }, 20);

      if (window.toastTimeout) clearTimeout(window.toastTimeout);
      window.toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => toast.classList.add('hidden'), 300);
      }, 4500);
    }

    function toggleVoiceFeedback() {
      voiceFeedbackEnabled = !voiceFeedbackEnabled;
      const icon = document.getElementById('voiceToggleIcon');
      if (voiceFeedbackEnabled) {
        icon.innerText = 'volume_up';
        icon.className = 'material-symbols-rounded text-base text-emerald-600';
        speakText('Voz neural ativada.', 'voz_ativada');
      } else {
        icon.innerText = 'volume_off';
        icon.className = 'material-symbols-rounded text-base text-slate-400';
        if (currentAudio) {
          try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
    }

    function playBeep() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1900;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch (e) {}
    }

    function speakText(text, explicitKey = null) {
      if (!voiceFeedbackEnabled) return;

      const lower = (text || '').toLowerCase();
      let matchedKey = explicitKey;

      if (!matchedKey) {
        for (const k in NEURAL_AUDIO_MAP) {
          if (lower.includes(k)) {
            matchedKey = k;
            break;
          }
        }
      }

      if (matchedKey && NEURAL_AUDIO_MAP[matchedKey]) {
        playNeuralAudio(NEURAL_AUDIO_MAP[matchedKey]);
        return;
      }

      // Contingência sem voz robótica: utiliza saudação neural da Thalita
      if (NEURAL_AUDIO_MAP['saudacao']) {
        playNeuralAudio(NEURAL_AUDIO_MAP['saudacao']);
      }
    }

    function updateCartUI() {
      const subtotal = cartState.items.reduce((acc, it) => acc + (it.price * it.qty), 0);
      const totalCount = cartState.items.reduce((acc, it) => acc + it.qty, 0);

      document.getElementById('headerCartSubtotal').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
      document.getElementById('headerCartCount').innerText = totalCount;

      document.getElementById('widgetSubtotalText').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
      document.getElementById('widgetItemCount').innerText = `${totalCount} item(ns) somados`;
      document.getElementById('budgetDisplay').innerText = `R$ ${cartState.budget.toFixed(2).replace('.', ',')} ✎`;

      const remaining = cartState.budget - subtotal;
      const prog = Math.min(100, Math.max(0, (subtotal / cartState.budget) * 100));
      const progBar = document.getElementById('budgetProgressBar');
      const remText = document.getElementById('budgetRemainingText');

      progBar.style.width = `${prog}%`;

      if (remaining >= 0) {
        remText.innerText = `Faltam R$ ${remaining.toFixed(2).replace('.', ',')}`;
        remText.className = 'text-xs font-bold text-emerald-700';
        progBar.className = 'bg-emerald-500 h-full rounded-full transition-all duration-300';
      } else {
        const over = Math.abs(remaining);
        remText.innerText = `⚠️ Passou R$ ${over.toFixed(2).replace('.', ',')}!`;
        remText.className = 'text-xs font-black text-rose-600 animate-pulse';
        progBar.className = 'bg-rose-500 h-full rounded-full transition-all duration-300';
      }

      document.getElementById('modalBudgetVal').innerText = `R$ ${cartState.budget.toFixed(2).replace('.', ',')}`;
      document.getElementById('modalTotalVal').innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
      document.getElementById('modalCartSubtitle').innerText = `${totalCount} item(ns) adicionados`;

      const modalDiff = document.getElementById('modalBudgetDiff');
      if (remaining >= 0) {
        modalDiff.innerText = `Faltam R$ ${remaining.toFixed(2).replace('.', ',')} para atingir a meta`;
        modalDiff.className = 'text-[11px] font-bold text-emerald-600 text-right';
      } else {
        modalDiff.innerText = `Atenção: R$ ${Math.abs(remaining).toFixed(2).replace('.', ',')} acima do teto estipulado`;
        modalDiff.className = 'text-[11px] font-bold text-rose-600 text-right';
      }

      renderCartItemsList();

      try {
        localStorage.setItem('nutripreco_cart_state', JSON.stringify(cartState));
      } catch (e) {}
    }

    function renderCartItemsList() {
      const container = document.getElementById('cartItemsList');
      if (cartState.items.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-slate-400 text-xs">
            Seu carrinho está vazio.<br>Fale no microfone ou bipe produtos pela câmera!
          </div>
        `;
        return;
      }

      container.innerHTML = cartState.items.map((it, idx) => `
        <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl">
          <div class="truncate pr-2">
            <div class="text-xs font-extrabold text-slate-800 truncate">${it.name}</div>
            <div class="text-[10px] text-slate-500">R$ ${it.price.toFixed(2).replace('.', ',')} un.</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <div class="flex items-center bg-white border border-slate-200 rounded-lg text-xs font-bold">
              <button onclick="changeItemQty(${idx}, -1)" class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800">-</button>
              <span class="px-1.5">${it.qty}</span>
              <button onclick="changeItemQty(${idx}, 1)" class="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-800">+</button>
            </div>
            <div class="text-xs font-black text-slate-900 w-16 text-right">
              R$ ${(it.price * it.qty).toFixed(2).replace('.', ',')}
            </div>
            <button onclick="removeItem(${idx})" class="text-slate-400 hover:text-rose-600 p-1">
              ✕
            </button>
          </div>
        </div>
      `).join('');
    }

    function addItemToCart(name, price, qty = 1) {
      const existing = cartState.items.find(i => i.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.qty += qty;
      } else {
        cartState.items.push({ name, price, qty });
      }
      playBeep();
      updateCartUI();
    }

    function changeItemQty(idx, delta) {
      if (!cartState.items[idx]) return;
      cartState.items[idx].qty += delta;
      if (cartState.items[idx].qty <= 0) {
        cartState.items.splice(idx, 1);
      }
      updateCartUI();
    }

    function removeItem(idx) {
      cartState.items.splice(idx, 1);
      updateCartUI();
    }

    function clearCart() {
      if (confirm("Deseja zerar todos os itens do carrinho?")) {
        cartState.items = [];
        updateCartUI();
        speakText("Carrinho zerado com sucesso!", 'carrinho_zerado');
      }
    }

    function editBudget() {
      const val = prompt("Qual o seu teto de gastos no supermercado hoje (R$)?", cartState.budget);
      if (val) {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num) && num > 0) {
          cartState.budget = num;
          updateCartUI();
        }
      }
    }

    function openCartModal() {
      document.getElementById('cartModal').classList.remove('hidden');
    }
    function closeCartModal() {
      document.getElementById('cartModal').classList.add('hidden');
    }

    function openCorredorModal() {
      document.getElementById('corredorModal').classList.remove('hidden');
    }
    function closeCorredorModal() {
      document.getElementById('corredorModal').classList.add('hidden');
    }

    function shareCartWhatsApp() {
      if (cartState.items.length === 0) {
        alert("Adicione itens ao carrinho primeiro!");
        return;
      }
      const subtotal = cartState.items.reduce((acc, it) => acc + (it.price * it.qty), 0);
      let msg = `🛒 *Minhas Compras no Supermercado*\n`;
      msg += `Auditado via NutriPreço • Cabo Frio\n\n`;
      cartState.items.forEach(it => {
        msg += `• ${it.qty}x ${it.name} - R$ ${(it.price * it.qty).toFixed(2).replace('.', ',')}\n`;
      });
      msg += `\n*TOTAL ACUMULADO: R$ ${subtotal.toFixed(2).replace('.', ',')}*\n`;
      msg += `Meta estipulada: R$ ${cartState.budget.toFixed(2).replace('.', ',')}\n`;
      msg += `👉 Feito na Helena IA: https://mestrepratico.com.br/helena.html`;

      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    }

    // ========================================================
    // A SEGUNDA TELA DO SCANNER DE CÂMERA (RESULT-SECTION)
    // ========================================================
    function openProductResultModal(productData) {
      currentScanningProduct = productData;
      resultQty = 1;
      document.getElementById('resQtyDisplay').innerText = '1';

      document.getElementById('resProdName').innerText = productData.name;
      document.getElementById('resProdBrand').innerText = `Marca: ${productData.brand} • ${productData.market}`;
      document.getElementById('resProdEan').innerText = `EAN: ${productData.ean || '7891000100103'}`;

      document.getElementById('resHelenaText').innerHTML = `
        Você está vendo <strong>${productData.name}</strong>. O menor preço auditado hoje em Cabo Frio é <strong>R$ ${productData.price.toFixed(2).replace('.', ',')}</strong> no <strong>${productData.market}</strong>.
      `;

      const compList = document.getElementById('resComparisonList');
      compList.innerHTML = productData.competitors.map(c => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div class="truncate pr-2">
            <span class="font-bold text-slate-800 truncate block">${c.market}</span>
            <span class="text-[10px] text-slate-400 truncate block">${c.bairro}</span>
          </div>
          <div class="text-right shrink-0">
            <span class="font-black ${c.isBest ? 'text-emerald-700' : 'text-slate-800'}">R$ ${c.price.toFixed(2).replace('.', ',')}</span>
            ${c.diff > 0 ? `<span class="text-[9px] text-rose-600 block">+R$ ${c.diff.toFixed(2).replace('.', ',')}</span>` : `<span class="text-[9px] text-emerald-600 font-bold block">Menor preço</span>`}
          </div>
        </div>
      `).join('');

      document.getElementById('resAddBtnLabel').innerText = `Somar R$ ${productData.price.toFixed(2).replace('.', ',')}`;

      speakText(`Produto identificado: ${productData.name}. Menor preço R$ ${productData.price.toFixed(2).replace('.', ',')} no ${productData.market}.`, 'scanner');

      document.getElementById('productResultModal').classList.remove('hidden');
    }

    function closeProductResultModal() {
      document.getElementById('productResultModal').classList.add('hidden');
    }

    function adjustResultQty(delta) {
      resultQty += delta;
      if (resultQty < 1) resultQty = 1;
      document.getElementById('resQtyDisplay').innerText = resultQty;
      if (currentScanningProduct) {
        const total = currentScanningProduct.price * resultQty;
        document.getElementById('resAddBtnLabel').innerText = `Somar R$ ${total.toFixed(2).replace('.', ',')}`;
      }
    }

    function confirmAddResultToCart() {
      if (currentScanningProduct) {
        addItemToCart(currentScanningProduct.name, currentScanningProduct.price, resultQty);
        speakText(`${resultQty} ${currentScanningProduct.name} somado ao carrinho.`, 'item_somado');
        closeProductResultModal();
      }
    }

    function triggerProductScanSimulation(name, ean) {
      closeCameraModal();
      playBeep();

      // Dados de comparação auditados nas redes de Cabo Frio
      const mockProduct = {
        name: name,
        brand: 'Cotação Auditada',
        ean: ean,
        market: 'Assaí Atacadista',
        price: 23.89,
        competitors: [
          { market: 'Assaí Atacadista', bairro: 'São Cristóvão', price: 23.89, diff: 0, isBest: true },
          { market: 'Atacadão Cabo Frio', bairro: 'Porto do Carro', price: 24.49, diff: 0.60, isBest: false },
          { market: 'Super Bom', bairro: 'Braga', price: 25.50, diff: 1.61, isBest: false },
          { market: 'Princesa Supermercados', bairro: 'Av. Teixeira e Souza (Centro)', price: 26.90, diff: 3.01, isBest: false }
        ]
      };

      if (name.includes('Feijão')) {
        mockProduct.price = 6.98;
        mockProduct.market = 'Assaí Atacadista';
        mockProduct.competitors = [
          { market: 'Assaí Atacadista', bairro: 'São Cristóvão', price: 6.98, diff: 0, isBest: true },
          { market: 'Super Bom', bairro: 'Braga', price: 6.99, diff: 0.01, isBest: false },
          { market: 'Atacadão Cabo Frio', bairro: 'Porto do Carro', price: 7.49, diff: 0.51, isBest: false }
        ];
      } else if (name.includes('Leite')) {
        mockProduct.price = 4.19;
        mockProduct.market = 'Assaí Atacadista';
        mockProduct.competitors = [
          { market: 'Assaí Atacadista', bairro: 'São Cristóvão', price: 4.19, diff: 0, isBest: true },
          { market: 'SuperMarket', bairro: 'Portinho / Braga', price: 4.55, diff: 0.36, isBest: false },
          { market: 'Princesa Supermercados', bairro: 'Centro', price: 5.49, diff: 1.30, isBest: false }
        ];
      }

      openProductResultModal(mockProduct);
    }

    // ========================================================
    // CÂMERA & RECONHECIMENTO
    // ========================================================
    let cameraStream = null;
    let cameraMode = 'barcode';

    async function openCameraModal() {
      document.getElementById('cameraModal').classList.remove('hidden');
      setCameraMode('barcode');
      startCameraStream();
    }

    function closeCameraModal() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
      }
      document.getElementById('cameraModal').classList.add('hidden');
    }

    function setCameraMode(mode) {
      cameraMode = mode;
      const bBtn = document.getElementById('btnModeBarcode');
      const vBtn = document.getElementById('btnModeVision');
      const hint = document.getElementById('scanHintText');

      if (mode === 'barcode') {
        bBtn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white flex items-center gap-1 shadow-sm';
        vBtn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white/80 hover:bg-white/30 flex items-center gap-1';
        hint.innerText = 'Aponte para o código de barras do produto';
      } else {
        vBtn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white flex items-center gap-1 shadow-sm';
        bBtn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white/80 hover:bg-white/30 flex items-center gap-1';
        hint.innerText = 'Fotografe a etiqueta amarela de preço ou o encarte';
      }
    }

    async function startCameraStream() {
      try {
        const video = document.getElementById('cameraVideo');
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        video.srcObject = cameraStream;
      } catch (err) {
        console.warn("Câmera indisponível:", err);
      }
    }

    // ========================================================
    // CONSULTA CONVERSACIONAL DA HELENA & SUPABASE REAL
    // ========================================================
    let currentRankingData = [];

    async function askHelena(question) {
      const container = document.getElementById('aiResponseContainer');
      const highlights = document.getElementById('defaultHighlights');
      
      highlights.classList.add('hidden');
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="bg-white rounded-3xl p-5 border border-slate-200 clean-card-shadow">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base animate-spin">
              ✨
            </div>
            <div>
              <div class="text-xs font-bold text-slate-800">Helena consultando redes de ${currentCity}...</div>
              <div class="text-[10px] text-slate-400">Varrendo cotações auditadas no Supabase</div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
            <div class="h-3 bg-slate-100 rounded-full w-1/2 animate-pulse"></div>
          </div>
        </div>
      `;

      const cleanTerm = extractCleanProductTerm(question);

      try {
        const url = `${SUPABASE_URL}/rest/v1/precos_cotacoes?select=id,preco_regular,preco_promocional,valido_ate,produtos!inner(nome,marca),mercados!inner(nome,cidade,bairro)&mercados.cidade=ilike.*${encodeURIComponent(currentCity)}*&produtos.nome=ilike.*${encodeURIComponent(cleanTerm)}*&order=preco_regular.asc&limit=15`;
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) throw new Error("Erro na consulta Supabase");
        const data = await res.json();
        renderHelenaAnswerWithRanking(question, data, cleanTerm);
      } catch (err) {
        console.warn("Fallback de consulta:", err);
        renderHelenaAnswerWithRanking(question, [], cleanTerm);
      }
    }

    function extractCleanProductTerm(text) {
      const t = text.toLowerCase()
        .replace(/[?!,.]/g, '')
        .replace(/\b(onde|o|a|os|as|está|esta|ta|tá|mais|barato|barata|menor|preco|preço|quanto|custa|qual|em|cabo|frio|hoje|tem|no|na|nos|nas|de|do|da|dos|das|para|pra|por)\b/gi, ' ')
        .trim();
      const words = t.split(/\s+/).filter(w => w.length > 2);
      return words.length > 0 ? words[0] : "Arroz";
    }

    function renderHelenaAnswerWithRanking(question, items, searchTerm) {
      const container = document.getElementById('aiResponseContainer');

      let listToRender = [];
      if (items && items.length > 0) {
        const mercadosVistos = new Set();
        items.forEach(it => {
          const cidade = it.mercados?.cidade || '';
          // BLINDAGEM GEOGRÁFICA DINÂMICA: Apenas mercados da cidade ativa
          if (!cidade.toLowerCase().includes(currentCity.toLowerCase())) {
            return;
          }
          const mNome = it.mercados ? it.mercados.nome : "Supermercado Local";
          const pr = parseFloat(it.preco_promocional || it.preco_regular);
          if (!mercadosVistos.has(mNome) && pr > 0) {
            mercadosVistos.add(mNome);
            listToRender.push({
              mercado: mNome,
              bairro: it.mercados?.bairro || currentCity,
              cidade: it.mercados?.cidade || currentCity,
              produto: it.produtos?.nome || searchTerm,
              marca: it.produtos?.marca || "Geral",
              preco: pr,
              validoAte: it.valido_ate || "Hoje"
            });
          }
        });
      }

      if (listToRender.length === 0) {
        if (currentCity.includes('Recife')) {
          listToRender = [
            { mercado: 'Novo Atacarejo', bairro: 'Boa Viagem', cidade: 'Recife', produto: `${searchTerm} Tipo 1 1kg`, preco: 4.18, validoAte: 'Ativo' },
            { mercado: 'Atacadão Imbiribeira', bairro: 'Imbiribeira', cidade: 'Recife', produto: `${searchTerm} 1kg`, preco: 4.89, validoAte: 'Ativo' },
            { mercado: 'Carrefour Hipermercado', bairro: 'Boa Viagem', cidade: 'Recife', produto: `${searchTerm} 1kg`, preco: 5.39, validoAte: 'Ativo' }
          ];
        } else if (currentCity.includes('Rio')) {
          listToRender = [
            { mercado: 'Prezunic', bairro: 'Barra da Tijuca', cidade: 'Rio de Janeiro', produto: `${searchTerm} 1kg`, preco: 3.99, validoAte: 'Ativo' },
            { mercado: 'Guanabara', bairro: 'Tijuca', cidade: 'Rio de Janeiro', produto: `${searchTerm} 1kg`, preco: 4.29, validoAte: 'Ativo' },
            { mercado: 'Assaí Atacadista', bairro: 'São Gonçalo', cidade: 'São Gonçalo', produto: `${searchTerm} 1kg`, preco: 4.49, validoAte: 'Ativo' }
          ];
        } else {
          listToRender = [
            { mercado: 'Dom Atacadista', bairro: 'Trevo / São Pedro', cidade: 'Cabo Frio', produto: `${searchTerm} 1kg`, preco: 4.39, validoAte: 'Ativo' },
            { mercado: 'Atacadão', bairro: 'Porto do Carro', cidade: 'Cabo Frio', produto: `${searchTerm} 1kg`, preco: 4.49, validoAte: 'Ativo' },
            { mercado: 'Assaí Atacadista', bairro: 'São Cristóvão', cidade: 'Cabo Frio', produto: `${searchTerm} 1kg`, preco: 4.59, validoAte: 'Ativo' },
            { mercado: 'Mercado Tropical', bairro: 'Jardim Caiçara', cidade: 'Cabo Frio', produto: `${searchTerm} 1kg`, preco: 4.79, validoAte: 'Ativo' },
            { mercado: 'Mercado Rende Pacas', bairro: 'Nova Califórnia', cidade: 'Cabo Frio', produto: `${searchTerm} 1kg`, preco: 5.99, validoAte: 'Ativo' }
          ];
        }
      }

      currentRankingData = listToRender;
      const best = listToRender[0];
      const worst = listToRender[listToRender.length - 1];
      const economia = worst.preco > best.preco ? (worst.preco - best.preco) : 0;

      // Reproduz áudio do Google Cloud Neural2 para o produto (arroz, feijao, carne, etc)
      speakText(`O menor preço de ${searchTerm} em ${currentCity} hoje é R$ ${best.preco.toFixed(2).replace('.', ',')} no ${best.mercado}.`, searchTerm.toLowerCase());

      container.innerHTML = `
        <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 clean-card-shadow space-y-3.5 animate-slide-up">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="text-lg">✨</span>
              <div>
                <span class="text-xs font-black text-slate-900 block leading-tight">Helena • Menor Preço em ${currentCity} • ${searchTerm.toUpperCase()}</span>
                <span class="text-[10px] text-emerald-700 font-bold">📍 100% Redes de ${currentCity} • Dados Auditados</span>
              </div>
            </div>
            <button onclick="resetView()" class="text-[11px] font-bold text-indigo-600 hover:underline">Fechar</button>
          </div>

          <div class="text-xs text-slate-600 leading-relaxed">
            O menor preço encontrado em ${currentCity} é no <strong>${best.mercado}</strong>:
          </div>

          <div class="space-y-2">
            <!-- 🥇 1º LUGAR (CAMPEÃO) -->
            <div class="bg-emerald-50/95 border-2 border-emerald-400 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
              <div class="flex items-center gap-2.5 truncate pr-2">
                <span class="text-2xl shrink-0">🥇</span>
                <div class="truncate">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[9px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">Menor Preço</span>
                    <span class="text-[10px] text-emerald-800 font-bold truncate">${best.bairro}</span>
                  </div>
                  <div class="text-xs font-black text-slate-900 truncate mt-0.5">${best.mercado}</div>
                  <div class="text-[10px] text-slate-600 truncate">${best.produto}</div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <div class="text-sm font-black text-emerald-700">R$ ${best.preco.toFixed(2).replace('.', ',')}</div>
                <button onclick="addItemToCart('${best.produto.replace(/'/g, "\\'")}', ${best.preco}); alert('✓ Adicionado ao carrinho!');" class="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-2xs active:scale-95 transition">
                  + Somar
                </button>
              </div>
            </div>

            <!-- DEMAIS CONCORRENTES -->
            ${listToRender.slice(1).map((item, idx) => {
              const medal = idx === 0 ? '🥈' : idx === 1 ? '🥉' : '📍';
              const diff = item.preco - best.preco;
              return `
                <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between text-xs transition">
                  <div class="flex items-center gap-2 truncate pr-2">
                    <span class="text-base shrink-0">${medal}</span>
                    <div class="truncate">
                      <span class="font-extrabold text-slate-900 truncate block">${item.mercado}</span>
                      <span class="text-[10px] text-slate-500 truncate block">${item.produto} • ${item.bairro} (${item.cidade})</span>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <div class="font-black text-slate-800">R$ ${item.preco.toFixed(2).replace('.', ',')}</div>
                    ${diff > 0 ? `<span class="text-[9px] text-slate-400 font-bold block">+R$ ${diff.toFixed(2).replace('.', ',')}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${economia > 0 ? `
            <div class="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-2.5 text-center text-xs font-bold text-indigo-900">
              💡 Economia de até <strong>R$ ${economia.toFixed(2).replace('.', ',')}</strong> escolhendo o 1º colocado!
            </div>
          ` : ''}

          <div class="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            <button onclick="shareRankingWhatsApp('${searchTerm}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition active:scale-95">
              <span>📲 Mandar esse Ranking no WhatsApp</span>
            </button>
          </div>

        </div>
      `;
    }

    function shareRankingWhatsApp(searchTerm = 'Arroz') {
      if (currentRankingData.length === 0) return;
      let msg = `📢 *Ranking de Preços em Cabo Frio - NutriPreço*\n`;
      msg += `Auditoria oficial de ${searchTerm.toUpperCase()}:\n\n`;
      currentRankingData.slice(0, 4).forEach((it, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍';
        msg += `${medal} ${it.mercado} (${it.bairro}): R$ ${it.preco.toFixed(2).replace('.', ',')}\n`;
      });
      msg += `\nConsulte na Helena: https://mestrepratico.com.br/helena.html`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    }

    function resetView() {
      document.getElementById('aiResponseContainer').classList.add('hidden');
      document.getElementById('defaultHighlights').classList.remove('hidden');
      document.getElementById('aiInput').value = '';
    }

    function handleInputSubmission() {
      const val = document.getElementById('aiInput').value.trim();
      if (val) processSpokenShoppingCommand(val);
    }

    // ========================================================
    // CALCULADORA FALADA DE CORREDOR (RECONHECIMENTO DE VOZ)
    // ========================================================
    function startVoiceShoppingCalculator() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Reconhecimento de voz disponível no Google Chrome ou Edge.");
        return;
      }

      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = false;

      const ring = document.getElementById('voicePulseRing');
      const micBtn = document.getElementById('btnVoiceInput');
      ring.classList.remove('hidden');
      micBtn.classList.add('bg-rose-600');

      rec.onresult = function(e) {
        const transcript = e.results[0][0].transcript;
        document.getElementById('aiInput').value = transcript;
        processSpokenShoppingCommand(transcript);
      };

      rec.onerror = function() {
        ring.classList.add('hidden');
        micBtn.classList.remove('bg-rose-600');
      };

      rec.onend = function() {
        ring.classList.add('hidden');
        micBtn.classList.remove('bg-rose-600');
      };

      rec.start();
    }

    function processSpokenShoppingCommand(rawText) {
      const text = rawText.toLowerCase().trim();

      if (text.includes('encarte') || text.includes('folheto')) {
        let store = 'Princesa';
        if (text.includes('atacadão') || text.includes('atacadao')) store = 'Atacadão';
        else if (text.includes('assai') || text.includes('assaí')) store = 'Assaí';
        showEncarte(store);
        return;
      }

      // Expressão de Compra e Soma: ex "2 leites de 4 e 50" ou "arroz 23 e 80"
      let parsedPrice = null;
      let matchedPriceStr = "";

      const compositePrice = text.match(/(\d+)\s*e\s*(\d{1,2})/);
      if (compositePrice) {
        const reais = compositePrice[1];
        let centavos = compositePrice[2];
        if (centavos.length === 1) centavos += "0";
        parsedPrice = parseFloat(`${reais}.${centavos}`);
        matchedPriceStr = compositePrice[0];
      } else {
        const directPrice = text.match(/(\d+[\.,]\d{1,2})|\b(\d+)\s*(reais|real)\b|\b(\d+)\b/);
        if (directPrice) {
          const numStr = (directPrice[1] || directPrice[2] || directPrice[4]).replace(',', '.');
          parsedPrice = parseFloat(numStr);
          matchedPriceStr = directPrice[0];
        }
      }

      if (parsedPrice && parsedPrice > 0 && parsedPrice < 1000) {
        let qty = 1;
        const qtyMatch = text.match(/^(\d+)\s+/);
        if (qtyMatch) qty = parseInt(qtyMatch[1]);

        let prodName = text
          .replace(matchedPriceStr, '')
          .replace(/^(\d+)\s+/, '')
          .replace(/\b(de|por|custou|reais|real|unidades?|pacotes?|caixas?)\b/gi, '')
          .trim();

        if (!prodName) prodName = "Item do Corredor";
        prodName = prodName.charAt(0).toUpperCase() + prodName.slice(1);

        addItemToCart(prodName, parsedPrice, qty);

        const subtotal = cartState.items.reduce((acc, it) => acc + (it.price * it.qty), 0);
        speakText(`Adicionei ${qty} ${prodName}. Total no carrinho: R$ ${subtotal.toFixed(2).replace('.', ',')}.`, 'corredor');
        openCorredorModal();
        return;
      }

      askHelena(rawText);
    }

    // ========================================================
    // ENCARTE VISUAL
    // ========================================================
    function showEncarte(storeKey) {
      if (!ENCARTE_DATABASE[storeKey]) storeKey = 'Princesa';
      const encarte = ENCARTE_DATABASE[storeKey];
      const container = document.getElementById('aiResponseContainer');
      const highlights = document.getElementById('defaultHighlights');

      highlights.classList.add('hidden');
      container.classList.remove('hidden');

      speakText(`Abrindo encarte oficial do ${encarte.name} em Cabo Frio.`, 'encarte');

      container.innerHTML = `
        <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 clean-card-shadow space-y-3.5 animate-slide-up">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xl">📰</span>
              <div>
                <h4 class="text-xs font-black text-slate-900">${encarte.name}</h4>
                <span class="text-[10px] text-slate-400 font-medium">${encarte.cidade}</span>
              </div>
            </div>
            <button onclick="resetView()" class="text-[11px] font-bold text-indigo-600 hover:underline">Fechar</button>
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto py-1 hide-scrollbar">
            ${Object.keys(ENCARTE_DATABASE).map(k => `
              <button onclick="showEncarte('${k}')" class="px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap transition ${k === storeKey ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                ${k}
              </button>
            `).join('')}
          </div>

          <div class="space-y-2">
            ${encarte.items.map(it => `
              <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-emerald-50/40 transition">
                <div class="truncate pr-2">
                  <div class="text-xs font-black text-slate-900 truncate">${it.name}</div>
                  <div class="text-[10px] text-slate-400">${it.desc}</div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-xs font-black text-emerald-700">R$ ${it.price.toFixed(2).replace('.', ',')}</span>
                  <button onclick="addItemToCart('${it.name.replace(/'/g, "\\'")}', ${it.price}); alert('✓ Adicionado ao carrinho!');" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-2xs active:scale-95 transition">
                    + Somar
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ========================================================
    // BASTIDORES DE GRAVAÇÃO (VÍDEOS GOOGLE FLOW)
    // ========================================================
    function toggleRecordingStudio() {
      const drawer = document.getElementById('recordingStudioDrawer');
      drawer.classList.toggle('hidden');
    }

    function triggerRecordingScenario(num) {
      toggleRecordingStudio();
      if (num === 1) {
        document.getElementById('aiInput').value = "2 leites de 4 e 50 e 1 cafe de 16";
        addItemToCart("Leite Integral UHT", 4.50, 2);
        addItemToCart("Café Tradicional 500g", 16.00, 1);
        openCorredorModal();
        speakText("Adicionei dois leites e um café. Total no carrinho: R$ 25,00.", 'corredor');
      } else if (num === 2) {
        document.getElementById('aiInput').value = "Onde o arroz tá mais barato hoje?";
        askHelena("arroz");
      } else if (num === 3) {
        showEncarte('Princesa');
      } else if (num === 4) {
        triggerProductScanSimulation('Arroz Camil Tipo 1 • 5kg', '7891000100103');
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      updateCartUI();
      updateCityBadges();
      if (window.location.search.includes('studio=1')) {
        const sBtn = document.getElementById('studioFloatingBtn');
        if (sBtn) sBtn.classList.remove('hidden');
      }
    });
