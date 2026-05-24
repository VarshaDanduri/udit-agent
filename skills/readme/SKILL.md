---
name: github-build-readme
description: Use when writing or updating a GitHub README/runbook that documents how to build, set up, or reproduce a project from a clean machine. Captures the styling, structure, and conventions for clean-slate build docs (devcontainer setup, multi-repo workspaces, troubleshooting sections).
allowed-tools:
  - "Read"
  - "Write"
  - "Edit"
  - "Bash"
  - "Glob"
  - "Grep"
---

# GitHub Build README Skill

Produces or updates README/runbook files in the **clean-slate build doc** style:
ordered numeric sections, copy-pasteable `bash` blocks, troubleshooting appendix,
and inline rationale for any non-obvious step. Designed for repos a new
contributor needs to reproduce from scratch.

## When to use

- Writing a `README.md`, `BUILD.md`, `BUILD_STEPS.md`, `SETUP.md`, or runbook
- Documenting a multi-repo or devcontainer-based workspace
- Recording a *known-good* sequence of commands after a successful build
- Adding a troubleshooting section to an existing build doc

If the doc is a project README that's primarily a **product description** (badges,
features, screenshots), use a different skill — this one is for build/runbook docs.

## Document structure

Always in this order:

```
# <Title> — <one-line subtitle>

<2-3 sentence intro: what this doc reproduces, on what host, in what scope>

[Optional: Covers list if multi-repo]

---

## 0. Prerequisites on the host

## 1. Workspace and clones

## 2. <External dependency or container/image setup>

## 3. <Data fixtures / secrets / env files>

## 4. <Per-repo config>

## 5. Open / build / run

## 6. Troubleshooting

---

## Outstanding (organization-side) work
```

Section numbering starts at **0** for prerequisites — emphasizes that step 0
is the base assumption, while steps 1+ are the actual reproducible flow.

Use `---` (3 hyphens, blank line above and below) between top-level sections.
Don't use `---` between subsections.

## Section conventions

### Prose before code

Every code block is preceded by 1–3 sentences of prose explaining **why**.
Never drop a code block on the reader without context. Bad:

````
## 3. Database fixtures

```bash
sudo mkdir -p /opt/apps/data
```
````

Good:

````
## 3. Database fixtures (`/opt/apps/data`)

The devcontainers bind-mount three host paths into the container:

```
/opt/apps/data/properties/dbpool   →  /opt/apps/data/properties/dbpool
/opt/apps/data/dbobjects.sql.gz    →  /workspace/dbobjects.sql.gz
```

The fixtures live in `data.tar.gz` in this repo. Extract to the bind-mount root
(needs sudo on macOS because `/opt` is root-owned):

```bash
sudo mkdir -p /opt/apps/data
```
````

### Code blocks

- Always tagged with a language (`bash`, `text`, `json`, etc.) — never bare ```.
- Comments only when the *why* isn't obvious from the command:
  ```bash
  brew install --cask docker            # Docker Desktop, must be running
  ```
- Loops over repo names use `for repo in ...; do ( cd ... && ... ); done`
  — subshell parens prevent `cd` from leaking.
- Show expected output below the block (as a separate fenced block, language
  `text`) when it's verification:
  ```bash
  ls /opt/apps/data/
  ```
  ```text
  dbobjects.sql.gz  sysadm.sql.gz  properties/
  ```

### Tables for per-repo or per-target variation

When the same step varies by target (repo, env, OS), use a table — never repeat
the same block N times:

```markdown
| Repo | Build command |
|---|---|
| CourseDescription | `mvn clean package` |
| CoursesSearch | `ant clean dist` |
```

Right-align numeric columns; left-align everything else (default).

### Inline formatting

- Backticks for: paths (`/opt/apps/data`), commands (`docker pull`),
  filenames (`devcontainer.json`), env vars (`GITHUB_TOKEN`),
  config keys, identifiers.
- **Bold** for: UI/menu actions ("**Settings → Resources → File sharing**"),
  emphasis on *don't* / *must* / *not*.
- *Italics* sparingly — usually for negation or contrast.
- Block quotes (`>`) for warnings only when they need to interrupt flow.

### Cross-references

Use `§N` or `§N.M` notation: "fix per §6.3", "this folds into §5".
Never raw "see section 6 above" — `§` is shorter and unambiguous.

## Troubleshooting section conventions

Numbered subsections like `### 6.1 <verbatim error message>`. Each subsection:

1. Verbatim error string as the heading (so `Cmd+F` for the error finds it).
2. One paragraph: **why** it happens (not just what to do).
3. The fix as a code block or bullet list.
4. If it's a cascade of an earlier failure, say so and link: "Cascading
   failure from §6.3".

Example:

````markdown
### 6.1 `bind source path does not exist: /opt/apps/data/...`

Docker Desktop on macOS runs containers inside a Linux VM that can only
bind-mount host paths it's been told to share. By default it shares `/Users`,
`/Volumes`, `/private`, `/tmp` — **not `/opt`**.

Fix: Docker Desktop → **Settings → Resources → File sharing**, click **+**,
add `/opt`, then **Apply & Restart**.
````

The verbatim-error heading is the most important convention — when a future
reader hits this same error and pastes it into search, they should land
*directly* on this subsection.

## "Outstanding work" appendix

For build runbooks that depend on org-side / upstream actions (permission
grants, missing artifacts, infrastructure changes), end with an
**## Outstanding (organization-side) work** section listing what would
collapse the runbook to a shorter form. Frame it as: "once X happens, §N's
workaround becomes a single command".

This section is the difference between a runbook that ages well and one that
becomes obsolete — it tells future readers which steps were workarounds for
a known temporary state.

## Voice

- Second person, present tense: "Switch each repo to the devcontainer branch."
- No filler: drop "in order to", "please note that", "it is worth mentioning".
- Imperative for instructions, declarative for explanations.
- Don't apologize for complexity. State the cause, give the fix.

## What NOT to include

- Project marketing / feature lists — those go in a separate top-level README.
- Long architectural explanations — link to a `docs/architecture.md` instead.
- Screenshots of terminal output that's already shown as a code block.
- Emoji — never. (Unless the user has explicitly asked for it.)
- "🚀 Get started" / "✨ Features" / similar marketing patterns.

## Updating an existing doc

When asked to update an existing build doc:

1. **Read the whole file first** — preserve its existing section numbering
   and voice unless the user asks for a rewrite.
2. **Add to troubleshooting** instead of inlining error notes in the main
   flow. Main flow stays linear.
3. **Renumber carefully** — if you delete §6, every cross-reference to §7+
   needs updating. Use `Edit` with `replace_all: true` on `§7.` → `§6.`.
4. **Preserve the "Outstanding work" appendix** — it's load-bearing context
   for whoever reads the doc next.
