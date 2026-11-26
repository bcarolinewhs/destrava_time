// Testes automáticos dos fluxos principais do DestravaTime (HU-01 a HU-19).
// Uso:  node tests/e2e.js            (testa public/index.html)
const { chromium } = require("playwright");
const fs = require("fs");
const os = require("os");
const path = require("path");

const arquivo = path.resolve(process.argv[2] || "public/index.html");
if (!fs.existsSync(arquivo)) { console.error("Arquivo não encontrado: " + arquivo); process.exit(1); }
const url = "file://" + arquivo;

const png = path.join(os.tmpdir(), "destrava-teste.png");
const txt = path.join(os.tmpdir(), "destrava-teste.txt");
fs.writeFileSync(png, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
fs.writeFileSync(txt, "isto não é uma imagem");

const resultados = [];
let browser;

async function teste(nome, fn, opcoes = {}) {
  const ctx = await browser.newContext(opcoes.contexto || {});
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  try {
    if (opcoes.antes) await opcoes.antes(p);
    await p.goto(url);
    await fn(p);
    if (erros.length) throw new Error("Erro de JavaScript na página: " + erros[0]);
    resultados.push([nome, true, ""]);
  } catch (e) {
    resultados.push([nome, false, e.message.split("\n")[0]]);
  } finally {
    await ctx.close();
  }
}
function igual(real, esperado, msg) {
  if (JSON.stringify(real) !== JSON.stringify(esperado)) throw new Error(msg + " (esperado " + JSON.stringify(esperado) + ", veio " + JSON.stringify(real) + ")");
}
function verdade(cond, msg) { if (!cond) throw new Error(msg); }

async function criar(p, d) {
  await p.click("#novo");
  await p.fill("#f-titulo", d.titulo);
  await p.fill("#f-desc", d.desc || "descrição detalhada de " + d.titulo);
  await p.fill("#f-resp", d.resp || "Ana");
  if (d.area && (await p.$("#f-area"))) await p.fill("#f-area", d.area);
  if (d.prio && (await p.$("#f-prio"))) await p.selectOption("#f-prio", d.prio);
  if (d.solNome && (await p.$("#f-sol-nome"))) await p.fill("#f-sol-nome", d.solNome);
  if (d.depto && (await p.$("#f-sol-depto"))) await p.fill("#f-sol-depto", d.depto);
  if (d.solEmail && (await p.$("#f-sol-email"))) await p.fill("#f-sol-email", d.solEmail);
  if (d.afetados && (await p.$("#f-afetados"))) await p.fill("#f-afetados", d.afetados);
  if (d.img) { await p.setInputFiles("#f-img", d.img); await p.waitForSelector("#previa img"); }
  await p.click("#dlg button[type=submit]");
}
const titulos = (p) => p.$$eval(".item h3", (hs) => hs.map((h) => h.textContent));

(async () => {
  browser = await chromium.launch();

  await teste("Cadastro: campos vazios mostram erro e não salvam", async (p) => {
    await p.click("#novo");
    await p.click("#dlg button[type=submit]");
    verdade((await p.textContent("#e-titulo")).length > 0, "faltou erro do título");
    verdade((await p.textContent("#e-desc")).length > 0, "faltou erro da descrição");
    verdade((await p.textContent("#e-resp")).length > 0, "faltou erro do responsável");
    igual((await titulos(p)).length, 0, "não deveria ter salvo");
  });

  await teste("HU-12: novo incidente nasce travado como Pendente e libera status depois", async (p) => {
    await p.click("#novo");
    verdade(await p.$eval("#f-status", (s) => s.disabled && s.value === "Pendente"), "status deveria estar bloqueado em Pendente");
    await p.click("#cancelar");
    await criar(p, { titulo: "Servidor caiu" });
    igual(await p.$eval(".item select.st", (s) => s.value), "Pendente", "status inicial");
    await p.click(".item >> text=Editar");
    verdade(await p.$eval("#f-status", (s) => !s.disabled), "status deveria liberar na edição");
  });

  await teste("Editar: altera o título e o status", async (p) => {
    await criar(p, { titulo: "Antes" });
    await p.click(".item >> text=Editar");
    await p.fill("#f-titulo", "Depois");
    await p.selectOption("#f-status", "Em andamento");
    await p.click("#dlg button[type=submit]");
    igual(await titulos(p), ["Depois"], "título editado");
    igual(await p.$eval(".item select.st", (s) => s.value), "Em andamento", "status editado");
  });

  await teste("Status: troca no cartão e o painel atualiza", async (p) => {
    await criar(p, { titulo: "A" });
    await p.selectOption(".item select.st", "Resolvido");
    igual(await p.$$eval("#tabs .tab b", (bs) => bs.map((b) => b.textContent)), ["1", "0", "0", "1"], "contadores");
  });

  await teste("Busca pelo título e filtro por área (HU-15)", async (p) => {
    await criar(p, { titulo: "Erro de rede", area: "Infraestrutura" });
    await criar(p, { titulo: "Memória cheia", area: "Produto" });
    await p.fill("#busca", "rede");
    igual(await titulos(p), ["Erro de rede"], "busca");
    await p.fill("#busca", "");
    await p.selectOption("#filtroArea", "Produto");
    igual(await titulos(p), ["Memória cheia"], "filtro de área");
  });

  await teste("Filtro por responsável", async (p) => {
    await criar(p, { titulo: "Do Dante", resp: "Dante" });
    await criar(p, { titulo: "Da Annie", resp: "Annie" });
    await p.selectOption("#filtroResp", "Dante");
    igual(await titulos(p), ["Do Dante"], "filtro");
  });

  await teste("Excluir: pede confirmação (cancelar mantém, confirmar remove)", async (p) => {
    await criar(p, { titulo: "Apagar" });
    p.once("dialog", (d) => d.dismiss());
    await p.click(".item >> text=Excluir");
    igual((await titulos(p)).length, 1, "cancelou, deveria manter");
    p.once("dialog", (d) => d.accept());
    await p.click(".item >> text=Excluir");
    igual((await titulos(p)).length, 0, "confirmou, deveria remover");
  });

  await teste("Persistência: dados e campos novos continuam após recarregar", async (p) => {
    await criar(p, { titulo: "Fica salvo", area: "TI", solNome: "Carla", depto: "Suporte", solEmail: "carla@exemplo.com", afetados: "time@exemplo.com" });
    await p.reload();
    igual(await titulos(p), ["Fica salvo"], "após recarregar");
    verdade((await p.textContent(".item")).includes("Carla"), "solicitante mantido");
  });

  await teste("HU-13, HU-14, HU-18 e HU-19: pop-up de detalhes e link mailto", async (p) => {
    await criar(p, {
      titulo: "Queda do checkout",
      desc: "Erro 500 ao confirmar pagamento com cartão.",
      area: "Tecnologia / TI",
      solNome: "Lucas",
      depto: "Comercial",
      solEmail: "lucas@exemplo.com",
      afetados: "ana@exemplo.com, bruno@exemplo.com",
    });
    await p.click(".item >> text=Detalhes");
    verdade((await p.textContent("#det-titulo")) === "Queda do checkout", "título no pop-up");
    verdade((await p.textContent("#det-grid")).includes("Lucas"), "solicitante no pop-up");
    verdade((await p.textContent("#det-afetados")).includes("ana@exemplo.com"), "afetados no pop-up");
    const href = await p.getAttribute("#det-mailto", "href");
    verdade(href && href.startsWith("mailto:ana%40exemplo.com,bruno%40exemplo.com"), "link mailto");
  });

  await teste("HU-18: e-mail inválido de afetados mostra erro e não salva", async (p) => {
    await criar(p, { titulo: "Teste email", afetados: "email_invalido" });
    verdade((await p.textContent("#e-afetados")).length > 0, "faltou erro de e-mail inválido");
    igual((await titulos(p)).length, 0, "não deveria salvar com e-mail inválido");
  });

  await teste("Imagem: anexa, mostra miniatura e mantém após recarregar", async (p) => {
    await criar(p, { titulo: "Com print", img: png });
    igual(await p.$$eval(".thumbs img", (x) => x.length), 1, "miniaturas");
    await p.reload();
    igual(await p.$$eval(".thumbs img", (x) => x.length), 1, "miniaturas após recarregar");
  });

  await teste("Imagem: arquivo que não é imagem mostra erro", async (p) => {
    await p.click("#novo");
    await p.setInputFiles("#f-img", txt);
    verdade((await p.textContent("#e-img")).length > 0, "faltou a mensagem de erro");
  });

  await teste("Imagem: limite de 3 por incidente", async (p) => {
    await p.click("#novo");
    await p.setInputFiles("#f-img", [png, png, png, png]);
    await p.waitForTimeout(500);
    igual(await p.$$eval("#previa img", (x) => x.length), 3, "prévias");
    verdade((await p.textContent("#e-img")).length > 0, "faltou aviso de limite");
  });

  await teste("Prioridade: ordenar por prioridade coloca Alta primeiro", async (p) => {
    await criar(p, { titulo: "Baixo", prio: "Baixa" });
    await criar(p, { titulo: "Urgente", prio: "Alta" });
    await criar(p, { titulo: "Meio", prio: "Média" });
    await p.selectOption("#ordem", "prioridade");
    igual(await titulos(p), ["Urgente", "Meio", "Baixo"], "ordem");
  });

  await teste("Exportar CSV: respeita o filtro, tem cabeçalho e evita fórmula", async (p) => {
    await criar(p, { titulo: "=SOMA(1;1)", resp: "Ana" });
    await criar(p, { titulo: "Normal", resp: "Dante" });
    await p.selectOption("#filtroResp", "Ana");
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#exp-csv")]);
    const conteudo = fs.readFileSync(await dl.path(), "utf8");
    verdade(conteudo.startsWith("\ufeff\"Título\";\"Descrição\""), "cabeçalho/BOM");
    verdade(conteudo.includes("\"'=SOMA(1;1)\""), "deveria neutralizar a fórmula");
    verdade(!conteudo.includes("Normal"), "exportou linha fora do filtro");
  });

  await teste("Exportar JSON: traz totais por status e prioridade", async (p) => {
    await criar(p, { titulo: "A", prio: "Alta" });
    await criar(p, { titulo: "B", prio: "Baixa" });
    await p.selectOption(".item:first-child select.st", "Resolvido");
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#exp-json")]);
    const dados = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
    igual(dados.totais.total, 2, "total");
    igual(dados.totais.porStatus["Resolvido"], 1, "resolvidos");
    igual(dados.totais.porPrioridade["Alta"], 1, "prioridade alta");
    igual(dados.incidentes.length, 2, "linhas");
  });

  await teste("Responsividade: celular (375 px) sem rolagem horizontal", async (p) => {
    await criar(p, { titulo: "Um título razoavelmente comprido para testar quebra de linha no celular", img: png });
    const largura = await p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    verdade(largura[0] <= largura[1], "rolagem horizontal: " + largura.join(" > "));
  }, { contexto: { viewport: { width: 375, height: 667 } } });

  await teste("Erro de armazenamento: avisa e não quebra a tela", async (p) => {
    let aviso = "";
    p.once("dialog", (d) => { aviso = d.message(); d.accept(); });
    await criar(p, { titulo: "Sem espaço" });
    verdade(aviso.length > 0, "faltou o aviso de armazenamento");
    await p.click("#novo");
  }, { antes: (p) => p.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("cheio"); }; }) });

  await browser.close();

  let falhas = 0;
  console.log("\nResultado dos testes (" + path.basename(arquivo) + ")\n");
  for (const [nome, ok, motivo] of resultados) {
    console.log((ok ? "  OK   " : "  FALHA") + "  " + nome + (ok ? "" : "\n         -> " + motivo));
    if (!ok) falhas++;
  }
  console.log("\n" + (resultados.length - falhas) + " de " + resultados.length + " testes passaram.");
  process.exit(falhas ? 1 : 0);
})();
