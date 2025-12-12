"use client";

import { useState, useEffect } from "react";
import { BanknotesIcon, LockClosedIcon, MapPinIcon } from "@heroicons/react/24/solid";

export const WorkerBalance = () => {
    const [walletBalance, setWalletBalance] = useState(12500);
    const [savingsBalance, setSavingsBalance] = useState(45000); // N45,000 saved
    const [claimable, setClaimable] = useState(5000); // Accrued salary
    const [locationVerified, setLocationVerified] = useState(false);
    const [locationError, setLocationError] = useState("");
    const [loading, setLoading] = useState(false);

    // Golden Spike: GPS Logic
    const verifyLocation = () => {
        setLoading(true);
        setLocationError("");

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Mock Distance Check: In real app, calculate Haversine distance to job site
                // For demo, we just require coordinates to be present
                console.log("Worker Verification Location:", position.coords);
                setLocationVerified(true);
                setLoading(false);
            },
            (error) => {
                setLocationError("Please enable GPS to prove you are at the work site.");
                setLoading(false);
            }
        );
    };

    const handleClaim = () => {
        if (!locationVerified) return;

        // Split Logic: 80% to Wallet, 20% to Savings
        const payment = claimable;
        const toWallet = payment * 0.8;
        const toSavings = payment * 0.2;

        setWalletBalance(prev => prev + toWallet);
        setSavingsBalance(prev => prev + toSavings);
        setClaimable(0);
    };

    return (
        <div className="w-full max-w-4xl">
            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Spendable (80%) */}
                <div className="card bg-base-100 shadow-xl border-l-8 border-accent">
                    <div className="card-body">
                        <h2 className="card-title">Disposable Income</h2>
                        <div className="text-4xl font-bold">N{walletBalance.toLocaleString()}</div>
                        <p className="text-sm opacity-50">Available to withdraw</p>
                        <div className="card-actions justify-end">
                            <button className="btn btn-sm btn-accent btn-outline">Withdraw</button>
                        </div>
                    </div>
                </div>

                {/* Locked Savings (20%) */}
                <div className="card bg-success text-success-content shadow-xl">
                    <div className="card-body">
                        <div className="flex justify-between">
                            <h2 className="card-title text-white">Future Home Fund</h2>
                            <LockClosedIcon className="h-6 w-6 text-white" />
                        </div>

                        <div className="text-5xl font-black text-white mt-2">N{savingsBalance.toLocaleString()}</div>
                        <p className="text-white opacity-80">+20% of every salary claim auto-locked.</p>
                    </div>
                </div>
            </div>

            {/* Claim Section */}
            <div className="card bg-base-200 shadow-sm text-center p-6">
                <h3 className="text-xl font-bold mb-4">Current Earnings: N{claimable.toLocaleString()}</h3>

                {!locationVerified && (
                    <div className="alert alert-warning mb-4">
                        <MapPinIcon className="h-5 w-5" />
                        <span>Proof of Work: Verify you are at the site to claim.</span>
                    </div>
                )}

                {locationError && <p className="text-error mb-2">{locationError}</p>}

                <div className="flex justify-center gap-4">
                    {!locationVerified ? (
                        <button
                            className={`btn btn-neutral ${loading ? "loading" : ""}`}
                            onClick={verifyLocation}
                        >
                            📍 Verify GPS Location
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-lg w-64" onClick={handleClaim}>
                            Claim Salary (Split 80/20)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
