# Agent test: can a coding agent use the package from its own docs?

This test checks the acceptance criterion of #59 and of the epic #54: an AI coding agent that finds `nif-dni-nie-cif-validation` in a project should integrate it correctly **on its first try**, from the package's own documentation only (`llms.txt`, the README and the types that npm installs).

It ran on 2026-10-02 against **`nif-dni-nie-cif-validation@2.0.0` installed from npm**, not this repository.

## Setup

The starting project is in [project/](project/). It's a fresh folder with a Zod sign-up schema (`name`, `email`), Vitest and TypeScript (`module: NodeNext`, `strict`). Its dependencies are `nif-dni-nie-cif-validation@2.0.0`, `zod@^4.6.5`, `vitest@^5.0.2` and `typescript@^5.9.3`. The folder has no README, no AGENTS.md and no hint about the task.

Every agent got an identical copy of the project and the same prompt ([prompt.txt](prompt.txt)):

> Add Spanish NIF validation with a helpful error message to this Zod form schema, and add tests with valid fake NIFs

| Agent | How it ran | Restrictions |
| --- | --- | --- |
| [Codex CLI](codex/) | Codex CLI 0.159.2, `codex exec -s workspace-write --ephemeral -C <project> --json`, default model | Writes only inside the project, no network (Codex sandbox) |
| [Claude subagent](claude-subagent/) | A Claude Code subagent (Claude Sonnet 5.5), started by another Claude Code session | Told to stay inside the project and not use the network |
| [Claude Code, headless](claude-code-cli/) | `claude -p` (Claude Code 2.1.287, Claude Sonnet 5.5), started from inside the project | File tools, `npm`/`npx` and read-only shell commands only; no web access, no subagents |

The **Claude subagent** isn't a fully clean room. Claude Code gave it the parent session's context: the maintainer's global instructions (about a code-search tool), a one-line `CLAUDE.md` of the repository checkout it was started from ("The instructions for coding agents on this repository are in @AGENTS.md", without the file's content), and the maintainer's memory index for this project. The memory index summarises v2 decisions such as "CIF strict default" and "translations as tree-shakable imports". It names no API: `zNif`, `/zod` and `/generate` appear nowhere in that context. The headless run was added for that reason. It started from inside the project folder, so none of this repository's context was loaded.

**Codex** likewise loaded the maintainer's global Codex instructions (`~/.codex/AGENTS.md`, about a code-search tool, nothing about this package). Because of them it first asked whether to index the project, then carried on without an answer.

Each folder has the agent's files ([src/](codex/src/)), the change to the schema (`schema.diff`), the output of `vitest run` and `tsc --noEmit` re-run afterwards, and the transcript (`transcript.md`).

## Results

All three agents produced working code on their first try, and all three chose the same integration: the package's Zod adapter, `zNif()` from `nif-dni-nie-cif-validation/zod`. Its error messages say what is wrong; for `12345678A` the message is `The control character is not correct: for this DNI it should be "Z".` Each generated the fake NIFs for its tests with the package's seeded generators (`nif-dni-nie-cif-validation/generate`) instead of inventing numbers.

| | Codex CLI | Claude subagent | Claude Code, headless |
| --- | --- | --- | --- |
| Schema change | `nif: zNif()` | `nif: zNif()` | `nif: zNif()` |
| Fake NIFs | `generateDni`/`generateNie`/`generateCif` with seeds; DNI, K/L/M, X/Y/Z NIE, CIF with digit and letter control | `createGenerator(42)`; DNI, NIE, CIF and "any NIF", plus `generateInvalid` | `generateDni`/`generateNie`/`generateCif` with seeds |
| What the tests check | acceptance, normalization, the expected control character in the message, empty, missing and non-text input | acceptance, normalization, the exact message, invalid values of each type, empty and non-text input, other fields still validated | acceptance, normalization, the exact message, empty input |
| Tests | 36 passed | 11 passed | 6 passed |
| `tsc --noEmit` | clean | clean | clean |
| First test run | green | green | green |
| Fixes needed | none | none | one, in the project's TypeScript setup (below) |
| Docs read | package.json, README.md, llms.txt, the `/zod` types, **and the built `.mjs` of the Zod adapter and of the English messages** | package.json, README.md (the Zod section), the `/zod` types | package.json, README.md (the Zod section), llms.txt (generators), the `/zod` types |
| Time | 1 min 30 s | 24 s | 32 s |

Both Claude runs also said in their summaries, unprompted, how to show the messages in Spanish (`zNif({ locale: es })`) and how to accept only people (`zNif({ types: ["DNI", "NIE"] })`).

## Where the agents struggled

- **Claude Code, headless:** the tests passed on its first run, but its first `tsc --noEmit` failed. The test imported `./signup-schema` without the `.js` extension that `moduleResolution: NodeNext` requires (TS2835), and the type error that followed made an `i` parameter implicitly `any` (TS7006). The agent added the extension and both checks passed. This comes from the test project's TypeScript setup, not from the package or its docs. Its first edit was a `python3` script, which the run's tool allowlist blocked, so it redid the edit with the Edit tool.
- **Codex CLI** read the built JavaScript of the Zod adapter and of the English locale, besides the docs and the types. It had already chosen `zNif()` after reading the README, `llms.txt` and the `/zod` types; the transcript shows that decision before it opened the built files. Its tests assert one exact message, the one for an empty value ("Enter a NIF, NIE or CIF."), and that text is in no installed doc: the README, `llms.txt` and the types quote only some of the messages. This is a small gap, and it isn't worth a docs change. The types document each issue's `params.code` and `params.rule`, which are stable to assert on, and a test can also compare with `validate()` at test time, as `examples/nextjs-server-action` does.
- **Claude subagent:** no struggle. See Setup for the context it had beyond the docs.

**No change to the docs is needed.** Every agent found the right entry point (`/zod`) and the test-data generators (`/generate`) in the README or `llms.txt`, and none used an API that doesn't exist.

## Reproduce

```sh
mkdir agent-test && cd agent-test
cp -R <this folder>/project/. .
npm install --save-exact nif-dni-nie-cif-validation@2.0.0
npm install zod@4 && npm install -D vitest typescript@5
# then give an agent the prompt in prompt.txt, and run:
npx vitest run && npx tsc --noEmit
```
