# Guia de Git e GitHub para o DestravaTime

## 1. O que é cada coisa

- **Git**: programa no seu computador que guarda o histórico do projeto, como "pontos de salvamento" chamados **commits**.
- **GitHub**: site que guarda uma cópia do projeto na internet, deixa a dupla trabalhar junta e (aqui) publica o site.
- **Repositório (repo)**: a pasta do projeto com todo o histórico.
- **Commit**: um ponto de salvamento com uma mensagem dizendo o que mudou e quem mudou.
- **Branch**: uma linha de trabalho. A principal se chama `main`.
- **Push**: enviar seus commits do computador para o GitHub. **Pull**: trazer para o computador o que o outro enviou.
- **Clone**: baixar o repositório do GitHub pela primeira vez.

## 2. Preparação (cada pessoa faz uma vez)

1. Crie conta em github.com (se ainda não tiver) e instale o Git: https://git-scm.com/downloads
2. No terminal (ou Git Bash no Windows), diga quem você é. Use o **mesmo e-mail** da conta do GitHub, senão o commit não aparece no seu perfil:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
```

## 3. Criar o repositório (a Bruna faz)

1. No GitHub: botão **New** (ou +, New repository).
2. Nome: `destravatime`. Marque **Public** (recomendado, veja a nota abaixo). Não marque "Add a README" (já temos um).
3. Clique em **Create repository**.

> **Público ou privado?** O professor aceita os dois. Público é mais simples e permite o GitHub Pages no plano gratuito. Se escolherem privado, vá em **Settings → Collaborators → Add people** e adicione o usuário **Zespek**. Como o repositório é do projeto, não coloque senha, chave ou dado pessoal real nele.

## 4. Dar acesso ao Rafael

No repositório: **Settings → Collaborators → Add people** e digite o usuário do GitHub do Rafael. Ele recebe um convite por e-mail e precisa aceitar. Depois disso ele consegue enviar commits.

## 5. Enviar o projeto pela primeira vez

Descompacte o kit do projeto, abra o terminal dentro da pasta `destravatime` e rode:

```bash
git init
git add .
git commit -m "Versão inicial do DestravaTime (HU-01 a HU-07)"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/destravatime.git
git push -u origin main
```

O GitHub vai pedir login. Se pedir senha, use um **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens) ou entre pelo GitHub Desktop.

## 6. Ligar o deploy automático

No repositório: **Settings → Pages → Source: GitHub Actions**. A cada push na `main`, a aba **Actions** mostra o pipeline rodando e, ao fim, o link do site (algo como `https://SEU-USUARIO.github.io/destravatime/`). Esse é o "link do projeto no ar".

## 7. O dia a dia (o ciclo que vocês repetem)

```bash
git pull                      # 1. traz o que o outro enviou
# ... edite os arquivos ...
git status                    # 2. mostra o que mudou
git add public/index.html     # 3. escolhe o que entra no commit
git commit -m "HU-09: anexar imagens ao impedimento"   # 4. salva com mensagem
git push                      # 5. envia para o GitHub
```

**Regras do time:**
- Um commit por mudança pequena e com sentido. Não junte tudo num commit só no fim da Sprint.
- A mensagem começa com a história: `HU-09: ...`, ou `S2: ...` para tarefas de Sprint.
- Os **dois** precisam fazer commits ao longo das Sprints. O histórico é evidência de quem trabalhou.
- Rode `git pull` antes de começar para evitar conflito.

## 8. Programação em pares (prática de XP)

Quando os dois trabalham juntos no mesmo código, quem digita faz o commit e registra o parceiro assim:

```bash
git commit -m "HU-08: manter dados após recarregar" -m "Co-authored-by: Nome do Parceiro <email-do-parceiro@exemplo.com>"
```

O GitHub mostra os dois como autores. Guardem o print do commit e anotem a data na evidência de XP.

## 9. Comandos para consultar

```bash
git log --oneline             # histórico resumido
git log --format="%h %an %ad %s" --date=short   # quem fez o quê e quando
git diff                      # o que mudou e ainda não foi para commit
git restore arquivo           # desfaz mudanças ainda não commitadas num arquivo
```

## 10. Se der conflito

Conflito acontece quando os dois mexem na mesma linha. O Git marca o arquivo com `<<<<<<<`, `=======` e `>>>>>>>`. Abra o arquivo, escolha qual versão fica (ou junte as duas), apague essas marcas, e rode:

```bash
git add arquivo
git commit
git push
```

## 11. O que mostrar na defesa

Cada integrante deve conseguir abrir o repositório, achar um commit seu e explicar o que ele muda, mesmo que a IA tenha escrito o código.
