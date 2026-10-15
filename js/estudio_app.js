// Externalizado para conformidade com CSP Estrito (Observatory A+)
// Roteiro Integral da Helena no Telejornal Econômico
    const NARRATIVE_FULL = "Atenção, consumidor de Cabo Frio! Aqui é a Helena com o Giro da Economia. Atuando como auditor neutro de utilidade pública, nossa equipe auditou a cesta com cinco itens essenciais em quatro supermercados da cidade: arroz cinco quilos, feijão preto, óleo, macarrão e açúcar. Na soma total da cesta, o ranking ficou assim: em primeiro lugar, o Assaí Atacadista em São Cristóvão com quarenta e um reais e setenta e seis centavos. Em segundo lugar, o SuperMarket com quarenta e quatro e dezesseis. Em terceiro lugar, o Mercado Rende Pacas em Nova Califórnia com quarenta e seis e vinte e cinco. E em quarto lugar, o Princesa Supermercados no Centro com quarenta e sete e setenta e seis. A diferença na soma total chega a seis reais na mesma cesta. O nosso papel é apenas informar para você exercer o seu direito de escolha. Instale agora mesmo o aplicativo NutriPreço no seu celular ou acesse mestrepratico ponto com ponto br para conferir todas as ofertas ao vivo!";

    let isBroadcasting = false;
    let timerSeconds = 0;
    const totalDuration = 46;
    let timerInterval = null;
    let synthUtterance = null;
    let audioPlayer = new Audio('00_locucao_completa_helena.mp3');
    audioPlayer.preload = 'auto';

    // Elementos da UI
    const sceneIntro = document.getElementById('scene-intro');
    const sceneRanking = document.getElementById('scene-ranking');
    const sceneTable = document.getElementById('scene-table');
    const sceneCta = document.getElementById('scene-cta');
    const lowerSubtitle = document.getElementById('lower-third-subtitle');
    const displayTimer = document.getElementById('display-timer');
    const timelineProgress = document.getElementById('timeline-progress');
    const masterIcon = document.getElementById('master-icon');
    const masterText = document.getElementById('master-text');
    const waveBars = document.querySelectorAll('#audio-wave span');

    // Sincronização Precisa com o Áudio Neural Real MP3
    audioPlayer.ontimeupdate = () => {
      const cur = audioPlayer.currentTime;
      const dur = audioPlayer.duration || totalDuration;
      
      const mins = String(Math.floor(cur / 60)).padStart(2, '0');
      const secs = String(Math.floor(cur % 60)).padStart(2, '0');
      displayTimer.innerText = `${mins}:${secs} / 00:46`;
      
      const pct = Math.min((cur / dur) * 100, 100);
      timelineProgress.style.width = `${pct}%`;

      if (cur < 8) {
        showScene(1);
      } else if (cur < 24) {
        showScene(2);
      } else if (cur < 34) {
        showScene(3);
      } else {
        showScene(4);
      }
    };

    audioPlayer.onended = () => {
      pauseBroadcast();
      jumpToScene(4);
    };

    function toggleBroadcast() {
      if (isBroadcasting) {
        pauseBroadcast();
      } else {
        startBroadcast();
      }
    }

    function startBroadcast() {
      isBroadcasting = true;
      masterIcon.innerText = "⏸️";
      masterText.innerText = "PAUSAR TRANSMISSÃO";

      // Tentativa 1: Reproduzir o Áudio Neural MP3 Oficial da Helena
      audioPlayer.play().then(() => {
        animateWave(true);
      }).catch(e => {
        console.warn("Reprodução de MP3 bloqueada, usando fallback SpeechSynthesis:", e);
        // Fallback: Web Speech API
        window.speechSynthesis.cancel();
        synthUtterance = new SpeechSynthesisUtterance(NARRATIVE_FULL);
        synthUtterance.lang = 'pt-BR';
        synthUtterance.rate = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v => v.lang.includes('pt'));
        if (ptVoice) synthUtterance.voice = ptVoice;
        synthUtterance.onend = () => { pauseBroadcast(); jumpToScene(4); };
        window.speechSynthesis.speak(synthUtterance);
        animateWave(true);

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          if (!isBroadcasting) return;
          timerSeconds++;
          const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
          const secs = String(timerSeconds % 60).padStart(2, '0');
          displayTimer.innerText = `${mins}:${secs} / 00:46`;
          const pct = Math.min((timerSeconds / totalDuration) * 100, 100);
          timelineProgress.style.width = `${pct}%`;

          if (timerSeconds < 8) showScene(1);
          else if (timerSeconds < 24) showScene(2);
          else if (timerSeconds < 34) showScene(3);
          else showScene(4);

          if (timerSeconds >= totalDuration) clearInterval(timerInterval);
        }, 1000);
      });
    }

    function pauseBroadcast() {
      isBroadcasting = false;
      try { audioPlayer.pause(); } catch(e){}
      window.speechSynthesis.cancel();
      clearInterval(timerInterval);
      masterIcon.innerText = "▶️";
      masterText.innerText = "CONTINUAR TRANSMISSÃO";
      animateWave(false);
    }

    function resetBroadcast() {
      pauseBroadcast();
      try { audioPlayer.currentTime = 0; } catch(e){}
      timerSeconds = 0;
      displayTimer.innerText = "00:00 / 00:46";
      timelineProgress.style.width = "0%";
      jumpToScene(1);
      masterText.innerText = "INICIAR TRANSMISSÃO AO VIVO (COM VOZ)";
    }
      }, 1000);
    }

    function pauseBroadcast() {
      isBroadcasting = false;
      window.speechSynthesis.cancel();
      clearInterval(timerInterval);
      masterIcon.innerText = "▶️";
      masterText.innerText = "CONTINUAR TRANSMISSÃO";
      animateWave(false);
    }

    function resetBroadcast() {
      pauseBroadcast();
      timerSeconds = 0;
      displayTimer.innerText = "00:00 / 00:46";
      timelineProgress.style.width = "0%";
      jumpToScene(1);
      masterText.innerText = "INICIAR TRANSMISSÃO AO VIVO (COM VOZ)";
    }

    function showScene(sceneNum) {
      sceneIntro.classList.add('hidden');
      sceneRanking.classList.add('hidden');
      sceneTable.classList.add('hidden');
      sceneCta.classList.add('hidden');

      const buttons = document.querySelectorAll('.scene-btn');
      buttons.forEach((btn, idx) => {
        if (idx === sceneNum - 1) {
          btn.classList.add('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/40');
          btn.classList.remove('text-slate-400');
        } else {
          btn.classList.remove('bg-emerald-500/20', 'text-emerald-300', 'border', 'border-emerald-500/40');
          btn.classList.add('text-slate-400');
        }
      });

      if (sceneNum === 1) {
        sceneIntro.classList.remove('hidden');
        lowerSubtitle.innerText = "Auditoria Cívica de Varejo: Menores preços apurados em Cabo Frio";
      } else if (sceneNum === 2) {
        sceneRanking.classList.remove('hidden');
        lowerSubtitle.innerText = "Ranking por Menor Soma Total: 1º Assaí R$ 41,76 | 2º SuperMarket R$ 44,16";
      } else if (sceneNum === 3) {
        sceneTable.classList.remove('hidden');
        lowerSubtitle.innerText = "Detalhamento: Arroz 5kg, Feijão 1kg, Óleo, Macarrão e Açúcar";
      } else if (sceneNum === 4) {
        sceneCta.classList.remove('hidden');
        lowerSubtitle.innerText = "Decisão do Consumidor: Baixe o App NutriPreço ou acesse mestrepratico.com.br";
      }
    }

    function jumpToScene(sceneNum) {
      showScene(sceneNum);
      if (sceneNum === 1) timerSeconds = 0;
      if (sceneNum === 2) timerSeconds = 9;
      if (sceneNum === 3) timerSeconds = 25;
      if (sceneNum === 4) timerSeconds = 35;

      const pct = Math.min((timerSeconds / totalDuration) * 100, 100);
      timelineProgress.style.width = `${pct}%`;
      const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const secs = String(timerSeconds % 60).padStart(2, '0');
      displayTimer.innerText = `${mins}:${secs} / 00:46`;
    }

    function animateWave(active) {
      waveBars.forEach((bar, idx) => {
        if (active) {
          bar.classList.add('bg-emerald-400');
          bar.classList.remove('bg-slate-600');
          bar.style.height = `${(idx % 3 + 1) * 5}px`;
        } else {
          bar.classList.remove('bg-emerald-400');
          bar.classList.add('bg-slate-600');
          bar.style.height = '6px';
        }
      });
    }

    function shareBroadcastWhatsApp() {
      const text = encodeURIComponent("📺 Olha esse telejornal de economia de Cabo Frio! Veja o ranking dos supermercados e onde a cesta básica somou mais barato:\n\nhttps://mestrepratico.com.br/estudio-economia-cabofrio/");
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
