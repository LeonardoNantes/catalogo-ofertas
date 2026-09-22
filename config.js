// ============================================================
// CONFIGURAÇÃO — Ofertas da Semana
// ============================================================
// Diferente dos catálogos de marca (Havaianas/Impala/Nadir), este app é
// UM SÓ pra todos os vendedores: não existe um config.js por pessoa. Quem
// é o vendedor vem do link (parâmetro "v" na URL, o slug cadastrado no
// Painel de Vendedores, na marca "Ofertas da Semana") — o resto dos dados
// dele (nome, foto, WhatsApp, área) é buscado no Supabase na hora.

const CONFIG = {
  supabase: {
    url: "https://eubbzefshftafjjcirna.supabase.co",
    anonKey: "sb_publishable_GZ-duizLJSQSVcdYejzWGQ_wdNUu8vA",
  },
};

// Contato do Leonardo — usado só na tela de "catálogo pausado", pro
// vendedor conseguir regularizar o acesso.
const PLATAFORMA = {
  whatsapp: "5547997375295",
};
