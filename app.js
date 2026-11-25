// ============================================================
// PAINEL DE PREÇOS — lógica
// ============================================================
// Ideia geral: existe uma área "base" (SC), que tem todos os produtos e
// coleções cadastrados. Cada área nova (PR - Fláviano, por exemplo) começa
// sem nenhuma linha própria — ao digitar um preço pra ela, a gente cria
// (ou atualiza) a linha daquela área, copiando o resto dos dados (nome,
// coleção, fração, foto...) da área base. Por isso o preço "some" até
// alguém digitar um valor pra aquela área. O mesmo vale pro botão
// Visível/Oculto: cada área tem seu próprio estado, então ocultar um item
// numa área não afeta as outras.

// Antes, as marcas ficavam fixas aqui no código. Agora elas vêm da tabela
// "catalogos" no Supabase (ver carregarCatalogos()) — cadastrar uma marca
// nova lá já faz ela aparecer sozinha como aba aqui, sem editar este arquivo.
let MARCAS = {};
let CATALOGOS_ORDENADOS = [];

let supabaseClient = null;
function getClient() {
  if (supabaseClient) return supabaseClient;
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error("Não consegui carregar a conexão com o Supabase. Verifique sua internet e recarregue a página.");
  }
  supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  return supabaseClient;
}

let MEU_ACESSO = null; // { nome, area } — area null = administrador
let SOU_ADMIN = false;
let AREA_SELECIONADA = CONFIG.areaBase;
let MARCA_ATUAL = null; // definido em carregarCatalogos(), com a 1ª marca ativa
let CACHE_MASTER = {}; // por marca: linhas da área base
let AREAS_CONHECIDAS = [];

const telaLogin = document.getElementById("tela-login");
const appEl = document.getElementById("app");

// ---------------- LOGIN ----------------
document.getElementById("btn-entrar").addEventListener("click", tentarLogin);
["input-email", "input-senha"].forEach((id) => {
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") tentarLogin();
  });
});

async function tentarLogin() {
  const erroEl = document.getElementById("erro-login");
  erroEl.hidden = true;
  const email = document.getElementById("input-email").value.trim();
  const senha = document.getElementById("input-senha").value;

  if (!email || !senha) {
    erroEl.textContent = "Preencha e-mail e senha.";
    erroEl.hidden = false;
    return;
  }

  try {
    const { error } = await getClient().auth.signInWithPassword({ email, password: senha });
    if (error) {
      erroEl.textContent = "E-mail ou senha incorretos.";
      erroEl.hidden = false;
      return;
    }
  } catch (erroConexao) {
    erroEl.textContent = erroConexao.message;
    erroEl.hidden = false;
    return;
  }

  await iniciarAposLogin();
}

document.getElementById("btn-sair").addEventListener("click", async () => {
  await getClient().auth.signOut();
  location.reload();
});

// ---------------- INÍCIO (login já feito ou sessão salva) ----------------
async function iniciarAposLogin() {
  const erroEl = document.getElementById("erro-login");

  const { data: sessionData } = await getClient().auth.getSession();
  const usuario = sessionData?.session?.user;
  if (!usuario) return; // continua na tela de login

  const { data: acesso, error } = await getClient()
    .from("acessos_precos")
    .select("nome, area")
    .eq("user_id", usuario.id)
    .maybeSingle();

  if (error || !acesso) {
    erroEl.textContent = "Seu login não tem uma área liberada ainda. Fale com o administrador.";
    erroEl.hidden = false;
    await getClient().auth.signOut();
    return;
  }

  MEU_ACESSO = acesso;
  SOU_ADMIN = MEU_ACESSO.area === null;
  telaLogin.hidden = true;
  appEl.hidden = false;

  const souAdmin = SOU_ADMIN;
  document.getElementById("texto-usuario").textContent = souAdmin
    ? `${MEU_ACESSO.nome} · Administrador (todas as áreas)`
    : `${MEU_ACESSO.nome} · Área: ${MEU_ACESSO.area}`;

  document.getElementById("bloco-acessos").hidden = !souAdmin;

  if (souAdmin) {
    AREA_SELECIONADA = CONFIG.areaBase;
    document.getElementById("label-area-select").hidden = false;
    document.getElementById("label-area-nova").hidden = false;
    await carregarAreasConhecidas();
    carregarListaAcessos();
  } else {
    AREA_SELECIONADA = MEU_ACESSO.area;
    document.getElementById("texto-area-fixa").hidden = false;
    document.getElementById("texto-area-fixa").textContent = `Área: ${MEU_ACESSO.area}`;
  }

  await carregarCatalogos();
  await carregarPrecosDaMarcaAtual();
}

