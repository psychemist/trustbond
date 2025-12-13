import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory store for demo (replace with Supabase in production)
 * Maps workerAddress -> { jobsCompleted, riskScore }
 */
const workerStats: Map<string, { jobsCompleted: number; riskScore: number }> = new Map();

/**
 * Risk Score Algorithm (from Python backend)
 * Score = min(100, jobsCompleted * 10)
 */
function calculateRiskScore(jobsCompleted: number): number {
  return Math.min(100, jobsCompleted * 10);
}

/**
 * GET /api/risk/[address]
 *
 * Returns worker risk profile for Chainlink Functions
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const workerAddress = address.toLowerCase();

  const stats = workerStats.get(workerAddress);

  if (!stats) {
    // Unknown worker - return neutral score
    return NextResponse.json({
      worker: workerAddress,
      score: 0,
      jobsCompleted: 0,
      status: "unknown",
    });
  }

  return NextResponse.json({
    worker: workerAddress,
    score: stats.riskScore,
    jobsCompleted: stats.jobsCompleted,
    status: "active",
  });
}

/**
 * POST /api/risk/[address]
 *
 * Force recalculate and update risk score
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const workerAddress = address.toLowerCase();

  // Get or create stats
  let stats = workerStats.get(workerAddress);
  if (!stats) {
    stats = { jobsCompleted: 0, riskScore: 0 };
    workerStats.set(workerAddress, stats);
  }

  // Recalculate score
  stats.riskScore = calculateRiskScore(stats.jobsCompleted);
  workerStats.set(workerAddress, stats);

  return NextResponse.json({
    worker: workerAddress,
    newScore: stats.riskScore,
    jobsCompleted: stats.jobsCompleted,
  });
}
