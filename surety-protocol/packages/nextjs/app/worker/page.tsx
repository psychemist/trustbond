"use client";

import { useCallback, useEffect, useState } from "react";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const JOB_SITE = {
  name: "Bariga Market",
  lat: 6.5401,
  lng: 3.3934,
  radius: 200,
};

const WorkerDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  const { data: workerData, refetch: refetchWorker } = useScaffoldReadContract({
    contractName: "SuretyBond",
    functionName: "getWorker",
    args: [connectedAddress],
  });

  const { data: wageBreakdown } = useScaffoldReadContract({
    contractName: "SuretyBond",
    functionName: "getWageBreakdown",
    args: [connectedAddress],
  });

  const { data: claimStatus } = useScaffoldReadContract({
    contractName: "SuretyBond",
    functionName: "canClaimWage",
    args: [connectedAddress],
  });

  const isEmployed = workerData?.isEmployed || false;
  const trustScore = workerData?.trustScore ? Number(workerData.trustScore) : 0;
  const weeklyCheckIns = workerData?.weeklyCheckIns ? Number(workerData.weeklyCheckIns) : 0;
  const rentSavings = workerData?.rentSavings ? formatUnits(workerData.rentSavings, 6) : "0";
  const weeklyWage = workerData?.weeklyWage ? formatUnits(workerData.weeklyWage, 6) : "0";

  const workerAmount = wageBreakdown?.[0] ? formatUnits(wageBreakdown[0], 6) : "0";
  const insuranceAmount = wageBreakdown?.[1] ? formatUnits(wageBreakdown[1], 6) : "0";
  const rentSavingsAmount = wageBreakdown?.[3] ? formatUnits(wageBreakdown[3], 6) : "0";

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLocation({ lat: userLat, lng: userLng });
        const dist = calculateDistance(userLat, userLng, JOB_SITE.lat, JOB_SITE.lng);
        setDistance(Math.round(dist));
        setLocationError(null);
      },
      error => {
        setLocationError(error.message);
      },
    );
  }, []);

  useEffect(() => {
    if (isConnected) {
      getLocation();
    }
  }, [isConnected, getLocation]);

  const isAtJobSite = distance !== null && distance <= JOB_SITE.radius;

  const handleCheckIn = async () => {
    if (!isAtJobSite || !location || !connectedAddress) return;
    setIsCheckingIn(true);
    try {
      const verifyResponse = await fetch("/api/verify-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerAddress: connectedAddress, lat: location.lat, lng: location.lng }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyData.verified) {
        alert(`Verification failed: ${verifyData.message}`);
        return;
      }
      const oracleResponse = await fetch("/api/oracle/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkIn", workerAddress: connectedAddress, trustScore: verifyData.trustScore }),
      });
      const oracleData = await oracleResponse.json();
      if (oracleData.success) {
        alert(`Check-in successful!`);
        refetchWorker();
      } else {
        alert(`Check-in recorded locally.`);
      }
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("Check-in failed.");
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg text-base-content/70">
          <span className="w-2 h-2 bg-warning rounded-full"></span>
          Connect wallet to access dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="page-container">
        {/* Header */}
        <div className="pt-8 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold">Worker</h1>
              <code className="text-sm text-base-content/50 mt-1 block">
                {connectedAddress?.slice(0, 8)}...{connectedAddress?.slice(-6)}
              </code>
            </div>

            {/* Trust Score */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold">{trustScore}</div>
                <p className="text-xs text-base-content/50 uppercase tracking-wider">Trust</p>
              </div>
              <div className="h-12 w-px bg-base-300"></div>
              <div className="text-center">
                <div className="text-4xl font-bold">{weeklyCheckIns}/5</div>
                <p className="text-xs text-base-content/50 uppercase tracking-wider">Check-ins</p>
              </div>
            </div>
          </div>
        </div>

        {!isEmployed ? (
          <div className="card bg-base-100 p-8 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Employed</h2>
            <p className="text-base-content/60 mb-6">Get hired through the employer marketplace</p>
            <a href="/employer" className="btn btn-primary">
              View Jobs
            </a>
          </div>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {/* Disposable */}
              <div className="card bg-base-100 p-6">
                <p className="text-xs text-base-content/50 uppercase tracking-wider mb-2">Available</p>
                <div className="text-4xl font-bold mb-1">${workerAmount}</div>
                <p className="text-sm text-base-content/50">85% of weekly wage</p>
                <button className="btn btn-sm btn-outline mt-4">Withdraw</button>
              </div>

              {/* Savings */}
              <div className="card bg-base-200 p-6 border-l-4 border-success">
                <p className="text-xs text-base-content/50 uppercase tracking-wider mb-2">Locked Savings</p>
                <div className="text-4xl font-bold mb-1">${rentSavings}</div>
                <p className="text-sm text-base-content/50">5% auto-saved · 90 day lock</p>
              </div>
            </div>

            {/* GPS Check-in */}
            <div className="card bg-base-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold">GPS Check-in</h2>
                  <p className="text-sm text-base-content/50">{JOB_SITE.name}</p>
                </div>
                {location && (
                  <div className={`text-sm font-medium ${isAtJobSite ? "text-success" : "text-base-content/50"}`}>
                    {distance}m away
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="w-full h-40 rounded-lg overflow-hidden border border-base-300 mb-6">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBFw0Qbyq9zTFTd-tUY6CE2MU1wX0ALnb0"
                    }&q=${JOB_SITE.lat},${JOB_SITE.lng}&zoom=17`}
                />
              </div>

              {/* Location Status */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-base-200 rounded-lg p-3">
                  <p className="text-xs text-base-content/50 mb-1">Job Site</p>
                  <p className="font-medium">{JOB_SITE.name}</p>
                  <p className="text-xs text-base-content/40">{JOB_SITE.radius}m radius</p>
                </div>
                <div className="bg-base-200 rounded-lg p-3">
                  <p className="text-xs text-base-content/50 mb-1">Your Location</p>
                  {locationError ? (
                    <p className="text-sm text-error">{locationError}</p>
                  ) : location ? (
                    <p className={`font-medium ${isAtJobSite ? "text-success" : ""}`}>{distance}m from site</p>
                  ) : (
                    <p className="text-sm">Locating...</p>
                  )}
                  <button onClick={getLocation} className="text-xs text-accent underline mt-1">
                    Refresh
                  </button>
                </div>
              </div>

              {/* Check-in Button */}
              {isAtJobSite ? (
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className={`btn btn-primary w-full ${isCheckingIn ? "loading" : ""}`}
                >
                  {isCheckingIn ? "Verifying..." : "Check In"}
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg text-base-content/60 text-sm">
                  <MapPinIcon className="w-4 h-4" />
                  Must be within {JOB_SITE.radius}m to check in
                </div>
              )}

              {/* Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-base-content/50 mb-2">
                  <span>Weekly progress</span>
                  <span>{weeklyCheckIns}/5 check-ins</span>
                </div>
                <div className="w-full bg-base-200 rounded-full h-2">
                  <div
                    className="bg-base-content h-2 rounded-full transition-all"
                    style={{ width: `${(weeklyCheckIns / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Wage Table */}
            <div className="card bg-base-100 p-6 mb-8">
              <h2 className="font-semibold mb-4">Wage Breakdown</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-base-200">
                    <th className="text-left py-2 text-base-content/50 font-medium">Category</th>
                    <th className="text-right py-2 text-base-content/50 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-base-200">
                    <td className="py-3">Your wallet (85%)</td>
                    <td className="text-right font-semibold">${workerAmount}</td>
                  </tr>
                  <tr className="border-b border-base-200">
                    <td className="py-3">Insurance (5%)</td>
                    <td className="text-right">${insuranceAmount}</td>
                  </tr>
                  <tr className="border-b border-base-200">
                    <td className="py-3">Savings (5%)</td>
                    <td className="text-right">${rentSavingsAmount}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold">Total</td>
                    <td className="text-right font-semibold">${weeklyWage}</td>
                  </tr>
                </tbody>
              </table>

              {/* Claim Status */}
              <div className="mt-6">
                {claimStatus?.[0] ? (
                  <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg text-success text-sm">
                    <CheckCircleIcon className="w-4 h-4" />
                    Ready to receive wage
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg text-base-content/60 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    {claimStatus?.[1] || "Complete 5 check-ins"}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;
