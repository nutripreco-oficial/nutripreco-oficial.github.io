// Externalizado para conformidade com CSP Estrito (Observatory A+)
const AUDIO_SRC = "/audio/diario_economia_semanal.mp3";
    const NARRATIVE_TEXT = "Olá, aqui é a Helena, com a edição semanal do Diário da Economia de Cabo Frio para o período de 8 a 15 de outubro de 2026. Auditamos os principais supermercados e atacados da Região dos Lagos. Na soma de cinco itens essenciais da cesta básica, o Assaí Atacadista em São Cristóvão registrou a menor soma, com 41 reais e 76 centavos, seguido pelo SuperMarket com 44 reais e 16 centavos, Mercado Rende Pacas em Nova Califórnia com 46 reais e 25 centavos, e Princesa Supermercados no Centro com 47 reais e 76 centavos. A diferença chega a 6 reais no carrinho de compras. Salve o aplicativo NutriPreço na sua tela inicial para conferir todos os preços atualizados diariamente!";

    let audioObj = null;
    let isPlaying = false;
    let synthUtterance = null;

    function initAudio() {
      if (!audioObj) {
        audioObj = new Audio(AUDIO_SRC);
        
        audioObj.addEventListener('timeupdate', () => {
          const cur = audioObj.currentTime;
          const dur = audioObj.duration || 45;
          const mins = String(Math.floor(cur / 60)).padStart(2, '0');
          const secs = String(Math.floor(cur % 60)).padStart(2, '0');
          const totalM = String(Math.floor(dur / 60)).padStart(2, '0');
          const totalS = String(Math.floor(dur % 60)).padStart(2, '0');
          
          const elTimer = document.getElementById('audio-timer');
          if (elTimer) elTimer.innerText = `${mins}:${secs} / ${totalM}:${totalS}`;
          const pct = Math.min((cur / dur) * 100, 100);
          const elProg = document.getElementById('audio-progress');
          if (elProg) elProg.style.width = `${pct}%`;
        });

        audioObj.addEventListener('ended', () => {
          isPlaying = false;
          const icon = document.getElementById('icon-play');
          if (icon) icon.innerText = "play_arrow";
          resetWaveBars(false);
          const elProg = document.getElementById('audio-progress');
          if (elProg) elProg.style.width = "0%";
        });

        audioObj.addEventListener('error', () => {
          console.warn("Audio file error, fallback to speech synthesis");
          playSpeechSynthesisFallback();
        });
      }
    }

    function toggleAudioBoletim() {
      const iconPlay = document.getElementById('icon-play');
      initAudio();

      if (isPlaying) {
        if (audioObj) audioObj.pause();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        isPlaying = false;
        if (iconPlay) iconPlay.innerText = "play_arrow";
        resetWaveBars(false);
      } else {
        isPlaying = true;
        if (iconPlay) iconPlay.innerText = "pause";
        resetWaveBars(true);

        const playPromise = audioObj.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Audio play prevented, using speech synthesis fallback:", err);
            playSpeechSynthesisFallback();
          });
        }
      }
    }

    function playSpeechSynthesisFallback() {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      synthUtterance = new SpeechSynthesisUtterance(NARRATIVE_TEXT);
      synthUtterance.lang = 'pt-BR';
      synthUtterance.rate = 1.05;
      synthUtterance.pitch = 1.1;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.includes('pt') && (v.name.includes('Luciana') || v.name.includes('Francisca') || v.name.includes('Google') || v.name.includes('Maria')));
      if (ptVoice) synthUtterance.voice = ptVoice;

      synthUtterance.onend = () => {
        isPlaying = false;
        const icon = document.getElementById('icon-play');
        if (icon) icon.innerText = "play_arrow";
        resetWaveBars(false);
      };

      window.speechSynthesis.speak(synthUtterance);
    }

    function resetWaveBars(active) {
      const bars = document.querySelectorAll('#wave-container div');
      bars.forEach(bar => {
        if (active) {
          bar.classList.add('audio-wave-bar', 'bg-emerald-400');
          bar.classList.remove('bg-slate-600');
        } else {
          bar.classList.remove('audio-wave-bar', 'bg-emerald-400');
          bar.classList.add('bg-slate-600');
          bar.style.height = '10px';
        }
      });
    }

    function shareWhatsApp() {
      const text = encodeURIComponent("🗞️ Olha isso! Saiu a nova edição semanal do Diário da Economia de Cabo Frio. Veja onde o Arroz, Feijão e itens básicos estão mais baratos hoje:\n\nhttps://mestrepratico.com.br/jornal-cabo-frio/");
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
