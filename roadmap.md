# Surety Protocol: Integrated Master Plan
**Target**: Lagos Impact Hackathon (Bariga Pilot)  
**Timeframe**: 20 Hours  
**Objective**: Build a full-stack decentralized employment & insurance protocol (The "Frankenstein" Architecture).

---

## 1. System Architecture (The "All-in-One" Stack)
**Concept**: A Closed-Loop System integrating Identity, Staking, Hiring, and Streaming.

### Components
1.  **The Oracle (Trust Layer)**: The Rehab Center/NGO admin.
2.  **The Vault (Collateral Layer)**: Holds the "Good Behavior Bond" (Insurance).
3.  **The Stream (Payment Layer)**: Handles "Split Payment" logic (Salary vs. Rent).

### Flow Breakdown
-   **Identity**: Rehab Center mints a "Badge" (SBT) to User A.
-   **Staking**: NGO deposits insurance into the Collateral Pool.
-   **Hiring**: Employer deposits salary (USDC/cNGN).
-   **Streaming**: Contract releases funds hourly/daily.
-   **Splitting**: 
    -   80% -> User A's Wallet (Disposable Income).
    -   20% -> Locked Rent Vault (Future Home Fund).
-   **Slashing**: If User A steals, Employer claims Insurance from the Pool.

---

## 2. Smart Contract Logic (The Brain)
**File**: `SuretyCore.sol`  
**Language**: Solidity (Hardhat/Foundry)  
**Strategy**: Single robust contract to manage complexity.

### Data Structures
```solidity
struct Worker {
    bool isVerified;       // Oracle Check
    bytes32 identityHash;  // Hash(BVN + NIN) for Privacy
    uint256 trustScore;    // AI Risk Score (0-100)
    uint256 rentSavings;   // Wrapped in logic for specific withdrawal conditions
    uint256 insuranceCover;// Amount available in Collateral Pool for this worker
    address currentEmployer;
}
```

### Core Functions & Deliverables
| Function | Role | Logic / Requirement |
| :--- | :--- | :--- |
| `verifyWorker` | Oracle (NGO) | Sets `isVerified = true`. Critical gatekeeping. |
| `stakeInsurance` | NGO/Donor | Deposits crypto tied to worker address. Updates `insuranceCover`. |
| `startJob` | Employer | Deposits salary. Initializes Stream (`paymentPerSecond`). |
| `claimSalary` | Worker | **Complex**: Calc earnings -> Send 80% to Msg.Sender -> Lock 20% in `rentSavings` -> Take 5% Protocol Fee. |
| `reportTheft` | Employer | Moves `insuranceCover` from Vault to Employer if validated. |

---

## 3. Frontend Views (The User Journey)
**Tech Stack**: Next.js, RainbowKit, Scaffold-ETH (Recommended).

### View A: The Oracle Dashboard (Admin)
-   **User**: Rehab Center / NGO.
-   **UI**: Table of Applicants with **Secure Identity Form**.
-   **Input**: BVN & NIN (Hashed locally, never sent raw).
-   **Action**: Button "Verify Sobriety & Mint ID" -> Calls `verifyWorker(addr, hash, score)`.

### View B: The Employer Marketplace (Business)
-   **User**: Construction interaction / Employers.
-   **UI**: Job Board Cards.
    -   *Detail*: "Tunde (Carpenter) - Risk Score 10/100"
    -   *Badge*: "🛡️ Insured: N200,000"
-   **Action**: "Hire & Deposit Salary" -> Calls `startJob()`.
-   **Visual**: Real-time graph "Insurance Status: Active".

### View C: The Worker Wallet (Impact)
-   **User**: The Worker (User A).
-   **UI**:
    -   **Available Balance**: 80% portion (spendable).
    -   **Locked Rent Savings**: 20% portion (**Huge Green Display**).
-   **Action**: `claimSalary()` coupled with "Withdraw" button.

---

## 4. Execution Roadmap (20-Hour Sprint)

### Phase 1: Smart Contract Core (Hours 0-4)
**Goal**: Deployable `SuretyCore.sol` on testnet.
-   [ ] **Step 1.1**: Initialize Hardhat/Foundry project.
-   [ ] **Step 1.2**: Define `Worker` struct and mappings.
-   [ ] **Step 1.3**: Implement `verifyWorker` (Owner/Oracle only modifier).
-   [ ] **Step 1.4**: Implement `stakeInsurance` (Payable function).
-   [ ] **Step 1.5**: Implement `startJob` (Stream setup, timestamp math).
-   [ ] **Step 1.6**: **CRITICAL**: Implement `claimSalary`.
    -   *Logic*: `(now - lastClaim) * rate`.
    -   *Split*: `amount * 80 / 100` transfer, `amount * 20 / 100` add to storage.
-   [ ] **Step 1.7**: Write basic tests for the split logic.

### Phase 2: Frontend Integration (Hours 4-10)
**Goal**: Functional UI connected to contract.
-   [ ] **Step 2.1**: Scaffolding (Create Next.js app / Install RainbowKit).
-   [ ] **Step 2.2**: Build Navigation/Auth (Connect Wallet).
-   [ ] **Step 2.3**: **Build View A (Oracle)**.
    -   Hardcode applicant list first.
    -   Wire "Verify" button to contract.
-   [ ] **Step 2.4**: **Build View B (Employer)**.
    -   Create "Worker Card" component.
    -   Wire "Hire" button to `startJob` (payable).
-   [ ] **Step 2.5**: **Build View C (Worker)**.
    -   Read `rentSavings` from contract.
    -   Read wallet balance.

### Phase 3: The "Bariga" Logic (Hours 10-15)
**Goal**: Specific features for the pilot context.
-   [ ] **Step 3.1**: **GPS Check**.
    -   Tech: Browser Geolocation API.
    -   Logic: `if (dist > 500m) throw Error("Go to site");`
    -   Placement: Wrap the `claimSalary` button.
-   [ ] **Step 3.2**: **Trust Meter Visuals**.
    -   UI: Add a circular progress bar for "Trust Score".
    -   Data: Read `trustScore` from contract.

### Phase 4: Testing & Pitch Prep (Hours 15-20)
**Goal**: A flawless demo video/flow.
-   [ ] **Step 4.1**: **The Demo Transaction**.
    -   Prerequisite: Pre-fund accounts (Admin, Employer).
    -   Run: Verify -> Stake -> Hire -> Wait -> Claim.
    -   Verify: Check `rentSavings` increased on-chain.
-   [ ] **Step 4.2**: **Storyboarding**.
    -   Draft script: "From Bariga streets to Victoria Island offices."

---

## 5. The "Golden Spike" (Judge-Proofing)
**Essential additions to guarantee high scoring.**

### A. AI Integration (Buzzword Compliance)
-   **Implementation**: Simple OpenAI API call during Verification.
-   **Input**: "Worker History Text" (Mocked).
-   **Output**: JSON `{ "risk_score": 10 }`.
-   **Usage**: Pass this score to `verifyWorker(address, score)`.

### B. Blockchain Choice
-   **Target**: **L2 (Base, Optimism, or Polygon)**.
-   **Constraint**: DO NOT use Ethereum Mainnet.
-   **Setup**: Ensure RPC URLs are configured in `hardhat.config.ts` or `foundry.toml`.

---

## Immediate Next Commands
1.  **Backend Team**: Start `SuretyCore.sol` structure. Focus on `splitPayment` math.
2.  **Frontend Team**: Initialize Scaffold-ETH. Start `Worker Wallet` component first (most visual impact).
