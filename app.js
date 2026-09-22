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

  return { itens: itens || [], semanaInicio: semana_inicio, semanaFim: semana_fim };
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
          <div class="item-icone">${iconeCategoria(item.categoria, info.fg)}</div>
          <div class="item-corpo">
            <div class="item-categoria" style="color: ${info.fg};">${escapeHtml(item.categoria)}</div>
            <div class="item-descricao">${escapeHtml(item.descricao)}</div>
            <div class="item-codigos">
              <span>Cód. ${escapeHtml(item.codigo)}</span>
              ${item.codigo_barras ? `<span class="divisor"></span><span>Cód. barras ${escapeHtml(item.codigo_barras)}</span>` : ""}
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
  const totalItens = Array.from(QTY.values()).filter((q) => q > 0).length;
  if (totalItens > 0) {
    btn.textContent = `Enviar interesse (${totalItens} ${totalItens === 1 ? "item" : "itens"})`;
    btn.disabled = false;
  } else {
    btn.textContent = "Marque os itens de interesse";
    btn.disabled = true;
  }
}

document.getElementById("btn-enviar-interesse").addEventListener("click", () => {
  const itensMarcados = TODOS_ITENS.filter((i) => (QTY.get(i.codigo) || 0) > 0);
  if (itensMarcados.length === 0 || !VENDEDOR_WHATSAPP) return;

  const linhas = itensMarcados.map((i) => `- ${i.descricao} (Cód. ${i.codigo}) — Qtd: ${QTY.get(i.codigo)}`);
  const mensagem = `Olá! Vi a Ofertas da Semana e tenho interesse nestes itens:\n\n${linhas.join("\n")}`;
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
  document.getElementById("btn-whatsapp-vendedor").href = vendedor.whatsapp
    ? `https://wa.me/${vendedor.whatsapp}?text=${encodeURIComponent("Olá! Vi a Ofertas da Semana.")}`
    : "#";

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
