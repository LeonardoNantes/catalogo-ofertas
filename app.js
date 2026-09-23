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

// ---------------- ESTADO DA PÁGINA (interesse / quantidade) ----------------
const QTY = new Map(); // codigo -> quantidade
let TODOS_ITENS = [];
let CATEGORIA_ATIVA = "todos";
let VENDEDOR_WHATSAPP = null;

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
  const totalItens = Array.from(QTY.values()).filter((q) => q > 0).length;
  if (totalItens > 0) {
    btn.textContent = `Enviar interesse (${totalItens} ${totalItens === 1 ? "item" : "itens"})`;
    btn.disabled = false;
    btnPdf.disabled = false;
  } else {
    btn.textContent = "Marque os itens de interesse";
    btn.disabled = true;
    btnPdf.disabled = true;
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
    const imagensPorCodigo = new Map();
    await Promise.all(
      itensMarcados
        .filter((i) => i.foto_url)
        .map(async (i) => {
          const dataUrl = await carregarImagemComoDataUrl(i.foto_url);
          if (dataUrl) imagensPorCodigo.set(i.codigo, dataUrl);
        })
    );

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margemX = 12;
    const larguraPagina = 210;
    const alturaPagina = 297;
    const larguraUtil = larguraPagina - margemX * 2;
    const colunas = 4;
    const gutterH = 4;
    const gutterV = 5;
    const larguraCard = (larguraUtil - gutterH * (colunas - 1)) / colunas;
    const alturaImagem = larguraCard - 4;
    const alturaCard = alturaImagem + 27;
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20);
    doc.text("Ofertas da Semana", margemX, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    const nomeVendedor = (document.getElementById("nome-vendedor").textContent || "").trim();
    const textoSemana = (document.getElementById("texto-semana").textContent || "").trim();
    doc.text([nomeVendedor, textoSemana].filter(Boolean).join(" · "), margemX, y);
    y += 9;
    doc.setDrawColor(220, 220, 220);
    doc.line(margemX, y, larguraPagina - margemX, y);
    y += 8;

    grupos.forEach((grupo) => {
      if (y + 8 + alturaCard > alturaPagina - margemX) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(14, 107, 84);
      doc.text(grupo.categoria.toUpperCase(), margemX, y);
      y += 6;

      let coluna = 0;
      grupo.itens.forEach((item) => {
        if (coluna === 0 && y + alturaCard > alturaPagina - margemX) {
          doc.addPage();
          y = 18;
        }

        const x = margemX + coluna * (larguraCard + gutterH);

        // Moldura do cartão do produto
        doc.setDrawColor(225, 224, 218);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, larguraCard, alturaCard, 1.5, 1.5, "S");

        // Foto (ou um fundo neutro no lugar, quando não tiver foto salva)
        const dataUrlImagem = imagensPorCodigo.get(item.codigo);
        const padCard = 2;
        if (dataUrlImagem) {
          try {
            doc.addImage(dataUrlImagem, formatoDaImagem(dataUrlImagem), x + padCard, y + padCard, larguraCard - padCard * 2, alturaImagem);
          } catch (erro) {
            console.error("[Ofertas da Semana] Erro ao inserir imagem no PDF:", erro);
          }
        } else {
          doc.setFillColor(244, 243, 238);
          doc.rect(x + padCard, y + padCard, larguraCard - padCard * 2, alturaImagem, "F");
        }

        let textY = y + padCard + alturaImagem + 4.5;

        // Nome do produto (até 2 linhas)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.8);
        doc.setTextColor(30, 30, 30);
        const todasLinhas = doc.splitTextToSize(item.descricao, larguraCard - padCard * 2);
        const linhasNome = todasLinhas.slice(0, 2);
        if (todasLinhas.length > 2 && linhasNome[1].length > 1) {
          linhasNome[1] = linhasNome[1].slice(0, -1) + "…";
        }
        linhasNome.forEach((linha, i) => doc.text(linha, x + padCard, textY + i * 3.2));
        textY += linhasNome.length * 3.2 + 3;

        // Código Martins + código de barras, lado a lado numa linha só
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.6);
        doc.setTextColor(120, 120, 120);
        const textoCodigos = item.codigo_barras
          ? `Cód. ${item.codigo}  •  Barras ${item.codigo_barras}`
          : `Cód. ${item.codigo}`;
        const linhaCodigos = doc.splitTextToSize(textoCodigos, larguraCard - padCard * 2)[0];
        doc.text(linhaCodigos, x + padCard, textY);
        textY += 4.5;

        // Preço em destaque (etiqueta verde) — única informação de valor no cartão
        const precoTexto = formatarPreco(item.preco);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        const larguraBadge = doc.getTextWidth(precoTexto) + 4;
        doc.setFillColor(14, 107, 84);
        doc.roundedRect(x + padCard, textY - 3.3, larguraBadge, 5.4, 1.2, 1.2, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(precoTexto, x + padCard + 2, textY + 0.3);

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
