# FRAMER INFRASTRUCTURE — Deep-Dive Knowledge Base (verified 2026-11-04)

> **Method:** 4-agent parallel research team (portal cartography, Server API analysis,
> MCP investigation, access/ops model) + direct endpoint probes from this sandbox.
> Every claim carries its source URL; unverified items are marked **UNVERIFIED**.
> Companion to `INFRASTRUCTURE.md` §6. Project context: the Framer relaunch attempt
> is **PARKED by owner decision 2026-10-14** (private KB `DELIVERY-READINESS-REPORT.md`
> D-10); this document is the knowledge base for resuming that work.

## 0. TL;DR for this project

1. Framer's agent/programmatic story has **three surfaces**: **Server API** (per-project
   API key, `framer-api` npm SDK, beta, free), **Framer MCP** (remote MCP server,
   OAuth, launched 2026-10-22, "Free during preview"), and the **External Agents CLI**
   (`@framer/agent`, now legacy — kept only for localization).
2. **Our past connection model was almost certainly the Server API key**: the
   2026-10-14 "zero deployments, verified via the Framer API" check predates the MCP
   launch (2026-10-22) and matches `listDeployments()` semantics. It died with the
   sandbox recycle because keys are never stored in repo/env (secrets rule).
3. **Restoring access = one per-project API key** (Site Settings → General → API
   Keys). It authenticates as the key creator, is bound to that single project, and
   cannot touch other projects, account settings, or billing — the tightest possible
   scope for an agent.
4. Sandbox readiness (probed 2026-11-04): Node **v24.22.2** (SDK needs 22+) ·
   `api.framer.com` reachable (HTTP 302 → www) · `mcp.framer.com/mcp` live
   (HTTP 401 + OAuth metadata `{"authorization_servers":["https://api.framer.com/auth/oauth"],"scopes_supported":["mcp:project"]}`).
5. There is **no public REST "Sites API"** (404/redirect) — old memory is stale; the
   real surface is the WebSocket-based Server API. There is also **no full project
   export** — archival outside Framer = mirror published HTML + CMS CSV/JSON.

## 1. Developer ecosystem map (framer.com/developers/)

| Surface | URL | What it is | Maturity | Cost signal |
|---|---|---|---|---|
| Developers portal | https://www.framer.com/developers/ | Hub: Plugins, Fetch, Code Components, Code Overrides, Server API, External Agents | GA | — |
| **Framer Plugins** | /developers/plugins-introduction | Iframe apps inside the editor ("insert images, layers and code components or modify anything on the Canvas"); `npm create framer-plugin@latest`; API v5.1.0 (2026-09-24) | **Beta** | Free to build; Workspace Plugins = Enterprise add-on |
| Code Components | /developers/components-introduction | React 18 components rendered on canvas/preview/published site; Property Controls, versioned share URLs | GA | — |
| Code Overrides | /developers/overrides-introduction | React HOCs on layers; docs themselves steer to native Effects/Components/Fetch | GA | — |
| Fetch | /developers/fetch-introduction | No-code API data into sites (CORS, caching, no list iteration) | GA | — |
| **Server API** | /developers/server-api-introduction | Scriptable project read/edit/publish from any server | **Beta** | Free during beta; per-use pricing planned ("a full hour of processing will likely cost a few dollars") |
| **Framer MCP** | https://www.framer.com/mcp/ | Remote MCP server for AI agents (ChatGPT, Claude, Codex, Cursor, …) | **New/Preview** (launched 2026-10-22) | Free during preview; on Free plan |
| External Agents CLI | https://www.framer.com/agents/external/ | `npx @framer/agent setup` local bridge + skills | **Legacy** ("Framer MCP is now the recommended way") | — |
| Skills + Index | https://www.framer.com/skills/ · /skills/index | Instruction packs for Framer's built-in agent (14+ public skills: design system, SEO, a11y, llms.txt…) | New | — |
| Marketplace | https://www.framer.com/marketplace/ | Templates (incl. Agent Templates), Components, Vectors, Plugins; creators keep 100% of paid template & plugin revenue | GA | — |
| Academy | https://www.framer.com/academy/ | 108 lessons, agent-era (Basics, Agents, CMS, Publishing, SEO & AEO…) | GA | Free start |
| Guides | https://www.framer.com/guides | 26 guides; MCP migration series (Webflow/WordPress → Framer) | GA | — |

