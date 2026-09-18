# ⚡ Nimble Quiz — Real-Time Multiplayer Web3 Trivia Powered by Nimiq Pay

<p align="center">
  <img src="public/apple-touch-icon.png" alt="Nimble Quiz Logo" width="180" style="border-radius: 16px; box-shadow: 0 10px 30px rgba(233,178,19,0.3);" />
</p>

<p align="center">
  <strong>The fast-paced, non-custodial Web3 trivia platform with 1-tap Nimiq Pay micro-staking, synchronized intermissions, sub-second auto-finalization, and batch winner payouts.</strong>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Blockchain-Nimiq%20Albatross-FFC107?style=flat-square&logo=nimiq&logoColor=black" alt="Nimiq" /></a>
  <a href="#-architecture--tech-stack"><img src="https://img.shields.io/badge/Fees-0%25%20Platform%20Fee-10B981?style=flat-square" alt="Zero Fees" /></a>
  <a href="#-architecture--tech-stack"><img src="https://img.shields.io/badge/Security-Non--Custodial-0066FF?style=flat-square" alt="Non-Custodial" /></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Framework-Next.js%2016-000000?style=flat-square&logo=next.js" alt="Next.js 16" /></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Styling-Vanilla%20CSS%20%2B%203D-E9B213?style=flat-square" alt="3D CSS" /></a>
</p>

---

