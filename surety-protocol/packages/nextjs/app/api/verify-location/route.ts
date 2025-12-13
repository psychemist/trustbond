import { NextRequest, NextResponse } from "next/server";

// Hardcoded job sites for demo
const JOB_SITES: Record<string, { name: string; lat: number; lng: number; radius: number }> = {
  default: {
    name: "Bariga Market",
    lat: 6.5401,
    lng: 3.3934,
    radius: 200, // meters
  },
};

/**
 * Haversine formula to calculate distance between two GPS coordinates
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * POST /api/verify-location
 *
 * Request: { workerAddress, lat, lng, jobSiteId? }
 * Response: { verified, distance, jobSite, trustScore, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workerAddress, lat, lng, jobSiteId = "default" } = body;

    // Validate inputs
    if (!workerAddress || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing required fields: workerAddress, lat, lng" }, { status: 400 });
    }

    // Get job site
    const jobSite = JOB_SITES[jobSiteId] || JOB_SITES.default;

    // Calculate distance
    const distance = calculateDistance(lat, lng, jobSite.lat, jobSite.lng);
    const distanceRounded = Math.round(distance);

    // Check if within radius
    const isWithinRadius = distance <= jobSite.radius;

    // Calculate trust score based on distance
    const trustScore = isWithinRadius ? 100 : 0;

    return NextResponse.json({
      verified: isWithinRadius,
      distance: distanceRounded,
      jobSite: { name: jobSite.name, lat: jobSite.lat, lng: jobSite.lng, radius: jobSite.radius },
      trustScore,
      message: isWithinRadius
        ? `Worker is ${distanceRounded}m from ${jobSite.name} - VERIFIED`
        : `Worker is ${distanceRounded}m away - need to be within ${jobSite.radius}m`,
      timestamp: new Date().toISOString(),
      workerAddress,
    });
  } catch (error) {
    console.error("Location verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
