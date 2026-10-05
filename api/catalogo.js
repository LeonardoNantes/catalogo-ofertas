// ============================================================
// Pré-visualização personalizada do link (Open Graph) — Ofertas da Semana
// ============================================================
// O WhatsApp (e similares) não executa o JavaScript da página pra montar
// o card de pré-visualização do link — ele só lê o HTML puro que o
// servidor devolve na hora que alguém cola o link. Por isso essa função
// roda ANTES da página chegar no navegador: descobre o vendedor do link,
// busca o nome dele no Supabase, e troca o marcador __OG_TITLE__ pelo
// título pronto (ex: "Ofertas da Semana - Leonardo Nantes") dentro do
// HTML, antes de responder.
//
// Diferente do Havaianas/Nadir/Impala (que migraram de repositório-por-
// vendedor pra site único e por isso também olham um domínio antigo),
// o Ofertas da Semana já nasceu como site único — o vendedor sempre vem
// só do parâmetro "v" na URL (?v=<slug>). Não existe tabela de domínio
// antigo pra consultar aqui.

const SUPABASE_URL = "https://eubbzefshftafjjcirna.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GZ-duizLJSQSVcdYejzWGQ_wdNUu8vA";

const fs = require("fs");
const path = require("path");

async function buscarNomeVendedor(slug) {
  const url =
    `${SUPABASE_URL}/rest/v1/vendedores` +
    `?slug=eq.${encodeURIComponent(slug)}` +
    `&marca=eq.${encodeURIComponent("Ofertas da Semana")}` +
    `&select=nome` +
    `&limit=1`;

  const resposta = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!resposta.ok) throw new Error(`Supabase respondeu ${resposta.status}`);

  const linhas = await resposta.json();
  return linhas[0]?.nome || null;
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async (req, res) => {
  const htmlBase = fs.readFileSync(
    path.join(process.cwd(), "catalogo-base.html"),
    "utf-8"
  );

  let titulo = "Ofertas da Semana";

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const slug = url.searchParams.get("v");

    if (slug) {
      const nome = await buscarNomeVendedor(slug);
      if (nome) titulo = `Ofertas da Semana - ${nome}`;
    }
  } catch (erro) {
    // Qualquer falha (Supabase fora do ar, vendedor não encontrado, etc) —
    // não trava nada pro cliente, só devolve a página com o título padrão.
    console.error("[og:catalogo] Não consegui personalizar o título:", erro);
  }

  const html = htmlBase.replace(/__OG_TITLE__/g, escaparHtml(titulo));

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
};
