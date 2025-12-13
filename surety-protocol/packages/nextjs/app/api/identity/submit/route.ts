import { NextRequest, NextResponse } from "next/server";

// In-memory store for identity submissions (replace with DB in production)
const identityStore: Map<
  string,
  {
    walletAddress: string;
    idType: "BVN" | "NIN";
    idNumber: string;
    idHash: string;
    ipfsHash?: string;
    status: "pending" | "verified" | "rejected";
    submittedAt: string;
  }
> = new Map();

/**
 * POST /api/identity/submit
 *
 * Submit BVN/NIN for verification
 * Request: { walletAddress, idType, idNumber }
 * Response: { success, idHash, ipfsHash, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, idType, idNumber } = body;

    // Validate inputs
    if (!walletAddress || !idType || !idNumber) {
      return NextResponse.json({ error: "Missing required fields: walletAddress, idType, idNumber" }, { status: 400 });
    }

    if (!["BVN", "NIN"].includes(idType)) {
      return NextResponse.json({ error: "idType must be 'BVN' or 'NIN'" }, { status: 400 });
    }

    // Validate format
    if (idType === "BVN" && idNumber.length !== 11) {
      return NextResponse.json({ error: "BVN must be exactly 11 digits" }, { status: 400 });
    }

    if (idType === "NIN" && idNumber.length !== 11) {
      return NextResponse.json({ error: "NIN must be exactly 11 digits" }, { status: 400 });
    }

    // Create hash of ID (never store raw ID)
    const encoder = new TextEncoder();
    const data = encoder.encode(`${walletAddress}:${idType}:${idNumber}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const idHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Upload to Pinata IPFS
    let ipfsHash: string | undefined;

    const pinataJwt = process.env.PINATA_JWT;
    if (pinataJwt) {
      try {
        const pinataBody = {
          pinataContent: {
            walletAddress,
            idType,
            idHash, // Only hash, never raw ID
            timestamp: new Date().toISOString(),
          },
          pinataMetadata: {
            name: `SuretyDAO-Identity-${walletAddress.slice(0, 10)}`,
          },
        };

        const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pinataJwt}`,
          },
          body: JSON.stringify(pinataBody),
        });

        if (pinataResponse.ok) {
          const pinataData = await pinataResponse.json();
          ipfsHash = pinataData.IpfsHash;
        }
      } catch (e) {
        console.error("Pinata upload failed:", e);
        // Continue without IPFS - not critical for demo
      }
    }

    // Store identity submission
    const submission = {
      walletAddress: walletAddress.toLowerCase(),
      idType,
      idNumber: "***REDACTED***", // Never store raw
      idHash,
      ipfsHash,
      status: "pending" as const,
      submittedAt: new Date().toISOString(),
    };

    identityStore.set(walletAddress.toLowerCase(), submission);

    return NextResponse.json({
      success: true,
      idHash,
      ipfsHash,
      ipfsUrl: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : null,
      status: "pending",
      message: `${idType} submitted for verification. Admin will review within 24 hours.`,
    });
  } catch (error: any) {
    console.error("Identity submit error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

/**
 * GET /api/identity/submit?wallet=0x...
 *
 * Check identity verification status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet query param" }, { status: 400 });
  }

  const identity = identityStore.get(wallet.toLowerCase());

  if (!identity) {
    return NextResponse.json({
      found: false,
      status: "not_submitted",
      message: "No identity submission found for this wallet",
    });
  }

  return NextResponse.json({
    found: true,
    walletAddress: identity.walletAddress,
    idType: identity.idType,
    idHash: identity.idHash,
    ipfsHash: identity.ipfsHash,
    status: identity.status,
    submittedAt: identity.submittedAt,
  });
}
