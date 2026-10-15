// Externalizado para conformidade com CSP Estrito (Observatory A+)
const screen = document.getElementById('phoneScreen');
    let draggedItem = null;

    // Configura Drag and Drop
    function setupDragAndDrop() {
      const cards = document.querySelectorAll('.draggable-card');

      cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
          draggedItem = card;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
          cards.forEach(c => c.classList.remove('drag-over'));
          atualizarResumoOrdem();
        });

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const target = e.currentTarget;
          if (target !== draggedItem) {
            target.classList.add('drag-over');
          }
        });

        card.addEventListener('dragleave', (e) => {
          e.currentTarget.classList.remove('drag-over');
        });

        card.addEventListener('drop', (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          target.classList.remove('drag-over');
          if (target !== draggedItem) {
            const allCards = Array.from(screen.querySelectorAll('.draggable-card'));
            const draggedIdx = allCards.indexOf(draggedItem);
            const targetIdx = allCards.indexOf(target);

            if (draggedIdx < targetIdx) {
              target.after(draggedItem);
            } else {
              target.before(draggedItem);
            }
            atualizarResumoOrdem();
          }
        });
      });
    }

    // Botões de subir/descer
    function moverBloco(btn, direcao) {
      const card = btn.closest('.draggable-card');
      if (direcao === -1 && card.previousElementSibling) {
        card.previousElementSibling.before(card);
      } else if (direcao === 1 && card.nextElementSibling) {
        card.nextElementSibling.after(card);
      }
      atualizarResumoOrdem();
    }

    // Atualiza a listagem de texto lateral
    function atualizarResumoOrdem() {
      const cards = document.querySelectorAll('.draggable-card');
      const list = document.getElementById('orderListSummary');
      list.innerHTML = '';

      const titulos = {
        'bloco_topo': '1. Topo & Modos (Mercados / Postos)',
        'bloco_logo': '2. Logo Central & Slogan',
        'bloco_busca': '3. Barra de Pesquisa Flutuante',
        'bloco_localizacao': '4. Localização GPS / Cidade Ativa',
        'bloco_botoes': '5. Botões de Ação (Pesquisar / Helena)',
        'bloco_audio_thalita': '6. Boletim de Voz da Thalita',
        'bloco_chips': '7. Atalhos Rápidos da Cesta Básica',
        'bloco_rodape': '8. Rodapé da Holding Inova Simples'
      };

      cards.forEach((c, idx) => {
        const id = c.getAttribute('data-id');
        const li = document.createElement('li');
        li.innerText = `${idx + 1}º: ${titulos[id] || id}`;
        list.appendChild(li);
      });
    }

    // Resetar para ordem padrão
    function resetarOrdemPadrao() {
      const ordemPadrao = [
        'bloco_topo',
        'bloco_logo',
        'bloco_busca',
        'bloco_localizacao',
        'bloco_botoes',
        'bloco_audio_thalita',
        'bloco_chips',
        'bloco_rodape'
      ];
      ordemPadrao.forEach(id => {
        const el = document.querySelector(`[data-id="${id}"]`);
        if (el) screen.appendChild(el);
      });
      atualizarResumoOrdem();
    }

    // Copiar para o clipboard
    function copiarEstruturaAprovada() {
      const cards = document.querySelectorAll('.draggable-card');
      let texto = "ORDEM DO LAYOUT MOBILE APROVADA PELO ARTHUR:\n";
      cards.forEach((c, idx) => {
        const id = c.getAttribute('data-id');
        texto += `${idx + 1}. ${id}\n`;
      });

      navigator.clipboard.writeText(texto).then(() => {
        const toast = document.getElementById('toastCopiado');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 4000);
      });
    }

    setupDragAndDrop();
    atualizarResumoOrdem();
