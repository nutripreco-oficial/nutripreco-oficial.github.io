// Externalizado para conformidade com CSP Estrito (Observatory A+)
let blogAudio = null;
    let blogIsPlaying = false;

    function initBlogAudio() {
      if (!blogAudio) {
        blogAudio = new Audio('/audio/helena_boletim_cesta_basica.mp3');
        blogAudio.addEventListener('timeupdate', () => {
          const cur = blogAudio.currentTime;
          const dur = blogAudio.duration || 35;
          const mins = String(Math.floor(cur / 60)).padStart(2, '0');
          const secs = String(Math.floor(cur % 60)).padStart(2, '0');
          const totalM = String(Math.floor(dur / 60)).padStart(2, '0');
          const totalS = String(Math.floor(dur % 60)).padStart(2, '0');
          
          const elTimer = document.getElementById('blog-audio-timer');
          if (elTimer) elTimer.innerText = `${mins}:${secs} / ${totalM}:${totalS}`;
          const pct = Math.min((cur / dur) * 100, 100);
          const elProg = document.getElementById('blog-audio-progress');
          if (elProg) elProg.style.width = `${pct}%`;
        });

        blogAudio.addEventListener('ended', () => {
          blogIsPlaying = false;
          const icon = document.getElementById('icon-blog-play');
          if (icon) icon.innerText = "play_arrow";
          resetBlogWaveBars(false);
          const elProg = document.getElementById('blog-audio-progress');
          if (elProg) elProg.style.width = "0%";
        });
      }
    }

    function toggleBlogAudio() {
      const iconPlay = document.getElementById('icon-blog-play');
      initBlogAudio();

      if (blogIsPlaying) {
        if (blogAudio) blogAudio.pause();
        blogIsPlaying = false;
        if (iconPlay) iconPlay.innerText = "play_arrow";
        resetBlogWaveBars(false);
      } else {
        blogIsPlaying = true;
        if (iconPlay) iconPlay.innerText = "pause";
        resetBlogWaveBars(true);
        blogAudio.play().catch(err => {
          console.warn("Audio playback error:", err);
        });
      }
    }

    function resetBlogWaveBars(active) {
      const bars = document.querySelectorAll('#blog-wave-container div');
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
