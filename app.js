// ============================================================
// OFERTAS DA SEMANA — página do cliente final
// ============================================================
// Um site só pra todos os vendedores — sem repositório por pessoa. O
// vendedor é identificado pelo parâmetro "v" na URL (o slug cadastrado no
// Painel de Vendedores, na marca "Ofertas da Semana"); os dados dele
// (nome, foto, WhatsApp, área) vêm do Supabase na hora que a página abre.

// ---------------- CATEGORIAS: cor e ícone ----------------
const CATEGORIAS_INFO = {
  "Limpeza": { bg: "#E3EFEA", fg: "#0E6B54" },
  "Mercearia": { bg: "#FBEAE0", fg: "#8C3115" },
  "Higiene & Beleza": { bg: "#EFE8F5", fg: "#6B4D9E" },
  "Bebidas": { bg: "#E1EEF9", fg: "#1B5E8C" },
  "Bomboniere": { bg: "#FCE7EF", fg: "#A33566" },
  "Brinquedos & Bazar": { bg: "#FFF4D9", fg: "#96660A" },
  "Eletro & Utilidades": { bg: "#E9E8F5", fg: "#4C4791" },
  "Material de Construção": { bg: "#F2ECDD", fg: "#7A5C1E" },
  "Papelaria": { bg: "#EAF2E1", fg: "#4C7A1F" },
  "Outros": { bg: "#ECECEA", fg: "#5E5D59" },
};
const ORDEM_CATEGORIAS = Object.keys(CATEGORIAS_INFO);

function infoCategoria(categoria) {
  return CATEGORIAS_INFO[categoria] || CATEGORIAS_INFO["Outros"];
}

function iconeCategoria(categoria, cor) {
  const icones = {
    "Limpeza": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="14" r="6"></circle><circle cx="16" cy="9" r="4"></circle></svg>`,
    "Mercearia": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16l-1.5 9a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 9z"></path><path d="M8 9a4 4 0 0 1 8 0"></path></svg>`,
    "Higiene & Beleza": `<svg width="24" height="24" viewBox="0 0 24 24" fill="${cor}"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"></path></svg>`,
    "Bebidas": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l-1.2 15a2 2 0 0 1-2 1.8h-3.6a2 2 0 0 1-2-1.8L7 3z"></path><path d="M6 3h12"></path></svg>`,
    "Bomboniere": `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"></path><path d="M2 6l6 6-6 6M22 6l-6 6 6 6"></path></svg>`,
    "Brinquedos & Bazar": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M4 8l2-4h12l2 4"></path><path d="M12 8v12"></path></svg>`,
    "Eletro & Utilidades": `<svg width="24" height="24" viewBox="0 0 24 24" fill="${cor}"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"></path></svg>`,
    "Material de Construção": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a5 5 0 0 1-6.6 6.6L5.6 21.4a2 2 0 0 1-2.8-2.8L12.2 9.2a5 5 0 0 1 6.6-6.6l-3.1 3.1z"></path></svg>`,
    "Papelaria": `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"></path></svg>`,
  };
  return icones[categoria] || `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
}

// ---------------- SUPABASE ----------------
let _client = null;
function getClient() {
  if (_client) return _client;
  _client = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  return _client;
}

// ---------------- TROCA DE TELA ----------------
const ESTADOS = ["tela-carregando", "tela-erro", "tela-pausado", "tela-vazio", "app"];
function mostrarEstado(id) {
  ESTADOS.forEach((e) => { document.getElementById(e).hidden = e !== id; });
}

function pegarSlugDaUrl() {
  return new URLSearchParams(window.location.search).get("v");
}

// Grava uma linha toda vez que o link é aberto — é o que permite o
// Leonardo ver depois quais vendedores usam mais essa ferramenta. Não
// trava a navegação se falhar.
async function registrarVisita(slug) {
  try {
    await getClient().from("ofertas_visualizacoes").insert({ vendedor_slug: slug });
  } catch (erro) {
    console.error("[Ofertas da Semana] Não consegui registrar a visita:", erro);
  }
}

async function buscarVendedor(slug) {
  const { data, error } = await getClient()
    .from("vendedores")
    .select("nome, area, whatsapp, foto_url, ativo")
    .eq("slug", slug)
    .eq("marca", "Ofertas da Semana")
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Pega a semana mais recente já publicada pra essa área, e todos os itens
// dela (o "Complemento" pode ter somado itens ao longo da semana — aqui
// pega tudo que estiver publicado nessa semana_inicio).
async function buscarOfertaAtual(area) {
  const { data: semanas, error: erroSemanas } = await getClient()
    .from("ofertas_semana")
    .select("semana_inicio, semana_fim")
    .eq("area", area)
    .order("semana_inicio", { ascending: false })
    .limit(1);
  if (erroSemanas) throw erroSemanas;
  if (!semanas || semanas.length === 0) return { itens: [], semanaInicio: null, semanaFim: null };

  const { semana_inicio, semana_fim } = semanas[0];
  const { data: itens, error: erroItens } = await getClient()
    .from("ofertas_semana")
    .select("codigo, codigo_barras, descricao, categoria, preco, ordem")
    .eq("area", area)
    .eq("semana_inicio", semana_inicio)
    .order("ordem", { ascending: true });
  if (erroItens) throw erroItens;

  const itensComFoto = await anexarFotosDosProdutos(itens || []);

  return { itens: itensComFoto, semanaInicio: semana_inicio, semanaFim: semana_fim };
}

// Produtos que já tiverem foto cadastrada (banco de fotos, por código
// Martins) mostram a foto de verdade no lugar do ícone da categoria.
async function anexarFotosDosProdutos(itens) {
  if (itens.length === 0) return itens;
  try {
    const codigos = itens.map((i) => i.codigo);
    const { data, error } = await getClient()
      .from("ofertas_fotos")
      .select("codigo, foto_url")
      .in("codigo", codigos);
    if (error) throw error;
    const fotoPorCodigo = new Map((data || []).map((f) => [f.codigo, f.foto_url]));
    return itens.map((item) => ({ ...item, foto_url: fotoPorCodigo.get(item.codigo) || null }));
  } catch (erro) {
    console.error("[Ofertas da Semana] Não consegui buscar as fotos dos produtos:", erro);
    return itens;
  }
}

function formatarDataCurta(dataISO) {
  if (!dataISO) return "";
  const [, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}`;
}

