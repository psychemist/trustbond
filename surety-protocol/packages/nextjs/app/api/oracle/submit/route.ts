import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Contract ABI (only the functions we need)
const SURETY_BOND_ABI = [
  {
    type: "function",
    name: "submitCheckIn",
    inputs: [
      { name: "_worker", type: "address" },
      { name: "_trustScore", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releaseWeeklyWage",
    inputs: [{ name: "_worker", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Contract addresses (from deployment)
const CONTRACTS = {
  baseSepolia: "0x0f5eaa5822c0b62f7a7c7835089fe58e5122cb3f",
  sepolia: "0x48b106ec461869ccb1fe58450fc9224266160b23",
};

/**
 * POST /api/oracle/submit
 *
 * Request: {
 *   action: "checkIn" | "releaseWage",
 *   workerAddress: string,
 *   trustScore?: number (for checkIn)
 * }
 *
 * Response: { success, txHash, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workerAddress, trustScore } = body;

    // Validate inputs
    if (!action || !workerAddress) {
      return NextResponse.json({ error: "Missing required fields: action, workerAddress" }, { status: 400 });
    }

    // Get oracle private key from environment
    const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
    if (!oraclePrivateKey) {
      return NextResponse.json(
        { error: "Oracle not configured. Set ORACLE_PRIVATE_KEY in .env.local" },
        { status: 500 },
      );
    }

    // Create wallet client
    const account = privateKeyToAccount(oraclePrivateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http("https://base-sepolia.g.alchemy.com/v2/4pe0pjV_Rl4CbVCaXb3lDvMjvYRyOoK0"),
    });

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http("https://base-sepolia.g.alchemy.com/v2/4pe0pjV_Rl4CbVCaXb3lDvMjvYRyOoK0"),
    });

    let txHash: `0x${string}`;

    if (action === "checkIn") {
      if (typeof trustScore !== "number" || trustScore < 0 || trustScore > 100) {
        return NextResponse.json({ error: "trustScore must be a number between 0-100" }, { status: 400 });
      }

      // Submit check-in to contract
      txHash = await walletClient.writeContract({
        address: CONTRACTS.baseSepolia as `0x${string}`,
        abi: SURETY_BOND_ABI,
        functionName: "submitCheckIn",
        args: [workerAddress as `0x${string}`, BigInt(trustScore)],
      });
    } else if (action === "releaseWage") {
      // Release weekly wage
      txHash = await walletClient.writeContract({
        address: CONTRACTS.baseSepolia as `0x${string}`,
        abi: SURETY_BOND_ABI,
        functionName: "releaseWeeklyWage",
        args: [workerAddress as `0x${string}`],
      });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'checkIn' or 'releaseWage'" }, { status: 400 });
    }

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      success: receipt.status === "success",
      txHash,
      blockNumber: receipt.blockNumber.toString(),
      message:
        action === "checkIn"
          ? `Check-in submitted for ${workerAddress} with trust score ${trustScore}`
          : `Wage released for ${workerAddress}`,
      explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
    });
  } catch (error: any) {
    console.error("Oracle submit error:", error);
    return NextResponse.json(
      {
        error: "Transaction failed",
        details: error.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
