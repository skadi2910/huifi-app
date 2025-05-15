<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Huifi Protocol — Monorepo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
        }
        pre {
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
        }
        code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        hr {
            border: 0;
            border-top: 1px solid #eaecef;
            margin: 24px 0;
        }
        .emoji {
            font-style: normal;
        }
    </style>
</head>
<body>
    <h1><span class="emoji">💸</span> Huifi Protocol — Monorepo</h1>

    <p>A decentralized Hụi (Rotating Savings and Credit Association) protocol built on <strong>Solana</strong>, using <strong>Anchor</strong> for smart contracts and <strong>Next.js</strong> for the frontend.</p>

    <p>This monorepo is structured to support collaborative development across:</p>

    <ul>
        <li><span class="emoji">✨</span> A web-based frontend</li>
        <li><span class="emoji">🔐</span> A smart contract deployed to the Solana blockchain</li>
        <li><span class="emoji">🧩</span> Shared TypeScript utilities and type definitions</li>
    </ul>

    <hr>

    <h2><span class="emoji">📁</span> Folder Structure</h2>

    <pre><code>huifi-app/ 
├── app/ # Frontend (Next.js, TailwindCSS, Solana Wallet Adapter) 
├── programs/ # Anchor programs directory at root 
├── shared/ # Shared TS types or IDLs (imported by app and tests) 
├── tests/ # Anchor integration tests 
├── Cargo.toml # Rust workspace config for Anchor programs 
├── Anchor.toml # Anchor configuration 
├── pnpm-workspace.yaml # pnpm monorepo setup 
├── .gitignore</code></pre>

    <hr>

    <h2><span class="emoji">🚀</span> Project Goals</h2>

    <p>This project aims to:</p>

    <ul>
        <li>Empower underbanked communities to save, borrow, and lend with transparency.</li>
        <li>Encode traditional Vietnamese "Hụi" savings logic into secure on-chain rules.</li>
        <li>Enable decentralized, trustless early payouts with fair slashing and credit incentives.</li>
    </ul>

    <hr>

    <h2><span class="emoji">🛠️</span> Setup Instructions</h2>

    <h3>1. Prerequisites</h3>

    <p>Make sure you have these installed:</p>

    <ul>
        <li><a href="https://www.rust-lang.org/tools/install">Rust</a> — for smart contract compilation</li>
        <li><a href="https://book.anchor-lang.com/getting_started/installation.html">Anchor CLI</a> — Solana dev framework</li>
        <li><a href="https://docs.solana.com/cli">Solana CLI</a> — for local validator and wallet</li>
        <li>Solana wallet file at <code>~/.config/solana/id.json</code></li>
    </ul>

    <hr>

    <h3>2. Install Dependencies</h3>

    <pre><code>pnpm install   # or yarn install / npm install / bun install</code></pre>

    <p>This installs dependencies for all packages (<code>app</code>, <code>contracts-hui</code>, and <code>shared</code>) thanks to workspace support.</p>

    <hr>

    <h3>3. Run the Frontend</h3>

    <pre><code>pnpm dev -F app</code></pre>

    <p>This starts the Next.js app locally.</p>

    <p>➡️ All code formatting (<code>Prettier</code>) and linting (<code>ESLint</code>) tools are configured <strong>locally inside the <code>app/</code> folder</strong>.</p>

    <pre><code>cd app
pnpm lint
pnpm format</code></pre>

    <hr>

    <h3>4. Compile and Test Smart Contract</h3>

    <pre><code>anchor build
anchor test</code></pre>

    <p>This compiles and runs tests against the local Solana validator.</p>

    <hr>

    <h3>5. Sync Contract IDL to Frontend</h3>

    <p>After building the contract, you'll get an IDL file here:</p>

    <pre><code>/target/idl/contracts_hui.json</code></pre>

    <p>To use this in the frontend, copy it into the shared folder:</p>

    <pre><code>cp target/idl/contracts_hui.json shared/idl/contracts_hui.json</code></pre>

    <hr>

    <h2><span class="emoji">🧰</span> Tooling</h2>

    <p>This repo is compatible with multiple package managers. You may use:</p>

    <ul>
        <li><a href="https://pnpm.io/">pnpm</a></li>
        <li><a href="https://classic.yarnpkg.com/lang/en/">yarn</a></li>
        <li><a href="https://www.npmjs.com/">npm</a></li>
        <li><a href="https://bun.sh/">bun</a></li>
    </ul>

    <p>We recommend <code>pnpm</code> for performance and workspace management, but the monorepo is <strong>not locked</strong> to it.</p>

    <h3>Install dependencies using:</h3>

    <pre><code># pnpm (recommended)
pnpm install

# OR yarn
yarn install

# OR npm
npm install

# OR bun
bun install</code></pre>

    <p><span class="emoji">✅</span> Each subproject (app/, shared/, root-level contracts) works independently as well.</p>

    <hr>

    <h2><span class="emoji">👥</span> Team Workflow</h2>

    <ul>
        <li>All shared logic (e.g., constants, TS types, IDLs) should go in <code>shared/</code></li>
        <li>Avoid committing <code>.env*</code>, <code>.anchor</code>, <code>node_modules</code>, <code>target</code>, etc.</li>
        <li>Run <code>pnpm install</code> (or your tool of choice) after pulling in case dependencies changed</li>
    </ul>

    <hr>

    <h2><span class="emoji">🧠</span> About Hụi</h2>

    <p>Hụi is a traditional Vietnamese savings circle where a group of people contribute funds in cycles, and each member gets a chance to receive the pot. This protocol digitizes that system in a fair, decentralized, and permissionless way.</p>

    <hr>

    <h2><span class="emoji">📄</span> License</h2>

    <p>MIT — feel free to contribute, fork, or adapt this protocol for your community.</p>

    <hr>

    <h2><span class="emoji">👋</span> Want to Help?</h2>

    <p>Open a PR, suggest an improvement, or just star the repo to show support <span class="emoji">💜</span></p>
</body>
</html>
