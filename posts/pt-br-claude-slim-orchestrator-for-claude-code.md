---
title: Construindo o claude-slim, um modo orquestrador para o Claude Code
slug: claude-slim-orchestrator-for-claude-code
locale: pt-BR
description: Como transformei o Claude Code em um orquestrador com um time de subagentes especialistas, inspirado no oh-my-opencode-slim, usando flags da CLI, arquivos de agente e alguns scripts pequenos.
tags:
  - technical
added: 2026-11-09T00:00:00.000Z
---

Numa sessão longa do Claude Code, o modelo principal faz tudo no mesmo contexto. Ele faz grep no código, lê documentação de bibliotecas, escreve a mudança e revisa, e todo arquivo que ele lê fica no contexto. A maior parte desse trabalho não precisa do modelo mais caro, e o contexto vai enchendo de saída que foi útil por um minuto.

O [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) resolve isso bem no [OpenCode](https://opencode.ai/). Ele é uma versão mais enxuta do [oh-my-opencode](https://github.com/code-yeongyu/oh-my-openagent), com o slogan "Mix any models · Auto delegate tasks." Um orquestrador planeja o trabalho e repassa partes dele para especialistas: um explorer para buscar no código, um fixer para implementar, um oracle para problemas difíceis, um designer para UI e um council que só roda quando você pede. Cada especialista tem seu próprio modelo, e um preset troca o time inteiro de uma vez.

Eu gostava desse fluxo, mas passo a maior parte do dia no Claude Code. Por muito tempo fiquei procurando algo equivalente ao oh-my-opencode-slim para o Claude Code, e nada do que encontrei chegava perto o suficiente. Uma hora decidi fazer o meu.

O resultado é o `claude-slim`: uma função de shell, dez arquivos de agente, um prompt de orquestrador, três presets e alguns scripts pequenos. Sem plugin e sem fork.

## O formato geral

Esta é a configuração inteira em uma imagem:

![claude-slim em uma imagem: o launcher passa o time de agentes, o prompt do orquestrador e os hooks exclusivos do slim para o Claude Code. A sessão principal age como orquestrador e despacha as frentes somente leitura (explorer, librarian, observer, oracle), as frentes que escrevem (fixer, designer) e, quando pedido, o council.](/assets/claude-slim-orchestrator-for-claude-code/overview.png)

## A ideia aplicada ao Claude Code

A maioria dos conceitos do oh-my-opencode-slim tem um equivalente direto no Claude Code:

| oh-my-opencode-slim | claude-slim |
|---|---|
| Plugin do OpenCode | Flags da CLI do Claude Code |
| `model`, `variant`, `skills` por agente em uma configuração JSON | Arquivos de agente em `~/.claude/agents/*.md` com frontmatter `model`, `effort`, `skills`, `tools`, `hooks` |
| Chave `preset` ou `OH_MY_OPENCODE_SLIM_PRESET` | `claude-slim --preset <nome>` ou `CLAUDE_SLIM_PRESET` |
| Sobrescrita de prompt com `{agent}_append.md` | `--append-system-prompt-file` |
| Council fora da delegação automática | Council só roda por um procedimento explícito |

Mudei uma coisa de propósito. O projeto original juntou o librarian ao explorer, e eu mantive os dois separados. Buscar no meu código e ler a documentação de outra pessoa usam ferramentas diferentes, e eu quero os dois rodando ao mesmo tempo.

## O launcher

Tudo começa por uma função do zsh:

```sh
claude-slim() {
  local preset="${CLAUDE_SLIM_PRESET:-default}"
  if [[ "$1" == "--preset" ]]; then
    preset="$2"
    shift 2
  fi
  local agents
  agents="$(bun ${CLAUDE_CONFIG_DIR:-$HOME/.claude}/slim/build-agents.mjs "$preset")" || return 1
  CLAUDE_SLIM=1 CLAUDE_SLIM_PRESET="$preset" ~/.local/bin/claude \
    --agents "$agents" \
    --agent orchestrator \
    --append-system-prompt-file ${CLAUDE_CONFIG_DIR:-$HOME/.claude}/slim/orchestrator.md \
    --settings ${CLAUDE_CONFIG_DIR:-$HOME/.claude}/slim/settings.json \
    "$@"
}
```

`--agents` recebe um mapa JSON com definições de agentes. Agentes passados assim têm prioridade sobre agentes de usuário com o mesmo nome, e é isso que faz os presets funcionarem (mais sobre isso abaixo).

`--agent orchestrator` define a identidade da thread principal. O orquestrador é a própria sessão, então o prompt diz para ele nunca despachar a si mesmo como subagente.

`--append-system-prompt-file` adiciona as regras do orquestrador por cima do prompt de sistema do próprio Claude Code, então o comportamento e as ferramentas normais continuam lá. `--settings` carrega hooks que só valem para sessões do slim, e o `claude` comum continua como estava.

A função lê `CLAUDE_CONFIG_DIR`, então também funciona com os perfis por workspace do meu [post sobre direnv](/pt-BR/post/claude-code-profiles-with-direnv).

## O time

Cada especialista é um arquivo de subagente comum do Claude Code. Estes são os padrões:

| Agente | Modelo / esforço | Escreve? | Função |
|---|---|---|---|
| explorer | Haiku, low | Não | Reconhecimento do código. Devolve contexto `file:line`, não arquivos inteiros |
| librarian | Haiku, low | Não | Documentação de bibliotecas, exemplos do GitHub, pesquisa na web |
| fixer | Haiku, high | Sim | Implementação delimitada a partir de uma especificação completa |
| designer | Haiku, medium | Sim | UI visível ao usuário: layout, espaçamento, hierarquia, animação |
| oracle | Opus, xhigh | Não | Arquitetura, depuração difícil, revisão de código |
| observer | Haiku, low | Não | Screenshots, PDFs e diagramas, fora do contexto principal |
| councillor-alpha / beta / gamma | Opus / Fable / Sonnet | Não | Opiniões independentes para o council |
| council | Opus, high | Não | Junta as respostas dos councillors em um relatório |

O frontmatter faz a maior parte do trabalho. Este é o fixer:

```yaml
---
name: fixer
description: Fast implementation specialist. Receives complete context and a task spec from the orchestrator and executes bounded, headless code changes efficiently. Not for research, planning, or UI/design work.
tools: Read, Edit, Write, Grep, Glob, Bash
disallowedTools: Agent, WebSearch, WebFetch, mcp__*
model: haiku
effort: high
---
```

O fixer não pode criar agentes nem navegar na web. Quando falta informação, ele precisa voltar e avisar, então não sai investigando por conta própria.

## O prompt do orquestrador

O `orchestrator.md` transforma a sessão principal em um gerente de fluxo de trabalho. Ela planeja, agenda, delega, confere o que volta e verifica o resultado. Só faz uma tarefa por conta própria quando ela é uma ação única, clara e de baixo risco, e despachar custaria mais do que fazer.

Para qualquer coisa maior, ela monta um pequeno grafo de trabalho antes de despachar. Uma feature típica fica assim:

![Uma feature típica em frentes: explorer e librarian rodam em paralelo, o orquestrador escreve as especificações, dois fixers trabalham em pastas separadas em paralelo e, por fim, o orquestrador roda build, testes e typecheck.](/assets/claude-slim-orchestrator-for-claude-code/work-graph.png)

As frentes de reconhecimento rodam em paralelo. As frentes que escrevem esperam o reconhecimento de que precisam, e cada uma é dona dos seus caminhos, então dois agentes nunca mexem nos mesmos arquivos. Todo briefing do fixer lista os arquivos, a mudança exata e o comando que a valida. O próprio orquestrador roda as verificações finais.

Algumas regras do prompt vieram de erros que vi acontecer:

- Nunca passar `model` ao despachar. A ferramenta Agent aceita sobrescrever o modelo, e o orquestrador gosta de "ajudar" definindo um, o que substitui o preset sem avisar.
- Reaproveitar uma frente com SendMessage quando a continuação é na mesma área, para o especialista manter o contexto.
- Chamar o oracle depois de duas correções que falharam, ou para uma decisão cara de desfazer. Mudanças de rotina não passam por ele.
- Revisar o texto do designer. Ele é bom em layout e fraco em redação, então o orquestrador reescreve o texto e deixa a estrutura visual como está.

O prompt também diz que as regras de delegação têm prioridade sobre os padrões de roteamento do meu `CLAUDE.md` global, enquanto todo o resto dele (aprovações, regras de git, formato de relatório) continua valendo. Sem essa linha, os dois conjuntos de instruções entram em conflito, e o modelo não segue nenhum dos dois de forma consistente.

## Presets

Um preset é um arquivo JSON que associa nomes de agentes a um modelo e um esforço. O preset padrão só define o orquestrador. Os outros agentes mantêm os modelos dos próprios arquivos:

```json
{
  "orchestrator": { "model": "opus", "effort": "high" }
}
```

O `premium` sobe tudo:

```json
{
  "orchestrator": { "model": "fable", "effort": "high" },
  "oracle": { "model": "fable", "effort": "xhigh" },
  "fixer": { "model": "opus", "effort": "medium" },
  "designer": { "model": "opus", "effort": "high" },
  "librarian": { "model": "sonnet", "effort": "medium" },
  "explorer": { "model": "sonnet", "effort": "low" },
  "observer": { "model": "sonnet", "effort": "medium" }
}
```

O `economy` desce o orquestrador, o oracle e o council para o Sonnet. Os presets usam apelidos como `opus` e `haiku` em vez de IDs de modelo com data, então continuam funcionando quando sai um modelo novo.

O `build-agents.mjs` transforma um preset no JSON do `--agents`:

![Como um preset vira um time: o build-agents.mjs lê o preset e o arquivo do agente, mantém o prompt, as ferramentas e os hooks, sobrescreve modelo e esforço e gera o JSON do --agents só para essa sessão.](/assets/claude-slim-orchestrator-for-claude-code/presets.png)

A troca em si é coisa de poucas linhas:

```js
function withModel(def, override) {
  def.model = override.model;
  // effort null drops the key (model default effort); the API rejected effort on Haiku 4.5.
  if (override.effort) def.effort = override.effort;
  else delete def.effort;
  return def;
}
```

Como uma definição passada com `--agents` tem prioridade sobre o agente de usuário com o mesmo nome, os arquivos de agente nunca mudam. Um preset só muda o que aquela sessão usa.

## Proteções: somente leitura de verdade

Escrever "você é somente leitura" em um prompt só pede isso. O oracle precisa de `Bash` para `git log` e `rg`, e o Bash roda qualquer coisa. Por isso o frontmatter do oracle adiciona um hook:

```yaml
disallowedTools: Edit, Write, NotebookEdit
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: bun ~/.claude/slim/hooks/readonly-bash.mjs
```

O `readonly-bash.mjs` divide o comando em pipes e separadores e confere cada trecho contra uma lista de permitidos (`rg`, `grep`, `find`, `cat`, `sed`, `jq`, `git` e mais alguns). No git, só passam subcomandos de inspeção, como `diff`, `log`, `show`, `blame` e `status`. Ele também fecha as saídas óbvias: `sed -i`, `find -exec`, `rg --pre`, `sort -o`, `git --output`, redirecionamento de saída e substituição de comando. Um comando bloqueado sai com código 2 e escreve o motivo no stderr. O Claude Code repassa esse motivo para o agente, que pode mudar a abordagem.

## Council Mode

O council é a parte cara: três modelos respondem à mesma pergunta, e um quarto junta as respostas. Como no projeto original, ele nunca roda automaticamente. O orquestrador segue um procedimento fixo:

![Council Mode: o orquestrador busca qualquer contexto externo, manda a mesma pergunta para três councillors em paralelo (Opus, Fable, Sonnet), junta as respostas e tenta de novo uma vez se alguma vier vazia, e então o council escreve um relatório que mantém as divergências.](/assets/claude-slim-orchestrator-for-claude-code/council.png)

Os councillors só conseguem ler o código, por isso o orquestrador busca qualquer PR, URL ou issue antes de despachá-los.

O orquestrador faz o despacho porque um subagente não pode iniciar outros subagentes. O `council` não chama nenhuma ferramenta; ele trabalha só com as respostas que recebe. Peço que as divergências fiquem no relatório, porque o ponto em que três modelos discordam costuma ser a parte da decisão que eu mesmo preciso pensar.

## Pequenas coisas que tornam o uso viável

O OpenCode dá nome às sessões automaticamente, e senti falta disso no Claude Code. Um hook de `UserPromptSubmit` define um título rápido a partir do primeiro prompt, com o prefixo `CS |`. Depois ele inicia uma chamada destacada de `claude -p --model haiku` que sugere um título melhor, de duas a seis palavras, aplicado no prompt seguinte. O hook ignora prompts gerados por máquina, como notificações de tarefas, e quando eu renomeio a sessão manualmente, ele deixa o título em paz.

Se você configura Haiku para o fixer, como sabe que ele realmente rodou no Haiku? O `audit.mjs` lê as transcrições das sessões em `~/.claude/projects` e mostra o modelo e o esforço que a API registrou para cada subagente:

```text
session bc5df23c-…  (11/9/2026, 2:24:01 PM)
  agent      model           effort   tools   secs  description
  librarian  haiku-5-5       low         10     61  Research oh-my-opencode-slim
```

Essa linha é da sessão em que planejei este post. A pesquisa sobre o oh-my-opencode-slim rodou no modelo barato, como esperado.

Escrever este post também revelou um bug. O script monta o nome da pasta de transcrições trocando `/` e `.` por `-`, mas o Claude Code troca todo caractere que não é alfanumérico. Meu blog fica em `my_personal_blog`, então o script procurava na pasta errada. Trocar a regex por `/[^A-Za-z0-9]/g` resolve.

Por último, digitar "ping all agents" faz o orquestrador despachar todos os especialistas com um prompt de uma linha, e cada um responde com `pong`, seu modelo e suas ferramentas. Uso isso como verificação rápida depois de editar arquivos de agente ou presets.

## Uma tarefa real

O melhor exemplo que tenho é este post. Escrevi ele em uma sessão do `claude-slim`, e foi isto que o `audit.mjs` registrou:

```text
agent      model      effort  tools  secs  description
librarian  haiku-5-5  low        10    61  Research oh-my-opencode-slim
designer   haiku-5-5  medium     15   344  Design four claude-slim diagram images
observer   haiku-5-5  low         4    28  Inspect four diagram PNGs
```

O orquestrador leu meus arquivos em `~/.claude/slim` ele mesmo. Os caminhos eram conhecidos e eram poucas leituras, então despachar custaria mais do que economizaria. Enquanto ele trabalhava no roteiro, o librarian pesquisava o oh-my-opencode-slim em segundo plano. O relatório voltou com alertas, além dos fatos: o projeto original tinha juntado o librarian ao explorer, e os IDs de modelo padrão não batiam entre as páginas da documentação, então deixei os nomes de modelo do projeto original fora do post.

Para os diagramas, mostrei ao orquestrador uma imagem de referência de que eu gostava. Ele escreveu para o designer um briefing com o estilo, todos os textos, as pastas em que ele podia escrever e a regra de olhar cada PNG renderizado antes de reportar. O designer criou um script que gera os SVGs e os renderiza com o `sharp`. Ele também pegou dois bugs próprios: espaços sumindo no texto do SVG e um ícone de engrenagem que virava uma mancha.

Depois, um observer separado inspecionou as quatro imagens, então PNGs de 3200 pixels nunca entraram no contexto do orquestrador. Ele não encontrou texto cortado, apontou alguns espaçamentos apertados e notou que um diagrama usava α/β/γ e outro alpha/beta/gamma. O orquestrador fez a verificação final ele mesmo: rodou o build do Astro e confirmou que a página gerada referenciava as quatro imagens.

Os três especialistas rodaram no Haiku. O orquestrador rodou no Opus e gastou o tempo com planejamento, briefings e revisão.

## Prós e contras

Toda delegação custa um briefing na ida e um resumo na volta. Para uma correção de uma linha, fazer direto é mais rápido, e o prompt do orquestrador diz isso.

Um fixer no Haiku vai bem com caminhos, números de linha e um comando de validação, e mal com "dá uma limpada nisso". As especificações precisam ser precisas, o que obriga o orquestrador a entender a mudança antes de repassá-la.

O orquestrador só vê o que o especialista reporta. Isso deixa o reconhecimento barato, mas, numa revisão, o que o resumo deixa de fora nunca chega ao orquestrador.

O council coloca quatro modelos fortes em uma única pergunta. Guardo ele para decisões difíceis de desfazer.

Para edições pequenas, ou quando quero pensar numa ideia de forma interativa, continuo usando o `claude` comum.

## Referências

- [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
- [oh-my-opencode / oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)
- [Subagentes do Claude Code](https://code.claude.com/docs/en/sub-agents)
- [Hooks do Claude Code](https://code.claude.com/docs/en/hooks)
- [Referência da CLI do Claude Code](https://code.claude.com/docs/en/cli-reference)
