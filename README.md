# Nimble Quiz Protocol ⚡️

Nimble Quiz is a fast, decentralized, and highly interactive multiplayer quiz mini-app built for the **Nimiq Pay** ecosystem. Players can stake real testnet NIM to join quiz rounds, compete in real-time, and win the entire pot!

Built using **Next.js**, **Prisma**, **Supabase**, and the **@nimiq/mini-app-sdk**, this app showcases how to build fully functional, Web3-integrated mini-apps that run flawlessly inside Nimiq Pay.

---

## 🏗 Workflow & Architecture

The app follows a Host-Player model where a Host creates a round, and Players stake NIM to join. The Host then starts the round, and players answer questions in real-time. Finally, the Host distributes the payouts to the winners.

```mermaid
sequenceDiagram
    participant Host
    participant Nimble App
    participant Nimiq Blockchain
    participant Player

    %% Phase 1: Creation
    Host->>Nimble App: Create new quiz round
    Nimble App-->>Host: Generate unique Invite Link

    %% Phase 2: Joining & Staking
    Player->>Nimble App: Open Invite Link (via Nimiq Pay)
    Nimble App->>Player: Prompt to stake entry fee
    Player->>Nimiq Blockchain: Send NIM stake to Host's address
    Nimiq Blockchain-->>Nimble App: Confirm transaction
    Nimble App-->>Player: Successfully joined round

    %% Phase 3: Gameplay
    Host->>Nimble App: Start Round
    Nimble App->>Player: Send Question 1
    Player->>Nimble App: Submit Answer
    Nimble App->>Player: Evaluate Answer & Update Leaderboard
    
    %% Phase 4: Payouts
    Host->>Nimble App: Finish Round
    Nimble App->>Host: Display Payout Dashboard
    Host->>Nimiq Blockchain: Send NIM payouts to Winners
    Nimiq Blockchain-->>Nimble App: Confirm Payouts
    Nimble App-->>Player: Send Winner Notification
```

---

## 🚀 Features

- **Nimiq Pay Integration:** Automatically hooks into the Nimiq Pay webview using `@nimiq/mini-app-sdk`.
- **Real-time Staking:** Players stake NIM to enter; transactions are verified on-chain.
- **Dynamic Leaderboard:** Real-time scoring based on speed and accuracy.
- **In-App Notifications:** Real-time bell notifications for joining rounds and receiving payouts.
- **Wallet Dashboard:** Users can check their connected Nimiq wallet balance directly within the app.

---

## 🛠 Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, Shadcn UI
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (hosted on Supabase)
- **Web3 / Blockchain:** Nimiq Testnet, `@nimiq/mini-app-sdk`

---

## 💻 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nimble-quiz.git
cd nimble-quiz
```

### 2. Install dependencies
We recommend using `pnpm` (as configured in the project):
```bash
pnpm install
```

### 3. Environment Variables
Create a `.env` file in the root directory. **Do not use real production API keys for local testing.** Here is an example of what your `.env` should look like:

```env
# Database Configuration (Example: Supabase connection string)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Nimiq Network Settings (Testnet)
NIMIQ_NETWORK="testnet"
NIMIQ_RPC_URL="https://test-albatross.nimiq.network/api"

# Public Explorer (Shown in the UI)
NEXT_PUBLIC_NIMIQ_NETWORK="testnet"
NEXT_PUBLIC_NIMIQ_EXPLORER="https://testnet.nimiqscan.com/tx"

# Cron Secret for background verification tasks
CRON_SECRET="generate_a_random_secure_string_here"
```

### 4. Setup the Database
Push the Prisma schema to your PostgreSQL database to create the necessary tables:
```bash
npx prisma db push
```

### 5. Run the Development Server
To test the app locally using the Nimiq Pay mobile app, you must expose your local server to your local network (LAN) so your phone can connect to it:

```bash
npm run dev:lan
# or
npx next dev -H 0.0.0.0
```
*Note: Ensure your phone and your computer are connected to the same Wi-Fi network. Then, input your computer's local IP address (e.g., `http://192.168.x.x:3000`) into the Nimiq Pay mini-app testing environment.*

---

## 📱 How to Play

1. **Host a Round:** Click "Create Round", select the entry fee, number of players, and category.
2. **Invite Players:** Share the generated invite link with your friends.
3. **Stake to Play:** Players open the link in Nimiq Pay and stake the required NIM to enter.
4. **Start the Quiz:** Once everyone has joined, the Host clicks "Start".
5. **Answer Fast:** Points are awarded based on how quickly you answer correctly.
6. **Win the Pot:** When the round ends, the Host initiates the payouts. Winners receive their NIM directly to their wallets!

---

## 🔒 Security
- **No Private Keys stored:** Nimble Quiz never asks for or stores private keys. All transactions are securely signed and broadcasted by the Nimiq Pay app itself.
- **On-Chain Verification:** Payouts and stakes are verified on the Nimiq blockchain via the backend before updating the database.
