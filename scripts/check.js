// Verificação automática (roda no GitHub Actions a cada push).
// 1) o JavaScript do site precisa ter sintaxe válida;
// 2) os elementos principais da tela precisam existir.
const fs = require("fs");
const vm = require("vm");

const caminho = ["index.html", "public/index.html", "docs/index.html"].find((c) => fs.existsSync(c));
if (!caminho) { console.error("ERRO: index.html não encontrado."); process.exit(1); }

const html = fs.readFileSync(caminho, "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error("ERRO: bloco <script> não encontrado em " + caminho); process.exit(1); }

try { new vm.Script(m[1]); }
catch (e) { console.error("ERRO de sintaxe no JavaScript:", e.message); process.exit(1); }

const ids = ["novo", "busca", "filtroResp", "lista", "frm", "f-titulo", "f-desc", "f-resp", "f-status"];
const faltando = ids.filter((id) => !html.includes('id="' + id + '"'));
if (faltando.length) { console.error("ERRO: faltam elementos:", faltando.join(", ")); process.exit(1); }

console.log("OK (" + caminho + "): JavaScript válido e elementos principais presentes.");
