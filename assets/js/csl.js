(function () {
  var raiz = document.documentElement;
  var semMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // entrada da capa
  requestAnimationFrame(function () { requestAnimationFrame(function () { raiz.classList.add('pronto'); }); });
  setTimeout(function () { raiz.classList.add('pronto'); }, 400);   // garantia: o texto da capa nunca fica escondido se a animação não disparar

  // capa: as fotos se alternam; os marcadores trocam na hora e a pausa acontece com o mouse em cima
  var slides = document.querySelectorAll('.capa-midia .slide');
  var pontos = document.querySelectorAll('.capa-pontos button');
  var rotulo = document.querySelector('.capa-rotulo');
  if (slides.length > 1) {
    var atual = 0, relogioCapa = null;
    var mostrarSlide = function (n) {
      atual = (n + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, i) { s.classList.toggle('ativa', i === atual); });
      Array.prototype.forEach.call(pontos, function (b, i) { b.classList.toggle('ativa', i === atual); });
      if (rotulo && pontos[atual]) rotulo.textContent = pontos[atual].getAttribute('data-rotulo');
    };
    var tocar = function () { if (!semMovimento && !relogioCapa) relogioCapa = setInterval(function () { mostrarSlide(atual + 1); }, 4000); };
    var pausar = function () { clearInterval(relogioCapa); relogioCapa = null; };
    Array.prototype.forEach.call(pontos, function (b, i) { b.addEventListener('click', function () { pausar(); mostrarSlide(i); tocar(); }); });
    var capa = document.querySelector('.capa');
    capa.addEventListener('mouseenter', pausar);
    capa.addEventListener('mouseleave', tocar);
    document.addEventListener('visibilitychange', function () { if (document.hidden) pausar(); else tocar(); });
    // ?slide=N abre direto numa foto (útil para revisar o enquadramento)
    var pedido = parseInt(new URLSearchParams(location.search).get('slide'), 10);
    if (!isNaN(pedido)) { Array.prototype.forEach.call(slides, function (s) { s.style.transition = 'none'; }); mostrarSlide(pedido); } else tocar();
  }

  // menu no celular
  var botao = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (botao && nav) {
    botao.addEventListener('click', function () {
      var aberta = nav.classList.toggle('aberta');
      botao.setAttribute('aria-expanded', aberta ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('aberta'); botao.setAttribute('aria-expanded', 'false'); }
    });
  }

  // cabeçalho compacto e o cabo de progresso, que é "pago" conforme a página desce
  var fio = document.querySelector('.fio span');
  function aoRolar() {
    var y = window.scrollY || 0;
    raiz.classList.toggle('rolou', y > 40);
    if (fio) {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      fio.style.width = (total > 0 ? Math.min(100, (y / total) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  // contagem dos números (o texto final já está no HTML; aqui só se anima até ele)
  function contar(el) {
    var texto = el.textContent.trim();
    var alvo = parseInt(texto.replace(/\./g, ''), 10);
    if (isNaN(alvo) || semMovimento) return;
    var inicio = Date.now(), dur = 1400;
    var relogio = setInterval(function () {
      var p = Math.min(1, (Date.now() - inicio) / dur);
      el.textContent = p < 1 ? Math.round(alvo * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR') : texto;
      if (p >= 1) clearInterval(relogio);
    }, 30);
    // garantia: o valor final é sempre o que está no HTML
    setTimeout(function () { clearInterval(relogio); el.textContent = texto; }, dur + 400);
  }

  // a barra de dados entra junto com a capa
  setTimeout(function () { Array.prototype.forEach.call(document.querySelectorAll('.fatos [data-conta]'), contar); }, 900);

  // revelação ao rolar: cada bloco entra uma vez; irmãos entram em sequência
  var seletores = '.intro > div, .trajetoria li, .sierra > *, .sierra-bloco, .cabeca, .linha-card, .aplic-card, .construcao, .empresa > *, .valor, .qualidade, .catalogo, .contato > *, ' +
    '.prod-grid > *, .tabela-rol, .depoimento, .irmaos, .chamada-in, .ficha-in, .creditos';
  var blocos = Array.prototype.slice.call(document.querySelectorAll(seletores));
  blocos.forEach(function (el) {
    el.setAttribute('data-rev', '');
    var irmaos = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(seletores); });
    el.style.setProperty('--i', Math.min(irmaos.indexOf(el), 5));
  });
  function revelar(el) {
    el.classList.add('visivel');
    Array.prototype.forEach.call(el.querySelectorAll('[data-conta]'), contar);
    // depois da entrada o bloco volta às próprias transições (hover etc.)
    setTimeout(function () { el.removeAttribute('data-rev'); el.style.removeProperty('--i'); }, 2400);
  }
  if ('IntersectionObserver' in window && !semMovimento) {
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) { if (it.isIntersecting) { revelar(it.target); obs.unobserve(it.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    blocos.forEach(function (el) { obs.observe(el); });
  } else {
    blocos.forEach(revelar);
  }

  // seletor de diâmetro: a seção é desenhada em milímetros CSS (1 mm = 96/25,4 px)
  var seletor = document.querySelector('[data-seletor]');
  if (seletor) {
    var dados = JSON.parse(document.getElementById('dados-tabela').textContent);
    var PX_MM = 96 / 25.4;
    var MOEDA_MM = 27; // moeda de R$ 1
    var faixa = seletor.querySelector('input[type=range]');
    var palco = seletor.querySelector('.palco');
    var secao = seletor.querySelector('.palco-secao');
    var moeda = seletor.querySelector('.moeda i');
    var escala = seletor.querySelector('.palco-escala');
    var titulo = seletor.querySelector('[data-diametro]');
    var campos = seletor.querySelectorAll('[data-col]');
    var linhas = document.querySelectorAll('.tabela-spec tbody tr');

    var LANG = document.documentElement.lang;
    var EN = LANG === 'en' || LANG === 'ar' || LANG === 'zh-CN';   // idiomas com ponto decimal
    function numero(txt) { return EN ? parseFloat(String(txt).replace(/,/g, '')) : parseFloat(String(txt).replace(/\./g, '').replace(',', '.')); }

    function mostrar(i) {
      var linha = dados.linhas[i];
      var mm = numero(linha[0]);
      var livre = Math.min(palco.clientWidth, palco.clientHeight) - 36;
      var real = mm * PX_MM;
      var fator = real > livre ? real / livre : 1;
      var lado = real / fator;
      secao.style.width = lado + 'px';
      secao.style.height = lado + 'px';
      var ladoMoeda = (MOEDA_MM * PX_MM) / fator;
      moeda.style.width = ladoMoeda + 'px';
      moeda.style.height = ladoMoeda + 'px';
      escala.textContent = (LANG === 'zh-CN' ? '比例 1:' : LANG === 'ar' ? 'المقياس 1:' : LANG === 'en' ? 'Scale 1:' : 'Escala 1:') + (fator === 1 ? '1' : (EN ? fator.toFixed(1) : fator.toFixed(1).replace('.', ',')));
      titulo.textContent = linha[0] + (LANG === 'ar' ? ' مم' : ' mm');
      Array.prototype.forEach.call(campos, function (c) { c.textContent = linha[+c.getAttribute('data-col')]; });
      Array.prototype.forEach.call(linhas, function (tr, n) { tr.classList.toggle('ativa', n === i); });
      faixa.setAttribute('aria-valuetext', linha[0] + (LANG === 'zh-CN' ? ' 毫米' : LANG === 'ar' ? ' مم' : LANG === 'en' ? ' millimetres' : ' milímetros'));
    }

    faixa.addEventListener('input', function () { mostrar(+faixa.value); });
    Array.prototype.forEach.call(linhas, function (tr, n) {
      tr.addEventListener('click', function () { faixa.value = n; mostrar(n); });
    });
    window.addEventListener('resize', function () { mostrar(+faixa.value); });
    mostrar(+faixa.value);
  }
})();