function formatarPreco(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

// Só o número, sem o "R$" na frente — usado nos cartões do PNG/PDF, onde
// o "R$" já aparece separado, como um rótulo pequeno em cima do preço.
function formatarPrecoSemPrefixo(valor) {
  return Number(valor).toFixed(2).replace(".", ",");
}

// ---------------- ESTADO DA PÁGINA (interesse / quantidade) ----------------
const QTY = new Map(); // codigo -> quantidade
let TODOS_ITENS = [];
let CATEGORIA_ATIVA = "todos";
let VENDEDOR_WHATSAPP = null;
let AREA_VENDEDOR = "SC";

function inc(codigo) {
  QTY.set(codigo, (QTY.get(codigo) || 0) + 1);
  renderizarItens();
  atualizarRodape();
}
function dec(codigo) {
  QTY.set(codigo, Math.max(0, (QTY.get(codigo) || 0) - 1));
  renderizarItens();
  atualizarRodape();
}
function toggleInteresse(codigo) {
  const atual = QTY.get(codigo) || 0;
  QTY.set(codigo, atual > 0 ? 0 : 1);
  renderizarItens();
  atualizarRodape();
}

function renderizarAbas() {
  const categoriasPresentes = ORDEM_CATEGORIAS.filter((c) => TODOS_ITENS.some((i) => i.categoria === c));
  const abas = [{ key: "todos", label: "Todos" }, ...categoriasPresentes.map((c) => ({ key: c, label: c }))];

  const nav = document.getElementById("categoria-tabs");
  nav.innerHTML = abas
    .map((a) => `<button type="button" class="categoria-tab${a.key === CATEGORIA_ATIVA ? " ativa" : ""}" data-key="${escapeAttr(a.key)}">${escapeHtml(a.label)}</button>`)
    .join("");
  nav.querySelectorAll(".categoria-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      CATEGORIA_ATIVA = btn.dataset.key;
      renderizarAbas();
      renderizarItens();
    });
  });
}