**Verified non-existent/retired:** `/developers/api` → 404; `developers.framer.com` → NXDOMAIN;
`api.framer.com` (plain HTTP) → 302 to www; "Widgets" is **not** a current surface
(only a dictionary entry; the concept lives on as Code Components);
`/developers/editor` renders the homepage (retired).

## 2. Server API (framer-api) — the workhorse

- **What:** "Update and publish your Framer projects with a simple script from any
  server at any time, without opening the Framer project."
  (https://www.framer.com/developers/server-api-introduction)
- **Transport:** persistent **WebSocket** (`wss://api.framer.com/channel/headless-plugin?projectId=<id>&sdkVersion=<v>`),
  header `Authorization: Token <API_KEY>` — **not REST**; no curl-able JSON API.
  (https://www.framer.com/developers/server-api-faq; SDK source `framer-api@5.1.0`)
- **SDK:** `npm i framer-api` (v5.1.0, actively shipped — last publish 2026-11-03).
  Runtime: Node 22+ / Bun 1.1+ / Deno 1.4+ / Cloudflare Workers.
- **Auth:** per-project API key, generated in **Site Settings → General → API Keys**
  (or `Cmd+K → open settings`). "These keys authenticate your script as the user who
  created them, and are bound to a specific project."
  (https://www.framer.com/developers/server-api-quick-start + npm README)
- **Key capabilities (can read AND write):**
  - Project/pages/branches: `connect(projectUrlOrId, apiKey?)`, `getProjectInfo()`,
    `getPublishInfo()`, branch CRUD (`getBranches/createBranch/switchBranch`), page
    create/clone
  - Canvas: `getNode/getChildren/getRect/getNodesWithType`, `createFrameNode`,
    `createTextNode`, `setAttributes`, `removeNodes`, `addImages/uploadImage(s)`,
    component instances
  - CMS: collections + items full read/write (incl. managed collections)
  - Code: `getCodeFile(s)/createCodeFile/typecheckCode/lintCode/setCustomCode`
  - Publishing: `publish()` (staging-aware), `deploy(deploymentId, domains?)`,
    `listDeployments()`, `getDeploymentIssues()`, `getUnpublishedPageChanges()`
  - **Audit:** `getChangeContributors(fromVersion?, toVersion?)` → authors of changes
    between versions; `subscribeToDeployment(...)`
  - Visual export: `screenshot(nodeId, opts)`, `exportSVG(nodeId)` (SDK-typed)
- **Cannot do:** list workspace sites (needs a concrete project URL/ID); domain CRUD
  (`deploy` only pushes to *already-configured* custom domains); account/billing;
  bulk rendered-HTML download; plugin UI methods (no-op headless). **Not
  transactional** — handle partial failures.
- **Stability:** Beta; breaking changes happen (v5.0.0 breaking 2026-09-08);
  typed error codes (`UNAUTHORIZED`, `TOKEN_SESSION_LIMIT`, `NODE_NOT_FOUND`…).
  Rate limits: **UNVERIFIED** (none documented).
- **Plan interaction:** free during beta; staging (used by `publish()` on main when
  enabled) is a **Pro** feature — UNVERIFIED whether enforced server-side for API calls.

Minimal official example (https://www.framer.com/developers/server-api-quick-start):

```js
import { connect } from "framer-api"
const framer = await connect("https://framer.com/projects/<id>", process.env.FRAMER_API_KEY)
console.log(await framer.getProjectInfo())   // { name, id }
await framer.disconnect()                    // required or the script hangs
```

Official examples repo: https://github.com/framer/server-api-examples
(publish flow; a self-built REST wrapper example `examples/json-api`).

## 3. Framer MCP — the new recommended agent path

- **Endpoint:** `https://mcp.framer.com/mcp` — remote **Streamable HTTP** MCP server,
  **OAuth** (scope `mcp:project`; authorization server `https://api.framer.com/auth/oauth`;
  no API key — verified live from this sandbox, HTTP 401 + metadata).
- **Launched 2026-10-22** (https://www.framer.com/updates/framer-mcp); status
  "PREVIEW — Free during preview" (pricing page); also listed on the **Free** plan.
- **Existing projects: YES, explicitly** — "Can Framer MCP work with an existing
  project? **Yes.** Give the agent the full project link and describe the task."
  (https://www.framer.com/help/articles/what-you-can-do-with-framer-mcp/)
  Uses the connected account's permissions; works with the editor closed.
- **Capabilities:** canvas/pages edit across breakpoints, components, supported
  project settings, CMS, branches, publish **only when explicitly asked**; SEO
  review; site migration flows (Webflow/WordPress/etc.).
- **Safety:** changes stay in project/branch until publish; work-on-a-branch is
  *recommended*, not automatic (unlike the legacy CLI's auto-branching); Enterprise
  workspaces can require admin approval of MCP connections.
- **Do not confuse** with the third-party marketplace plugin "Tommy's MCP"
  (https://www.framer.com/marketplace/plugins/mcp/) — unofficial, predates the launch.
- **Weakness for us:** the OAuth approval requires an authenticated browser session
  at framer.com, and Framer login is **passwordless** (magic link / Google) — hard
  to complete inside a recycled sandbox (see §5). Tool-level enumeration: UNVERIFIED
  (requires an OAuth session).

## 4. External Agents CLI (legacy)

`npx @framer/agent setup` (@framer/agent@0.0.47) installs skills for local agents
(Claude Code, Codex, Cursor, Windsurf, Antigravity); project access is granted via a
browser flow; **every change automatically lands on a branch**. Retained specifically
for **localization**, which MCP does not support yet. Read/write CMS + redirects; cannot
change project names/domains, assign overrides, or access analytics.
(https://www.framer.com/agents/external/ · /help/articles/use-external-agents-with-framer/)

## 5. Access, accounts & collaboration model

- **Login is passwordless:** "Continue with Google" or email → **magic link**; "Framer
  does not use passwords" (https://framer.com/login ·
  /help/articles/creating-a-framer-account/). Automated browser login therefore
  requires inbox access to the magic link — fragile; the durable paths are the
  per-project API key or MCP OAuth.
- **Account sharing is prohibited by ToS** ("Each person who edits or collaborates on
  projects must use their own account… repeated sharing may result in suspension" —
  /help/articles/sharing-accounts-on-framer/). A dedicated single-purpose agent
  account is not explicitly addressed: **UNVERIFIED / gray zone** — avoid sharing the
  owner's primary account.
- **Hierarchy:** account → workspaces → projects (sites); billing per workspace;
  projects movable/transferable.
- **Plans (2026-11-04, https://www.framer.com/pricing):** Free (3 editors, 500 AI
  credits once, framer.app domain, 1 GB bandwidth) · Basic · Pro (branching, staging,
  redirects; extra editor seat **$20/mo USD**, Content Editor $10/mo, viewers free;
  10 seats max on Basic/Pro) · Enterprise (SSO/SCIM, unlimited editors, Workspace
  Plugins, private plugins). Site-plan limits: pages 30/150, CMS collections 2/10,
  CMS items 1k/2.5k, bandwidth 50/100 GB (Basic/Pro).
- **Invites & roles:** email invite, workspace join link, project link sharing
  (viewer), Auto Join by email domain; roles = workspace Admin/Editor/Content
  Editor/Viewer; project Owner/Editor/Viewer; granular Design/Content/Deploy
  permissions (staging publish open to members, production deploy gated).
  (/help/articles/inviting-members-to-a-workspace-or-project/ ·
  /help/articles/member-roles-and-permissions/)

## 6. Seeing past actions (audit) — what "access to everything done" means

- **Editor version history** (File → Version History): snapshots **every 5 min in the
  last 4 h, hourly in the last 24 h, daily thereafter**; view-only restore by copying
  elements forward; timeline includes collaborators' work.
  (/help/articles/how-can-i-revert-to-a-previous-working-version-of-my-file/)
- **Published versions:** Site Settings → "Staging & Versions" — version ID, status,
  **publisher + timestamp**, permanent links, rollback. (Our project: **zero
  deployments ever** — D-10 verification stands.)
- **Change attribution:** pre-publish "View Changes" shows per-user edits; the Server
  API exposes `getChangeContributors(fromVersion, toVersion)`; merges are logged per
  branch. A workspace-wide audit log: **UNVERIFIED** (not documented).

## 7. Export & backup reality (important constraint)

- **No HTML/project export for self-hosting** — "published sites are not fully static
  and cannot be exported as standalone HTML files"
  (/help/articles/can-i-export-my-website-to-html-and-self-host-it/).
- Portability = mirror the published output (standard HTML/CSS/JS/assets) + **CMS
  CSV/JSON via plugins** + assets as PNG/JPG 1×–4× + redirects CSV via Redirect Sync
  plugin (/help/articles/porting-your-data-from-framer/).
- Consequence: the half-finished relaunch **cannot be fully archived outside Framer**
  while unpublished; keeping it parked on the canvas is the only faithful archive
  (plus node-level `screenshot()`/`exportSVG()` captures via the Server API).

## 8. Publishing ops essentials

Publish → atomic immutable version on framer.app base domain; custom domains via
Site Settings → Hosting (apex A records 31.43.160.6 / 31.43.161.6, www CNAME →
sites.framer.app; auto SSL); staging + rollback = Pro; redirects (wildcards, capture
groups) = Pro; automatic sitemap.xml/robots.txt, SSR, per-page meta, JSON-LD
(/help/articles/guide-to-seo-features-and-tools/); AWS global edge CDN, HTTP/3, image
resize/font subsetting on all plans (/help/articles/guide-to-framer-hosting-infrastructure/).

## 9. OUR ACCESS PLAN (restoring agent access to the parked project)

Ranked paths — per-project API key first:

| Rank | Path | Owner steps | What I get | Notes |
|---|---|---|---|---|
| **1** | **Server API key** (restores the past model) | Open the parked project → `Cmd+K → open settings` → **General → API Keys → Create** → copy key + the project URL (`framer.com/projects/<Name>--<id>`) → send both in chat | Full project read (canvas, pages, CMS, code) + edit + publish + `getChangeContributors` + node screenshots | Scoped to ONE project, authenticates as owner; store 0600 in `.env` (git-ignored), never print/commit; revoke after the phase; free during beta |
| 2 | Framer MCP | Requires an authenticated framer.com browser session to approve OAuth — owner-side agent (e.g., their local Claude/Codex via one-click) or a dedicated-account session dance in this sandbox | Canvas/CMS/settings/publish via MCP tools | Framer's recommended long-term path; Free during preview; revisit once key path proves the workflow |
| 3 | Dedicated agent account + Editor invite | Create a second Framer account with a dedicated email the owner controls → invite as project Editor (Free: 3 editors; paid: +$20/mo) → send me the magic-link URL once to open a session in this sandbox's browser → save session state 0600 | Full editor UI incl. version-history timeline, View Changes attribution | Magic links are one-time/short-lived; **ToS gray zone** (account-sharing clause doesn't address single-purpose agent accounts — UNVERIFIED); least preferred |

**Security rules (project standing policy):** any key/token arrives in chat → stored
`chmod 0600` in git-ignored `.env` → never printed, never committed, never pasted
into docs; rotation/revocation reminder after the phase ends; values only ever read
via `process.env`.

**Post-access workflow (proposed):** (1) recon — `getProjectInfo`, walk pages/canvas
nodes, read CMS + code files, `listDeployments`, `getChangeContributors`, node
screenshots; (2) written state-of-the-canvas report incl. everything the audit
surfaces; (3) we agree the fix list for the recorded v1 defects; (4) edits on a
**branch** if the workspace is Pro — otherwise disciplined small passes with the
owner reviewing in the editor; (5) publish only on explicit owner instruction
(D-10 red lines apply: game code untouched, no economy claims, assets only from the
approved logo/mascot set).

## 10. Research provenance

Team: 4 parallel research agents (2026-11-04), ~60 framer.com pages fetched live
(developer docs, help center, pricing, updates/blog, academy, sitemap), npm registry
metadata (`framer-api@5.1.0`, `@framer/plugin@5.1.0`, `@framer/agent@0.0.47`,
`create-framer-plugin@1.5.1`), plus direct probes from this sandbox (Node v24.22.2;
`mcp.framer.com/mcp` 401+OAuth metadata; `api.framer.com` 302). Key entry points:
https://www.framer.com/developers/ · /mcp/ · /developers/server-api-introduction ·
/developers/server-api-quick-start · /developers/server-api-reference ·
/developers/server-api-faq · /help/articles/getting-started-with-framer-mcp/ ·
/help/articles/what-you-can-do-with-framer-mcp/ · /pricing ·
/help/articles/member-roles-and-permissions/ ·
/help/articles/how-can-i-revert-to-a-previous-working-version-of-my-file/ ·
https://github.com/framer/server-api-examples

**UNVERIFIED items (honesty list):** MCP tool-name enumeration (needs OAuth session);
Server API rate limits; whether staging-gating is plan-enforced for API calls; Server
API post-beta pricing; 2FA availability; session length; viewer access to version
history; workspace-wide audit log; Framer's stance on single-purpose agent accounts;
contents of the login-gated creator dashboard; Academy catalog beyond the homepage.
