// Externalizado para conformidade com CSP Estrito (Observatory A+)
function filterArticles(city) {
      const items = document.querySelectorAll('.article-item');
      const tabs = ['all', 'cabofrio', 'recife', 'rio'];
      
      tabs.forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (btn) {
          if (t === city) {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs transition';
          } else {
            btn.className = 'px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition';
          }
        }
      });

      items.forEach(item => {
        if (city === 'all') {
          item.style.display = 'flex';
        } else if (item.classList.contains(city)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    }
