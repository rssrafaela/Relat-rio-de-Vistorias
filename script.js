"use strict";

const $ = (id) => document.getElementById(id);

const campos = {
  responsavel: $("responsavel"),
  data: $("data"),
  busca: $("equipamentoBusca"),
  lista: $("listaEquipamentos"),
  linha: $("linha"),
  estacao: $("estacao"),
  tipo: $("tipo"),
  fabricante: $("fabricante")
};

let equipamentosBanco = [];
let equipamentoSelecionado = null;

/* ======================================================
   INICIALIZAÇÃO DOS CAMPOS
====================================================== */

function hojeISO() {
  const agora = new Date();

  return new Date(
    agora.getTime() - agora.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}

campos.data.value = hojeISO();

campos.responsavel.value =
  localStorage.getItem("tkeResponsavel") || "";

campos.responsavel.addEventListener("change", () => {
  localStorage.setItem(
    "tkeResponsavel",
    campos.responsavel.value.trim()
  );
});

/* ======================================================
   EQUIPAMENTOS — LISTA LOCAL
====================================================== */

async function carregarEquipamentos() {
  const mensagem = $("mensagemEquipamento");

  mensagem.textContent = "Carregando equipamentos...";
  mensagem.className = "status success";

  if (!Array.isArray(equipamentos)) {
    mensagem.textContent =
      "Erro ao carregar a lista local de equipamentos.";
    mensagem.className = "status error";
    return;
  }

  equipamentosBanco = equipamentos;
  campos.lista.innerHTML = "";

  equipamentosBanco.forEach((registro) => {
    const option = document.createElement("option");

    option.value = registro.equipamento;
    option.label =
      `${registro.equipamento} — ${registro.estacao} — ${registro.tipo}`;

    campos.lista.appendChild(option);
  });

  mensagem.textContent =
    `${equipamentosBanco.length} equipamentos carregados.`;
  mensagem.className = "status success";

  setTimeout(() => {
    mensagem.className = "status hidden";
  }, 2500);
}

function registroSelecionado() {
  const codigo = campos.busca.value
    .trim()
    .toUpperCase();

  return equipamentosBanco.find(
    (registro) =>
      String(registro.equipamento).toUpperCase() === codigo
  );
}

function limparEquipamento() {
  equipamentoSelecionado = null;

  campos.linha.value = "";
  campos.estacao.value = "";
  campos.tipo.value = "";
  campos.fabricante.value = "";
}

function preencherEquipamento() {
  campos.busca.value = campos.busca.value
    .trim()
    .toUpperCase();

  const registro = registroSelecionado();
  const mensagem = $("mensagemEquipamento");

  if (!registro) {
    limparEquipamento();

    if (campos.busca.value) {
      mensagem.textContent =
        "Equipamento não encontrado. Selecione um código válido.";

      mensagem.className = "status error";
    } else {
      mensagem.className = "status hidden";
    }

    return;
  }

  equipamentoSelecionado = registro;

  campos.linha.value = `Linha ${registro.linha}`;
  campos.estacao.value = registro.estacao || "";
  campos.tipo.value = registro.tipo || "";
  campos.fabricante.value =
    registro.fabricanteModelo || "";

  mensagem.textContent =
    `Equipamento ${registro.equipamento} selecionado com sucesso.`;

  mensagem.className = "status success";

  salvarAutomatico();
}

campos.busca.addEventListener(
  "change",
  preencherEquipamento
);

campos.busca.addEventListener(
  "blur",
  preencherEquipamento
);

/* ======================================================
   CHECKLIST
====================================================== */

function criarChecklist() {
  const root = $("checklist");

  root.innerHTML = "";

  let secaoAtual = "";

  itensVistoria.forEach((item) => {
    if (item.secao !== secaoAtual) {
      secaoAtual = item.secao;

      const titulo = document.createElement("div");

      titulo.className = "section-title";
      titulo.textContent = secaoAtual;

      root.appendChild(titulo);
    }

    const card = document.createElement("article");

    card.className = "item-card";
    card.dataset.ordem = item.ordem;

    card.innerHTML = `
      <div class="item-head">
        <span class="num">${item.ordem}</span>
        <div class="item-name">${item.item}</div>
      </div>

      <div class="result-row">
        ${["C", "NC", "NA"]
          .map(
            (resultado) => `
              <div class="result-option ${resultado.toLowerCase()}">
                <input
                  type="radio"
                  id="r${item.ordem}${resultado}"
                  name="resultado${item.ordem}"
                  value="${resultado}"
                >

                <label for="r${item.ordem}${resultado}">
                  ${resultado}
                </label>
              </div>
            `
          )
          .join("")}
      </div>

      <div class="nc-fields">
        <div>
          <label>Descrição</label>

          <textarea
            class="descricao"
            rows="2"
            placeholder="Descreva a não conformidade"
          ></textarea>
        </div>

        <div>
          <label>Ação</label>

          <select class="acao">
            <option value="">Selecione...</option>
            <option value="Ajuste">Ajuste</option>
            <option value="Substituição">Substituição</option>
            <option value="Adequação">Adequação</option>
            <option value="Limpeza">Limpeza</option>
            <option value="Sinalização">Sinalização</option>
            <option value="Vedação">Vedação</option>
          </select>
        </div>
      </div>
    `;

    card
      .querySelectorAll('input[type="radio"]')
      .forEach((radio) => {
        radio.addEventListener("change", () => {
          card.classList.toggle(
            "is-nc",
            radio.value === "NC"
          );

          atualizarProgresso();
          salvarAutomatico();
        });
      });

    card
      .querySelectorAll("textarea, select")
      .forEach((controle) => {
        controle.addEventListener(
          "change",
          salvarAutomatico
        );
      });

    root.appendChild(card);
  });
}

function atualizarProgresso() {
  const quantidade = document.querySelectorAll(
    '.item-card input[type="radio"]:checked'
  ).length;

  $("progresso").textContent =
    `${quantidade} / ${itensVistoria.length}`;

  $("barra").style.width =
    `${(quantidade / itensVistoria.length) * 100}%`;
}

function coletarRespostas() {
  const cards = [
    ...document.querySelectorAll(".item-card")
  ];

  return cards.map((card, indice) => ({
    ordem: itensVistoria[indice].ordem,
    secao: itensVistoria[indice].secao,
    item: itensVistoria[indice].item,

    resultado:
      card.querySelector(
        'input[type="radio"]:checked'
      )?.value || "",

    descricao:
      card.querySelector(".descricao").value.trim(),

    acao:
      card.querySelector(".acao").value
  }));
}

/* ======================================================
   DADOS DA VISTORIA
====================================================== */

function gerarIdVistoria() {
  return `VIST-${Date.now()}`;
}

function dadosVistoria(idVistoria = null) {
  const registro =
    equipamentoSelecionado || registroSelecionado();

  return {
    idVistoria:
      idVistoria || gerarIdVistoria(),

    data:
      campos.data.value,

    responsavel:
      campos.responsavel.value.trim(),

    equipamento:
      registro?.equipamento || "",

    linha:
      registro?.linha || "",

    estacao:
      registro?.estacao || "",

    tipo:
      registro?.tipo || "",

    fabricanteModelo:
      registro?.fabricanteModelo || "",

    respostas:
      coletarRespostas()
  };
}

/* ======================================================
   RASCUNHO
====================================================== */

function salvarAutomatico() {
  const rascunho = {
    data: campos.data.value,

    responsavel:
      campos.responsavel.value.trim(),

    equipamento:
      campos.busca.value.trim().toUpperCase(),

    respostas:
      coletarRespostas()
  };

  localStorage.setItem(
    "tkeRascunho",
    JSON.stringify(rascunho)
  );
}

function restaurar() {
  try {
    const texto =
      localStorage.getItem("tkeRascunho");

    if (!texto) return;

    const dados = JSON.parse(texto);

    campos.responsavel.value =
      dados.responsavel ||
      campos.responsavel.value;

    campos.data.value =
      dados.data || hojeISO();

    campos.busca.value =
      dados.equipamento || "";

    preencherEquipamento();

    const cards =
      document.querySelectorAll(".item-card");

    (dados.respostas || []).forEach(
      (resposta, indice) => {
        const card = cards[indice];

        if (!card) return;

        if (resposta.resultado) {
          const radio = card.querySelector(
            `input[value="${resposta.resultado}"]`
          );

          if (radio) {
            radio.checked = true;

            card.classList.toggle(
              "is-nc",
              resposta.resultado === "NC"
            );
          }
        }

        card.querySelector(".descricao").value =
          resposta.descricao || "";

        card.querySelector(".acao").value =
          resposta.acao || "";
      }
    );

    atualizarProgresso();
  } catch (erro) {
    console.error(
      "Erro ao restaurar rascunho:",
      erro
    );
  }
}

/* ======================================================
   STATUS E VALIDAÇÃO
====================================================== */

function mostrarStatus(
  texto,
  tipo = "success"
) {
  const elemento = $("statusFinal");

  elemento.textContent = texto;
  elemento.className = `status ${tipo}`;

  elemento.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function validar() {
  const respostas = coletarRespostas();

  if (!campos.responsavel.value.trim()) {
    return "Informe o responsável.";
  }

  if (!campos.data.value) {
    return "Informe a data.";
  }

  if (!equipamentoSelecionado) {
    return "Digite e selecione um equipamento válido.";
  }

  if (
    respostas.some(
      (resposta) => !resposta.resultado
    )
  ) {
    return "Preencha C, NC ou NA em todos os 43 itens.";
  }

  if (
    respostas.some(
      (resposta) =>
        resposta.resultado === "NC" &&
        (!resposta.descricao || !resposta.acao)
    )
  ) {
    return "Todo item NC precisa de descrição e ação.";
  }

  return "";
}

/* ======================================================
   EXPORTAÇÃO CSV LOCAL
====================================================== */

function csvEsc(valor) {
  const texto = String(valor ?? "")
    .replace(/"/g, '""');

  return `"${texto}"`;
}

function exportarCSV() {
  const erro = validar();

  if (erro) {
    mostrarStatus(erro, "error");
    return;
  }

  const dados = dadosVistoria();

  const cabecalho = [
    "IDVistoria",
    "Data",
    "Responsável",
    "Linha",
    "Estação",
    "Equipamento",
    "TipoEquipamento",
    "FabricanteModelo",
    "Seção",
    "Item",
    "Resultado",
    "Descrição",
    "Ação"
  ];

  const linhas = [
    cabecalho.map(csvEsc).join(";")
  ];

  dados.respostas.forEach((resposta) => {
    linhas.push(
      [
        dados.idVistoria,
        dados.data,
        dados.responsavel,
        dados.linha,
        dados.estacao,
        dados.equipamento,
        dados.tipo,
        dados.fabricanteModelo,
        resposta.secao,
        resposta.item,
        resposta.resultado,
        resposta.descricao,
        resposta.acao
      ]
        .map(csvEsc)
        .join(";")
    );
  });

  const blob = new Blob(
    ["\ufeff" + linhas.join("\r\n")],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download =
    `Vistoria_${dados.equipamento}_${dados.data}.csv`;

  link.click();

  URL.revokeObjectURL(link.href);
}

/* ======================================================
   ENVIO DIRETO PARA O GOOGLE SHEETS
====================================================== */

const GOOGLE_SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycby2yl87uHhqs20pIYyAtAsjConxI0ExvRT_KXACD096dF7qSKopM85IgG3cv24CCf1Rqw/exec";

async function finalizarVistoria() {
  const erroValidacao = validar();

  if (erroValidacao) {
    mostrarStatus(erroValidacao, "error");
    return;
  }

  const botao = $("btnEnviar");
  const idVistoria = gerarIdVistoria();
  const dados = dadosVistoria(idVistoria);

  const payload = {
    respostas: dados.respostas.map((resposta) => ({
      id_vistoria: dados.idVistoria,
      data_vistoria: dados.data,
      tecnico: dados.responsavel,
      equipamento: dados.equipamento,
      linha: String(dados.linha),
      estacao: dados.estacao,
      tipo: dados.tipo,
      fabricante: dados.fabricanteModelo,
      ordem: resposta.ordem,
      secao: resposta.secao,
      item: resposta.item,
      resultado: resposta.resultado,
      descricao: resposta.descricao || "",
      acao: resposta.acao || ""
    }))
  };

  botao.disabled = true;
  botao.textContent = "Enviando...";

  try {
    /*
      Apps Script é outro domínio. O modo no-cors permite que o navegador
      envie o POST sem depender de cabeçalhos CORS do Google. O corpo vai
      como text/plain, mas continua sendo JSON e o doPost usa JSON.parse().
    */
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    localStorage.removeItem("tkeRascunho");

    mostrarStatus(
      `Vistoria ${dados.idVistoria} enviada. Foram encaminhadas ${payload.respostas.length} respostas para a planilha.`
    );
  } catch (erro) {
    console.error("Erro ao enviar vistoria:", erro);

    mostrarStatus(
      "Não foi possível enviar a vistoria. Verifique sua conexão com a internet e tente novamente.",
      "error"
    );
  } finally {
    botao.disabled = false;
    botao.textContent = "Finalizar vistoria";
  }
}

/* ======================================================
   LIMPAR DADOS / NOVA VISTORIA
====================================================== */

function limparDadosNovaVistoria() {
  // Mantém o responsável para facilitar várias vistorias pelo mesmo técnico.
  const responsavelAtual = campos.responsavel.value.trim();

  localStorage.removeItem("tkeRascunho");

  equipamentoSelecionado = null;
  campos.busca.value = "";
  campos.linha.value = "";
  campos.estacao.value = "";
  campos.tipo.value = "";
  campos.fabricante.value = "";
  campos.data.value = hojeISO();
  campos.responsavel.value = responsavelAtual;

  document.querySelectorAll('.item-card input[type="radio"]').forEach((radio) => {
    radio.checked = false;
  });

  document.querySelectorAll(".item-card").forEach((card) => {
    card.classList.remove("is-nc");

    const descricao = card.querySelector(".descricao");
    const acao = card.querySelector(".acao");

    if (descricao) descricao.value = "";
    if (acao) acao.value = "";
  });

  atualizarProgresso();

  const mensagemEquipamento = $("mensagemEquipamento");
  mensagemEquipamento.textContent = "";
  mensagemEquipamento.className = "status hidden";

  const statusFinal = $("statusFinal");
  statusFinal.textContent = "";
  statusFinal.className = "status hidden";

  campos.busca.focus();
}

/* ======================================================
   BOTÕES
====================================================== */

$("btnSalvar").addEventListener(
  "click",
  () => {
    salvarAutomatico();

    mostrarStatus(
      "Rascunho salvo neste navegador."
    );
  }
);

$("btnExcel").addEventListener(
  "click",
  exportarCSV
);

$("btnImprimir").addEventListener(
  "click",
  () => window.print()
);

$("btnLimpar").addEventListener(
  "click",
  () => {
    const confirmar = window.confirm(
      "Limpar os dados desta tela e iniciar uma nova vistoria?\n\nOs registros já enviados ao Google Sheets NÃO serão apagados."
    );

    if (confirmar) {
      limparDadosNovaVistoria();
    }
  }
);

$("btnEnviar").addEventListener(
  "click",
  finalizarVistoria
);

/* ======================================================
   INICIALIZAÇÃO DO APLICATIVO
====================================================== */

async function iniciarAplicativo() {
  criarChecklist();
  atualizarProgresso();

  await carregarEquipamentos();

  restaurar();
}

iniciarAplicativo();
