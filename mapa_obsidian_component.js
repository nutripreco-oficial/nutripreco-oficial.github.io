/**
 * COMPONENTE OFICIAL: MAPA INTERATIVO DARK OBSIDIAN — REDE NACIONAL
 * Holding Arthur Luis Vieira dos Santos Tecnologia e Inteligência de Varejo Inova Simples (I.S.)
 * 
 * Requisitos:
 * - Custo R$ 0,00 (SVG nativo ultraleve < 25KB, sem bibliotecas externas pesadas).
 * - Desktop: Sidebar elegante na lateral esquerda sem obstruir a barra central.
 * - Mobile: Bottom sheet / gaveta deslizante 100% responsiva sem travar rolagem.
 * - Interatividade: Clique nos nós de cada estado para navegar e consultar preços.
 */

(function() {
  if (document.getElementById('mapaObsidianContainer')) return;

  const DADOS_MALHA = {
    total_postos: 4753,
    total_cidades: 342,
    total_ufs: 12,
    estados: [
      { uf: "SP", nome: "São Paulo", postos: 1697, cidades: 100, x: 260, y: 310, status: "ativo" },
      { uf: "MG", nome: "Minas Gerais", postos: 590, cidades: 54, x: 295, y: 260, status: "ativo" },
      { uf: "RS", nome: "Rio Grande do Sul", postos: 400, cidades: 35, x: 215, y: 400, status: "ativo" },
      { uf: "RJ", nome: "Rio de Janeiro", postos: 398, cidades: 28, x: 320, y: 295, status: "ativo", sede: true },
      { uf: "PR", nome: "Paraná", postos: 367, cidades: 26, x: 235, y: 340, status: "ativo" },
      { uf: "BA", nome: "Bahia", postos: 289, cidades: 27, x: 340, y: 190, status: "ativo" },
      { uf: "GO", nome: "Goiás", postos: 226, cidades: 16, x: 250, y: 230, status: "ativo" },
      { uf: "PE", nome: "Pernambuco", postos: 221, cidades: 18, x: 385, y: 135, status: "ativo" },
      { uf: "SC", nome: "Santa Catarina", postos: 208, cidades: 16, x: 245, y: 365, status: "ativo" },
      { uf: "CE", nome: "Ceará", postos: 160, cidades: 11, x: 360, y: 100, status: "ativo" },
      { uf: "ES", nome: "Espírito Santo", postos: 133, cidades: 10, x: 340, y: 265, status: "ativo" },
      { uf: "DF", nome: "Distrito Federal", postos: 64, cidades: 1, x: 265, y: 220, status: "ativo" }
    ]
  };

  // 1. Estilos CSS Nativos Dark Obsidian
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulseGlow {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.4); opacity: 0.4; }
    }
    @keyframes dashBeam {
      to { stroke-dashoffset: -100; }
    }
    .obsidian-pulse {
      animation: pulseGlow 2.5s infinite ease-in-out;
      transform-origin: center;
    }
    .obsidian-beam {
      stroke-dasharray: 6, 8;
      animation: dashBeam 3s linear infinite;
    }
    .state-node {
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .state-node:hover circle {
      fill: #34d399 !important;
      filter: drop-shadow(0 0 10px #10b981);
    }
  `;
  document.head.appendChild(style);

  // 2. Botão Gatilho Discreto (Pill Flutuante na Lateral Esquerda)
  const btnToggle = document.createElement('button');
  btnToggle.id = 'btnToggleMapaObsidian';
  btnToggle.className = 'fixed left-3 sm:left-5 top-20 sm:top-24 z-40 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md transition-all cursor-pointer group';
  btnToggle.title = 'Abrir Mapa Interativo Dark Obsidian da Rede Nacional';
  btnToggle.innerHTML = `
    <span class="text-base group-hover:scale-110 transition-transform">🗺️</span>
    <span class="hidden md:inline font-mono uppercase tracking-wide">Malha Nacional</span>
    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
  `;
  document.body.appendChild(btnToggle);

  // 3. Container do Modal / Drawer Dark Obsidian
  const modal = document.createElement('div');
  modal.id = 'mapaObsidianContainer';
  modal.className = 'hidden fixed inset-0 z-50 flex items-center justify-start';
  modal.innerHTML = `
    <!-- Backdrop com Blur Suave -->
    <div id="mapaObsidianBackdrop" class="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>

    <!-- Painel Lateral Desktop / Drawer Inferior Mobile -->
    <div class="relative z-10 w-full sm:w-[460px] h-[92vh] sm:h-full max-h-[95vh] sm:max-h-screen my-auto sm:my-0 ml-0 sm:ml-4 rounded-3xl sm:rounded-2xl bg-gradient-to-b from-[#06080e] via-[#090d16] to-[#04060a] border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 flex flex-col overflow-hidden animate-fade-in">
      
      <!-- Cabeçalho Executivo -->
      <div class="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base">
            🌐
          </div>
          <div>
            <h3 class="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Malha Nacional Ativa</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">12 UFs</span>
            </h3>
            <p class="text-[11px] text-slate-400">NutriPreço & NutriCombust • Expansão Real</p>
          </div>
        </div>
        <button id="btnCloseMapaObsidian" class="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold">
          ✕
        </button>
      </div>

      <!-- Placar de Métricas da Holding -->
      <div class="grid grid-cols-3 gap-2 p-3 bg-slate-900/40 border-b border-slate-800/80 shrink-0 text-center">
        <div class="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
          <div class="text-[10px] text-slate-400 font-semibold uppercase">Postos ANP</div>
          <div class="text-sm font-black text-amber-400 font-mono">4.753</div>
        </div>
        <div class="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
          <div class="text-[10px] text-slate-400 font-semibold uppercase">Cidades</div>
          <div class="text-sm font-black text-emerald-400 font-mono">342</div>
        </div>
        <div class="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
          <div class="text-[10px] text-slate-400 font-semibold uppercase">Status Edge</div>
          <div class="text-sm font-black text-sky-400 flex items-center justify-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span> 100%
          </div>
        </div>
      </div>

      <!-- Área de Visualização do Mapa SVG Dark Obsidian -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        
        <!-- SVG Interativo -->
        <div class="relative bg-[#05070d] rounded-2xl border border-slate-800/90 p-3 shadow-inner flex items-center justify-center">
          <svg viewBox="0 0 500 480" class="w-full h-64 sm:h-72" style="filter: drop-shadow(0 0 15px rgba(16,185,129,0.08));">
            <defs>
              <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.8"/>
                <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.2"/>
              </linearGradient>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#34d399" stop-opacity="1"/>
                <stop offset="60%" stop-color="#10b981" stop-opacity="0.5"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Contorno Abstrato Vetorial do Brasil (Dark Obsidian) -->
            <path d="M 170 30 Q 240 25 320 60 Q 400 90 440 140 Q 480 180 430 240 Q 400 290 350 330 Q 320 370 290 420 Q 260 470 220 475 Q 180 440 200 370 Q 180 320 150 260 Q 110 200 130 140 Q 150 70 170 30 Z" 
                  fill="#080c14" stroke="#1e293b" stroke-width="1.5" />
            
            <!-- Linhas de Conexão Cyber / Feixes de Luz até o Hub Central RJ -->
            ${DADOS_MALHA.estados.map(est => `
              <path d="M 320 295 Q ${(320 + est.x)/2} ${(295 + est.y)/2 - 15} ${est.x} ${est.y}" 
                    fill="none" stroke="url(#cyberGradient)" stroke-width="1.2" class="obsidian-beam" />
            `).join('')}

            <!-- Nós Brilhantes de Cada Estado -->
            ${DADOS_MALHA.estados.map(est => `
              <g class="state-node" onclick="window.selecionarEstadoMapa('${est.uf}', '${est.nome}')">
                <circle cx="${est.x}" cy="${est.y}" r="9" fill="url(#nodeGlow)" class="obsidian-pulse" />
                <circle cx="${est.x}" cy="${est.y}" r="4" fill="${est.sede ? '#fbbf24' : '#10b981'}" stroke="#ffffff" stroke-width="1" />
                <text x="${est.x + 8}" y="${est.y + 3}" fill="#cbd5e1" font-size="9" font-family="monospace" font-weight="bold">${est.uf}</text>
              </g>
            `).join('')}
          </svg>
        </div>

        <!-- Seletor Rápido de Estados com Métricas -->
        <div>
          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Selecione a Praça para Consultar:</span>
            <span class="text-amber-400">Clique para Abrir</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            ${DADOS_MALHA.estados.map(est => `
              <button onclick="window.selecionarEstadoMapa('${est.uf}', '${est.nome}')" 
                      class="p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border ${est.sede ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'} text-left transition flex items-center justify-between cursor-pointer group">
                <div>
                  <div class="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    <span>${est.nome}</span>
                    <span class="text-[10px] text-slate-500">(${est.uf})</span>
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    <span class="text-amber-300 font-mono font-bold">${est.postos}</span> postos • <span class="text-emerald-300 font-mono font-bold">${est.cidades}</span> cid.
                  </div>
                </div>
                <span class="text-slate-600 group-hover:text-emerald-400 transition-colors">➔</span>
              </button>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- Rodapé do Modal -->
      <div class="p-3 bg-slate-950/80 border-t border-slate-800/80 shrink-0 text-center">
        <p class="text-[10px] text-slate-500">
          Inteligência Central • Holding Arthur Luis Vieira dos Santos Inova Simples
        </p>
      </div>

    </div>
  `;
  document.body.appendChild(modal);

  // 4. Lógica de Controle do Modal
  const backdrop = document.getElementById('mapaObsidianBackdrop');
  const btnClose = document.getElementById('btnCloseMapaObsidian');

  function abrirMapa() {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function fecharMapa() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  btnToggle.addEventListener('click', abrirMapa);
  btnClose.addEventListener('click', fecharMapa);
  backdrop.addEventListener('click', fecharMapa);

  // 5. Ação de Clique no Estado
  window.selecionarEstadoMapa = function(uf, nome) {
    fecharMapa();
    
    // Se estiver em combustivel.html e tiver o selectEstado
    const sel = document.getElementById('selectEstado');
    if (sel) {
      sel.value = uf.toLowerCase();
      if (typeof window.trocarEstado === 'function') {
        window.trocarEstado();
      }
      return;
    }

    // Se estiver em busca.html, atualiza a busca ou redireciona
    const inp = document.getElementById('searchInput');
    if (inp) {
      inp.value = `gasolina em ${nome}`;
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    } else {
      window.location.href = `/combustivel?uf=${uf.toLowerCase()}`;
    }
  };

})();
