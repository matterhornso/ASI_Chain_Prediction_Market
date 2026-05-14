# ASI:Chain Prediction Market

A decentralized prediction market platform built on **ASI:Chain DevNet** using **Rholang** smart contracts. Users can create binary (yes/no) prediction markets, place bets, and earn proportional payouts when markets resolve.

![Platform](https://img.shields.io/badge/Chain-ASI%3AChain%20DevNet-blue)
![Language](https://img.shields.io/badge/Smart%20Contract-Rholang-purple)
![License](https://img.shields.io/badge/License-MIT-green)

## Live Deployment

The prediction market contract is deployed on ASI:Chain DevNet:

| Field | Value |
|-------|-------|
| **Network** | ASI:Chain DevNet |
| **Block** | #438724 |
| **Deploy ID** | `3045022100b1d28bb4b043784d6e76a176d63137fa2d82d6cbb9c93025af83fa7bd63ecffc02202e2a06984188463e1efc59f91b280cbbf070e4ed95ed49fbdb02a797bc1578d5` |
| **Registry Name** | `asi_prediction_market_v1` |
| **Explorer** | [View on ASI:Chain Explorer](https://explorer.dev.asichain.io/transaction/3045022100b1d28bb4b043784d6e76a176d63137fa2d82d6cbb9c93025af83fa7bd63ecffc02202e2a06984188463e1efc59f91b280cbbf070e4ed95ed49fbdb02a797bc1578d5) |

## Architecture

```
ASI:Chain DevNet (Rholang VM)
        |
  prediction-market.rho
  (5 on-chain operations)
        |
   +---------+---------+
   |                   |
Frontend (HTML)    CLI Scripts (Node.js)
  (browser)        (terminal)
```

The platform has two interfaces — a browser-based frontend and Node.js CLI scripts — both signing and submitting Rholang deploys directly to the ASI:Chain DevNet validator API. No backend server required.

## Smart Contract

The Rholang contract (`contracts/prediction-market.rho`) implements a fully on-chain prediction market with 5 operations:

| Operation | Description | On-chain Cost |
|-----------|-------------|---------------|
| `createMarket` | Create a new yes/no market with a question and designated oracle | Phlo required |
| `placeBet` | Place a bet on a market's yes or no side with a stake amount | Phlo required |
| `resolveMarket` | Oracle resolves the market with the final outcome | Phlo required |
| `computePayout` | Calculate a bettor's payout on a resolved market | Free (read-only) |
| `getMarket` | Query market data (question, status, pools, oracle) | Free (read-only) |

### Payout Formula

Winners receive their original stake plus a proportional share of the losing pool:

```
payout = stake + (stake / winningPool) * losingPool
```

### Formal Verification

The contract follows strict formal verification practices for Rholang:

- **State Channel Linearity** — Every `for` consumption has a matching write-back on all paths (including error branches)
- **OCAP Boundaries** — All internal channels (`markets`, `bets`, `nextMarketId`) are unforgeable inside `new` blocks
- **Join Patterns** — Multi-channel operations use Rholang joins for atomicity
- **Ack Channels** — All state-modifying operations accept and respond on acknowledgement channels
- **No None/Some** — Uses `contains`/`get` pattern throughout

## Project Structure

```
├── contracts/
│   └── prediction-market.rho    # Rholang smart contract
├── frontend/
│   └── index.html               # Single-file frontend (no build step)
├── scripts/
│   ├── lib/
│   │   └── asi-chain.js         # Shared signing & deploy library
│   ├── deploy.js                # Deploy the contract
│   ├── create-market.js         # Create a prediction market
│   ├── place-bet.js             # Place a bet
│   ├── resolve-market.js        # Resolve a market (oracle only)
│   ├── get-market.js            # Query market data (free)
│   └── compute-payout.js        # Compute payout (free)
├── .env.example                 # Environment variable template
└── package.json                 # Dependencies & scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- ASI:Chain DevNet test tokens from [the faucet](https://faucet.dev.asichain.io)

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your private key (hex format, no 0x prefix)
echo "PRIVATE_KEY=your_hex_private_key_here" > .env
```

### Deploy via CLI

```bash
npm run deploy
```

### Deploy via Frontend

1. Open `frontend/index.html` in a browser (or serve it locally)
2. Paste your ASI:Chain private key and click **Connect**
3. Go to the **Deploy** tab and click **Deploy Contract**
4. Optionally click **Deploy + Create 10 Sample Markets** to populate with example markets

### Interact via CLI

```bash
# Create a market
QUESTION="Will BTC hit 150k by end of 2026?" ORACLE=oracle1 npm run create-market

# Place bets
MARKET_ID=0 BETTOR=alice SIDE=yes AMOUNT=5000 npm run place-bet
MARKET_ID=0 BETTOR=bob SIDE=no AMOUNT=3000 npm run place-bet

# Oracle resolves the market
MARKET_ID=0 CALLER=oracle1 OUTCOME=yes npm run resolve-market

# Query market data (free, no Phlo)
MARKET_ID=0 npm run get-market

# Compute payout (free, no Phlo)
MARKET_ID=0 BETTOR=alice SIDE=yes npm run compute-payout
```

## Frontend

The frontend is a single HTML file with no build step — just open it in a browser. It includes:

- **Markets tab** — Browse all markets with probability bars, category tags, and a quick bet interface
- **Create tab** — Create new prediction markets with a question and oracle address
- **Resolve tab** — Resolve markets (oracle-only) by selecting the winning outcome
- **Deploy tab** — Deploy the contract and batch-create sample markets

### Sample Markets

The platform comes with 10 pre-configured sample markets inspired by current events:

1. Will France win the 2026 FIFA World Cup?
2. Will the Fed cut rates in June 2026?
3. Will Anthropic have the best AI model at end of May 2026?
4. Will Keir Starmer still be UK PM on December 31, 2026?
5. Will SpaceX IPO before end of 2026?
6. Will BTC be above $120k on June 30, 2026?
7. Will Lula win the Brazil Presidential Election?
8. Will WTI Crude Oil hit $75 in May 2026?
9. Will Apple be the largest company by market cap end of June 2026?
10. Will Cerebras complete its IPO before July 2026?

## Technical Details

### Signing & Deployment

All deploys are signed client-side using **secp256k1** (via `@noble/curves`). The signed deploy is submitted to the ASI:Chain DevNet validator API as a protobuf-encoded `DeployDataProto`. No private keys are sent to any server.

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| Validator API | Submit signed deploys and explore-deploys |
| Indexer (GraphQL) | Query on-chain state and block data |
| Explorer | View transactions and blocks |
| Faucet | Get DevNet test tokens |

### Dependencies

- `@noble/curves` — secp256k1 signing
- `@noble/hashes` — SHA-256 hashing for deploy IDs

## Built With

- [ASI:Chain](https://asi.chain) — Layer 1 blockchain with Rholang VM
- [Rholang](https://rholang.github.io/) — Formally verifiable smart contract language
- [Matterhorn IDE](https://matterhorn.studio) — Blockchain development environment
