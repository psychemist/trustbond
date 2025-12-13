import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// Job status workflow (from Python backend)
type JobStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "VERIFIED" | "CANCELLED";

interface Job {
  id: string;
  employerAddress: string;
  workerAddress?: string;
  title: string;
  description?: string;
  amountUsdc: number;
  status: JobStatus;
  startLocationLat?: number;
  startLocationLng?: number;
  endLocationLat?: number;
  endLocationLng?: number;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for demo (replace with Supabase in production)
const jobs: Map<string, Job> = new Map();

/**
 * GET /api/jobs
 * List all jobs or filter by employer/worker
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employer = searchParams.get("employer");
  const worker = searchParams.get("worker");

  let allJobs = Array.from(jobs.values());

  if (employer) {
    allJobs = allJobs.filter(j => j.employerAddress.toLowerCase() === employer.toLowerCase());
  }
  if (worker) {
    allJobs = allJobs.filter(j => j.workerAddress?.toLowerCase() === worker.toLowerCase());
  }

  return NextResponse.json({ jobs: allJobs });
}

/**
 * POST /api/jobs
 * Create a new job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employerAddress, title, description, amountUsdc } = body;

    if (!employerAddress || !title || !amountUsdc) {
      return NextResponse.json(
        { error: "Missing required fields: employerAddress, title, amountUsdc" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const job: Job = {
      id: randomUUID(),
      employerAddress: employerAddress.toLowerCase(),
      title,
      description,
      amountUsdc: Number(amountUsdc),
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    jobs.set(job.id, job);

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Create job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
