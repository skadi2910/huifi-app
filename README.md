# 💸 Huifi Protocol — Monorepo

A decentralized Hụi (Rotating Savings and Credit Association) protocol built on **Solana**, using **Anchor** for smart contracts and **Next.js** for the frontend.
https://img.shields.io/github/last-commit/skadi2910/huifi-app?style=flat&logo=git&logoColor=white&color=0080ff
This monorepo is structured to support collaborative development across:

- ✨ A web-based frontend
- 🔐 A smart contract deployed to the Solana blockchain
- 🧩 Shared TypeScript utilities and type definitions

---

## 📁 Folder Structure

```
huifi-app/ 
├── app/ # Frontend (Next.js, TailwindCSS, Solana Wallet Adapter) 
├── programs/ # Anchor programs directory at root 
├── shared/ # Shared TS types or IDLs (imported by app and tests) 
├── tests/ # Anchor integration tests 
├── Cargo.toml # Rust workspace config for Anchor programs 
├── Anchor.toml # Anchor configuration 
├── pnpm-workspace.yaml # pnpm monorepo setup 
├── .gitignore
```
---

## 🚀 Project Goals

This project aims to:

- Empower underbanked communities to save, borrow, and lend with transparency.
- Encode traditional Vietnamese “Hụi” savings logic into secure on-chain rules.
- Enable decentralized, trustless early payouts with fair slashing and credit incentives.

---

## 🛠️ Setup Instructions

### 1. Prerequisites

Make sure you have these installed:

- [Rust](https://www.rust-lang.org/tools/install) — for smart contract compilation
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html) — Solana dev framework
- [Solana CLI](https://docs.solana.com/cli) — for local validator and wallet
- Solana wallet file at `~/.config/solana/id.json`

---

### 2. Install Dependencies

```bash
pnpm install   # or yarn install / npm install / bun install
```

This installs dependencies for all packages (`app`, `contracts-hui`, and `shared`) thanks to workspace support.

---

### 3. Run the Frontend

```bash
pnpm dev -F app
```

This starts the Next.js app locally.

➡️ All code formatting (`Prettier`) and linting (`ESLint`) tools are configured **locally inside the `app/` folder**.

```bash
cd app
pnpm lint
pnpm format
```

---

### 4. Compile and Test Smart Contract

```bash
anchor build
anchor test
```

This compiles and runs tests against the local Solana validator.

---

### 5. Sync Contract IDL to Frontend

After building the contract, you’ll get an IDL file here:

```bash
/target/idl/contracts_hui.json
```

To use this in the frontend, copy it into the shared folder:

```bash
cp target/idl/contracts_hui.json shared/idl/contracts_hui.json
```

---

## 🧰 Tooling

This repo is compatible with multiple package managers. You may use:

- [pnpm](https://pnpm.io/)
- [yarn](https://classic.yarnpkg.com/lang/en/)
- [npm](https://www.npmjs.com/)
- [bun](https://bun.sh/)

We recommend `pnpm` for performance and workspace management, but the monorepo is **not locked** to it.

### Install dependencies using:

```bash
# pnpm (recommended)
pnpm install

# OR yarn
yarn install

# OR npm
npm install

# OR bun
bun install
```

✅ Each subproject (app/, shared/, root-level contracts) works independently as well.

---

## 👥 Team Workflow

- All shared logic (e.g., constants, TS types, IDLs) should go in `shared/`
- Avoid committing `.env*`, `.anchor`, `node_modules`, `target`, etc.
- Run `pnpm install` (or your tool of choice) after pulling in case dependencies changed

---

## 🧠 About Hụi

Hụi is a traditional Vietnamese savings circle where a group of people contribute funds in cycles, and each member gets a chance to receive the pot. This protocol digitizes that system in a fair, decentralized, and permissionless way.

---

## 📄 License

MIT — feel free to contribute, fork, or adapt this protocol for your community.

---

## 👋 Want to Help?

Open a PR, suggest an improvement, or just star the repo to show support 💜
