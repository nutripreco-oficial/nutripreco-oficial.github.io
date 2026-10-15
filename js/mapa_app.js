// Externalizado para conformidade com CSP Estrito (Observatory A+)
let map = null;
    let allMarkets = [];
    let activeMarkers = [];
    let currentRegion = 'todos';
    let searchQuery = '';

    // Inicialização do Mapa Leaflet
    function initMap() {
      // Centro inicial: Visual amplo do Brasil pegando RJ e Recife
      map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([-15.5, -39.0], 5);

      // Camada de Mapa Oficial Livre (OpenStreetMap sem marca d'água ou API Key)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Carregar dados de mercados
      carregarMercados();
    }

    // Carregar mercados via API com fallback para JSON local
    async function carregarMercados() {
      try {
        const pubKey = 'sb_publishable_asGr3f2xfay96fUJAkIHBg_L5vfLYvv';
        const res = await fetch('https://fzoyldcfyiigwyxxhosd.supabase.co/rest/v1/mercados?select=*&order=cidade.asc,nome.asc', {
          headers: { 'apikey': pubKey, 'Authorization': `Bearer ${pubKey}` }
        });
        if (res.ok) {
          allMarkets = await res.json();
        } else {
          throw new Error('Supabase request failed');
        }
      } catch (e) {
        console.warn('Carregando mercados do backup local...', e);
        try {
          const resLocal = await fetch('/mercados_data.json');
          allMarkets = await resLocal.json();
        } catch (err) {
          console.error('Falha ao carregar mercados:', err);
        }
      }

      atualizarContadores();
      renderizarMarcadores();
      ajustarVisaoRegiao('todos');
    }

    // Atualiza contadores nas abas
    function atualizarContadores() {
      const total = allMarkets.length;
      const cf = allMarkets.filter(m => (m.cidade || '').toLowerCase().includes('cabo') || (m.cidade || '').toLowerCase().includes('lagos')).length;
      const rec = allMarkets.filter(m => (m.cidade || '').toLowerCase().includes('recife') || (m.cidade || '').toLowerCase().includes('jaboat')).length;
      const rj = allMarkets.filter(m => (m.cidade || '').toLowerCase().includes('rio') || (m.cidade || '').toLowerCase().includes('gonçalo')).length;

      document.getElementById('count-todos').textContent = total;
      document.getElementById('count-cabofrio').textContent = cf;
      document.getElementById('count-recife').textContent = rec;
      document.getElementById('count-rj').textContent = rj;
    }

    // Criar Marcador Vermelho com Efeito Pulsante
    function criarIconeVermelho() {
      return L.divIcon({
        className: 'custom-red-pin-wrapper',
        html: `
          <div class="red-dot-marker">
            <div class="red-dot-pulse"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -14]
      });
    }

    // Renderizar Marcadores no Mapa com base no filtro atual
    function renderizarMarcadores() {
      // Limpar marcadores anteriores
      activeMarkers.forEach(m => map.removeLayer(m));
      activeMarkers = [];

      const query = searchQuery.trim().toLowerCase();

      const mercadosFiltrados = allMarkets.filter(m => {
        if (!m.latitude || !m.longitude) return false;

        // Filtro de Região
        const cid = (m.cidade || '').toLowerCase();
        let matchRegiao = true;
        if (currentRegion === 'cabofrio') {
          matchRegiao = cid.includes('cabo') || cid.includes('lagos');
        } else if (currentRegion === 'recife') {
          matchRegiao = cid.includes('recife') || cid.includes('jaboat');
        } else if (currentRegion === 'rj') {
          matchRegiao = cid.includes('rio') || cid.includes('gonçalo');
        }

        if (!matchRegiao) return false;

        // Filtro de Busca Texto
        if (query) {
          const nome = (m.nome || '').toLowerCase();
          const bairro = (m.bairro || '').toLowerCase();
          const rede = (m.rede || '').toLowerCase();
          return nome.includes(query) || bairro.includes(query) || rede.includes(query) || cid.includes(query);
        }

        return true;
      });

      document.getElementById('lblExibindo').textContent = mercadosFiltrados.length;

      const redIcon = criarIconeVermelho();

      mercadosFiltrados.forEach(m => {
        const marker = L.marker([m.latitude, m.longitude], { icon: redIcon });

        // Conteúdo do Popup Estilizado
        const popupContent = `
          <div class="text-slate-900 leading-tight">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-xs"></span>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-red-600">${m.rede || 'Supermercado'}</span>
            </div>
            <h4 class="font-black text-sm text-slate-900 mb-1">${m.nome}</h4>
            <p class="text-xs text-slate-600 mb-0.5"><strong>Bairro:</strong> ${m.bairro || 'Região Central'}</p>
            <p class="text-xs text-slate-600 mb-2"><strong>Cidade:</strong> ${m.cidade} - ${m.estado || ''}</p>
            
            <div class="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
              <a href="https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}" target="_blank" class="w-full text-center px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-colors">
                <span>🧭</span>
                <span>Abrir no Google Maps</span>
              </a>
              <a href="/?q=${encodeURIComponent(m.nome)}" class="w-full text-center px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors">
                <span>🛒</span>
                <span>Ver Ofertas no Portal</span>
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });
        marker.addTo(map);
        activeMarkers.push(marker);
      });
    }

    // Ajustar zoom e centro por Região
    function ajustarVisaoRegiao(regiao) {
      if (regiao === 'cabofrio') {
        map.setView([-22.8805, -42.0235], 13);
      } else if (regiao === 'recife') {
        map.setView([-8.0578, -34.8830], 12);
      } else if (regiao === 'rj') {
        map.setView([-22.8800, -43.2000], 11);
      } else {
        if (activeMarkers.length > 0) {
          const group = new L.featureGroup(activeMarkers);
          map.fitBounds(group.getBounds().pad(0.1));
        } else {
          map.setView([-15.5, -39.0], 5);
        }
      }
    }

    // Alternar Abas de Região
    function filtrarRegiao(regiao) {
      currentRegion = regiao;
      
      // Atualizar classes das abas
      document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.className = 'filter-tab px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all whitespace-nowrap cursor-pointer';
      });

      const activeTab = document.getElementById(`tab-${regiao}`);
      if (activeTab) {
        activeTab.className = 'filter-tab px-3 py-1.5 rounded-xl bg-red-600 text-white shadow-xs transition-all whitespace-nowrap cursor-pointer';
      }

      renderizarMarcadores();
      ajustarVisaoRegiao(regiao);
    }

    // Busca por Texto em Tempo Real
    function filtrarPorTexto(val) {
      searchQuery = val;
      const btnClear = document.getElementById('btnClearSearch');
      if (val.trim()) {
        btnClear.classList.remove('hidden');
      } else {
        btnClear.classList.add('hidden');
      }
      renderizarMarcadores();
    }

    function limparBusca() {
      document.getElementById('inputBusca').value = '';
      filtrarPorTexto('');
    }

    // Modais
    function abrirModalGoogleMaps() {
      document.getElementById('modalGoogleMaps').classList.remove('hidden');
    }
    function fecharModalGoogleMaps() {
      document.getElementById('modalGoogleMaps').classList.add('hidden');
    }

    // Iniciar ao carregar página
    window.addEventListener('DOMContentLoaded', initMap);
