# Frontend Structure Plan: Surety Protocol

## 1. Technology Stack
*   **Base Framework**: Scaffold-ETH 2 (`npx create-eth@latest`)
*   **Core**: Next.js 14 (App Router), TypeScript
*   **Styling**: Tailwind CSS, DaisyUI (default in SE-2)
*   **Web3**: RainbowKit, Wagmi, Viem

## 2. Project Structure
We will modify the standard Scaffold-ETH structure to support our 3 distinct personas.

### Directory Layout
```
packages/nextjs/
├── app/
│   ├── page.tsx                // Landing: Role Selection (Oracle vs Employer vs Worker)
│   ├── oracle/
│   │   └── page.tsx            // View A: The "Oracle" Dashboard
│   ├── employer/
│   │   └── page.tsx            // View B: The Employer Marketplace
│   ├── worker/
│   │   └── page.tsx            // View C: The Worker Wallet
│   └── layout.tsx              // Global layout (Providers)
├── components/
│   ├── surety/                 // Custom project components
│   │   ├── ApplicantTable.tsx  // For Oracle View
│   │   ├── JobCard.tsx         // For Employer View
│   │   ├── TrustMeter.tsx      // Visual "Risk Score" (Golden Spike)
│   │   ├── WorkerBalance.tsx   // Split-Payment visualizer
│   │   ├── ClaimButton.tsx     // Includes GPS Logic
│   │   └── RoleSwitcher.tsx    // For Demo Navigation
│   └── ...
└── ...
```

## 3. Detailed View Specifications

### A. The Landing (`/`)
*   **Purpose**: Quick navigation to personas for the Demo.
*   **Components**:
    *   3 Big Cards: "I am an NGO", "I am an Employer", "I am a Worker".

### B. Oracle Dashboard (`/oracle`)
*   **Function**: Verify workers onto the protocol.
*   **Components**:
    *   `ApplicantTable`: Columns [Name, Status, RiskScore].
    *   **Identity Form**: Inputs for BVN / NIN.
        *   *Security*: App computes `keccak256(BVN + NIN)` client-side.
    *   Action: `VerifyButton` -> Calls `SuretyCore.verifyWorker(workerAddress, identityHash)`.
    *   *AI Mock*: A specific "Analyze Risk" button that fakes an API call and returns a score.

### C. Employer Marketplace (`/employer`)
*   **Function**: Hire verified workers and stream salary.
*   **Components**:
    *   `JobGrid`: Grid of `JobCard` components.
    *   `JobCard`:
        *   Displays `TrustMeter` (Green/Yellow/Red).
        *   Displays "Shield Icon" with Insurance Amount.
        *   Action: "Hire & Deposit" -> Calls `SuretyCore.startJob()` (sending USDC/ETH).

### D. Worker Wallet (`/worker`)
*   **Function**: View earnings and withdraw.
*   **Components**:
    *   `SplitBalanceDisplay`:
        *   Left: "Available Now" (80%).
        *   Right: "Future Home Fund" (20%) - **Locked Icon** (Green).
    *   `ClaimButton`:
        *   **Validation**: Checks Browser Geolocation before enabling transaction.
        *   Action: Calls `SuretyCore.claimSalary()`.

## 4. Execution Plan
1.  Run `npx create-eth@latest`.
2.  Scaffold the 3 pages (`oracle`, `employer`, `worker`).
3.  Implement the UI components with mock data first.
4.  Integrate "Golden Spike" features (GPS, Trust Meter).