// Se a sessão já estava salva no navegador, entra direto sem pedir senha de novo.
(async () => {
  try {
    await iniciarAposLogin();
  } catch (erro) {
    console.error("[Painel de Preços] Erro ao iniciar:", erro);
  }
})();

// ---------------- SELETOR DE ÁREA (admin) ----------------
async function carregarAreasConhecidas() {
  const select = document.getElementById("select-area");
  let areas = [CONFIG.areaBase];
  try {
    const { data } = await getClient().from("vendedores").select("area");
    if (data) {
      const extras = data.map((v) => v.area).filter(Boolean);
      areas = Array.from(new Set([...areas, ...extras]));
    }
  } catch (erro) {
    // Se não conseguir, segue só com a área base.
  }
  areas.sort((a, b) => a.localeCompare(b, "pt-BR"));
  AREAS_CONHECIDAS = areas;

  select.innerHTML = areas.map((a) => `<option value="${escapeAttr(a)}">${escapeHtml(a)}</option>`).join("");
  select.value = AREA_SELECIONADA;
}

document.getElementById("select-area").addEventListener("change", async (e) => {
  AREA_SELECIONADA = e.target.value;
  await carregarPrecosDaMarcaAtual();
});

document.getElementById("btn-usar-area-nova").addEventListener("click", async () => {
  const input = document.getElementById("input-area-nova");
  const valor = input.value.trim();
  if (!valor) return;

  if (!AREAS_CONHECIDAS.includes(valor)) {
    AREAS_CONHECIDAS.push(valor);
    AREAS_CONHECIDAS.sort((a, b) => a.localeCompare(b, "pt-BR"));
    const select = document.getElementById("select-area");
    select.innerHTML = AREAS_CONHECIDAS.map(
      (a) => `<option value="${escapeAttr(a)}">${escapeHtml(a)}</option>`
    ).join("");
  }
  document.getElementById("select-area").value = valor;
  input.value = "";
  AREA_SELECIONADA = valor;
  await carregarPrecosDaMarcaAtual();
});

