---
title: Use Separate Claude Code Profiles with direnv
slug: claude-code-profiles-with-direnv
locale: en-US
description: Keep Claude Code configuration for a project in its own profile directory with direnv, and verify when that profile is active.
tags:
  - technical
added: 2026-09-23T00:00:00.000Z
---

Claude Code keeps user-level configuration and data in `~/.claude` by default. To use a separate profile in a workspace, set `CLAUDE_CONFIG_DIR` and have [direnv](https://direnv.net/) load it when you enter the workspace.

Project-level settings and instructions stay with the project. Changing this variable redirects Claude Code's configuration and data directory; it does not guarantee that operating-system credentials are isolated.

## Install direnv

On macOS with Homebrew:

```sh
brew install direnv
```

Add the direnv hook to your shell so environment variables load and unload as you move between directories. In zsh, put this line in `~/.zshrc`:

```sh
eval "$(direnv hook zsh)"
```

For bash, put this line in `~/.bashrc`:

```sh
eval "$(direnv hook bash)"
```

Restart your shell, or source the relevant rc file, to activate the hook. Instructions for other installation methods and shells are in the [direnv installation guide](https://direnv.net/docs/installation.html) and [shell hook documentation](https://direnv.net/docs/hook.html).

Claude Code must already be installed. If you still need it, follow the [official quickstart](https://code.claude.com/docs/en/quickstart).

## Set a profile for this workspace

Choose a profile directory outside the repository. From the project directory, create one like this:

```sh
mkdir -p "$HOME/.claude-work"
```

In the project directory, create a `.envrc` containing:

```sh
export CLAUDE_CONFIG_DIR="$HOME/.claude-work"
```

Claude Code can create the config directory when it first needs it. Keeping it outside the repository also keeps profile data out of version control. Do not put credentials in `.envrc` or commit sensitive configuration.

Read `.envrc` before you authorize it. direnv runs the file as shell code, so only allow a file you trust. In the project directory, run:

```sh
direnv allow
```

direnv remembers which contents you allowed. If `.envrc` changes, review the update and run `direnv allow` again.

## Check the profile and start Claude Code

While you're in the project directory, check that the profile path is set:

```sh
echo "$CLAUDE_CONFIG_DIR"
```

You should see the path you chose, for example `/Users/you/.claude-work`. Start Claude Code:

```sh
claude
```

Every `claude` invocation from this directory uses the selected config directory. On the first run with this profile, Claude Code may prompt you to log in.

Leave the project directory and run the check again:

```sh
cd ..
echo "$CLAUDE_CONFIG_DIR"
```

When you leave, direnv unloads the workspace environment. The variable should be empty unless your shell sets it elsewhere. For another profile, choose a different directory and set it in that workspace's `.envrc`.

## References

- [Claude Code configuration directory](https://code.claude.com/docs/en/claude-directory)
- [direnv installation](https://direnv.net/docs/installation.html)
- [direnv shell hook](https://direnv.net/docs/hook.html)
- [direnv](https://direnv.net/)
