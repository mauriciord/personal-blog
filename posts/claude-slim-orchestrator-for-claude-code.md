---
title: Building claude-slim, an Orchestrator Mode for Claude Code
slug: claude-slim-orchestrator-for-claude-code
locale: en-US
description: How I turned Claude Code into an orchestrator with a roster of specialist subagents, inspired by oh-my-opencode-slim, using CLI flags, agent files and a few small scripts.
tags:
  - technical
added: 2026-11-09T00:00:00.000Z
---

In a long Claude Code session, the main model does everything in the same context. It greps the codebase, reads library docs, writes the change and reviews it, and every file it reads stays in the context. Most of that work doesn't need the most expensive model, and the context fills up with output that was useful for a minute.

[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) handles this well for [OpenCode](https://opencode.ai/). It is a slimmer take on [oh-my-opencode](https://github.com/code-yeongyu/oh-my-openagent), with the tagline "Mix any models · Auto delegate tasks." An orchestrator plans the work and hands pieces to specialists: an explorer for code search, a fixer for implementation, an oracle for hard problems, a designer for UI, and a council that only runs when you ask for it. Each specialist has its own model, and a preset switches the whole roster at once.

I liked that workflow, but I spend most of my day in Claude Code. For a long time I kept looking for an oh-my-opencode-slim equivalent for Claude Code, and nothing I found matched it closely enough. Eventually I decided to build my own.

The result is `claude-slim`: a shell function, ten agent files, an orchestrator prompt, three presets and a few small scripts. There's no plugin and no fork.

## The shape of it

Here is the whole setup in one picture:

![claude-slim at a glance: the launcher passes the agent roster, the orchestrator prompt and slim-only hooks to Claude Code. The main session acts as the orchestrator and dispatches read-only lanes (explorer, librarian, observer, oracle), writer lanes (fixer, designer) and, on request, the council.](/assets/claude-slim-orchestrator-for-claude-code/overview.png)

## The idea mapped onto Claude Code

Most oh-my-opencode-slim concepts have a direct equivalent in Claude Code:

| oh-my-opencode-slim | claude-slim |
|---|---|
| OpenCode plugin | Claude Code CLI flags |
| Per-agent `model`, `variant`, `skills` in a JSON config | Agent files in `~/.claude/agents/*.md` with `model`, `effort`, `skills`, `tools`, `hooks` frontmatter |
| `preset` key or `OH_MY_OPENCODE_SLIM_PRESET` | `claude-slim --preset <name>` or `CLAUDE_SLIM_PRESET` |
| `{agent}_append.md` prompt overrides | `--append-system-prompt-file` |
| Council excluded from automatic delegation | Council runs only through an explicit procedure |

I changed one thing on purpose. Upstream merged the librarian into the explorer, and I kept them apart. Searching my codebase and reading someone else's docs use different tools, and I want both running at the same time.

## The launcher

Everything starts from one zsh function:

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

`--agents` takes a JSON map of agent definitions. Agents passed this way take precedence over user agents with the same name, which is what makes presets work (more on that below).

`--agent orchestrator` sets the identity of the main thread. The orchestrator is the session itself, so the prompt tells it never to dispatch itself as a subagent.

`--append-system-prompt-file` adds the orchestrator rules on top of Claude Code's own system prompt, so the normal behavior and tools stay in place. `--settings` loads hooks that only apply to slim sessions, and plain `claude` stays as it was.

The function reads `CLAUDE_CONFIG_DIR`, so it also works with the per-workspace profiles from my [direnv post](/post/claude-code-profiles-with-direnv).

## The roster

Each specialist is an ordinary Claude Code subagent file. These are the defaults:

| Agent | Model / effort | Writes? | Job |
|---|---|---|---|
| explorer | Haiku, low | No | Codebase recon. Returns `file:line` context, not whole files |
| librarian | Haiku, low | No | Library docs, GitHub examples, web research |
| fixer | Haiku, high | Yes | Bounded implementation from a complete spec |
| designer | Haiku, medium | Yes | User-visible UI: layout, spacing, hierarchy, motion |
| oracle | Opus, xhigh | No | Architecture, hard debugging, code review |
| observer | Haiku, low | No | Screenshots, PDFs and diagrams, kept out of the main context |
| councillor-alpha / beta / gamma | Opus / Fable / Sonnet | No | Independent opinions for the council |
| council | Opus, high | No | Combines the councillors' answers into one report |

The frontmatter does most of the work. Here is the fixer:

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

Fixer can't spawn agents or browse the web. When it's missing information, it has to report back, so it can't wander off into its own investigation.

## The orchestrator prompt

`orchestrator.md` turns the main session into a workflow manager. It plans, schedules, delegates, checks what comes back and verifies the result. It handles a task itself only when the task is a single, clear, low-risk action and a dispatch would cost more than doing it.

For anything bigger, it builds a small work graph before dispatching anything. A typical feature looks like this:

![A typical feature as lanes: explorer and librarian run in parallel, the orchestrator writes the specs, two fixers work on separate folders in parallel, then the orchestrator runs build, tests and typecheck.](/assets/claude-slim-orchestrator-for-claude-code/work-graph.png)

Recon lanes run in parallel. Writer lanes wait for the recon they need, and each one owns its paths, so two writers never touch the same files. Every fixer brief names the files, the exact change and the command that validates it. The orchestrator runs the final gates itself.

A few rules in the prompt came from mistakes I watched happen:

- Never pass `model` when dispatching. The Agent tool accepts a model override, and the orchestrator likes to "help" by setting one, which silently replaces the preset.
- Reuse a lane through SendMessage when the follow-up is in the same area, so the specialist keeps its context.
- Call the oracle after two failed fixes, or for a decision that's expensive to undo. Routine changes skip it.
- Review the designer's copy. It's good at layout and weak at wording, so the orchestrator rewrites the text and leaves the visual structure alone.

The prompt also says its delegation rules take precedence over the routing defaults in my global `CLAUDE.md`, while everything else there (approval gates, git rules, report format) still applies. Without that line the two sets of instructions conflict, and the model doesn't follow either one consistently.

## Presets

A preset is a JSON file that maps agent names to a model and effort. The default preset only sets the orchestrator. The other agents keep the models from their own files:

```json
{
  "orchestrator": { "model": "opus", "effort": "high" }
}
```

`premium` moves everything up:

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

`economy` moves the orchestrator, oracle and council down to Sonnet. Presets use aliases like `opus` and `haiku` in place of dated model IDs, so they keep working when a new model comes out.

`build-agents.mjs` turns a preset into the `--agents` JSON:

![How a preset becomes a roster: build-agents.mjs reads the preset and the agent file, keeps the prompt, tools and hooks, overwrites model and effort, and emits the --agents JSON for this session only.](/assets/claude-slim-orchestrator-for-claude-code/presets.png)

The swap itself is a few lines:

```js
function withModel(def, override) {
  def.model = override.model;
  // effort null drops the key (model default effort); the API rejected effort on Haiku 4.5.
  if (override.effort) def.effort = override.effort;
  else delete def.effort;
  return def;
}
```

Because a definition passed with `--agents` takes precedence over the user agent with the same name, the agent files never change. A preset only changes what that one session uses.

## Guardrails: enforcing read-only

Writing "you are read-only" in a prompt only asks for it. The oracle needs `Bash` for `git log` and `rg`, and Bash can run anything. So the oracle's frontmatter adds a hook:

```yaml
disallowedTools: Edit, Write, NotebookEdit
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: bun ~/.claude/slim/hooks/readonly-bash.mjs
```

`readonly-bash.mjs` splits the command on pipes and separators and checks each segment against an allowlist (`rg`, `grep`, `find`, `cat`, `sed`, `jq`, `git` and a few more). For git, only inspection subcommands such as `diff`, `log`, `show`, `blame` and `status` pass. It also closes the obvious escape routes: `sed -i`, `find -exec`, `rg --pre`, `sort -o`, `git --output`, output redirection and command substitution. A blocked command exits with code 2 and writes the reason to stderr. Claude Code passes that reason back to the agent, which can then change its approach.

## Council Mode

The council is the expensive part: three models answer the same question, then a fourth combines their answers. Like upstream, it never runs automatically. The orchestrator follows a fixed procedure:

![Council Mode: the orchestrator fetches any external context, sends the same question to three councillors in parallel (Opus, Fable, Sonnet), collects their answers and retries an empty one once, then the council writes one report that keeps the disagreements.](/assets/claude-slim-orchestrator-for-claude-code/council.png)

Councillors can only read the codebase, which is why the orchestrator fetches any PR, URL or issue before dispatching them.

The orchestrator does the dispatching because a subagent can't start other subagents. `council` doesn't call any tools; it works only from the answers it receives. I ask for the disagreements to stay in the report, because a point where three models split is usually the part of the decision I need to think about myself.

## Small things that make it usable

OpenCode names sessions automatically, and I missed that in Claude Code. A `UserPromptSubmit` hook sets a quick title from the first prompt, prefixed with `CS |`. It then starts a detached `claude -p --model haiku` call that suggests a better title of two to six words, applied on the next prompt. The hook ignores machine-generated prompts like task notifications, and once I rename a session myself, it leaves the title alone.

If you configure Haiku for the fixer, how do you know it actually ran on Haiku? `audit.mjs` reads the session transcripts under `~/.claude/projects` and prints the model and effort the API recorded for each subagent:

```text
session bc5df23c-…  (11/9/2026, 2:24:01 PM)
  agent      model           effort   tools   secs  description
  librarian  haiku-5-5       low         10     61  Research oh-my-opencode-slim
```

That row is from the session where I planned this post. The research on oh-my-opencode-slim ran on the cheap model, as intended.

Writing this post also turned up a bug. The script builds the transcript folder name by replacing `/` and `.` with `-`, but Claude Code replaces every non-alphanumeric character. My blog lives in `my_personal_blog`, so the script looked in the wrong folder. Changing the regex to `/[^A-Za-z0-9]/g` fixes it.

Last, typing "ping all agents" makes the orchestrator dispatch every specialist with a one-line prompt, and each one replies with `pong`, its model and its tools. I use it as a quick check after editing agent files or presets.

## A real task

The best example I have is this post. I wrote it in a `claude-slim` session, and this is what `audit.mjs` recorded for it:

```text
agent      model      effort  tools  secs  description
librarian  haiku-5-5  low        10    61  Research oh-my-opencode-slim
designer   haiku-5-5  medium     15   344  Design four claude-slim diagram images
observer   haiku-5-5  low         4    28  Inspect four diagram PNGs
```

The orchestrator read my `~/.claude/slim` files itself. The paths were known and it was a handful of reads, so a dispatch would have cost more than it saved. While it worked on the outline, the librarian researched oh-my-opencode-slim in the background. Its report came back with flags as well as facts: upstream had merged the librarian into the explorer, and the default model IDs disagreed across their docs pages, so I left upstream model names out of the post.

For the diagrams, I showed the orchestrator a reference image I liked. It wrote the designer a brief with the style, every label, the folders it was allowed to write to, and a rule to look at each rendered PNG before reporting. The designer built a script that generates the SVGs and renders them with `sharp`. It also caught two of its own bugs: whitespace collapsing in SVG text, and a gear icon that rendered as a blob.

Then a separate observer inspected the four images, so 3200-pixel PNGs never landed in the orchestrator's context. It found no clipped text, flagged some tight padding, and noticed that one diagram said α/β/γ where another said alpha/beta/gamma. The orchestrator ran the final check itself: an Astro build, then confirmed that the built page referenced all four images.

All three specialists ran on Haiku. The orchestrator ran on Opus and spent its time on planning, briefs and review.

## Trade-offs

Every delegation costs a brief going out and a summary coming back. For a one-line fix, doing it directly is faster, and the orchestrator prompt says so.

A Haiku fixer does well with paths, line numbers and a validation command, and badly with "clean this up." The specs have to be precise, which means the orchestrator has to understand the change before handing it off.

The orchestrator only sees what a specialist reports. That keeps recon cheap, but in a review, anything the summary leaves out never reaches the orchestrator.

The council puts four strong models on a single question. I save it for decisions that are hard to undo.

For small edits, or when I want to work through an idea interactively, I still use plain `claude`.

## References

- [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
- [oh-my-opencode / oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
