# Portfolio Project Tech Stack Logos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each portfolio project's tech stack entry a real brand logo, picked via a searchable dropdown in the admin Add/Edit Project forms, and shown on the public project page's "Powered By" section.

**Architecture:** `techStack` moves from a plain string array to structured `{ name, version, icon }` entries. A new static catalog (`client/src/lib/techCatalog.ts`, ~178 curated technologies built on the already-installed `react-icons` package) powers a new `TechStackPicker` search/chip component used in both the Add and Edit project modals. The public `ProjectDetail.tsx` page resolves each entry's `icon` key against the same catalog to render the logo. A one-off migration script converts existing free-text `techStack` data to the new shape.

**Tech Stack:** React 18 + TypeScript, `react-icons` (already a dependency — no new packages), Mongoose 9 (Express 5 backend), no test runner configured in this repo (verification is via `tsc`/`vite build` for frontend and manual script runs for backend — there is no jest/vitest/pytest to invoke).

## Global Constraints

- No new npm dependencies — `react-icons` is already installed in `client/package.json`.
- Every icon identifier used below has been individually verified to exist in the installed `react-icons/si` and `react-icons/fa` type declarations. Do not substitute or guess new icon names without checking `client/node_modules/react-icons/si/index.d.ts` first.
- `techStack.icon` stores a catalog **key** (e.g. `"react"`), never a react-icons class name directly, so the catalog can change its underlying icon library later without a data migration.
- Client has no test runner (`client/package.json` scripts are only `dev`, `build`, `preview`). Verification for frontend tasks is `npm run build` (runs `tsc -b && vite build`) — a non-zero exit or any printed TypeScript error means the step failed.
- Server has no test runner or lint script (per `server/CLAUDE.md`). Verification for backend tasks is a manual `node` invocation as shown in each task.
- **Critical ordering rule:** this app has a single MongoDB Atlas cluster (no separate staging), and most controller reads (`adminProject.find()`, `.findById()`) fully hydrate Mongoose documents rather than using `.lean()`. Once the schema (Task 1) changes `techStack` from `[String]` to an array of `{name, version, icon}` subdocuments, hydrating an *existing* document that still has raw string entries can throw a Mongoose CastError. **Task 2's migration script therefore uses the native MongoDB driver directly (`mongoose.connection.db.collection(...)`), never the `adminProject` Mongoose model** — this makes it immune to whichever schema shape is currently loaded, in either direction. Even so, run Task 1 and Task 2 back-to-back, and don't use the admin panel in between.

---

### Task 1: Backend — `techStack` schema change

**Files:**
- Modify: `server/src/models/usersModels/AdminProject.model.js:221-226`

**Interfaces:**
- Produces: `AdminProject.techStack` subdocument shape `{ name: string, version?: string, icon: string }[]`, consumed by Task 5 (admin form payload), Task 6 (public page), and read by Task 2's migration script (via raw driver, not this schema).

- [ ] **Step 1: Replace the `techStack` field definition**

Open `server/src/models/usersModels/AdminProject.model.js` and find:

```js
    // Tech Stack – array of technology names shown on the Add Project form
    techStack: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tech name cannot exceed 50 characters']
    }],
```

Replace it with:

```js
    // Tech Stack – array of technologies shown on the Add Project form, each with an optional
    // version and a catalog icon key (see client/src/lib/techCatalog.ts for the matching keys)
    techStack: [{
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [50, 'Tech name cannot exceed 50 characters']
        },
        version: {
            type: String,
            trim: true,
            maxlength: [20, 'Version cannot exceed 20 characters']
        },
        icon: {
            type: String,
            trim: true,
            default: 'generic'
        }
    }],
```

- [ ] **Step 2: Verify the schema still compiles**

Run from `server/`:
```bash
node -e "import('./src/models/usersModels/AdminProject.model.js').then(() => console.log('Model loaded OK')).catch(e => { console.error(e); process.exit(1); })"
```
Expected: prints `Model loaded OK` and exits 0. (This only registers the Mongoose schema — it does not connect to the database, so it works without `.env` configured.)

- [ ] **Step 3: Commit**

```bash
git add server/src/models/usersModels/AdminProject.model.js
git commit -m "feat: structure techStack entries with name, version, and icon key"
```

- [ ] **Step 4: Immediately continue to Task 2** — do not restart the admin panel or browse `/admin/projects` between this task and the next; existing legacy-shaped documents are still incompatible with this schema until Task 2's migration runs.

---

### Task 2: Backend — migrate existing `techStack` string data

**Files:**
- Create: `server/src/scripts/migrateTechStack.js`

**Interfaces:**
- Consumes: `connectDB` default export from `../database/database.js` (existing, same pattern as `server/src/seed.js`); the native MongoDB driver via `mongoose.connection.db` (not the `adminProject` Mongoose model — see Global Constraints).

- [ ] **Step 1: Create the migration script**

Create `server/src/scripts/migrateTechStack.js`:

