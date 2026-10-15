// Externalizado para conformidade com CSP Estrito (Observatory A+)
function toggleAcessibilidade() {
      const isAtivo = document.body.classList.toggle('modo-acessibilidade');
      localStorage.setItem('mestrepratico_acessibilidade', isAtivo ? 'true' : 'false');
    }
    if (localStorage.getItem('mestrepratico_acessibilidade') === 'true') {
      document.body.classList.add('modo-acessibilidade');
    }