function renderizarItens() {
  const lista = document.getElementById("lista-itens");
  const itensFiltrados = TODOS_ITENS.filter((i) => CATEGORIA_ATIVA === "todos" || i.categoria === CATEGORIA_ATIVA);

  if (itensFiltrados.length === 0) {
    lista.innerHTML = '<p class="sem-itens">Nenhum item nessa categoria.</p>';
    return;
  }

  lista.innerHTML = itensFiltrados
    .map((item) => {
      const info = infoCategoria(item.categoria);
      const qty = QTY.get(item.codigo) || 0;
      const interessado = qty > 0;
      return `
        <div class="item-card" style="background: ${info.bg};">
          <div class="item-icone"${item.foto_url ? ` style="background-image:url('${escapeAttr(item.foto_url)}')"` : ""}>${item.foto_url ? "" : iconeCategoria(item.categoria, info.fg)}</div>
          <div class="item-corpo">
            <div class="item-descricao">${escapeHtml(item.descricao)}</div>
            <div class="item-codigos">
              <span>Cód. ${escapeHtml(item.codigo)}</span>
              ${item.codigo_barras ? `<span class="divisor"></span><span>Barras ${escapeHtml(item.codigo_barras)}</span>` : ""}
            </div>
            <div class="item-acao-linha">
              <div class="item-preco">${formatarPreco(item.preco)}</div>
              ${interessado
                ? `<div class="item-qty" data-codigo="${escapeAttr(item.codigo)}">
                     <button type="button" class="btn-dec" aria-label="Diminuir quantidade">−</button>
                     <div class="qty-valor">${qty}</div>
                     <button type="button" class="btn-inc" aria-label="Aumentar quantidade">+</button>
                   </div>`
                : `<button type="button" class="item-interesse-pill" data-codigo="${escapeAttr(item.codigo)}">Tenho interesse</button>`}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  lista.querySelectorAll(".item-qty").forEach((el) => {
    const codigo = el.dataset.codigo;
    el.querySelector(".btn-dec").addEventListener("click", () => dec(codigo));
    el.querySelector(".btn-inc").addEventListener("click", () => inc(codigo));
  });
  lista.querySelectorAll(".item-interesse-pill").forEach((btn) => {
    btn.addEventListener("click", () => toggleInteresse(btn.dataset.codigo));
  });
}

function atualizarRodape() {
  const btn = document.getElementById("btn-enviar-interesse");
  const btnPdf = document.getElementById("btn-gerar-pdf");
  const btnPng = document.getElementById("btn-gerar-png");
  const totalItens = Array.from(QTY.values()).filter((q) => q > 0).length;
  if (totalItens > 0) {
    btn.textContent = `Enviar interesse (${totalItens} ${totalItens === 1 ? "item" : "itens"})`;
    btn.disabled = false;
    btnPdf.disabled = false;
    btnPng.disabled = false;
  } else {
    btn.textContent = "Marque os itens de interesse";
    btn.disabled = true;
    btnPdf.disabled = true;
    btnPng.disabled = true;
  }
}

// Agrupa por categoria (ordem alfabética) e ordena os itens de cada
// categoria também em ordem alfabética — mesma lógica usada na mensagem
// do WhatsApp, reaproveitada aqui pro PDF.
function agruparPorCategoriaOrdenado(itens) {
  const porCategoria = new Map();
  itens.forEach((item) => {
    if (!porCategoria.has(item.categoria)) porCategoria.set(item.categoria, []);
    porCategoria.get(item.categoria).push(item);
  });
  const categoriasOrdenadas = Array.from(porCategoria.keys()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return categoriasOrdenadas.map((categoria) => ({
    categoria,
    itens: porCategoria.get(categoria).sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR")),
  }));
}

// Carrega a foto do produto (URL do Supabase) como base64, porque o jsPDF
// só consegue inserir imagem já em base64 — não aceita link direto.
async function carregarImagemComoDataUrl(url) {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = () => reject(new Error("Falha ao ler imagem"));
      leitor.readAsDataURL(blob);
    });
  } catch (erro) {
    console.error("[Ofertas da Semana] Não consegui carregar imagem pro PDF:", erro);
    return null;
  }
}

function formatoDaImagem(dataUrl) {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

// Caminho de retângulo arredondado no canvas (mesmo visual dos cartões do PDF).
function desenharRetanguloArredondado(ctx, x, y, largura, altura, raio) {
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.lineTo(x + largura - raio, y);
  ctx.arcTo(x + largura, y, x + largura, y + raio, raio);
  ctx.lineTo(x + largura, y + altura - raio);
  ctx.arcTo(x + largura, y + altura, x + largura - raio, y + altura, raio);
  ctx.lineTo(x + raio, y + altura);
  ctx.arcTo(x, y + altura, x, y + altura - raio, raio);
  ctx.lineTo(x, y + raio);
  ctx.arcTo(x, y, x + raio, y, raio);
  ctx.closePath();
}

// Desenha a foto preenchendo todo o espaço (largura x altura) sem esticar/
// deformar — corta as sobras da foto original, igual o "preencher" do
// Instagram, em vez de espremer a imagem pra caber.
function desenharImagemPreenchendo(ctx, img, x, y, largura, altura) {
  const razaoAlvo = largura / altura;
  const razaoFoto = img.width / img.height;
  let sx = 0, sy = 0, sLargura = img.width, sAltura = img.height;
  if (razaoFoto > razaoAlvo) {
    // Foto mais "larga" que o espaço: corta as laterais.
    sLargura = img.height * razaoAlvo;
    sx = (img.width - sLargura) / 2;
  } else {
    // Foto mais "alta" que o espaço: corta em cima/embaixo.
    sAltura = img.width / razaoAlvo;
    sy = (img.height - sAltura) / 2;
  }
  ctx.drawImage(img, sx, sy, sLargura, sAltura, x, y, largura, altura);
}

// Quebra um texto em até "maxLinhas" linhas que cabem em "larguraMax" (usa a
// fonte já configurada no ctx), cortando com "…" se sobrar texto.
function quebrarTextoCanvas(ctx, texto, larguraMax, maxLinhas) {
  const palavras = String(texto || "").split(/\s+/).filter(Boolean);
  const linhas = [];
  let linhaAtual = "";
  palavras.forEach((palavra) => {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (ctx.measureText(tentativa).width > larguraMax && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = tentativa;
    }
  });
  if (linhaAtual) linhas.push(linhaAtual);
  if (linhas.length === 0) return [""];

  if (linhas.length > maxLinhas) {
    const cortadas = linhas.slice(0, maxLinhas);
    let ultima = cortadas[maxLinhas - 1];
    while (ctx.measureText(ultima + "…").width > larguraMax && ultima.length > 1) {
      ultima = ultima.slice(0, -1);
    }
    cortadas[maxLinhas - 1] = ultima + "…";
    return cortadas;
  }
  return linhas;
}

// Carrega uma data URL como um objeto Image pronto pra desenhar no canvas.
function carregarImageElement(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

const LIMITE_ITENS_PNG = 12;

// Imagem-modelo compartilhada pelo PDF e pelo PNG (formato A4, trocada todo
// mês). Coordenadas em pixels da própria imagem, marcando a área "em
// branco" onde os cartões podem ser desenhados sem cobrir a moldura —
// vale pra qualquer template, desde que sigam sempre esse mesmo molde
// (mesmo tamanho, mesmo espaço em branco no mesmo lugar).
const CAMINHO_TEMPLATE_PADRAO = "template-oferta.jpg";
const TEMPLATE_LARGURA = 1131;
const TEMPLATE_ALTURA = 1600;
const TEMPLATE_AREA = { esq: 48, dir: 1082, topo: 210, base: 1554 };

// Cada área pode ter o seu próprio template — útil se um dia esse
// catálogo for negociado com outra empresa (ex: uma distribuidora
// parceira), cadastrada como uma área nova, com a própria identidade
// visual. Basta o arquivo existir em "templates/<nome da área>.jpg"
// (só o Leonardo sobe esse arquivo, direto no repositório); áreas sem
// template próprio usam o padrão (o da Atacado Martins).
function caminhoTemplateDaArea(area) {
  const nome = String(area || "").trim();
  return nome ? `templates/${encodeURIComponent(nome)}.jpg` : CAMINHO_TEMPLATE_PADRAO;
}
async function carregarTemplateDaArea(area) {
  const caminhoEspecifico = caminhoTemplateDaArea(area);
  if (caminhoEspecifico !== CAMINHO_TEMPLATE_PADRAO) {
    const imagemEspecifica = await carregarImageElement(caminhoEspecifico);
    if (imagemEspecifica) return imagemEspecifica;
  }
  return carregarImageElement(CAMINHO_TEMPLATE_PADRAO);
}

// O espaço dos dois lados do logo fica livre bem antes do centro (que
// ainda tem o desenho "Ofertas da Semana"), então o nome do vendedor
// (esquerda) e a validade (direita) sobem pra esse espaço — a grade de
// cartões continua começando na altura de sempre (TEMPLATE_AREA.topo).
const TEMPLATE_TEXTO_TOPO = TEMPLATE_AREA.topo - 5;
const TEMPLATE_GRADE_TOPO = TEMPLATE_AREA.topo + 18;
// Respiro do nome/validade em relação à borda da área útil (um "tabzinho"
// pra não ficar colado, pedido pelo Leonardo).
const TEMPLATE_TEXTO_INDENT = 22;

// Desenha uma grade de cartões de produto sobre o template (usada pelo
// PNG e, futuramente, pelo PDF): cartão branco com sombra suave, foto
// quadrada cortada sem esticar, nome em Montserrat itálico e o preço
// numa etiqueta preta com brilho dourado, sempre ancorada no rodapé do
// cartão — não se move de acordo com o tamanho do nome do produto.
function desenharGradeDeCartoes(ctx, itens, imagensCarregadas, opcoes) {
  const {
    colunas, areaEsq, areaTopo, larguraCard, alturaCard, gutterH, gutterV,
    padCard, larguraFoto, alturaImagem, comSombra,
  } = opcoes;

  itens.forEach((item, indice) => {
    const coluna = indice % colunas;
    const linha = Math.floor(indice / colunas);
    const x = areaEsq + coluna * (larguraCard + gutterH);
    const y = areaTopo + linha * (alturaCard + gutterV);

    // Cartão branco, sombra suave (dá referência de profundidade sobre o template)
    ctx.save();
    if (comSombra) {
      ctx.shadowColor = "rgba(20,18,14,0.18)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 5;
    }
    ctx.fillStyle = "#FFFFFF";
    desenharRetanguloArredondado(ctx, x, y, larguraCard, alturaCard, 14);
    ctx.fill();
    ctx.restore();

    // Foto (corte "preencher", sem esticar) — ou um fundo neutro, se não tiver foto salva
    const imagemItem = imagensCarregadas.get(item.codigo);
    if (imagemItem) {
      ctx.save();
      desenharRetanguloArredondado(ctx, x + padCard, y + padCard, larguraFoto, alturaImagem, 8);
      ctx.clip();
      desenharImagemPreenchendo(ctx, imagemItem, x + padCard, y + padCard, larguraFoto, alturaImagem);
      ctx.restore();
    } else {
      ctx.fillStyle = "#F4F3EE";
      desenharRetanguloArredondado(ctx, x + padCard, y + padCard, larguraFoto, alturaImagem, 8);
      ctx.fill();
    }

    // Preço — ancorado no final do cartão, etiqueta preta + brilho dourado
    // (o "R$" já aparece separado, então usa só o número aqui)
    const precoTexto = formatarPrecoSemPrefixo(item.preco);
    const alturaBadge = 52;
    const larguraBadge = larguraFoto;
    const xBadge = x + padCard;
    const yBadge = y + alturaCard - padCard - alturaBadge;

    // Título + código — calculados de baixo pra cima, colados no preço
    // (o espaço "sobrando" fica entre a foto e o texto, não entre o texto e o preço)
    ctx.font = "400 9.5px 'Work Sans', sans-serif";
    const textoCodigos = item.codigo_barras
      ? `Cód. ${item.codigo}  •  Barras ${item.codigo_barras}`
      : `Cód. ${item.codigo}`;
    const linhaCodigos = quebrarTextoCanvas(ctx, textoCodigos, larguraFoto, 1)[0];

    ctx.font = "italic 900 15px 'Montserrat', sans-serif";
    const linhasNome = quebrarTextoCanvas(ctx, item.descricao, larguraFoto, 2);

    const gapCodigoBadge = 14;
    const gapNomeCodigo = 16;
    const linhaAlturaNome = 18;

    const yCodigo = yBadge - gapCodigoBadge;
    const yUltimaLinhaNome = yCodigo - gapNomeCodigo;
    const yPrimeiraLinhaNome = yUltimaLinhaNome - (linhasNome.length - 1) * linhaAlturaNome;

    ctx.fillStyle = "#1E1E1E";
    ctx.font = "italic 900 15px 'Montserrat', sans-serif";
    linhasNome.forEach((linha, li) => ctx.fillText(linha, x + padCard, yPrimeiraLinhaNome + li * linhaAlturaNome));

    ctx.fillStyle = "#8A8A8A";
    ctx.font = "400 9.5px 'Work Sans', sans-serif";
    ctx.fillText(linhaCodigos, x + padCard, yCodigo);

    ctx.save();
    ctx.shadowColor = "rgba(246,178,27,0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#161513";
    desenharRetanguloArredondado(ctx, xBadge, yBadge, larguraBadge, alturaBadge, 10);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 10px 'Work Sans', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("R$", xBadge + 11, yBadge + 16);
    ctx.textAlign = "right";
    ctx.fillStyle = "#D8D6CF";
    ctx.fillText("unid", xBadge + larguraBadge - 11, yBadge + 16);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 900 34px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(precoTexto, x + larguraCard / 2, yBadge + alturaBadge - 10);
    ctx.textAlign = "left";
  });
}

document.getElementById("btn-gerar-png").addEventListener("click", async () => {
  const itensMarcados = TODOS_ITENS.filter((i) => (QTY.get(i.codigo) || 0) > 0);
  if (itensMarcados.length === 0) return;

  if (itensMarcados.length > LIMITE_ITENS_PNG) {
    alert(
      `Pra gerar a imagem, marque no máximo ${LIMITE_ITENS_PNG} itens por vez.\n\n` +
      `Gera a imagem com esses, desmarca eles e marca os próximos.`
    );
    return;
  }

  const botao = document.getElementById("btn-gerar-png");
  botao.disabled = true;

  try {
    // Mesma ordenação usada no PDF (categoria e depois descrição, alfabética),
    // só que aqui numa grade só, sem títulos de categoria.
    const itensOrdenados = agruparPorCategoriaOrdenado(itensMarcados).flatMap((g) => g.itens);

    const dataUrlsPorCodigo = new Map();
    await Promise.all(
      itensOrdenados
        .filter((i) => i.foto_url)
        .map(async (i) => {
          const dataUrl = await carregarImagemComoDataUrl(i.foto_url);
          if (dataUrl) dataUrlsPorCodigo.set(i.codigo, dataUrl);
        })
    );

    const imagensCarregadas = new Map();
    await Promise.all(
      Array.from(dataUrlsPorCodigo.entries()).map(async ([codigo, dataUrl]) => {
        const img = await carregarImageElement(dataUrl);
        if (img) imagensCarregadas.set(codigo, img);
      })
    );

    const imagemTemplate = await carregarTemplateDaArea(AREA_VENDEDOR);

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (erroFontes) { /* segue com a fonte padrão */ }
    }

    // Grade de 4 colunas x 3 linhas = 12 cartões, dentro do espaço em
    // branco da imagem-modelo (entre a moldura decorada e o rodapé). Uma
    // linha de texto com o vendedor + período fica logo abaixo do topo da
    // área branca, e a grade começa abaixo dessa linha.
    const larguraCanvas = TEMPLATE_LARGURA;
    const alturaCanvas = TEMPLATE_ALTURA;
    const colunas = 4;
    const linhasGrade = 3;
    const gutterH = 30;
    const gutterV = 22;
    const areaEsq = TEMPLATE_AREA.esq;
    const areaDir = TEMPLATE_AREA.dir;
    const areaBase = TEMPLATE_AREA.base;
    const yLinhaVendedor = TEMPLATE_TEXTO_TOPO;
    const areaTopo = TEMPLATE_GRADE_TOPO;

    const larguraUtil = areaDir - areaEsq;
    const alturaUtil = areaBase - areaTopo;
    const larguraCard = (larguraUtil - gutterH * (colunas - 1)) / colunas;
    const alturaCard = (alturaUtil - gutterV * (linhasGrade - 1)) / linhasGrade;
    const padCard = 10;
    const larguraFoto = larguraCard - padCard * 2;
    const alturaImagem = larguraFoto; // foto quadrada

    const canvas = document.createElement("canvas");
    canvas.width = larguraCanvas;
    canvas.height = alturaCanvas;
    const ctx = canvas.getContext("2d");

    // Fundo: a imagem-modelo (ou um fundo branco liso, se ela não carregar)
    if (imagemTemplate) {
      ctx.drawImage(imagemTemplate, 0, 0, larguraCanvas, alturaCanvas);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, larguraCanvas, alturaCanvas);
    }

    // Vendedor (esquerda) e período (direita) — aproveitando o espaço
    // livre dos dois lados do logo, que fica desimpedido bem mais cedo
    // que o centro (onde ainda está o desenho "Ofertas da Semana")
    const nomeVendedor = (document.getElementById("nome-vendedor").textContent || "").trim();
    const textoSemana = (document.getElementById("texto-semana").textContent || "").trim();
    ctx.fillStyle = "#2A2925";
    ctx.font = "600 15px 'Work Sans', sans-serif";
    if (nomeVendedor) {
      ctx.textAlign = "left";
      ctx.fillText(nomeVendedor, areaEsq + TEMPLATE_TEXTO_INDENT, yLinhaVendedor);
    }
    if (textoSemana) {
      ctx.textAlign = "right";
      ctx.fillText(textoSemana, areaDir - TEMPLATE_TEXTO_INDENT, yLinhaVendedor);
    }
    ctx.textAlign = "left";

    desenharGradeDeCartoes(ctx, itensOrdenados, imagensCarregadas, {
      colunas, areaEsq, areaTopo, larguraCard, alturaCard, gutterH, gutterV,
      padCard, larguraFoto, alturaImagem, comSombra: true,
    });

    const dataArquivo = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.download = `ofertas-da-semana-${dataArquivo}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (erro) {
    console.error("[Ofertas da Semana] Erro ao gerar imagem:", erro);
    alert("Não consegui gerar a imagem. Tenta de novo.");
  } finally {
    botao.disabled = false;
  }
});

document.getElementById("btn-gerar-pdf").addEventListener("click", async () => {
  const itensMarcados = TODOS_ITENS.filter((i) => (QTY.get(i.codigo) || 0) > 0);
  if (itensMarcados.length === 0) return;

  const botao = document.getElementById("btn-gerar-pdf");
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Gerando…";

  try {
    const grupos = agruparPorCategoriaOrdenado(itensMarcados);

    // Carrega as fotos dos itens que tiverem, em paralelo, antes de montar
    // o PDF (os itens sem foto salva simplesmente não mostram imagem).
    const dataUrlsPorCodigo = new Map();
    await Promise.all(
      itensMarcados
        .filter((i) => i.foto_url)
        .map(async (i) => {
          const dataUrl = await carregarImagemComoDataUrl(i.foto_url);
          if (dataUrl) dataUrlsPorCodigo.set(i.codigo, dataUrl);
        })
    );
    const imagensCarregadas = new Map();
    await Promise.all(
      Array.from(dataUrlsPorCodigo.entries()).map(async ([codigo, dataUrl]) => {
        const img = await carregarImageElement(dataUrl);
        if (img) imagensCarregadas.set(codigo, img);
      })
    );

    // Imagem-modelo (mesma do PNG, já escolhida pela área do vendedor) —
    // convertida pra data URL, porque o jsPDF precisa de base64/URL pra
    // inserir a imagem, não do elemento <img>.
    const imagemTemplateEl = await carregarTemplateDaArea(AREA_VENDEDOR);
    let templateDataUrl = null;
    if (imagemTemplateEl) {
      const canvasTemplate = document.createElement("canvas");
      canvasTemplate.width = imagemTemplateEl.width;
      canvasTemplate.height = imagemTemplateEl.height;
      canvasTemplate.getContext("2d").drawImage(imagemTemplateEl, 0, 0);
      templateDataUrl = canvasTemplate.toDataURL("image/jpeg", 0.92);
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const larguraPagina = 210;
    const alturaPagina = 297;

    // Área "segura" da imagem-modelo (as mesmas medidas usadas no PNG),
    // convertida de pixels pra milímetros.
    const escalaX = larguraPagina / TEMPLATE_LARGURA;
    const escalaY = alturaPagina / TEMPLATE_ALTURA;
    const areaEsq = TEMPLATE_AREA.esq * escalaX;
    const areaDir = TEMPLATE_AREA.dir * escalaX;
    const areaBase = TEMPLATE_AREA.base * escalaY;
    const yTexto = TEMPLATE_TEXTO_TOPO * escalaY;
    const areaTopo = TEMPLATE_GRADE_TOPO * escalaY;
    const indentTexto = TEMPLATE_TEXTO_INDENT * escalaX;
    const margemX = areaEsq;
    const larguraUtil = areaDir - areaEsq;

    // Desenha a imagem-modelo cobrindo a página inteira — chamada de novo
    // a cada página nova (addPage não mantém o que já foi desenhado).
    function desenharFundo() {
      if (templateDataUrl) {
        doc.addImage(templateDataUrl, "JPEG", 0, 0, larguraPagina, alturaPagina);
      }
    }

    desenharFundo();

    // Vendedor (esquerda) e período (direita) — mesmo espaço livre dos
    // dois lados do logo já usado no PNG, mais alto que o centro.
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(42, 41, 37);
    const nomeVendedor = (document.getElementById("nome-vendedor").textContent || "").trim();
    const textoSemana = (document.getElementById("texto-semana").textContent || "").trim();
    if (nomeVendedor) doc.text(nomeVendedor, margemX + indentTexto, yTexto);
    if (textoSemana) doc.text(textoSemana, areaDir - indentTexto, yTexto, { align: "right" });

    let y = areaTopo;

    const colunas = 4;
    const gutterH = 4;
    const gutterV = 7;
    const larguraCard = (larguraUtil - gutterH * (colunas - 1)) / colunas;
    const padCard = 2.2;
    const larguraFoto = larguraCard - padCard * 2;
    const alturaFoto = larguraFoto; // foto quadrada, igual à do PNG
    const alturaBadge = 9.6;
    const alturaTextos = 12.5; // nome (até 2 linhas) + código, entre a foto e a etiqueta
    const alturaCard = padCard + alturaFoto + alturaTextos + alturaBadge + padCard;

    // Recorta cada foto (sem esticar) num quadrado pronto, na resolução
    // final aproximada — mesma lógica de corte usada no PNG
    // (desenharImagemPreenchendo), só que desenhando num canvas à parte
    // em vez de direto no PDF (o jsPDF não recorta imagem sozinho).
    const ladoFotoPx = Math.round(larguraFoto * (300 / 25.4)); // ~300dpi
    const fotosRecortadas = new Map();
    imagensCarregadas.forEach((img, codigo) => {
      const canvasFoto = document.createElement("canvas");
      canvasFoto.width = ladoFotoPx;
      canvasFoto.height = ladoFotoPx;
      desenharImagemPreenchendo(canvasFoto.getContext("2d"), img, 0, 0, ladoFotoPx, ladoFotoPx);
      fotosRecortadas.set(codigo, canvasFoto.toDataURL("image/jpeg", 0.9));
    });

    grupos.forEach((grupo) => {
      if (y + 6 + alturaCard > areaBase) { doc.addPage(); desenharFundo(); y = areaTopo + 6; }

      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(11);
      doc.setTextColor(150, 106, 18);
      doc.text(grupo.categoria.toUpperCase(), margemX, y);
      y += 5.5;

      let coluna = 0;
      grupo.itens.forEach((item) => {
        if (coluna === 0 && y + alturaCard > areaBase) {
          doc.addPage();
          desenharFundo();
          y = areaTopo + 6;
        }

        const x = margemX + coluna * (larguraCard + gutterH);

        // Cartão branco com borda leve (sem sombra — o jsPDF não faz blur)
        doc.setDrawColor(225, 224, 218);
        doc.setFillColor(255, 255, 255);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, larguraCard, alturaCard, 1.8, 1.8, "FD");

        // Foto (recorte quadrado já pronto, sem esticar) ou fundo neutro
        const fotoDataUrl = fotosRecortadas.get(item.codigo);
        if (fotoDataUrl) {
          try {
            doc.addImage(fotoDataUrl, "JPEG", x + padCard, y + padCard, larguraFoto, alturaFoto);
          } catch (erro) {
            console.error("[Ofertas da Semana] Erro ao inserir imagem no PDF:", erro);
          }
        } else {
          doc.setFillColor(244, 243, 238);
          doc.rect(x + padCard, y + padCard, larguraFoto, alturaFoto, "F");
        }

        // Preço — etiqueta preta ancorada no rodapé do cartão (não se
        // move de acordo com o tamanho do nome do produto). O "R$" já
        // aparece separado, então usa só o número aqui.
        const precoTexto = formatarPrecoSemPrefixo(item.preco);
        const larguraBadge = larguraFoto;
        const xBadge = x + padCard;
        const yBadge = y + alturaCard - padCard - alturaBadge;

        // Nome + código, calculados de baixo pra cima, colados na etiqueta
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.2);
        const textoCodigos = item.codigo_barras
          ? `Cód. ${item.codigo}  •  Barras ${item.codigo_barras}`
          : `Cód. ${item.codigo}`;
        const linhaCodigos = doc.splitTextToSize(textoCodigos, larguraFoto)[0];

        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(8.3);
        const todasLinhasNome = doc.splitTextToSize(item.descricao, larguraFoto);
        const linhasNome = todasLinhasNome.slice(0, 2);
        if (todasLinhasNome.length > 2 && linhasNome[1].length > 1) {
          linhasNome[1] = linhasNome[1].slice(0, -1) + "…";
        }

        const gapCodigoBadge = 2.6;
        const gapNomeCodigo = 3.4;
        const linhaAlturaNome = 3.4;

        const yCodigo = yBadge - gapCodigoBadge;
        const yUltimaLinhaNome = yCodigo - gapNomeCodigo;
        const yPrimeiraLinhaNome = yUltimaLinhaNome - (linhasNome.length - 1) * linhaAlturaNome;

        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(8.3);
        linhasNome.forEach((linha, li) => doc.text(linha, x + padCard, yPrimeiraLinhaNome + li * linhaAlturaNome));

        doc.setTextColor(130, 130, 130);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.2);
        doc.text(linhaCodigos, x + padCard, yCodigo);

        doc.setFillColor(22, 21, 19);
        doc.roundedRect(xBadge, yBadge, larguraBadge, alturaBadge, 1.6, 1.6, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.6);
        doc.setTextColor(255, 255, 255);
        doc.text("R$", xBadge + 2, yBadge + 3.4);
        doc.setTextColor(216, 214, 207);
        doc.text("unid", xBadge + larguraBadge - 2, yBadge + 3.4, { align: "right" });

        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(13.5);
        doc.setTextColor(255, 255, 255);
        doc.text(precoTexto, x + larguraCard / 2, yBadge + alturaBadge - 2, { align: "center" });

        coluna++;
        if (coluna === colunas) {
          coluna = 0;
          y += alturaCard + gutterV;
        }
      });

      if (coluna !== 0) y += alturaCard + gutterV;
      y += 3;
    });

    const dataArquivo = new Date().toISOString().slice(0, 10);
    doc.save(`ofertas-da-semana-${dataArquivo}.pdf`);
  } catch (erro) {
    console.error("[Ofertas da Semana] Erro ao gerar PDF:", erro);
    alert("Não consegui gerar o PDF. Tenta de novo.");
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
});

