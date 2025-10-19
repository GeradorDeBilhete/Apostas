let palpites = [];

// Carregar palpites
async function carregarPalpites() {
  const response = await fetch('bet.txt');
  const text = await response.text();
  const linhas = text.split('\n');

  let jogos = [];
  let jogoAtual = null;
  let esporteAtual = null;

  linhas.forEach(linha => {
    linha = linha.trim();
    if (!linha) return;

    if (linha.includes('|')) {
      if (jogoAtual) jogos.push(jogoAtual);
      [esporteAtual, nomeJogo] = linha.split('|');
      jogoAtual = { esporte: esporteAtual, nome: nomeJogo, palpites: [] };
    } else {
      const partes = linha.split(' ');
      const porcentagem = partes.pop();
      const odd = partes.pop();
      const mercado = partes.join(' ');
      jogoAtual.palpites.push({ mercado, odd, porcentagem });
    }
  });

  if (jogoAtual) jogos.push(jogoAtual);
  palpites = jogos;

  criarFiltros();
}

// Criar filtros de esportes e mercados
function criarFiltros() {
  const esportesContainer = document.getElementById('esportesContainer');
  const mercadosContainer = document.getElementById('mercadosContainer');

  esportesContainer.innerHTML = '';
  mercadosContainer.innerHTML = '';

  const esportes = [...new Set(palpites.map(j => j.esporte))];

  esportes.forEach(esporte => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${esporte}" class="filtroEsporte"> ${esporte}`;
    esportesContainer.appendChild(label);
  });

  document.querySelectorAll('.filtroEsporte').forEach(cb => {
    cb.addEventListener('change', atualizarMercados);
  });
}

// Atualizar mercados
function atualizarMercados() {
  const mercadosContainer = document.getElementById('mercadosContainer');
  mercadosContainer.innerHTML = '';

  const esportesSelecionados = Array.from(document.querySelectorAll('.filtroEsporte:checked')).map(cb => cb.value);
  if (esportesSelecionados.length === 0) return;

  let mercados = [];
  palpites.forEach(j => {
    if (esportesSelecionados.includes(j.esporte)) {
      j.palpites.forEach(p => {
        if (!mercados.includes(p.mercado)) mercados.push(p.mercado);
      });
    }
  });

  mercados.forEach(m => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${m}" class="filtroMercado"> ${m}`;
    mercadosContainer.appendChild(label);
  });
}

// Gerar bilhete filtrado
async function gerarBilhete() {
  const esportesSelecionados = Array.from(document.querySelectorAll('.filtroEsporte:checked')).map(cb => cb.value);
  const mercadosSelecionados = Array.from(document.querySelectorAll('.filtroMercado:checked')).map(cb => cb.value);

  let jogosFiltrados = palpites.filter(j => esportesSelecionados.includes(j.esporte));
  jogosFiltrados = jogosFiltrados.sort(() => 0.5 - Math.random()).slice(0, 5);

  const bilhete = [];

  jogosFiltrados.forEach(jogo => {
    let palpitesDisponiveis = jogo.palpites.filter(p => mercadosSelecionados.includes(p.mercado));
    if (palpitesDisponiveis.length === 0) return;

    const palpite = palpitesDisponiveis[Math.floor(Math.random() * palpitesDisponiveis.length)];
    bilhete.push({ jogo: jogo.nome, mercado: palpite.mercado, odd: palpite.odd, porcentagem: palpite.porcentagem });
  });

  const oddTotal = bilhete.reduce((acc, item) => acc * parseFloat(item.odd), 1).toFixed(2);

  return { bilhete, oddTotal };
}

// Mostrar bilhete com emojis
async function mostrarBilhete() {
  const resultado = await gerarBilhete();
  const container = document.getElementById('bilheteContainer');
  container.innerHTML = '';

  if (resultado.bilhete.length === 0) {
    container.innerHTML = '<p>⚠️ Selecione ao menos um esporte e mercado disponível!</p>';
    return;
  }

  const bilheteDiv = document.createElement('div');
  bilheteDiv.classList.add('bilhete');

  resultado.bilhete.forEach(item => {
    const jogoP = document.createElement('p');
    jogoP.textContent = `🎟️ ${item.jogo} - ${item.mercado} Odd: ${item.odd} ${item.porcentagem}%`;
    bilheteDiv.appendChild(jogoP);
  });

  const totalP = document.createElement('p');
  totalP.innerHTML = `<strong>💰 Odd Total: ${resultado.oddTotal}</strong>`;
  bilheteDiv.appendChild(totalP);

  container.appendChild(bilheteDiv);
}

document.getElementById('gerarBtn').addEventListener('click', mostrarBilhete);

carregarPalpites();