```js
/**
 * One-off migration: converts AdminProject.techStack from plain strings
 * (e.g. "React 19 + TypeScript") to structured { name, version, icon }
 * entries matching client/src/lib/techCatalog.ts.
 *
 * Uses the native MongoDB driver (not the Mongoose model) so it works
 * correctly regardless of which techStack schema shape is currently
 * loaded by the app — critical since this script is meant to be run
 * immediately after (or before) the schema change in
 * server/src/models/usersModels/AdminProject.model.js, when the two
 * can briefly be out of sync.
 *
 * Run with --dry-run first to review the planned changes without saving:
 *   node src/scripts/migrateTechStack.js --dry-run
 * Then run for real:
 *   node src/scripts/migrateTechStack.js
 *
 * Safe to re-run — string entries are only converted if they are still
 * plain strings; already-migrated object entries are left untouched.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../database/database.js';

const COLLECTION_NAME = 'adminprojects';

// Mirrors client/src/lib/techCatalog.ts — keep names/aliases/keys in sync
// if the frontend catalog changes.
const CATALOG = [
  { key: 'react', name: 'React', aliases: ['reactjs'] },
  { key: 'nextjs', name: 'Next.js', aliases: ['next', 'nextdotjs'] },
  { key: 'vue', name: 'Vue.js', aliases: ['vuejs', 'vue'] },
  { key: 'angular', name: 'Angular', aliases: [] },
  { key: 'svelte', name: 'Svelte', aliases: [] },
  { key: 'typescript', name: 'TypeScript', aliases: ['ts'] },
  { key: 'javascript', name: 'JavaScript', aliases: ['js'] },
  { key: 'nodejs', name: 'Node.js', aliases: ['node', 'nodedotjs'] },
  { key: 'express', name: 'Express', aliases: [] },
  { key: 'mongodb', name: 'MongoDB', aliases: [] },
  { key: 'postgresql', name: 'PostgreSQL', aliases: ['postgres'] },
  { key: 'mysql', name: 'MySQL', aliases: [] },
  { key: 'redis', name: 'Redis', aliases: [] },
  { key: 'tailwindcss', name: 'Tailwind CSS', aliases: ['tailwind'] },
  { key: 'framer', name: 'Framer Motion', aliases: ['framer'] },
  { key: 'react-router', name: 'React Router', aliases: ['reactrouter'] },
  { key: 'graphql', name: 'GraphQL', aliases: [] },
  { key: 'firebase', name: 'Firebase', aliases: [] },
  { key: 'supabase', name: 'Supabase', aliases: [] },
  { key: 'docker', name: 'Docker', aliases: [] },
  { key: 'aws', name: 'AWS', aliases: ['amazon web services'] },
  { key: 'python', name: 'Python', aliases: [] },
  { key: 'django', name: 'Django', aliases: [] },
  { key: 'flask', name: 'Flask', aliases: [] },
  { key: 'flutter', name: 'Flutter', aliases: [] },
  { key: 'openai', name: 'OpenAI', aliases: [] },
];

// Note: 'react-router' isn't in the frontend TECH_CATALOG built in Task 3 —
// if this exact key shows up as a match during migration, add a matching
// entry to TECH_CATALOG in client/src/lib/techCatalog.ts (react-icons/si
// has no dedicated React Router logo, so add it pointing at GenericTechIcon).

function findCatalogMatch(pieceText) {
  const normalized = pieceText.trim().toLowerCase();
  for (const entry of CATALOG) {
    const haystacks = [entry.name.toLowerCase(), ...entry.aliases.map(a => a.toLowerCase())];
    if (haystacks.some(h => h === normalized || normalized.includes(h))) {
      return entry;
    }
  }
  return null;
}

function convertString(original) {
  // Split combined entries like "React 19 + TypeScript" into pieces
  const pieces = original.split(/[+,&]/).map(p => p.trim()).filter(Boolean);

  return pieces.map(piece => {
    const versionMatch = piece.match(/^(.*?)\s+(\d+(?:\.\d+)*)$/);
    const namePart = versionMatch ? versionMatch[1].trim() : piece;
    const version = versionMatch ? versionMatch[2] : undefined;

    const match = findCatalogMatch(namePart);
    if (match) {
      return { name: match.name, version, icon: match.key };
    }
    return { name: namePart, version, icon: 'generic' };
  });
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\nStarting techStack migration${dryRun ? ' (DRY RUN — no writes)' : ''}...\n`);

  await connectDB();
  const collection = mongoose.connection.db.collection(COLLECTION_NAME);

  const projects = await collection.find({}).toArray();
  let changedCount = 0;
  const unmatched = [];

  for (const project of projects) {
    const techStack = project.techStack || [];
    const hasStringEntries = techStack.some(t => typeof t === 'string');
    if (!hasStringEntries || techStack.length === 0) continue;

    const converted = [];
    for (const entry of techStack) {
      if (typeof entry === 'string') {
        converted.push(...convertString(entry));
      } else {
        converted.push(entry); // already migrated
      }
    }

    for (const c of converted) {
      if (c.icon === 'generic') unmatched.push(`${project.projectTitle}: "${c.name}"`);
    }

    console.log(`${project.projectTitle} (${project._id}):`);
    console.log(`  before: ${JSON.stringify(techStack)}`);
    console.log(`  after:  ${JSON.stringify(converted)}`);

    if (!dryRun) {
      await collection.updateOne({ _id: project._id }, { $set: { techStack: converted } });
    }
    changedCount++;
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${changedCount} project(s).`);
  if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} entries had no catalog match and got the generic icon — review these manually:`);
    unmatched.forEach(u => console.log(`  - ${u}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
```

- [ ] **Step 2: Run the dry run and review output**

From `server/`:
```bash
node src/scripts/migrateTechStack.js --dry-run
```
Expected: prints a before/after line for every project with string `techStack` entries, a total count, and a list of any unmatched entries. No errors. Review the "after" output for each project — confirm names/versions look correct before proceeding.

- [ ] **Step 3: Run it for real**

```bash
node src/scripts/migrateTechStack.js
```
Expected: same output as the dry run, but ending in `Updated N project(s).` (not "Would update").

- [ ] **Step 4: Confirm nothing is left to migrate**

Run the same script again in dry-run mode:
```bash
node src/scripts/migrateTechStack.js --dry-run
```
Expected: prints no before/after lines (no documents match `hasStringEntries` anymore) and ends with `Would update 0 project(s).` — confirming every document is now fully migrated.

- [ ] **Step 5: Commit**

```bash
git add server/src/scripts/migrateTechStack.js
git commit -m "chore: migrate techStack string entries to structured name/version/icon objects"
```

- [ ] **Step 6: Now it's safe to use the admin panel again** — `/admin/projects` reads (list, view, edit) will now correctly hydrate every project's `techStack` under the new schema from Task 1.

---

### Task 3: Frontend — tech logo catalog

**Files:**
- Create: `client/src/lib/techCatalog.ts`

**Interfaces:**
- Consumes: `DefaultIcon` from `client/src/components/TechIcons.tsx` (existing export, unchanged).
- Produces:
  - `interface TechCatalogEntry { key: string; name: string; Icon: React.ComponentType<{ className?: string }>; aliases?: string[]; }`
  - `export const TECH_CATALOG: TechCatalogEntry[]`
  - `export const GenericTechIcon: React.ComponentType<{ className?: string }>`
  - `export function searchTechCatalog(query: string): TechCatalogEntry[]`
  - `export function getTechByKey(key: string): TechCatalogEntry | undefined`
  - Consumed by Task 4 (`TechStackPicker`), Task 5 (`Projects.tsx` View modal), Task 6 (`ProjectDetail.tsx`).

- [ ] **Step 1: Create the catalog file**

Create `client/src/lib/techCatalog.ts`:

```ts
/**
 * Static catalog of technology logos, searchable by name/alias.
 * Used by TechStackPicker (admin) and the public project detail page's
 * "Powered By" section. `key` is the stable identifier stored on
 * AdminProject.techStack[].icon — never rename an existing key without
 * a data migration.
 */
import type { ComponentType } from 'react';
import {
  SiReact, SiNextdotjs, SiVuedotjs, SiAngular, SiSvelte, SiSolid, SiAstro, SiRemix, SiGatsby, SiRedux, SiJquery,
  SiTypescript, SiJavascript, SiPython, SiRuby, SiPhp, SiGo, SiRust, SiOpenjdk, SiCplusplus, SiSharp, SiScala, SiElixir, SiDart, SiSwift, SiKotlin,
  SiHtml5, SiCss, SiSass, SiTailwindcss, SiBootstrap, SiChakraui, SiMui, SiAntdesign, SiRadixui,
  SiWebpack, SiVite, SiBabel, SiEslint, SiPrettier, SiNpm, SiYarn, SiPnpm, SiZod,
  SiJest, SiCypress, SiVitest, SiSelenium, SiStorybook,
  SiNodedotjs, SiExpress, SiNestjs, SiDjango, SiFlask, SiFastapi, SiSpringboot, SiDotnet, SiLaravel, SiRubyonrails, SiPhoenixframework, SiDeno, SiBun, SiElectron,
  SiMongodb, SiPostgresql, SiMysql, SiSqlite, SiRedis, SiElasticsearch,
  SiGraphql, SiApollographql, SiTrpc, SiSocketdotio, SiSwagger, SiJson, SiYaml, SiMarkdown, SiOpenapiinitiative,
  SiFirebase, SiSupabase, SiGooglecloud, SiVercel, SiNetlify, SiHeroku, SiDigitalocean, SiCloudflare, SiDocker, SiKubernetes,
  SiJenkins, SiGithubactions, SiCircleci, SiTerraform, SiAnsible, SiPrometheus, SiGrafana, SiSentry, SiDatadog, SiNewrelic,
  SiGit, SiGithub, SiGitlab, SiBitbucket, SiPostman, SiJira, SiSlack, SiNotion, SiVim, SiIntellijidea, SiXcode, SiAndroidstudio, SiLinux, SiUbuntu, SiNginx, SiApache, SiGooglechrome, SiFirefoxbrowser, SiSafari,
  SiFigma, SiFramer, SiSketch, SiInvision,
  SiFlutter, SiIonic,
  SiUnity, SiUnrealengine, SiBlender, SiThreedotjs, SiChartdotjs, SiD3, SiWebassembly, SiWebrtc, SiPwa,
  SiWordpress, SiShopify, SiWoocommerce, SiWebflow, SiContentful, SiStrapi, SiSanity, SiHasura, SiPrisma, SiSequelize,
  SiTensorflow, SiPytorch, SiKeras, SiScikitlearn, SiPandas, SiNumpy, SiJupyter, SiAnaconda, SiOpenai, SiHuggingface, SiLangchain, SiOllama, SiAnthropic, SiGooglegemini,
  SiTwilio, SiSendgrid, SiMailchimp, SiDiscord, SiTelegram, SiWhatsapp, SiZapier,
  SiPaypal, SiStripe,
  SiAuth0, SiJsonwebtokens, SiOkta,
  SiFacebook, SiInstagram, SiX, SiYoutube, SiTiktok, SiSpotify, SiGoogleanalytics, SiGoogletagmanager, SiMeta,
  SiEthereum, SiSolidity, SiWeb3Dotjs,
  SiCloudinary, SiRabbitmq, SiApachekafka,
} from 'react-icons/si';
import { FaAws } from 'react-icons/fa';
import { DefaultIcon } from '../components/TechIcons';

export interface TechCatalogEntry {
  key: string;
  name: string;
  Icon: ComponentType<{ className?: string }>;
  aliases?: string[];
}

export const GenericTechIcon = DefaultIcon;

export const TECH_CATALOG: TechCatalogEntry[] = [
  // Frontend frameworks / libraries
  { key: 'react', name: 'React', Icon: SiReact, aliases: ['reactjs'] },
  { key: 'react-native', name: 'React Native', Icon: SiReact, aliases: ['reactnative'] },
  { key: 'nextjs', name: 'Next.js', Icon: SiNextdotjs, aliases: ['next'] },
  { key: 'vue', name: 'Vue.js', Icon: SiVuedotjs, aliases: ['vuejs'] },
  { key: 'angular', name: 'Angular', Icon: SiAngular },
  { key: 'svelte', name: 'Svelte', Icon: SiSvelte },
  { key: 'solidjs', name: 'Solid.js', Icon: SiSolid, aliases: ['solid'] },
  { key: 'astro', name: 'Astro', Icon: SiAstro },
  { key: 'remix', name: 'Remix', Icon: SiRemix },
  { key: 'gatsby', name: 'Gatsby', Icon: SiGatsby },
  { key: 'redux', name: 'Redux', Icon: SiRedux },
  { key: 'jquery', name: 'jQuery', Icon: SiJquery },

  // Languages
  { key: 'typescript', name: 'TypeScript', Icon: SiTypescript, aliases: ['ts'] },
  { key: 'javascript', name: 'JavaScript', Icon: SiJavascript, aliases: ['js'] },
  { key: 'python', name: 'Python', Icon: SiPython },
  { key: 'ruby', name: 'Ruby', Icon: SiRuby },
  { key: 'php', name: 'PHP', Icon: SiPhp },
  { key: 'go', name: 'Go', Icon: SiGo, aliases: ['golang'] },
  { key: 'rust', name: 'Rust', Icon: SiRust },
  { key: 'java', name: 'Java', Icon: SiOpenjdk },
  { key: 'cpp', name: 'C++', Icon: SiCplusplus, aliases: ['c++'] },
  { key: 'csharp', name: 'C#', Icon: SiSharp, aliases: ['c#'] },
  { key: 'scala', name: 'Scala', Icon: SiScala },
  { key: 'elixir', name: 'Elixir', Icon: SiElixir },
  { key: 'dart', name: 'Dart', Icon: SiDart },
  { key: 'swift', name: 'Swift', Icon: SiSwift },
  { key: 'kotlin', name: 'Kotlin', Icon: SiKotlin },

  // Styling / UI
  { key: 'html5', name: 'HTML5', Icon: SiHtml5, aliases: ['html'] },
  { key: 'css3', name: 'CSS3', Icon: SiCss, aliases: ['css'] },
  { key: 'sass', name: 'Sass', Icon: SiSass },
  { key: 'tailwindcss', name: 'Tailwind CSS', Icon: SiTailwindcss, aliases: ['tailwind'] },
  { key: 'bootstrap', name: 'Bootstrap', Icon: SiBootstrap },
  { key: 'chakraui', name: 'Chakra UI', Icon: SiChakraui },
  { key: 'mui', name: 'Material UI', Icon: SiMui, aliases: ['mui'] },
  { key: 'antdesign', name: 'Ant Design', Icon: SiAntdesign },
  { key: 'radixui', name: 'Radix UI', Icon: SiRadixui },

  // Build / tooling
  { key: 'webpack', name: 'Webpack', Icon: SiWebpack },
  { key: 'vite', name: 'Vite', Icon: SiVite },
  { key: 'babel', name: 'Babel', Icon: SiBabel },
  { key: 'eslint', name: 'ESLint', Icon: SiEslint },
  { key: 'prettier', name: 'Prettier', Icon: SiPrettier },
  { key: 'npm', name: 'npm', Icon: SiNpm },
  { key: 'yarn', name: 'Yarn', Icon: SiYarn },
  { key: 'pnpm', name: 'pnpm', Icon: SiPnpm },
  { key: 'zod', name: 'Zod', Icon: SiZod },

  // Testing
  { key: 'jest', name: 'Jest', Icon: SiJest },
  { key: 'cypress', name: 'Cypress', Icon: SiCypress },
  { key: 'vitest', name: 'Vitest', Icon: SiVitest },
  { key: 'selenium', name: 'Selenium', Icon: SiSelenium },
  { key: 'storybook', name: 'Storybook', Icon: SiStorybook },

  // Backend frameworks
  { key: 'nodejs', name: 'Node.js', Icon: SiNodedotjs, aliases: ['node'] },
  { key: 'express', name: 'Express', Icon: SiExpress },
  { key: 'nestjs', name: 'NestJS', Icon: SiNestjs },
  { key: 'django', name: 'Django', Icon: SiDjango },
  { key: 'flask', name: 'Flask', Icon: SiFlask },
  { key: 'fastapi', name: 'FastAPI', Icon: SiFastapi },
  { key: 'springboot', name: 'Spring Boot', Icon: SiSpringboot, aliases: ['spring'] },
  { key: 'dotnet', name: '.NET', Icon: SiDotnet },
  { key: 'laravel', name: 'Laravel', Icon: SiLaravel },
  { key: 'rubyonrails', name: 'Ruby on Rails', Icon: SiRubyonrails, aliases: ['rails'] },
  { key: 'phoenix', name: 'Phoenix', Icon: SiPhoenixframework },
  { key: 'deno', name: 'Deno', Icon: SiDeno },
  { key: 'bun', name: 'Bun', Icon: SiBun },
  { key: 'electron', name: 'Electron', Icon: SiElectron },

  // Databases
  { key: 'mongodb', name: 'MongoDB', Icon: SiMongodb },
  { key: 'postgresql', name: 'PostgreSQL', Icon: SiPostgresql, aliases: ['postgres'] },
  { key: 'mysql', name: 'MySQL', Icon: SiMysql },
  { key: 'sqlite', name: 'SQLite', Icon: SiSqlite },
  { key: 'redis', name: 'Redis', Icon: SiRedis },
  { key: 'elasticsearch', name: 'Elasticsearch', Icon: SiElasticsearch },

  // APIs / data formats
  { key: 'graphql', name: 'GraphQL', Icon: SiGraphql },
  { key: 'apollographql', name: 'Apollo GraphQL', Icon: SiApollographql },
  { key: 'trpc', name: 'tRPC', Icon: SiTrpc },
  { key: 'socketio', name: 'Socket.IO', Icon: SiSocketdotio },
  { key: 'swagger', name: 'Swagger', Icon: SiSwagger },
  { key: 'json', name: 'JSON', Icon: SiJson },
  { key: 'yaml', name: 'YAML', Icon: SiYaml },
  { key: 'markdown', name: 'Markdown', Icon: SiMarkdown },
  { key: 'openapi', name: 'OpenAPI', Icon: SiOpenapiinitiative },

  // Cloud / infra
  { key: 'firebase', name: 'Firebase', Icon: SiFirebase },
  { key: 'supabase', name: 'Supabase', Icon: SiSupabase },
  { key: 'googlecloud', name: 'Google Cloud', Icon: SiGooglecloud, aliases: ['gcp'] },
  { key: 'aws', name: 'AWS', Icon: FaAws, aliases: ['amazon web services'] },
  { key: 'vercel', name: 'Vercel', Icon: SiVercel },
  { key: 'netlify', name: 'Netlify', Icon: SiNetlify },
  { key: 'heroku', name: 'Heroku', Icon: SiHeroku },
  { key: 'digitalocean', name: 'DigitalOcean', Icon: SiDigitalocean },
  { key: 'cloudflare', name: 'Cloudflare', Icon: SiCloudflare },
  { key: 'docker', name: 'Docker', Icon: SiDocker },
  { key: 'kubernetes', name: 'Kubernetes', Icon: SiKubernetes, aliases: ['k8s'] },

  // CI/CD & DevOps
  { key: 'jenkins', name: 'Jenkins', Icon: SiJenkins },
  { key: 'githubactions', name: 'GitHub Actions', Icon: SiGithubactions },
  { key: 'circleci', name: 'CircleCI', Icon: SiCircleci },
  { key: 'terraform', name: 'Terraform', Icon: SiTerraform },
  { key: 'ansible', name: 'Ansible', Icon: SiAnsible },
  { key: 'prometheus', name: 'Prometheus', Icon: SiPrometheus },
  { key: 'grafana', name: 'Grafana', Icon: SiGrafana },
  { key: 'sentry', name: 'Sentry', Icon: SiSentry },
  { key: 'datadog', name: 'Datadog', Icon: SiDatadog },
  { key: 'newrelic', name: 'New Relic', Icon: SiNewrelic },

  // Dev tools
  { key: 'git', name: 'Git', Icon: SiGit },
  { key: 'github', name: 'GitHub', Icon: SiGithub },
  { key: 'gitlab', name: 'GitLab', Icon: SiGitlab },
  { key: 'bitbucket', name: 'Bitbucket', Icon: SiBitbucket },
  { key: 'postman', name: 'Postman', Icon: SiPostman },
  { key: 'jira', name: 'Jira', Icon: SiJira },
  { key: 'slack', name: 'Slack', Icon: SiSlack },
  { key: 'notion', name: 'Notion', Icon: SiNotion },
  { key: 'vim', name: 'Vim', Icon: SiVim },
  { key: 'intellijidea', name: 'IntelliJ IDEA', Icon: SiIntellijidea },
  { key: 'xcode', name: 'Xcode', Icon: SiXcode },
  { key: 'androidstudio', name: 'Android Studio', Icon: SiAndroidstudio },
  { key: 'linux', name: 'Linux', Icon: SiLinux },
  { key: 'ubuntu', name: 'Ubuntu', Icon: SiUbuntu },
  { key: 'nginx', name: 'Nginx', Icon: SiNginx },
  { key: 'apache', name: 'Apache', Icon: SiApache },
  { key: 'chrome', name: 'Chrome', Icon: SiGooglechrome },
  { key: 'firefox', name: 'Firefox', Icon: SiFirefoxbrowser },
  { key: 'safari', name: 'Safari', Icon: SiSafari },

  // Design
  { key: 'figma', name: 'Figma', Icon: SiFigma },
  { key: 'framer', name: 'Framer Motion', Icon: SiFramer, aliases: ['framer'] },
  { key: 'sketch', name: 'Sketch', Icon: SiSketch },
  { key: 'invision', name: 'InVision', Icon: SiInvision },

  // Mobile
  { key: 'flutter', name: 'Flutter', Icon: SiFlutter },
  { key: 'ionic', name: 'Ionic', Icon: SiIonic },

  // Game / 3D / graphics / web platform
  { key: 'unity', name: 'Unity', Icon: SiUnity },
  { key: 'unrealengine', name: 'Unreal Engine', Icon: SiUnrealengine },
  { key: 'blender', name: 'Blender', Icon: SiBlender },
  { key: 'threejs', name: 'Three.js', Icon: SiThreedotjs },
  { key: 'chartjs', name: 'Chart.js', Icon: SiChartdotjs },
  { key: 'd3js', name: 'D3.js', Icon: SiD3 },
  { key: 'webassembly', name: 'WebAssembly', Icon: SiWebassembly, aliases: ['wasm'] },
  { key: 'webrtc', name: 'WebRTC', Icon: SiWebrtc },
  { key: 'pwa', name: 'PWA', Icon: SiPwa },

  // CMS / e-commerce / backend-as-a-service
  { key: 'wordpress', name: 'WordPress', Icon: SiWordpress },
  { key: 'shopify', name: 'Shopify', Icon: SiShopify },
  { key: 'woocommerce', name: 'WooCommerce', Icon: SiWoocommerce },
  { key: 'webflow', name: 'Webflow', Icon: SiWebflow },
  { key: 'contentful', name: 'Contentful', Icon: SiContentful },
  { key: 'strapi', name: 'Strapi', Icon: SiStrapi },
  { key: 'sanity', name: 'Sanity', Icon: SiSanity },
  { key: 'hasura', name: 'Hasura', Icon: SiHasura },
  { key: 'prisma', name: 'Prisma', Icon: SiPrisma },
  { key: 'sequelize', name: 'Sequelize', Icon: SiSequelize },

  // Data / ML / AI
  { key: 'tensorflow', name: 'TensorFlow', Icon: SiTensorflow },
  { key: 'pytorch', name: 'PyTorch', Icon: SiPytorch },
  { key: 'keras', name: 'Keras', Icon: SiKeras },
  { key: 'scikitlearn', name: 'scikit-learn', Icon: SiScikitlearn },
  { key: 'pandas', name: 'Pandas', Icon: SiPandas },
  { key: 'numpy', name: 'NumPy', Icon: SiNumpy },
  { key: 'jupyter', name: 'Jupyter', Icon: SiJupyter },
  { key: 'anaconda', name: 'Anaconda', Icon: SiAnaconda },
  { key: 'openai', name: 'OpenAI', Icon: SiOpenai },
  { key: 'huggingface', name: 'Hugging Face', Icon: SiHuggingface },
  { key: 'langchain', name: 'LangChain', Icon: SiLangchain },
  { key: 'ollama', name: 'Ollama', Icon: SiOllama },
  { key: 'anthropic', name: 'Anthropic', Icon: SiAnthropic, aliases: ['claude'] },
  { key: 'googlegemini', name: 'Google Gemini', Icon: SiGooglegemini, aliases: ['gemini'] },

  // Messaging / comms / marketing
  { key: 'twilio', name: 'Twilio', Icon: SiTwilio },
  { key: 'sendgrid', name: 'SendGrid', Icon: SiSendgrid },
  { key: 'mailchimp', name: 'Mailchimp', Icon: SiMailchimp },
  { key: 'discord', name: 'Discord', Icon: SiDiscord },
  { key: 'telegram', name: 'Telegram', Icon: SiTelegram },
  { key: 'whatsapp', name: 'WhatsApp', Icon: SiWhatsapp },
  { key: 'zapier', name: 'Zapier', Icon: SiZapier },

  // Payments
  { key: 'paypal', name: 'PayPal', Icon: SiPaypal },
  { key: 'stripe', name: 'Stripe', Icon: SiStripe },

  // Auth
  { key: 'auth0', name: 'Auth0', Icon: SiAuth0 },
  { key: 'jwt', name: 'JSON Web Tokens', Icon: SiJsonwebtokens, aliases: ['jwt'] },
  { key: 'okta', name: 'Okta', Icon: SiOkta },

  // Social / marketing platforms
  { key: 'facebook', name: 'Facebook', Icon: SiFacebook },
  { key: 'instagram', name: 'Instagram', Icon: SiInstagram },
  { key: 'x-twitter', name: 'X (Twitter)', Icon: SiX, aliases: ['twitter'] },
  { key: 'youtube', name: 'YouTube', Icon: SiYoutube },
  { key: 'tiktok', name: 'TikTok', Icon: SiTiktok },
  { key: 'spotify', name: 'Spotify', Icon: SiSpotify },
  { key: 'googleanalytics', name: 'Google Analytics', Icon: SiGoogleanalytics },
  { key: 'googletagmanager', name: 'Google Tag Manager', Icon: SiGoogletagmanager },
  { key: 'meta', name: 'Meta', Icon: SiMeta },

  // Blockchain
  { key: 'ethereum', name: 'Ethereum', Icon: SiEthereum },
  { key: 'solidity', name: 'Solidity', Icon: SiSolidity },
  { key: 'web3js', name: 'Web3.js', Icon: SiWeb3Dotjs },

  // Misc
  { key: 'cloudinary', name: 'Cloudinary', Icon: SiCloudinary },
  { key: 'rabbitmq', name: 'RabbitMQ', Icon: SiRabbitmq },
  { key: 'apachekafka', name: 'Apache Kafka', Icon: SiApachekafka, aliases: ['kafka'] },
];

/** Case-insensitive search over name + aliases. Prefix matches rank above substring matches. */
export function searchTechCatalog(query: string): TechCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const starts: TechCatalogEntry[] = [];
  const includes: TechCatalogEntry[] = [];

  for (const entry of TECH_CATALOG) {
    const haystacks = [entry.name.toLowerCase(), ...(entry.aliases || []).map(a => a.toLowerCase())];
    if (haystacks.some(h => h.startsWith(q))) {
      starts.push(entry);
    } else if (haystacks.some(h => h.includes(q))) {
      includes.push(entry);
    }
  }

  return [...starts, ...includes];
}

export function getTechByKey(key: string): TechCatalogEntry | undefined {
  return TECH_CATALOG.find(entry => entry.key === key);
}
```

- [ ] **Step 2: Verify it compiles**

Run from `client/`:
```bash
npm run build
```
Expected: exits 0, no TypeScript errors mentioning `techCatalog.ts`.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/techCatalog.ts
git commit -m "feat: add searchable tech logo catalog for portfolio projects"
```

---

### Task 4: Frontend — `TechStackPicker` component

**Files:**
- Create: `client/src/components/TechStackPicker.tsx`

**Interfaces:**
- Consumes: `TECH_CATALOG`, `searchTechCatalog`, `getTechByKey`, `GenericTechIcon`, `TechCatalogEntry` from `../lib/techCatalog` (Task 3); `Input` from `./ui/input`; `X` from `lucide-react`.
- Produces:
  - `export interface TechStackEntry { name: string; version?: string; icon: string; }`
  - `export default function TechStackPicker({ value, onChange }: { value: TechStackEntry[]; onChange: (next: TechStackEntry[]) => void }): JSX.Element`
  - Consumed by Task 5 (`Projects.tsx` Add/Edit modal).

- [ ] **Step 1: Create the component**

Create `client/src/components/TechStackPicker.tsx`:

```tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from './ui/input';
import { searchTechCatalog, getTechByKey, GenericTechIcon, TechCatalogEntry } from '../lib/techCatalog';

export interface TechStackEntry {
  name: string;
  version?: string;
  icon: string;
}

interface TechStackPickerProps {
  value: TechStackEntry[];
  onChange: (next: TechStackEntry[]) => void;
}

export default function TechStackPicker({ value, onChange }: TechStackPickerProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const results = query.trim() ? searchTechCatalog(query) : [];
  const selectedKeys = new Set(value.map(v => v.icon));
  const availableResults = results.filter(r => !selectedKeys.has(r.key));
  const trimmedQuery = query.trim();
  const exactNameMatch = value.some(v => v.name.toLowerCase() === trimmedQuery.toLowerCase());

  const addEntry = (entry: TechCatalogEntry) => {
    onChange([...value, { name: entry.name, icon: entry.key }]);
    setQuery('');
    setShowDropdown(false);
  };

  const addCustom = () => {
    if (!trimmedQuery || exactNameMatch) return;
    onChange([...value, { name: trimmedQuery, icon: 'generic' }]);
    setQuery('');
    setShowDropdown(false);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateVersion = (index: number, version: string) => {
    onChange(value.map((v, i) => (i === index ? { ...v, version } : v)));
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search a technology (React, MongoDB, Docker...)"
        />
        {showDropdown && trimmedQuery && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
            {availableResults.length > 0 ? (
              availableResults.slice(0, 8).map(entry => (
                <button
                  key={entry.key}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => addEntry(entry)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  <entry.Icon className="h-4 w-4 shrink-0" />
                  <span>{entry.name}</span>
                </button>
              ))
            ) : (
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={addCustom}
                disabled={exactNameMatch}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <GenericTechIcon className="h-4 w-4 shrink-0" />
                <span>Add "{trimmedQuery}" without a logo</span>
              </button>
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((entry, index) => {
            const catalogEntry = getTechByKey(entry.icon);
            const Icon = catalogEntry?.Icon || GenericTechIcon;
            return (
              <div key={`${entry.icon}-${index}`} className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-muted/50 border border-border">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{entry.name}</span>
                <input
                  value={entry.version || ''}
                  onChange={e => updateVersion(index, e.target.value)}
                  placeholder="ver"
                  className="w-12 bg-transparent text-xs text-muted-foreground focus:outline-none border-b border-transparent focus:border-border"
                />
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="h-4 w-4 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run from `client/`:
```bash
npm run build
```
Expected: exits 0, no TypeScript errors mentioning `TechStackPicker.tsx`.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/TechStackPicker.tsx
git commit -m "feat: add TechStackPicker search-and-chip component"
```

---

### Task 5: Frontend — wire `TechStackPicker` into admin Projects page

**Files:**
- Modify: `client/src/pages/admin/Projects.tsx:28-113` (types, `formToPayload`, `projectToForm`)
- Modify: `client/src/pages/admin/Projects.tsx:570-573` (Tech Stack input in Add/Edit modal)
- Modify: `client/src/pages/admin/Projects.tsx:738-745` (Tech Stack display in View modal)

**Interfaces:**
- Consumes: `TechStackPicker`, `TechStackEntry` from `../../components/TechStackPicker` (Task 4); `getTechByKey`, `GenericTechIcon` from `../../lib/techCatalog` (Task 3).
- Produces: `ProjectForm.techStack: TechStackEntry[]`, consumed by `formToPayload`/`projectToForm` in the same file.

- [ ] **Step 1: Add imports**

In `client/src/pages/admin/Projects.tsx`, add after the existing `BulkActionBar` import (line 20):

```tsx
import TechStackPicker, { TechStackEntry } from '../../components/TechStackPicker';
import { getTechByKey, GenericTechIcon } from '../../lib/techCatalog';
```

- [ ] **Step 2: Change `ProjectForm.techStack` type**

Find (line 36):
```tsx
  techStack: string;       // comma-separated input
```
Replace with:
```tsx
  techStack: TechStackEntry[];
```

- [ ] **Step 3: Change the empty form default**

Find (line 58):
```tsx
  techStack: '',
```
Replace with:
```tsx
  techStack: [],
```

- [ ] **Step 4: Update `formToPayload`**

Find (line 80):
```tsx
    techStack: form.techStack.split(',').map(t => t.trim()).filter(Boolean),
```
Replace with:
```tsx
    techStack: form.techStack,
```

- [ ] **Step 5: Update `projectToForm`**

Find (line 103):
```tsx
    techStack: (p.techStack || []).join(', '),
```
Replace with:
```tsx
    techStack: p.techStack || [],
```

- [ ] **Step 6: Replace the Tech Stack input in the Add/Edit modal**

Find (lines 570-573):
```tsx
              <div className="space-y-2">
                <Label>Tech Stack <span className="text-muted-foreground text-xs">(comma separated)</span></Label>
                <Input value={form.techStack} onChange={e => setField('techStack', e.target.value)} placeholder="React, TypeScript, Node.js, MongoDB" />
              </div>
```
Replace with:
```tsx
              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <TechStackPicker value={form.techStack} onChange={next => setField('techStack', next)} />
              </div>
```

- [ ] **Step 7: Replace the Tech Stack display in the View modal**

Find (lines 738-745):
```tsx
              {viewProject.techStack?.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Tech Stack</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewProject.techStack.map((t: string) => <Badge key={t} variant="outline">{t}</Badge>)}
                  </div>
                </div>
              )}
```
Replace with:
```tsx
              {viewProject.techStack?.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Tech Stack</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {viewProject.techStack.map((t: TechStackEntry, i: number) => {
                      const Icon = getTechByKey(t.icon)?.Icon || GenericTechIcon;
                      return (
                        <Badge key={`${t.icon}-${i}`} variant="outline" className="flex items-center gap-1.5">
                          <Icon className="h-3 w-3" />
                          {t.name}{t.version ? ` ${t.version}` : ''}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
```

- [ ] **Step 8: Verify it compiles**

Run from `client/`:
```bash
npm run build
```
Expected: exits 0, no TypeScript errors mentioning `Projects.tsx`.

- [ ] **Step 9: Manual smoke test**

Run `npm run dev` from `client/` (and ensure the backend from `server/` is running with `npm run dev`), then in a browser:
1. Go to `/admin/projects` → "Add Project".
2. In the Tech Stack field, type "reac" → confirm a dropdown appears showing "React" with its logo.
3. Click it → confirm a chip appears: `[React logo] React [ver] [×]`.
4. Type "19" into the chip's version box → confirm it accepts input.
5. Type "zzznotarealtech" → confirm the dropdown shows `Add "zzznotarealtech" without a logo` and clicking it adds a chip with the generic icon.
6. Fill the other required fields, add an image, submit.
7. Re-open the created project via the View (eye) button → confirm the Tech Stack section shows the same chips with logos.
8. Open the same project via Edit (pencil) button → confirm the picker shows the existing chips and still lets you add/remove more.

Expected: all steps behave as described, no console errors.

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/admin/Projects.tsx
git commit -m "feat: replace comma-separated tech stack input with logo picker in admin"
```

---

### Task 6: Frontend — show logos on the public "Powered By" section

**Files:**
- Modify: `client/src/pages/public/ProjectDetail.tsx:14` (imports)
- Modify: `client/src/pages/public/ProjectDetail.tsx:148` (`techItems` derivation)
- Modify: `client/src/pages/public/ProjectDetail.tsx:256-261` (marquee pill rendering)

**Interfaces:**
- Consumes: `getTechByKey`, `GenericTechIcon` from `../../lib/techCatalog` (Task 3).

- [ ] **Step 1: Update imports**

Find (line 14):
```tsx
import { ArrowLeft, ArrowRight, Code2, Globe, Share2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
```
Replace with:
```tsx
import { ArrowLeft, ArrowRight, Globe, Share2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { getTechByKey, GenericTechIcon } from '../../lib/techCatalog';
```
(`Code2` is removed — it was only used in the tech pill being replaced below.)

- [ ] **Step 2: Update `techItems` derivation**

Find (line 148):
```tsx
  const techItems = (project.techStack || []).map((name: string) => ({ name }));
```
Replace with:
```tsx
  const techItems = (project.techStack || []).map((t: any) => {
    // Backward-compat: tolerate any pre-migration plain-string entries
    if (typeof t === 'string') return { name: t, version: undefined, Icon: GenericTechIcon };
    const catalogEntry = getTechByKey(t.icon);
    return { name: t.name, version: t.version, Icon: catalogEntry?.Icon || GenericTechIcon };
  });
```

- [ ] **Step 3: Update the marquee pill rendering**

Find (lines 256-261):
```tsx
                {[...techItems, ...techItems].map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-center gap-3 shrink-0 px-6 py-3 rounded-2xl bg-muted/50 border border-border">
                    <Code2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium whitespace-nowrap">{tech.name}</span>
                  </div>
                ))}
```
Replace with:
```tsx
                {[...techItems, ...techItems].map((tech: any, index: number) => (
                  <div key={index} className="flex items-center justify-center gap-3 shrink-0 px-6 py-3 rounded-2xl bg-muted/50 border border-border">
                    <tech.Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium whitespace-nowrap">{tech.name}{tech.version ? ` ${tech.version}` : ''}</span>
                  </div>
                ))}
```

- [ ] **Step 4: Verify it compiles**

Run from `client/`:
```bash
npm run build
```
Expected: exits 0, no TypeScript errors mentioning `ProjectDetail.tsx`.

- [ ] **Step 5: Manual smoke test**

With `npm run dev` running (client + server), open `/portfolio/<id>` for the project created in Task 5's smoke test. Scroll to "Powered By" and confirm the React logo (and generic icon for the unmatched entry) render in the marquee, with "React 19" showing the version.

Expected: logos render correctly, no broken images, no console errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/public/ProjectDetail.tsx
git commit -m "feat: show real tech logos in the public Powered By section"
```

---

### Task 7: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full build check**

From `client/`:
```bash
npm run build
```
Expected: exits 0, no TypeScript errors anywhere in the project.

- [ ] **Step 2: Full manual walkthrough**

With both `client` and `server` dev servers running:
1. `/admin/projects` → Add Project → add 3-4 techs with versions via the picker → save with an image.
2. Confirm the new project's row, View modal, and Edit modal all show the tech chips with logos.
3. Visit the project's public page (`/portfolio/<id>`) → confirm "Powered By" shows the real logos with versions.
4. Visit `/` (home) and `/portfolio` → confirm the project's card still renders correctly (tech stack isn't shown on cards, only on the detail page, so this just confirms no regressions).
5. Edit an existing (pre-migration) project's tech stack via Edit → confirm the picker loads its migrated chips, and you can add/remove/re-save without errors.

Expected: no console errors, no broken images, all four admin/public surfaces show logos consistently.

- [ ] **Step 3: Clean up any test data created during verification**

If you created a throwaway project in Step 2, delete it via the admin panel's Delete (trash) button.
