// ============================================================
// Registrar acesso ao catálogo (com IP) — roda no servidor
// ============================================================
// O navegador não consegue descobrir com confiança o próprio IP público, e
// não devia gravar esse dado direto no Supabase (um cliente malicioso
// poderia mandar qualquer IP). Por isso quem grava o acesso agora é essa
// função, que roda no servidor da Vercel: ela lê o IP real de quem fez a
// requisição (cabeçalho padrão da Vercel, x-forwarded-for) e grava junto
// com o vendedor_slug na tabela "ofertas_visualizacoes" — a mesma tabela de
// todos os catálogos, que alimenta a tela "Acessos" do Painel de
// Vendedores.
//
// Pra que serve o IP: tentar diferenciar, mais pra frente, o próprio
// vendedor abrindo o link dele dos clientes dele (endereço que se repete
// bastante = provavelmente o vendedor; endereços variados = provavelmente
// clientes diferentes). É uma pista aproximada, não uma identificação
// certa — IP de rede compartilhada/4G pode mudar ou se repetir por outros
// motivos. Não é usado pra mais nada.
//
// Chamado pelo app.js via fetch("/api/registrar-acesso?v=<slug>") no lugar
// do insert direto pelo supabase-js. Não trava a navegação do cliente se
// der erro — qualquer falha fica só no log do servidor.

const SUPABASE_URL = "https://eubbzefshftafjjcirna.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GZ-duizLJSQSVcdYejzWGQ_wdNUu8vA";

function descobrirIp(req) {
  const encaminhado = req.headers["x-forwarded-for"];
  if (encaminhado) return String(encaminhado).split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const slug = url.searchParams.get("v");

    if (!slug) {
      res.status(400).json({ ok: false, erro: "faltou o parâmetro v" });
      return;
    }

    const ip = descobrirIp(req);

    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/ofertas_visualizacoes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ vendedor_slug: slug, ip }),
    });

    if (!resposta.ok) {
      console.error(`[registrar-acesso] Supabase respondeu ${resposta.status}`);
    }

    res.status(200).json({ ok: resposta.ok });
  } catch (erro) {
    console.error("[registrar-acesso] Não consegui registrar o acesso:", erro);
    // Nunca devolve erro pro cliente por causa disso - não é crítico pra
    // navegação, só perde o registro dessa visita.
    res.status(200).json({ ok: false });
  }
};