## 📌 Table of Contents
- [Inspiration & Problem](#-inspiration--problem)
- [The Solution: Nimble Quiz](#-the-solution-nimble-quiz)
- [Key Features](#-key-features)
- [Detailed User Flows](#-detailed-user-flows)
  - [Flow 1: Host Creating & Sharing Round](#flow-1-host-creating--sharing-round)
  - [Flow 2: Player Staking & Joining via Nimiq Pay SDK](#flow-2-player-staking--joining-via-nimiq-pay-sdk)
  - [Flow 3: Synchronized Live Gameplay & Intermissions](#flow-3-synchronized-live-gameplay--intermissions)
  - [Flow 4: Sub-Second Auto-Finalization & Batch Payouts](#flow-4-sub-second-auto-finalization--batch-payouts)
- [Sequence Architecture Diagram](#-sequence-architecture-diagram)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Synchronized Intermission Engine & Sub-Second Scoring](#-synchronized-intermission-engine--sub-second-scoring)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Judge Presentation & Video Script Guides](#-judge-presentation--video-script-guides)
- [License](#-license)

---

## 💡 Inspiration & Problem

Trivia and quiz games attract over **500 million active players** globally on Web2 platforms like Kahoot! and Trivia Crack. However, traditional Web2 trivia platforms rely on centralized points with zero real-world value, while existing Web3 trivia applications suffer from severe friction:

1. **Painful Wallet Friction**: Players are forced to export seed phrases, switch RPC networks, and approve multiple complex wallet popups for every action.
2. **Agonizing Settlement Delays**: Players routinely wait 3 to 10 minutes (or days) after a match for background crons to calculate scores and issue payouts.
3. **Unsynchronized Question Reveals**: Variable mobile network latencies lead to unfair advantages, where players on faster connections receive answers seconds before others.
4. **Manual Host Payout Bottlenecks**: Organizers must manually sign and submit individual crypto transactions for every winner in a round.

---

## ⚡ The Solution: Nimble Quiz

**Nimble Quiz** re-imagines competitive trivia into a seamless, high-velocity Web3 experience running natively inside **Nimiq Pay**.

* **0% Platform Fees**: 100% of the pooled NIM stake goes directly to the round winners.
* **Native 1-Tap Nimiq Pay Micro-Staking**: Instant, seedless wallet connection and entry fee deposits powered by `@nimiq/mini-app-sdk`.
* **5-Second Intermission Reveal Engine**: Server-synchronized question slots reveal correct answers simultaneously to all players, eliminating latency cheats.
* **Sub-Second Inline Auto-Finalization**: Zero wait time! Scores and `Payout` records compute inline in `< 1 second` as soon as the final question timer expires.
* **Batch "Pay All" Host Execution**: Hosts disburse prize pots to all winning wallets with a single tap.
* **Real-Time In-App Wallet Ledger**: Verified on-chain balance calculations and match history tracking (`My Rounds`).

---

## 🚀 Key Features

### 1. 🎯 Custom Round Creation & 3D Social Invites
* **Custom Quiz Parameters**: Set custom category (*Computers, Sports, General Knowledge*), question count, time limits (10-30s), and entry stake in NIM.
* **Payout Rules**: Choose between **Winner Take All** or **Top 3 Distributed (50% / 30% / 20%)**.
* **3D Social Share Modal**: Instant share buttons with custom branding for **X (Twitter)** and **Telegram** linking directly to `/join/[id]`.

### 2. ⚡ Frictionless Nimiq Pay Staking
* **Native Webview Integration**: Automatically hooks into the Nimiq Pay app context.
* **1-Tap Staking Intent**: Pre-populates recipient address and NIM amount; confirms on-chain in seconds.

### 3. ⏱️ Synchronized Gameplay & Intermission Engine
* **Fair Question Slots**: Calculated as `activeSeconds + 5s intermission`.
* **Revealed Answers**: Highlights correct options in green during intermissions without revealing answers early.
* **Dynamic Time-Decay Scoring**: Faster correct submissions earn maximum points on the live leaderboard.

### 4. 🏆 Sub-Second Finalization & Batch Host Payouts
* **Instant Inline Settlement**: Round status updates instantly from `IN_PROGRESS` to `AWAITING_PAYOUT` with zero cron delay.
* **1-Tap Batch "Pay All"**: Host executes sequential Nimiq Pay SDK payouts with live progress tracking (`Paying 1/2...`, `Paid ✓`).
* **Zero-Score Protection**: If no player answers correctly, 100% of stakes are refunded automatically.

### 5. 💼 In-App Wallet & Transaction History
* **Live Ledger Balance**: Displays real-time confirmed NIM balances via background transaction polling.
* **My Rounds History**: Clickable round cards to view past match standings, player scores, and payout transaction hashes.

---

## 🗺️ Detailed User Flows

### Flow 1: Host Creating & Sharing Round
1. The Host navigates to **Create Round**, chooses a quiz title, category, stake amount (e.g. 10 NIM), and payout distribution rule (*Winner Take All* or *Top 3*).
2. The server creates the round and generates a unique invite link (`/join/[id]`).
3. The Host opens the **3D Social Share Modal** to tweet the match on **X (Twitter)** or post it directly to **Telegram** groups.

### Flow 2: Player Staking & Joining via Nimiq Pay SDK
1. The Player opens the invite link directly inside Nimiq Pay mobile app or browser.
2. The Player clicks **"Pay Stake & Join"**. The app triggers `sendStakePayment` via `@nimiq/mini-app-sdk`.
3. The Nimiq Pay wallet drawer pops up; the Player confirms the transaction in 1 tap.
4. The backend verifies the transaction hash on-chain and updates the Player's status to `CONFIRMED`. The live lobby updates confirmed player count.

### Flow 3: Synchronized Live Gameplay & Intermissions
1. The Host clicks **Start Game**. All players enter `PlayView.tsx`.
2. A 3-2-1 countdown synchronizes the start clock across all clients.
3. Each question runs for the active duration (e.g. 20s) followed by a **5-second Intermission**.
4. During the intermission, the server reveals `correctOptionIndex` for visual green highlighting and updates live leaderboard standings.

### Flow 4: Sub-Second Auto-Finalization & Batch Payouts
1. The moment the final question timer expires, `finalizeRound(roundId)` executes inline on the server (< 1 second).
2. The leaderboard ranks are saved, and `Payout` records with status `PENDING` are inserted into the database.
3. The Host's view updates to **Results**, displaying the **"Pay All"** control.
4. The Host clicks **"Pay All"**. The Nimiq Pay SDK sequentially triggers winner payouts (`sendPayoutPayment`), updating each payout status to `SENT` / `CONFIRMED`.

---

## 🔄 Sequence Architecture Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Host
    actor Player
    participant App as Nimble Quiz App
    participant Nimiq as Nimiq Pay SDK / Blockchain

    %% Phase 1: Round Creation & Invite
    Host->>App: Create Round (e.g. 10 NIM, Winner Take All)
    App-->>Host: Generate 3D Social Invite Links (X / Telegram)

    %% Phase 2: Joining & Staking
    Player->>App: Open /join/[id] link
    Player->>Nimiq: Tap "Pay Stake & Join" via Nimiq Pay SDK
    Nimiq-->>App: Confirm Transaction Hash & Update Entry Status to CONFIRMED
    App-->>Host: Real-time Lobby updates confirmed player count

    %% Phase 3: Synchronized Gameplay
    Host->>App: Start Round
    loop For Each Question
        App->>Player: Synchronized Question Slot (20s countdown)
        Player->>App: Submit Answer with response time
        App->>Player: 5-Sec Intermission Reveal (Correct answer + Live Leaderboard)
    end

    %% Phase 4: Sub-Second Auto-Finalization & Payouts
    App->>App: Auto-finalize scores inline (< 1s) & generate Payout records
    App-->>Host: Render Results View with "Pay All" & "Pay" Controls
    Host->>Nimiq: Click "Pay All" (Batch send NIM payouts)
    Nimiq-->>Player: Instant NIM payout received in wallet!
```

---

## 🏗 Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (Turbopack)** | Server/Client components, App Router, dynamic routing |
| **Styling & Aesthetics** | **Vanilla CSS + 3D UI** | Glassmorphism, 3D card tilts, custom brand palettes |
| **Database ORM** | **Prisma 5.22** | Type-safe schema for `TriviaRound`, `Entry`, `Answer`, `Payout` |
| **Database Provider** | **PostgreSQL (Supabase)** | Hosted relational database with connection pooling |
| **Blockchain Integration**| **@nimiq/mini-app-sdk** | Native wallet connection, stake intent, payout signatures |
| **Sync Engine** | **Slot-Offset Calculation** | Server-computed time slots preventing client clock drift |

---

## ⚡ Synchronized Intermission Engine & Sub-Second Scoring

### Server Slot Computation
Each question operates inside a deterministic time slot:
$$\text{Slot Duration} = \text{TimePerQuestion} + 5\text{s Intermission}$$

- During `Offset < TimePerQuestion`: Options are active; answers can be submitted. Correct answer indexes remain hidden on the server.
- During `Offset >= TimePerQuestion`: The 5-second intermission timer fires; `correctOptionIndex` is returned to reveal answer highlighting.

### Inline Finalization Transaction
When all questions complete, the backend executes `finalizeRound(roundId)` inline inside the API request:

```ts
await prisma.$transaction(async (tx) => {
  await tx.triviaRound.update({
    where: { id: roundId },
    data: { status: 'AWAITING_PAYOUT' },
  })

  await tx.payout.createMany({
    data: payouts.map((p) => ({
      roundId,
      recipientId: p.recipientId,
      amount: p.amount,
      status: 'PENDING',
    })),
  })
})
```
This guarantees **zero wait time (< 1 sec)** for the Host to view results and execute payouts!

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Database Connection (Supabase / PostgreSQL)
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Nimiq Network Configuration
NIMIQ_NETWORK="testnet"
NIMIQ_RPC_URL="https://test-albatross.nimiq.network/api"

# Public Explorer (Used for transaction verification links)
NEXT_PUBLIC_NIMIQ_NETWORK="testnet"
NEXT_PUBLIC_NIMIQ_EXPLORER="https://testnet.nimiqscan.com/tx"

# Cron Verification Secret
CRON_SECRET="your_random_cron_verification_secret"
```

---

## 💻 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Nimble_Quiz.git
cd Nimble_Quiz
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser or Nimiq Pay simulator.

---


---

## 📜 License

Distributed under the **MIT License**. Built for the **Nimiq Ecosystem**.