document.getElementById("btn-enviar-interesse").addEventListener("click", () => {
  const itensMarcados = TODOS_ITENS.filter((i) => (QTY.get(i.codigo) || 0) > 0);
  if (itensMarcados.length === 0 || !VENDEDOR_WHATSAPP) return;

  // Agrupa por categoria (não pela ordem que o cliente foi marcando) e
  // ordena tanto as categorias quanto os itens dentro de cada uma em
  // ordem alfabética.
  const porCategoria = new Map();
  itensMarcados.forEach((item) => {
    if (!porCategoria.has(item.categoria)) porCategoria.set(item.categoria, []);
    porCategoria.get(item.categoria).push(item);
  });

  const categoriasOrdenadas = Array.from(porCategoria.keys()).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const blocos = categoriasOrdenadas.map((categoria) => {
    const itensDaCategoria = porCategoria.get(categoria).sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
    const linhas = itensDaCategoria.map((i) => `Cód: ${i.codigo} | Qtd: ${QTY.get(i.codigo)}`);
    return `- *${categoria.toUpperCase()}*\n${linhas.join("\n")}`;
  });

  const mensagem =
    `*OFERTAS DA SEMANA*\n` +
    `_Olá! tenho interesse nestes itens:_\n\n` +
    blocos.join("\n\n") +
    `\n\n_(Vamos negociar esses itens!)_`;

  const url = `https://wa.me/${VENDEDOR_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
});

// ---------------- BOOT ----------------
async function iniciar() {
  const slug = pegarSlugDaUrl();
  if (!slug) {
    mostrarEstado("tela-erro");
    return;
  }

  registrarVisita(slug);

  let vendedor;
  try {
    vendedor = await buscarVendedor(slug);
  } catch (erro) {
    console.error("[Ofertas da Semana] Erro ao buscar vendedor:", erro);
    mostrarEstado("tela-erro");
    return;
  }

  if (!vendedor) {
    mostrarEstado("tela-erro");
    return;
  }

  if (!vendedor.ativo) {
    const texto = encodeURIComponent("Olá! Meu catálogo de Ofertas da Semana está pausado, gostaria de regularizar o acesso.");
    document.getElementById("btn-pausado-whatsapp").href = `https://wa.me/${PLATAFORMA.whatsapp}?text=${texto}`;
    mostrarEstado("tela-pausado");
    return;
  }

  VENDEDOR_WHATSAPP = vendedor.whatsapp;
  AREA_VENDEDOR = vendedor.area || "SC";
  document.getElementById("nome-vendedor").textContent = vendedor.nome;

  const fotoEl = document.getElementById("foto-vendedor");
  if (vendedor.foto_url) {
    fotoEl.style.backgroundImage = `url(${vendedor.foto_url})`;
    fotoEl.textContent = "";
  } else {
    fotoEl.textContent = iniciaisDoNome(vendedor.nome);
  }

  let oferta;
  try {
    oferta = await buscarOfertaAtual(vendedor.area || "SC");
  } catch (erro) {
    console.error("[Ofertas da Semana] Erro ao buscar itens:", erro);
    mostrarEstado("tela-erro");
    return;
  }

  if (!oferta.itens || oferta.itens.length === 0) {
    mostrarEstado("tela-vazio");
    return;
  }

  TODOS_ITENS = oferta.itens;
  document.getElementById("texto-semana").textContent =
    `Ofertas de ${formatarDataCurta(oferta.semanaInicio)} a ${formatarDataCurta(oferta.semanaFim)}`;

  renderizarAbas();
  renderizarItens();
  atualizarRodape();
  mostrarEstado("app");
}

function iniciaisDoNome(nome) {
  return (nome || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(texto) {
  return String(texto || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function escapeAttr(texto) {
  return escapeHtml(texto);
}

document.addEventListener("DOMContentLoaded", iniciar);
