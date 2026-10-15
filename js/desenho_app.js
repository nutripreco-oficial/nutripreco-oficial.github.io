// Externalizado para conformidade com CSP Estrito (Observatory A+)
const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    const labelStatus = document.getElementById('labelStatus');

    let animId = null;

    function limparCanvas() {
      if (animId) cancelAnimationFrame(animId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      labelStatus.innerText = "Canvas limpo e pronto para novo traço.";
    }

    // DESENHO 1: ARTE CÓSMICA NEON (ESTRELA + ÓRBITAS + NÚCLEO)
    function desenharArteCosmica() {
      limparCanvas();
      labelStatus.innerText = "🤖 IA desenhando a Estrela Cósmica ao vivo...";

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Gera pontos da estrela
      const rExt = 140;
      const rInt = 60;
      const pontosEstrela = [];
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI / 5);
        const r = (i % 2 === 0) ? rExt : rInt;
        pontosEstrela.push({ x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) });
      }

      let step = 0;
      let totalSteps = 200;

      function animar() {
        step++;
        const prog = step / totalSteps;

        // Desenha estrela progressivamente
        if (prog <= 0.4) {
          const subProg = prog / 0.4;
          const idxAtual = Math.floor(subProg * 10);
          const segmentProg = (subProg * 10) - idxAtual;

          ctx.strokeStyle = "#F43F5E";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.shadowColor = "#F43F5E";
          ctx.shadowBlur = 15;

          if (idxAtual < 10) {
            const p1 = pontosEstrela[idxAtual];
            const p2 = pontosEstrela[(idxAtual + 1) % 10];
            const curX = p1.x + (p2.x - p1.x) * segmentProg;
            const curY = p1.y + (p2.y - p1.y) * segmentProg;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(curX, curY);
            ctx.stroke();
          }
        } 
        // Desenha Órbitas Planetárias
        else if (prog <= 0.8) {
          const orbProg = (prog - 0.4) / 0.4;
          const theta = orbProg * (Math.PI * 2);
          const rx = 240, ry = 90;
          const inc = 25 * (Math.PI / 180);

          const ex = rx * Math.cos(theta);
          const ey = ry * Math.sin(theta);
          const x1 = cx + ex * Math.cos(inc) - ey * Math.sin(inc);
          const y1 = cy + ex * Math.sin(inc) + ey * Math.cos(inc);

          ctx.strokeStyle = "#06B6D4";
          ctx.lineWidth = 3;
          ctx.shadowColor = "#06B6D4";
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.arc(x1, y1, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#06B6D4";
          ctx.fill();

          // Segunda órbita em roxo
          const x2 = cx + ex * Math.cos(-inc) - ey * Math.sin(-inc);
          const y2 = cy + ex * Math.sin(-inc) + ey * Math.cos(-inc);
          ctx.fillStyle = "#A855F7";
          ctx.beginPath();
          ctx.arc(x2, y2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } 
        // Núcleo Dourado Central
        else if (prog <= 1.0) {
          const coreProg = (prog - 0.8) / 0.2;
          const theta = coreProg * (Math.PI * 2);

          ctx.strokeStyle = "#FACC15";
          ctx.lineWidth = 5;
          ctx.shadowColor = "#FACC15";
          ctx.shadowBlur = 20;

          const px = cx + 45 * Math.cos(theta);
          const py = cy + 45 * Math.sin(theta);

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#FACC15";
          ctx.fill();
        }

        if (step < totalSteps) {
          animId = requestAnimationFrame(animar);
        } else {
          labelStatus.innerText = "✨ Arte Cósmica concluída com sucesso!";
          ctx.shadowBlur = 0;
          ctx.font = "bold 16px 'Plus Jakarta Sans'";
          ctx.fillStyle = "#10B981";
          ctx.textAlign = "center";
          ctx.fillText("✨ IDENTIDADE FORA DO QUADRO CONCLUÍDA", cx, cy + 190);
        }
      }

      animar();
    }

    // DESENHO 2: GRÁFICO DE PREÇOS DE COMBUSTÍVEIS AO VIVO
    function desenharPlanilhaPrecos() {
      limparCanvas();
      labelStatus.innerText = "📊 IA desenhando o Radar de Preços de Cabo Frio...";

      const postos = [
        { nome: "1º Shell Centro", preco: 5.39, cor: "#10B981" },
        { nome: "2º São Cristóvão", preco: 5.45, cor: "#06B6D4" },
        { nome: "3º Praia do Forte", preco: 5.49, cor: "#38BDF8" },
        { nome: "4º Portinho", preco: 5.52, cor: "#818CF8" },
        { nome: "5º Jardim Esperança", preco: 5.54, cor: "#A855F7" }
      ];

      let step = 0;
      let totalSteps = 120;

      function animarGrafico() {
        step++;
        const prog = step / totalSteps;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Título do Gráfico
        ctx.font = "bold 20px 'Plus Jakarta Sans'";
        ctx.fillStyle = "#F43F5E";
        ctx.textAlign = "center";
        ctx.fillText("⛽ TOP 5 MENORES PREÇOS DE CABO FRIO • AUDITORIA HOJE", canvas.width / 2, 60);

        // Linhas de Base
        postos.forEach((p, idx) => {
          const y = 130 + idx * 75;
          const larguraMax = 550;
          const valorRelativo = (6.00 - p.preco) / (6.00 - 5.30);
          const barW = (larguraMax * valorRelativo) * prog;

          // Nome do Posto
          ctx.font = "bold 14px 'Plus Jakarta Sans'";
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          ctx.fillText(p.nome, 60, y + 22);

          // Barra Animada
          ctx.fillStyle = p.cor;
          ctx.shadowColor = p.cor;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(240, y, barW, 34, 10);
          ctx.fill();

          // Preço no Final da Barra
          ctx.shadowBlur = 0;
          ctx.font = "black 16px 'Plus Jakarta Sans'";
          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          ctx.fillText(`R$ ${p.preco.toFixed(2).replace('.', ',')}`, 255 + barW, y + 24);
        });

        if (step < totalSteps) {
          animId = requestAnimationFrame(animarGrafico);
        } else {
          labelStatus.innerText = "✅ Gráfico de Preços renderizado com economia de até R$ 34,50/tanque!";
        }
      }

      animarGrafico();
    }

    // Inicia o desenho cósmico automaticamente ao abrir a página
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(desenharArteCosmica, 600);
    });
