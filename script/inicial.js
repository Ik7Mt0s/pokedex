function iniciarNavegacao(event){
    event.preventDefault();
    const botao = document.getElementById('botao-iniciar');
    botao.innerText = "Carregando...";
    botao.style.backgroundColor = "#2c3e50"
    botao.style.color = "#ecf0f1";
    setTimeout(function(){
        window.location.href = "catalogo.html";
        botao.innerText = "Iniciar Busca"
        botao.style.backgroundColor = "transparent";
    }, 1000);
}
const mensagem = "Bem-vindo ao Laboratório Oak.";
let indiceLetra = 0;
const velocidadeDigitação = 60;

function digitarTexto() {
    const elementoTexto = document.getElementById('texto-boas-vindas');
    
    if (indiceLetra < mensagem.length) {
        elementoTexto.textContent += mensagem.charAt(indiceLetra);
        indiceLetra++;
        setTimeout(digitarTexto, velocidadeDigitação);
    }
}
window.onload = digitarTexto;