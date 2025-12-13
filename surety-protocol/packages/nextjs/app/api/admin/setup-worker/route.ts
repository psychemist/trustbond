import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Contract ABI (only admin/oracle functions)
const SURETY_BOND_ABI = [
  {
    type: "function",
    name: "verifyWorker",
    inputs: [{ name: "_worker", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "stakeBond",
    inputs: [
      { name: "_worker", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const CONTRACTS = {
  suretyBond: "0x0f5eaa5822c0b62f7a7c7835089fe58e5122cb3f" as const,
  mockUsdc: "0x30fc0581b29fa881bc91b776bec6e5b2bb506e96" as const,
};

const RPC_URL = "https://base-sepolia.g.alchemy.com/v2/4pe0pjV_Rl4CbVCaXb3lDvMjvYRyOoK0";

/**
 * POST /api/admin/setup-worker
 *
 * Admin endpoint to verify a worker AND stake a bond for them
 * This is critical for demo - workers need to be verified and bonded before hiring
 *
 * Request: {
 *   workerAddress: string,
 *   bondAmount?: number (USDC, default 50)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerAddress, bondAmount = 50 } = body;

    if (!workerAddress) {
      return NextResponse.json({ error: "Missing workerAddress" }, { status: 400 });
    }

    // Get admin private key from environment
    const adminPrivateKey = process.env.ORACLE_PRIVATE_KEY;
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: "Admin not configured. Set ORACLE_PRIVATE_KEY in .env.local" },
        { status: 500 },
      );
    }

    const account = privateKeyToAccount(adminPrivateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(RPC_URL),
    });

    const results: { step: string; txHash?: string; error?: string }[] = [];

    // Step 1: Verify Worker
    try {
      const verifyTx = await walletClient.writeContract({
        address: CONTRACTS.suretyBond,
        abi: SURETY_BOND_ABI,
        functionName: "verifyWorker",
        args: [workerAddress as `0x${string}`],
      });
      await publicClient.waitForTransactionReceipt({ hash: verifyTx });
      results.push({ step: "verifyWorker", txHash: verifyTx });
    } catch (e: any) {
      results.push({ step: "verifyWorker", error: e.message });
    }

    // Step 2: Approve USDC for bond
    const bondAmountWei = parseUnits(bondAmount.toString(), 6);
    try {
      const approveTx = await walletClient.writeContract({
        address: CONTRACTS.mockUsdc,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACTS.suretyBond, bondAmountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
      results.push({ step: "approveUSDC", txHash: approveTx });
    } catch (e: any) {
      results.push({ step: "approveUSDC", error: e.message });
    }

    // Step 3: Stake Bond
    try {
      const stakeTx = await walletClient.writeContract({
        address: CONTRACTS.suretyBond,
        abi: SURETY_BOND_ABI,
        functionName: "stakeBond",
        args: [workerAddress as `0x${string}`, bondAmountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: stakeTx });
      results.push({ step: "stakeBond", txHash: stakeTx });
    } catch (e: any) {
      results.push({ step: "stakeBond", error: e.message });
    }

    const success = results.every(r => !r.error);

    return NextResponse.json({
      success,
      workerAddress,
      bondAmount,
      results,
      message: success
        ? `Worker ${workerAddress.slice(0, 10)}... is now verified with $${bondAmount} bond`
        : "Some steps failed. Check results.",
    });
  } catch (error: any) {
    console.error("Admin setup-worker error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
