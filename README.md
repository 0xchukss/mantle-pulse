# MantlePulse

MantlePulse is a Telegram bot that delivers AI-powered smart money signals from Mantle Network directly to traders.

Bot: [t.me/mantlepulse_bot](https://t.me/mantlepulse_bot)

Tagline: Real-time alpha signals from Mantle's on-chain activity.

## Architecture

```text
Telegram User
    ↓ command
Grammy Bot (Render)
    ↓             ↓
Gemini Flash  Mantle RPC + Subgraph
    ↓
MantlePulse Contract (Mantle)
    ↓
Insight logged on-chain
```

## Tech Stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 20 + TypeScript |
| Telegram | grammy |
| Web server | Fastify |
| Blockchain | ethers.js v6 |
| Smart contract | Solidity 0.8.24 + Hardhat |
| AI | Google Gemini 2.5 Flash |
| On-chain data | Mantle RPC + Goldsky subgraph |
| Scheduler | node-cron |
| Deployment | Render |

## Commands

```text
/start - Show menu
/help - Show menu
/analyze <address> - AI analysis of any wallet
/whales - Track smart money wallet balances
/anomalies - Latest volume spikes and unusual activity
/pulse - Current market sentiment summary
```

## Local Setup

```bash
npm install
cp .env.example .env
npm run compile
npm run build
```

Fill `.env` with:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
MANTLE_CHAIN_ID=5003
DEPLOYER_PRIVATE_KEY=
CONTRACT_ADDRESS=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
SUBGRAPH_URL=
NODE_ENV=development
PORT=3000
ALERT_CHAT_ID=
```

Run in polling mode for local testing:

```bash
npm run dev
```

## Deploy Contract

Testnet:

```bash
npm run deploy:testnet
```

Mainnet:

```bash
npm run deploy:mainnet
```

After deployment, put the printed contract address in `CONTRACT_ADDRESS`.

Deployed contract address: `0x8C78a2d13088EABEcEfe0886E5106046F81dAC03`

Explorer link: [https://explorer.sepolia.mantle.xyz/address/0x8C78a2d13088EABEcEfe0886E5106046F81dAC03](https://explorer.sepolia.mantle.xyz/address/0x8C78a2d13088EABEcEfe0886E5106046F81dAC03)

## Render Deploy

1. Push this repo to GitHub.
2. In Render, choose **New +** -> **Blueprint** and connect this repo, or choose **Web Service** and use the commands below.
3. Build command: `npm ci && npm run build`
4. Start command: `npm start`
5. Add the secret env vars from `.env`: `TELEGRAM_BOT_TOKEN`, `DEPLOYER_PRIVATE_KEY`, `GEMINI_API_KEY`, and optionally `ALERT_CHAT_ID`.
6. Set `TELEGRAM_WEBHOOK_URL` to the Render HTTPS URL, for example `https://mantlepulse.onrender.com`.
7. Redeploy. The app registers `/webhook` automatically.

The root route returns a small JSON health check, and Telegram updates are handled at `/webhook`.

## Hackathon Answers

### Which data sources does your project use?

Mantle Network RPC via ethers.js for wallet balances, ERC-20 transfer events, and block data; Mantle DEX subgraph via Goldsky for swap volumes, pair data, and wallet activity; and the MantlePulse smart contract for tamper-proof on-chain insight logging.

### What role does AI play?

Gemini 2.5 Flash analyzes wallet transaction patterns, classifies them into insight types such as whale accumulation, arbitrage, and dormant activation, scores confidence, and generates plain-English actionable signals delivered through Telegram. It also answers free-text user questions with current Mantle context.

### How does it generate verifiable value on Mantle?

Every AI-generated insight is keccak256-hashed and written on-chain through `logInsight()` on the MantlePulse contract, creating a timestamped public ledger of alpha signals that anyone can verify on Mantle Explorer.

## Submission Checklist

- [x] Contract deployed - address: `0x8C78a2d13088EABEcEfe0886E5106046F81dAC03`
- [ ] Contract verified on Mantle Explorer - explorer API returned HTML during Hardhat verification
- [x] `logInsight()` tested - example tx: [0xa649e244714bdd1094eb2e5b2a0ccdca699b479bb7681d42a6164e4092f7c6db](https://explorer.sepolia.mantle.xyz/tx/0xa649e244714bdd1094eb2e5b2a0ccdca699b479bb7681d42a6164e4092f7c6db)
- [x] Bot live and public - [t.me/mantlepulse_bot](https://t.me/mantlepulse_bot)
- [x] Render URL - [https://mantlepulse.onrender.com](https://mantlepulse.onrender.com)
- [ ] Demo video >= 2 min - `<<VIDEO_LINK>>`
- [x] GitHub repo public - [https://github.com/0xchukss/mantle-pulse](https://github.com/0xchukss/mantle-pulse)
- [ ] DoraHacks submission complete

One-line pitch:

> MantlePulse is a Telegram bot that uses Gemini AI to detect smart money patterns on Mantle and logs verifiable alpha insights on-chain.

## License

MIT
