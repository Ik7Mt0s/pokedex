const BASE_API = 'https://pokeapi.co/api/v2';
let pokemonAtual = [];


let pokemonFavoritos = JSON.parse(localStorage.getItem('meusFavoritos')) || [];

function capitalizar(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function exibirErro(mensagem) {
    const grade = document.getElementById('catalog-grid');
    if (grade) {
        grade.innerHTML = `<div class="msg msg-erro">⚠️ ${mensagem}</div>`;
    }
}

function traduzirTipo(tipo) {
    const mapa = {
        normal:'Normal', fire:'Fogo', water:'Água', electric:'Elétrico',
        grass:'Grama', ice:'Gelo', fighting:'Lutador', poison:'Venenoso',
        ground:'Terra', flying:'Voador', psychic:'Psíquico', bug:'Inseto',
        rock:'Pedra', ghost:'Fantasma', dragon:'Dragão', dark:'Sombrio',
        steel:'Aço', fairy:'Fada'
    };
    return mapa[tipo] || tipo;
}

async function buscarListaPokemon(limite, offset) {
    try {
        const resposta = await fetch(`${BASE_API}/pokemon?limit=${limite}&offset=${offset}`);
        const dados = await resposta.json();
        const promessas = dados.results.map(p => fetch(p.url).then(r => r.json()));
        return await Promise.all(promessas);
    } catch (erro) {
        exibirErro('Erro ao carregar a lista de Pokémon');
        return [];
    }
}

async function buscarPokemon(consulta) {
    try {
        const resposta = await fetch(`${BASE_API}/pokemon/${consulta.toLowerCase().trim()}`);
        if (!resposta.ok) throw new Error('Pokémon não encontrado');
        return await resposta.json();
    } catch (erro) {
        exibirErro(erro.message);
        return null;
    }
}


function inicializarFavoritos(){
    atualizarTelaFavoritos();
}

function atualizarTelaFavoritos() {
    const section = document.getElementById('favorites-section');
    if (!section) return;

    if (pokemonFavoritos.length === 0) {
        section.style.display = 'none';
    } else {
        section.style.display = 'block';
        
        
        const favoritados = pokemonAtual.filter(p => pokemonFavoritos.includes(p.id));
        
        
        renderizarGrade(favoritados, 'favorites-grid');
    }
}   


function alternarFavorito(pokemon) {
    const index = pokemonFavoritos.indexOf(pokemon.id);

    if (index === -1) {
        pokemonFavoritos.push(pokemon.id);
        console.log(`Pokémon ${pokemon.name} adicionado aos favoritos!`);
    } else {
        pokemonFavoritos.splice(index, 1);
        console.log(`Pokémon ${pokemon.name} removido dos favoritos!`);
    }

    
    localStorage.setItem('meusFavoritos', JSON.stringify(pokemonFavoritos));

    
    atualizarTelaFavoritos();
}

async function buscarCadeiaEvolucao(urlEspecie) {
    try {
        const especie = await (await fetch(urlEspecie)).json();
        const evolucao = await (await fetch(especie.evolution_chain.url)).json();
        return analisarCadeia(evolucao.chain);
    } catch {
        return [];
    }
}

function analisarCadeia(cadeia) {
    const estagios = [];
    function percorrer(no) {
        const id = no.species.url.split('/').slice(-2, -1)[0];
        estagios.push({
            nome: no.species.name,
            id: id,
            imagem: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
        });
        no.evolves_to.forEach(e => percorrer(e));
    }
    percorrer(cadeia);
    return estagios;
}

function criarCard(pokemon) {
    const tipos = pokemon.types.map(t => t.type.name);
    const card = document.createElement('div');
    card.className = 'pokemon-card';
    card.dataset.id = pokemon.id;
    card.innerHTML = `
        <span class="pokemon-id">#${String(pokemon.id).padStart(3, '0')}</span>
        <div class="pokemon-image-container">
            <img class="pokemon-image" src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        </div>
        <h3 class="pokemon-name">${capitalizar(pokemon.name)}</h3>
        <div class="pokemon-types">
            ${tipos.map(t => `<span class="type-badge type-${t}">${traduzirTipo(t)}</span>`).join('')}
        </div>
    `;
    card.onclick = () => abrirModal(pokemon);
    return card;
}

function renderizarGrade(lista, idContainer) {
    const grade = document.getElementById(idContainer);
    if (!grade) return;
    grade.innerHTML = '';
    if (!lista || lista.length === 0) {
        grade.innerHTML = '<div class="msg">Nenhum Pokémon encontrado</div>';
        return;
    }
    lista.forEach(p => grade.appendChild(criarCard(p)));
}

function filtrarPokemonPorTermo(termo) {
    if (!termo || termo.trim() === '') {
        renderizarGrade(pokemonAtual, 'catalog-grid');
        return;
    }
    const termoLower = termo.toLowerCase().trim();
    const filtrados = pokemonAtual.filter(p => 
        p.name.toLowerCase().includes(termoLower) || 
        String(p.id).includes(termoLower)
    );
    renderizarGrade(filtrados, 'catalog-grid');
}

async function abrirModal(pokemon) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    const imagemAlta = pokemon.sprites.other?.['official-artwork']?.front_default ||
                       pokemon.sprites.front_default ||
                       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png";

    const tiposHtml = pokemon.types.map(t => 
        `<span class="modal-type-badge">${traduzirTipo(t.type.name)}</span>`
    ).join('');

    const estagiosEvo = await buscarCadeiaEvolucao(pokemon.species.url);
    const htmlEvo = estagiosEvo.length > 1
        ? `<div class="evolution-chain">
            ${estagiosEvo.map((e, i) => `
                <div class="evolution-stage" data-id="${e.id}">
                    <img src="${e.imagem}" alt="${e.nome}">
                    <p>${capitalizar(e.nome)}</p>
                </div>
                ${i < estagiosEvo.length - 1 ? '<span class="evolution-arrow">→</span>' : ''}
            `).join('')}
           </div>`
        : '<p style="text-align:center; color:#aaa;">Sem evoluções conhecidas.</p>';

    const temShiny = !!pokemon.sprites.other?.['official-artwork']?.front_shiny || !!pokemon.sprites.front_shiny;
    const imagemShinyAlta = pokemon.sprites.other?.['official-artwork']?.front_shiny || pokemon.sprites.front_shiny || imagemAlta;

    
    const ehFavorito = pokemonFavoritos.includes(pokemon.id);

    const corpoModal = document.getElementById('modal-body');
    if (corpoModal) {
        corpoModal.innerHTML = `
            <div class="modal-image-wrapper">
                <img class="modal-image" src="${imagemAlta}" alt="${pokemon.name}">
            </div>
            <div class="modal-id">#${String(pokemon.id).padStart(3, '0')}</div>
            <div class="modal-name">${capitalizar(pokemon.name)}</div>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <button id="btn-favorito" class="btn-favorito ${ehFavorito ? 'ativo' : ''}">
                    ${ehFavorito ? '⭐ Remover dos Favoritos' : '⭐ Adicionar aos Favoritos'}
                </button>
            </div>

            <div class="modal-types">${tiposHtml}</div>

            <div class="modal-info-grid">
                <div class="info-box">
                    <div class="info-label">Altura</div>
                    <div class="info-value">${(pokemon.height / 10).toFixed(1)}<span class="info-unit">m</span></div>
                </div>
                <div class="info-box">
                    <div class="info-label">Peso</div>
                    <div class="info-value">${(pokemon.weight / 10).toFixed(1)}<span class="info-unit">kg</span></div>
                </div>
            </div>

            <div class="modal-stats">
                <div class="stats-title">Estatísticas Base</div>
                ${pokemon.stats.map(stat => {
                    const statNames = { hp:'HP', attack:'Ataque', defense:'Defesa',
                        'special-attack':'Atq.Esp.', 'special-defense':'Def.Esp.', speed:'Velocidade' };
                    const porcentagem = Math.min((stat.base_stat / 255) * 100, 100);
                    return `
                        <div class="stat-row">
                            <div class="stat-name">${statNames[stat.stat.name] || stat.stat.name}</div>
                            <div class="stat-bar-bg">
                                <div class="stat-bar-fill" style="width: 0%" data-width="${porcentagem}%"></div>
                            </div>
                            <div class="stat-value">${stat.base_stat}</div>
                        </div>
                    `;
                }).join('')}
            </div>

            ${temShiny ? `
            <div class="form-tabs">
                <button class="form-tab active" data-sprite-normal="${imagemAlta}" data-sprite-shiny="${imagemShinyAlta}">Normal</button>
                <button class="form-tab" data-sprite-normal="${imagemAlta}" data-sprite-shiny="${imagemShinyAlta}">Shiny</button>
            </div>` : ''}

            <div style="margin-top:20px;">
                <div class="stats-title">Cadeia Evolutiva</div>
                ${htmlEvo}
            </div>
        `;
    }

    
    

    const normalBtn = document.querySelector('.form-tab:first-child');
    const shinyBtn = document.querySelector('.form-tab:last-child');
    if (normalBtn && shinyBtn) {
        normalBtn.onclick = () => {
            document.querySelector('.modal-image').src = normalBtn.dataset.spriteNormal;
            normalBtn.classList.add('active');
            shinyBtn.classList.remove('active');
        };
        shinyBtn.onclick = () => {
            document.querySelector('.modal-image').src = shinyBtn.dataset.spriteShiny;
            shinyBtn.classList.add('active');
            normalBtn.classList.remove('active');
        };
    }

    document.querySelectorAll('.evolution-stage').forEach(stage => {
        stage.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = stage.dataset.id;
            const resposta = await fetch(`${BASE_API}/pokemon/${id}`);
            const pokemonClicado = await resposta.json();
            abrirModal(pokemonClicado);
        });
    });

    overlay.style.display = 'flex';

    setTimeout(() => {
        document.querySelectorAll('.stat-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width;
        });
    }, 100);
}

function fecharModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
}

function configurarModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target === overlay) fecharModal();
        };
    }
    if (closeBtn) {
        closeBtn.onclick = fecharModal;
    }
}

const campoBusca = document.getElementById('search-input');
const botaoBusca = document.getElementById('search-btn');

async function executarBuscaExata() {
    const consulta = campoBusca.value.trim();
    if (!consulta) {
        filtrarPokemonPorTermo('');
        return;
    }
    const grade = document.getElementById('catalog-grid');
    if (grade) grade.innerHTML = '<div class="msg">Buscando...</div>';
    const pokemon = await buscarPokemon(consulta);
    if (pokemon) {
        renderizarGrade([pokemon], 'catalog-grid');
    }
}

async function iniciar() {
    configurarModal();
    if (botaoBusca) botaoBusca.onclick = executarBuscaExata;
    if (campoBusca) {
        campoBusca.onkeypress = (e) => { if (e.key === 'Enter') executarBuscaExata(); };
        campoBusca.addEventListener('input', (e) => {
            filtrarPokemonPorTermo(e.target.value);
        });
    }
    const grade = document.getElementById('catalog-grid');
    if (grade) grade.innerHTML = '<div class="msg">Carregando Pokémon...</div>';
    pokemonAtual = await buscarListaPokemon(1025, 0);
    renderizarGrade(pokemonAtual, 'catalog-grid');
    
    
    inicializarFavoritos();
}

document.addEventListener('DOMContentLoaded', iniciar);
