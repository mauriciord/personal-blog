---
title: Use perfis separados do Claude Code com direnv
slug: claude-code-profiles-with-direnv
locale: pt-BR
description: Configure um diretório de perfil próprio para o Claude Code com direnv e confira quando ele está ativo.
tags:
  - technical
added: 2026-09-23T00:00:00.000Z
---

Por padrão, o Claude Code guarda configurações e dados de usuário em `~/.claude`. Para usar um perfil separado em um workspace, defina `CLAUDE_CONFIG_DIR` e deixe o [direnv](https://direnv.net/) carregar a variável quando você entrar nesse diretório.

As configurações e instruções do projeto continuam no próprio projeto. Essa variável muda o diretório de configuração e dados usado pelo Claude Code, mas não garante o isolamento das credenciais do sistema operacional.

## Instale o direnv

No macOS com Homebrew:

```sh
brew install direnv
```

Adicione o hook do direnv ao shell para carregar e remover variáveis de ambiente ao entrar e sair dos diretórios. No zsh, coloque esta linha no `~/.zshrc`:

```sh
eval "$(direnv hook zsh)"
```

No bash, coloque esta linha no `~/.bashrc`:

```sh
eval "$(direnv hook bash)"
```

Reinicie o shell ou carregue o arquivo rc correspondente para ativar o hook. As instruções para outros métodos de instalação e shells estão na [documentação de instalação do direnv](https://direnv.net/docs/installation.html) e na documentação dos [hooks de shell](https://direnv.net/docs/hook.html).

O Claude Code já precisa estar instalado. Se ainda não estiver, siga o [quickstart oficial](https://code.claude.com/docs/en/quickstart).

## Configure um perfil para o workspace

Escolha um diretório de perfil fora do repositório. Dentro do diretório do projeto, crie um assim:

```sh
mkdir -p "$HOME/.claude-work"
```

No diretório do projeto, crie um arquivo `.envrc` com este conteúdo:

```sh
export CLAUDE_CONFIG_DIR="$HOME/.claude-work"
```

O Claude Code pode criar o diretório de configuração quando precisar dele. Mantê-lo fora do repositório também evita que os dados do perfil entrem no controle de versão. Não coloque credenciais no `.envrc` nem faça commit de configurações sensíveis.

Leia o `.envrc` antes de autorizá-lo. O direnv executa esse arquivo como código de shell, então só autorize arquivos em que confia. No diretório do projeto, execute:

```sh
direnv allow
```

O direnv registra o conteúdo autorizado. Se o `.envrc` mudar, revise a alteração e execute `direnv allow` novamente.

## Confira o perfil e abra o Claude Code

Dentro do diretório do projeto, confira se o caminho do perfil está definido:

```sh
echo "$CLAUDE_CONFIG_DIR"
```

O comando deve mostrar o caminho escolhido, por exemplo `/Users/voce/.claude-work`. Agora inicie o Claude Code:

```sh
claude
```

Toda execução de `claude` iniciada nesse diretório usa o diretório de configuração selecionado. Na primeira vez que usar esse perfil, o Claude Code pode pedir que você faça login.

Saia do diretório do projeto e confira novamente:

```sh
cd ..
echo "$CLAUDE_CONFIG_DIR"
```

Ao sair, o direnv descarrega as variáveis do workspace. A variável deve ficar vazia, a menos que seu shell defina outro valor. Para usar outro perfil, escolha um diretório diferente e configure-o no `.envrc` daquele workspace.

## Referências

- [Diretório de configuração do Claude Code](https://code.claude.com/docs/en/claude-directory)
- [Instalação do direnv](https://direnv.net/docs/installation.html)
- [Hooks de shell do direnv](https://direnv.net/docs/hook.html)
- [direnv](https://direnv.net/)