// ---------------- ABAS DE MARCA (vem da tabela "catalogos") ----------------
async function carregarCatalogos() {
  try {
    const { data, error } = await getClient()
      .from("catalogos")
      .select("marca, tabela, tipo_precificacao, ordenar_por")
      .eq("ativo", true)
      .order("ordem", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Nenhum catálogo ativo encontrado.");

    MARCAS = {};
    data.forEach((c) => {
      MARCAS[c.marca] = {
        tabela: c.tabela,
        tipo: c.tipo_precificacao,
        ordenarPor: c.ordenar_por,
      };
    });
    CATALOGOS_ORDENADOS = data.map((c) => c.marca);
  } catch (erroConexao) {
    console.error("[Painel de Preços] Não consegui carregar a tabela de catálogos:", erroConexao);
    // Sem a tabela "catalogos" (ex: antes de rodar a migração), continua
    // funcionando com as 3 marcas de sempre, pra não travar o painel.
    MARCAS = {
      Havaianas: { tabela: "havaianas", tipo: "colecao", ordenarPor: [["segmento", true], ["colecao", true], ["ordem", true]] },
      Impala: { tabela: "impala", tipo: "codigo", ordenarPor: [["colecao", true], ["descricao", true]] },
      Nadir: { tabela: "nadir", tipo: "codigo", ordenarPor: [["colecao", true], ["ordem", true]] },
    };
    CATALOGOS_ORDENADOS = ["Havaianas", "Impala", "Nadir"];
  }

  if (!MARCA_ATUAL || !MARCAS[MARCA_ATUAL]) {
    MARCA_ATUAL = CATALOGOS_ORDENADOS[0];
  }

  const container = document.getElementById("filtros-marca");
  container.innerHTML = CATALOGOS_ORDENADOS.map(
    (marca) =>
      `<button class="filtro-marca${marca === MARCA_ATUAL ? " ativo" : ""}" data-marca="${escapeAttr(marca)}">${escapeHtml(marca)}</button>`
  ).join("");

  container.querySelectorAll(".filtro-marca").forEach((btn) => {
    btn.addEventListener("click", async () => {
      container.querySelectorAll(".filtro-marca").forEach((b) => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      MARCA_ATUAL = btn.dataset.marca;
      await carregarPrecosDaMarcaAtual();
    });
  });
}

// ---------------- CARREGAR E MOSTRAR PREÇOS ----------------
async function carregarPrecosDaMarcaAtual() {
  const lista = document.getElementById("lista-precos");
  lista.innerHTML = '<p class="carregando">Carregando preços…</p>';

  const config = MARCAS[MARCA_ATUAL];

  try {
    if (!CACHE_MASTER[MARCA_ATUAL]) {
      let query = getClient().from(config.tabela).select("*").eq("area", CONFIG.areaBase);
      config.ordenarPor.forEach(([coluna, asc]) => {
        query = query.order(coluna, { ascending: asc });
      });
      const { data, error } = await query;
      if (error) throw error;
      CACHE_MASTER[MARCA_ATUAL] = data || [];
    }
    const master = CACHE_MASTER[MARCA_ATUAL];

    let areaMap = new Map();
    if (AREA_SELECIONADA !== CONFIG.areaBase) {
      const { data: areaData, error: areaError } = await getClient()
        .from(config.tabela)
        .select("*")
        .eq("area", AREA_SELECIONADA);
      if (areaError) throw areaError;
      (areaData || []).forEach((row) => areaMap.set(row.codigo, row));
    } else {
      // A própria área base já tem os preços na "master" — usa ela mesma como referência.
      master.forEach((row) => areaMap.set(row.codigo, row));
    }

    if (config.tipo === "colecao") {
      renderizarHavaianas(master, areaMap);
    } else {
      renderizarPorCodigo(master, areaMap, config);
    }
  } catch (erro) {
    lista.innerHTML = `<p class="carregando">Erro ao carregar: ${erro.message}</p>`;
  }
}

// ---------------- HAVAIANAS (preço por coleção) ----------------
function renderizarHavaianas(master, areaMap) {
  const lista = document.getElementById("lista-precos");

  const porSegmento = new Map();
  master.forEach((r) => {
    if (!porSegmento.has(r.segmento)) porSegmento.set(r.segmento, new Map());
    const porColecao = porSegmento.get(r.segmento);
    if (!porColecao.has(r.colecao)) porColecao.set(r.colecao, []);
    porColecao.get(r.colecao).push(r);
  });

  lista.innerHTML = "";

  Array.from(porSegmento.keys())
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach((segmento) => {
      const porColecao = porSegmento.get(segmento);
      const grupoEl = document.createElement("div");
      grupoEl.className = "grupo-segmento";

      const colecoesOrdenadas = Array.from(porColecao.keys()).sort((a, b) => a.localeCompare(b, "pt-BR"));
      const cartoesHtml = colecoesOrdenadas
        .map((colecao) => {
          const itens = porColecao.get(colecao);
          const precoBase = itens[0].preco;
          const negociacaoBaseInfo = !!itens[0].negociacao;

          // Linha desta ÁREA pra essa coleção, se já existir uma — é ela que
          // manda no que o cliente vê de verdade (preço OU negociação vêm
          // sempre juntos, gravados pelo painel). A base só entra como
          // "dica" de referência enquanto a área ainda não tem linha própria.
          let linhaArea = null;
          for (const item of itens) {
            const linha = areaMap.get(item.codigo);
            if (linha) { linhaArea = linha; break; }
          }

          const emNegociacao = linhaArea ? !!linhaArea.negociacao : negociacaoBaseInfo;
          const precoArea = linhaArea && linhaArea.preco != null ? linhaArea.preco : null;
          const valorInput = precoArea != null ? precoArea : "";
          const placeholder = emNegociacao ? "Negociação" : `Base: ${formatarReais(precoBase)}`;
          // Visível/oculto também é por área — usa a linha desta área quando
          // já existe uma, senão cai pro estado da base como referência.
          const visivel = linhaArea ? linhaArea.ativo !== false : itens[0].ativo !== false;

          return `
            <div class="cartao-item${visivel ? "" : " oculto"}" data-colecao="${escapeAttr(colecao)}">
              <div class="item-info">
                <span class="item-nome">${escapeHtml(colecao)}</span>
                ${emNegociacao ? '<span class="item-tag-negociacao">Negociação</span>' : ""}
              </div>
              <div class="item-preco-campo">
                R$
                <input type="number" step="0.01" value="${valorInput}" placeholder="${placeholder}" data-campo="preco-colecao" />
                <button class="btn-marcar-negociacao" data-acao="marcar-negociacao" title="Deixar esta coleção sem preço fixo (Negociação)">Negociação</button>
              </div>
              <button class="btn-toggle-visibilidade ${visivel ? "visivel" : "oculto"}" data-acao="toggle-visibilidade">
                ${visivel ? "Visível" : "Oculto"}
              </button>
              <span class="item-salvando" hidden>Salvo ✓</span>
            </div>
          `;
        })
        .join("");

      grupoEl.innerHTML = `<div class="grupo-segmento-titulo">${escapeHtml(segmento)}</div>${cartoesHtml}`;
      lista.appendChild(grupoEl);

      grupoEl.querySelectorAll(".cartao-item").forEach((cartaoEl) => {
        const colecao = cartaoEl.dataset.colecao;
        const itens = porColecao.get(colecao);
        const input = cartaoEl.querySelector("input[data-campo]");
        input.addEventListener("change", () => salvarPrecoHavaianas(itens, input, cartaoEl, areaMap));
        const botaoNegociacao = cartaoEl.querySelector(".btn-marcar-negociacao");
        botaoNegociacao.addEventListener("click", () => marcarComoNegociacao(itens, input, cartaoEl, colecao, areaMap));
        const botaoVisibilidade = cartaoEl.querySelector(".btn-toggle-visibilidade");
        botaoVisibilidade.addEventListener("click", () => {
          const linhasBase = itens.map((item) => linhaDaAreaOuBase(item, areaMap));
          alternarVisibilidade("havaianas", linhasBase, linhasBase[0].ativo !== false, cartaoEl, "Havaianas", areaMap);
        });
      });
    });

  if (master.length === 0) {
    lista.innerHTML = '<p class="carregando">Nenhum produto encontrado.</p>';
  }
}

// Volta uma coleção pra "Negociação" (sem preço fixo) na área que está sendo
// editada agora — o campo "negociacao" é o mesmo que o catálogo do cliente
// olha pra decidir se mostra preço ou "Negociação" no pedido do WhatsApp.
async function marcarComoNegociacao(itens, input, cartaoEl, colecao, areaMap) {
  const confirmar = confirm(
    `Marcar "${colecao}" como Negociação (sem preço fixo) na área ${AREA_SELECIONADA}?\n\nO cliente dessa área vai ver "Negociação" no catálogo, e o item não entra na soma do pedido no WhatsApp.`
  );
  if (!confirmar) return;

  const linhas = itens.map((item) => prepararLinhaParaArea(linhaDaAreaOuBase(item, areaMap), AREA_SELECIONADA, {
    preco: null,
    negociacao: true,
  }));

  const botao = cartaoEl.querySelector(".btn-marcar-negociacao");
  input.disabled = true;
  botao.disabled = true;
  try {
    const { error } = await getClient()
      .from("havaianas")
      .upsert(linhas, { onConflict: "codigo,area" });
    if (error) throw error;

    atualizarAreaMapComLinhasSalvas(areaMap, linhas);

    input.value = "";
    input.placeholder = "Negociação";
    const infoEl = cartaoEl.querySelector(".item-info");
    if (!infoEl.querySelector(".item-tag-negociacao")) {
      infoEl.insertAdjacentHTML("beforeend", '<span class="item-tag-negociacao">Negociação</span>');
    }
    if (AREA_SELECIONADA === CONFIG.areaBase) {
      // A área base mudou de verdade — limpa o cache pra próxima troca de
      // aba recarregar certinho (a linha acima já mantém a tela atual ok).
      delete CACHE_MASTER.Havaianas;
    }
    marcarSalvo(cartaoEl);
  } catch (erro) {
    alert("Não consegui salvar: " + detalharErro(erro));
  } finally {
    input.disabled = false;
    botao.disabled = false;
  }
}

async function salvarPrecoHavaianas(itens, input, cartaoEl, areaMap) {
  const novoPreco = Number(input.value);
  if (!input.value || isNaN(novoPreco) || novoPreco <= 0) {
    alert("Digite um preço válido.");
    return;
  }

  const linhas = itens.map((item) => prepararLinhaParaArea(linhaDaAreaOuBase(item, areaMap), AREA_SELECIONADA, {
    preco: novoPreco,
    negociacao: false,
  }));

  input.disabled = true;
  try {
    const { error } = await getClient()
      .from("havaianas")
      .upsert(linhas, { onConflict: "codigo,area" });
    if (error) throw error;
    atualizarAreaMapComLinhasSalvas(areaMap, linhas);
    marcarSalvo(cartaoEl);
    if (AREA_SELECIONADA === CONFIG.areaBase) {
      // A área base mudou de verdade — limpa o cache pra recarregar certinho.
      delete CACHE_MASTER.Havaianas;
    }
  } catch (erro) {
    alert("Não consegui salvar: " + detalharErro(erro));
  } finally {
    input.disabled = false;
  }
}

// ---------------- IMPALA / NADIR (preço por código) ----------------
function renderizarPorCodigo(master, areaMap, config) {
  const lista = document.getElementById("lista-precos");

  const porColecao = new Map();
  master.forEach((r) => {
    if (!porColecao.has(r.colecao)) porColecao.set(r.colecao, []);
    porColecao.get(r.colecao).push(r);
  });

  lista.innerHTML = "";

  Array.from(porColecao.keys())
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach((colecao) => {
      const itens = porColecao.get(colecao);
      const grupoEl = document.createElement("div");
      grupoEl.className = "grupo-segmento";

      const cartoesHtml = itens
        .map((item) => {
          const linhaArea = areaMap.get(item.codigo);
          const valorInput = linhaArea && linhaArea.preco_unitario != null ? linhaArea.preco_unitario : "";
          const placeholder = `Base: ${formatarReais(item.preco_unitario)}`;
          const totalAtual = linhaArea && linhaArea.preco_total != null ? linhaArea.preco_total : null;
          // Visível/oculto também é por área — usa a linha desta área quando
          // já existe uma, senão cai pro estado da base como referência.
          const visivel = linhaArea ? linhaArea.ativo !== false : item.ativo !== false;

          return `
            <div class="cartao-item${visivel ? "" : " oculto"}" data-codigo="${item.codigo}">
              <div class="item-info">
                <span class="item-nome">${item.codigo} — ${escapeHtml(item.descricao)}</span>
                <div class="item-detalhe">Fração: ${item.fracao}</div>
              </div>
              <div class="item-preco-campo">
                R$
                <input type="number" step="0.01" value="${valorInput}" placeholder="${placeholder}" data-campo="preco-unitario" />
              </div>
              <span class="item-preco-total" data-campo="preco-total">
                ${totalAtual != null ? `Caixa/total: ${formatarReais(totalAtual)}` : ""}
              </span>
              <button class="btn-toggle-visibilidade ${visivel ? "visivel" : "oculto"}" data-acao="toggle-visibilidade">
                ${visivel ? "Visível" : "Oculto"}
              </button>
              <span class="item-salvando" hidden>Salvo ✓</span>
            </div>
          `;
        })
        .join("");

      grupoEl.innerHTML = `<div class="grupo-segmento-titulo">${escapeHtml(colecao)}</div>${cartoesHtml}`;
      lista.appendChild(grupoEl);

      grupoEl.querySelectorAll(".cartao-item").forEach((cartaoEl) => {
        const codigo = Number(cartaoEl.dataset.codigo);
        const item = itens.find((i) => i.codigo === codigo);
        const input = cartaoEl.querySelector("input[data-campo]");
        input.addEventListener("change", () => salvarPrecoPorCodigo(item, input, cartaoEl, areaMap));
        const botaoVisibilidade = cartaoEl.querySelector(".btn-toggle-visibilidade");
        botaoVisibilidade.addEventListener("click", () => {
          const linhaBase = linhaDaAreaOuBase(item, areaMap);
          alternarVisibilidade(MARCAS[MARCA_ATUAL].tabela, [linhaBase], linhaBase.ativo !== false, cartaoEl, MARCA_ATUAL, areaMap);
        });
      });
    });

  if (master.length === 0) {
    lista.innerHTML = '<p class="carregando">Nenhum produto encontrado.</p>';
  }
}

async function salvarPrecoPorCodigo(item, input, cartaoEl, areaMap) {
  const novoUnitario = Number(input.value);
  if (!input.value || isNaN(novoUnitario) || novoUnitario <= 0) {
    alert("Digite um preço válido.");
    return;
  }
  const novoTotal = Math.round(novoUnitario * item.fracao * 100) / 100;

  const linha = prepararLinhaParaArea(linhaDaAreaOuBase(item, areaMap), AREA_SELECIONADA, {
    preco_unitario: novoUnitario,
    preco_total: novoTotal,
  });

  input.disabled = true;
  try {
    const { error } = await getClient()
      .from(MARCAS[MARCA_ATUAL].tabela)
      .upsert([linha], { onConflict: "codigo,area" });
    if (error) throw error;
    atualizarAreaMapComLinhasSalvas(areaMap, [linha]);
    cartaoEl.querySelector('[data-campo="preco-total"]').textContent = `Caixa/total: ${formatarReais(novoTotal)}`;
    marcarSalvo(cartaoEl);
    if (AREA_SELECIONADA === CONFIG.areaBase) {
      delete CACHE_MASTER[MARCA_ATUAL];
    }
  } catch (erro) {
    alert("Não consegui salvar: " + detalharErro(erro));
  } finally {
    input.disabled = false;
  }
}

// ---------------- MOSTRAR / OCULTAR (sem estoque, por área) ----------------
// Visível/oculto vale só pra área que está sendo editada agora — cada área
// tem sua própria linha (mesmo esquema de codigo+area usado pra preço), então
// marcar "Oculto" na área SC não mexe no que aparece pras outras áreas.
async function alternarVisibilidade(tabela, linhasBase, visivelAtual, cartaoEl, nomeMarca, areaMap) {
  const novoValor = !visivelAtual;
  const confirmar = confirm(
    novoValor
      ? `Voltar a mostrar este item no catálogo da área ${AREA_SELECIONADA}?`
      : `Ocultar este item por falta de estoque na área ${AREA_SELECIONADA}? Ele some do catálogo dessa área até você marcar como visível de novo (as outras áreas não são afetadas).`
  );
  if (!confirmar) return;

  const linhas = linhasBase.map((linha) => prepararLinhaParaArea(linha, AREA_SELECIONADA, {
    ativo: novoValor,
  }));

  const botao = cartaoEl.querySelector(".btn-toggle-visibilidade");
  botao.disabled = true;
  try {
    const { error } = await getClient().from(tabela).upsert(linhas, { onConflict: "codigo,area" });
    if (error) throw error;

    atualizarAreaMapComLinhasSalvas(areaMap, linhas);
    if (AREA_SELECIONADA === CONFIG.areaBase) {
      delete CACHE_MASTER[nomeMarca];
    }

    cartaoEl.classList.toggle("oculto", !novoValor);
    botao.textContent = novoValor ? "Visível" : "Oculto";
    botao.classList.toggle("visivel", novoValor);
    botao.classList.toggle("oculto", !novoValor);
    marcarSalvo(cartaoEl);
  } catch (erro) {
    alert("Não consegui salvar: " + detalharErro(erro));
  } finally {
    botao.disabled = false;
  }
}

// ---------------- GERENCIAR ACESSOS (admin) ----------------
async function carregarListaAcessos() {
  const listaEl = document.getElementById("lista-acessos");
  listaEl.innerHTML = '<p class="carregando">Carregando acessos…</p>';

  try {
    const { data, error } = await getClient()
      .from("acessos_precos")
      .select("nome, area")
      .order("nome", { ascending: true });
    if (error) throw error;

    listaEl.innerHTML = (data || [])
      .map((a) => {
        const admin = a.area === null;
        return `
          <div class="cartao-acesso${admin ? " admin" : ""}">
            <span class="acesso-nome">${escapeHtml(a.nome)}</span>
            <span class="acesso-area">${admin ? "Administrador" : escapeHtml(a.area)}</span>
          </div>
        `;
      })
      .join("");
  } catch (erro) {
    listaEl.innerHTML = `<p class="carregando">Erro ao carregar acessos: ${erro.message}</p>`;
  }
}

document.getElementById("btn-criar-acesso").addEventListener("click", async () => {
  const erroEl = document.getElementById("erro-novo-acesso");
  const sucessoEl = document.getElementById("sucesso-novo-acesso");
  erroEl.hidden = true;
  sucessoEl.hidden = true;

  const nome = document.getElementById("novo-acesso-nome").value.trim();
  const area = document.getElementById("novo-acesso-area").value.trim();
  const email = document.getElementById("novo-acesso-email").value.trim();
  const senha = document.getElementById("novo-acesso-senha").value.trim();

  if (!nome || !area || !email || !senha) {
    erroEl.textContent = "Preencha todos os campos.";
    erroEl.hidden = false;
    return;
  }
  if (senha.length < 6) {
    erroEl.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    erroEl.hidden = false;
    return;
  }

  const botao = document.getElementById("btn-criar-acesso");
  botao.disabled = true;
  try {
    const { data: sessionData } = await getClient().auth.getSession();
    const token = sessionData?.session?.access_token;

    const resposta = await fetch(`${CONFIG.supabase.url}/functions/v1/criar-acesso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": CONFIG.supabase.anonKey,
      },
      body: JSON.stringify({ nome, area, email, senha }),
    });
    const resultado = await resposta.json();
    if (!resposta.ok || !resultado.ok) {
      throw new Error(resultado.erro || "Não consegui criar o acesso.");
    }

    sucessoEl.textContent = `Acesso criado! Repasse o e-mail e a senha pra ${nome}.`;
    sucessoEl.hidden = false;
    document.getElementById("novo-acesso-nome").value = "";
    document.getElementById("novo-acesso-area").value = "";
    document.getElementById("novo-acesso-email").value = "";
    document.getElementById("novo-acesso-senha").value = "";
    await carregarListaAcessos();
  } catch (erro) {
    erroEl.textContent = erro.message;
    erroEl.hidden = false;
  } finally {
    botao.disabled = false;
  }
});

// ---------------- UTIL ----------------
function prepararLinhaParaArea(masterRow, area, camposNovos) {
  const linha = { ...masterRow, ...camposNovos, area };
  delete linha.criado_em;
  return linha;
}

// Ponto de partida pra qualquer alteração (preço, negociação ou visível) de
// um código numa área: usa a linha que essa área já tem (se já tiver uma),
// senão cai pra linha da base — assim uma mudança nunca apaga por engano
// algo que a área já tinha configurado diferente da base.
function linhaDaAreaOuBase(item, areaMap) {
  return (areaMap && areaMap.get(item.codigo)) || item;
}

// Depois de salvar com sucesso, atualiza o "areaMap" em memória com a linha
// que acabou de ir pro banco — assim, se a pessoa mexer noutra coisa do
// mesmo item logo em seguida (sem trocar de aba/recarregar), o painel já
// enxerga o valor certo em vez do estado de antes da última ação.
function atualizarAreaMapComLinhasSalvas(areaMap, linhasSalvas) {
  if (!areaMap) return;
  linhasSalvas.forEach((linha) => {
    areaMap.set(linha.codigo, { ...(areaMap.get(linha.codigo) || {}), ...linha });
  });
}

// Junta a mensagem principal do erro com a "dica" e os "detalhes" que o
// Supabase manda (quando manda) — a mensagem sozinha às vezes é genérica
// demais pra entender o que realmente bloqueou o salvamento.
function detalharErro(erro) {
  const partes = [erro.message];
  if (erro.details) partes.push(`Detalhes: ${erro.details}`);
  if (erro.hint) partes.push(`Dica: ${erro.hint}`);
  if (erro.code) partes.push(`Código: ${erro.code}`);
  return partes.join("\n");
}

function marcarSalvo(cartaoEl) {
  const marca = cartaoEl.querySelector(".item-salvando");
  marca.hidden = false;
  setTimeout(() => { marca.hidden = true; }, 1800);
}

function formatarReais(valor) {
  if (valor == null) return "";
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

function escapeHtml(texto) {
  return String(texto || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function escapeAttr(texto) {
  return escapeHtml(texto);
}
