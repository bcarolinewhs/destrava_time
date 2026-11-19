# DestravaTime

Site para registrar e acompanhar **impedimentos** que travam o trabalho de uma equipe.
Um integrante cadastra o problema, indica quem resolve e a equipe acompanha o status
(Pendente, Em andamento, Resolvido) até destravar.

Projeto da disciplina Métodos Ágeis (Engenharia de Software, 4º C noturno).
Integrantes: Bruna Caroline Araújo de Oliveira e Rafael de Souza Berloni.

## O que o site faz

- Cadastrar, editar e excluir impedimentos (com confirmação ao excluir)
- Anexar até 3 imagens por impedimento (prints de erro)
- Atualizar o status direto no cartão
- Painel com totais por status e barra de proporção
- Buscar pelo título e filtrar por responsável

## Como rodar

Não precisa instalar nada: abra `public/index.html` no navegador.
Os dados ficam no `localStorage` do navegador (não vão para nenhum servidor).

## Estrutura

| Pasta | Para que serve |
| --- | --- |
| `public/` | O site (HTML, CSS e JavaScript) |
| `scripts/check.js` | Verificação automática usada no CI |
| `.github/workflows/pages.yml` | Pipeline: verifica e publica no GitHub Pages a cada push na `main` |
| `docs/` | Guias e evidências do projeto (prints do board, burndown, etc.) |

## Fluxo de trabalho do time

1. Cada história do board (HU-XX) vira um ou mais commits.
2. A mensagem do commit começa com o número da história. Exemplo: `HU-09: anexar imagens ao impedimento`.
3. Todo push na `main` roda a verificação e publica o site.
4. Pareamento: o commit leva `Co-authored-by` com o nome da outra pessoa.
