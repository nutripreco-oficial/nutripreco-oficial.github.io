// Externalizado para conformidade com CSP Estrito (Observatory A+)
let map = null;
    let markersLayer = null;
    let TODOS_POSTOS = [];

    const COORDENADAS_ESTADOS = {
      'rj': [-22.9068, -43.1729, 9],
      'sp': [-23.5505, -46.6333, 9],
      'mg': [-19.9167, -43.9345, 9],
      'es': [-20.3155, -40.3128, 9],
      'pr': [-25.4284, -49.2733, 9],
      'sc': [-27.5954, -48.5480, 9],
      'rs': [-30.0346, -51.2177, 9],
      'ba': [-12.9777, -38.5016, 9],
      'pe': [-8.0476, -34.8770, 9],
      'ce': [-3.7319, -38.5267, 9],
      'df': [-15.7975, -47.8919, 10],
      'go': [-16.6869, -49.2648, 9],
      'todos': [-15.7801, -47.9292, 4]
    };

    // Coordenadas aproximadas por cidade polo para renderização precisa do mapa
    const POLOS_COORDS = {
      'cabo frio': [-22.8864, -42.0267],
      'sao pedro da aldeia': [-22.8419, -42.1039],
      'araruama': [-22.8731, -42.3431],
      'rio de janeiro': [-22.9068, -43.1729],
      'niteroi': [-22.8832, -43.1034],
      'duque de caxias': [-22.7856, -43.3117],
      'sao paulo': [-23.5505, -46.6333],
      'campinas': [-22.9056, -47.0608],
      'belo horizonte': [-19.9167, -43.9345],
      'vitoria': [-20.3155, -40.3128],
      'curitiba': [-25.4284, -49.2733],
      'florianopolis': [-27.5954, -48.5480],
      'porto alegre': [-30.0346, -51.2177],
      'salvador': [-12.9777, -38.5016],
      'recife': [-8.0476, -34.8770],
      'fortaleza': [-3.7319, -38.5267],
      'brasilia': [-15.7975, -47.8919],
      'goiania': [-16.6869, -49.2648]
    };

    function initMap() {
      map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([-22.9068, -43.1729], 9);

      // OpenStreetMap Tiles (100% Gratuito - Custo Zero R$ 0,00)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      markersLayer = L.layerGroup().addTo(map);

      carregarDadosPostos();
    }

    async function carregarDadosPostos() {
      try {
        const res = await fetch('/dados_combustiveis_nacional.json');
        if (res.ok) {
          const data = await res.json();
          TODOS_POSTOS = data.postos || [];
          filtrarMapa();
        }
      } catch (err) {
        console.error('Erro ao carregar dados dos postos:', err);
      }
    }

    function normalizar(txt) {
      if (!txt) return '';
      return txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function obterCoordsPosto(p, idx) {
      if (p.lat && p.lng) return [p.lat, p.lng];
      const cidNorm = normalizar(p.cidade);
      const base = POLOS_COORDS[cidNorm] || [-22.9068, -43.1729];
      // Variação determinística leve para espalhar pinos no polo sem agrupar no mesmo pixel
      const jitterLat = ((idx * 9301 + 49297) % 233280) / 233280 * 0.08 - 0.04;
      const jitterLng = ((idx * 49297 + 9301) % 233280) / 233280 * 0.08 - 0.04;
      return [base[0] + jitterLat, base[1] + jitterLng];
    }

    function filtrarMapa() {
      if (!map || !markersLayer) return;
      markersLayer.clearLayers();

      const ufSel = document.getElementById('selectFiltroUf').value;
      const combSel = document.getElementById('selectFiltroCombustivel').value;

      let postosFiltrados = TODOS_POSTOS;
      if (ufSel !== 'todos') {
        postosFiltrados = postosFiltrados.filter(p => normalizar(p.estado) === ufSel);
      }

      // Filtra por postos com o combustível escolhido
      postosFiltrados = postosFiltrados.filter(p => (p[combSel] || 0) > 0);

      document.getElementById('countPostosVisiveis').innerText = postosFiltrados.length.toLocaleString('pt-BR');

      // Centraliza na UF
      const cfg = COORDENADAS_ESTADOS[ufSel] || COORDENADAS_ESTADOS['todos'];
      map.setView([cfg[0], cfg[1]], cfg[2]);

      // Plota no mapa (limite de 350 pinos simultâneos para performance ultra-rápida no celular)
      const exibicao = postosFiltrados.slice(0, 350);

      exibicao.forEach((p, idx) => {
        const coords = obterCoordsPosto(p, idx);
        const preco = (p[combSel] || 0).toFixed(2).replace('.', ',');
        const uf = (p.estado || 'BR').toUpperCase();

        const customIcon = L.divIcon({
          className: 'custom-fuel-icon',
          html: `<div class="fuel-pin-marker">⛽</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const mapsQuery = encodeURIComponent(`${p.posto} ${p.endereco} ${p.cidade} ${uf}`);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

        const popupContent = `
          <div class="text-slate-900 font-sans p-1 min-w-[220px]">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">ANP OFICIAL</span>
              <span class="text-[10px] text-slate-500 font-bold">${p.bandeira || 'Bandeira Branca'}</span>
            </div>
            <h4 class="text-sm font-black text-slate-950 leading-tight mb-1">${p.posto}</h4>
            <p class="text-xs text-slate-600 mb-2">${p.bairro} • ${p.cidade} - ${uf}</p>
            <div class="p-2 bg-amber-50 rounded-xl border border-amber-200 mb-3 text-center">
              <span class="text-[10px] font-bold text-amber-900 uppercase">Preço ${combSel.replace('_', ' ').toUpperCase()}</span>
              <div class="text-lg font-black text-amber-700">R$ ${preco} <span class="text-xs font-normal">/ litro</span></div>
              <span class="text-[9px] text-slate-500">Coleta ANP: ${p.atualizado_em || '12/10/2026'}</span>
            </div>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="w-full py-2 px-3 rounded-xl bg-slate-950 text-amber-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow hover:bg-slate-900 transition">
              <span>🚗 Abrir Rota no Google Maps</span>
            </a>
          </div>
        `;

        const marker = L.marker(coords, { icon: customIcon });
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
      });
    }

    document.addEventListener('DOMContentLoaded', initMap);
