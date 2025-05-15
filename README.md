# HuiFi - Decentralized ROSCA Platform on Solana

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Solana](https://img.shields.io/badge/Solana-1.98-blue?style=flat-square&logo=solana)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-yellow?style=flat-square)](https://project-serum.github.io/anchor/)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg?style=flat-square)](https://opensource.org/licenses/ISC)

HuiFi is a decentralized Rotating Savings and Credit Association (ROSCA) platform built on the Solana blockchain. It enables users to participate in transparent, secure, and efficient group savings and credit cycles.

## 🌟 Features

- **Decentralized ROSCA Management**: Create and participate in ROSCA groups on Solana
- **Smart Contract Security**: Powered by Anchor framework for secure fund management
- **Web3 Integration**: Seamless connection with Solana wallets
- **Modern UI/UX**: Built with Next.js and TailwindCSS for a responsive experience
- **Real-time Updates**: Live tracking of ROSCA cycles and contributions
- **Multi-wallet Support**: Compatible with popular Solana wallets

## 🚀 Getting Started

### Prerequisites

- Node.js v18.18.0 or higher
- Solana CLI tools
- Anchor Framework
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/skadi2910/huifi-app.git
cd huifi
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install app dependencies
cd app
npm install
```

3. Set up your environment:
```bash
# Configure your Solana wallet and network
solana config set --url localhost
```

4. Start the development environment:
```bash
# Start the local Solana validator
npm run anchor-localnet

# In a new terminal, start the Next.js development server
cd app
npm run dev
```

## 🛠 Development Scripts

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run anchor` - Run Anchor CLI commands
- `npm run anchor-build` - Build Anchor programs
- `npm run anchor-test` - Run Anchor tests
- `npm run update-idl` - Update IDL files

## 🏗 Tech Stack

### Frontend
- Next.js 14.2
- React 18
- TypeScript 5.4
- TailwindCSS 4.1
- DaisyUI
- Framer Motion
- React Query

### Blockchain
- Solana Web3.js
- Anchor Framework
- SPL Token
- Wallet Adapter

### Development Tools
- ESLint
- Jest
- TypeScript
- Postcss

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](#)
- [Live Demo](#)
- [Issue Tracker](#)
- [Project Board](#)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Made with ❤️ by the HuiFi Team
