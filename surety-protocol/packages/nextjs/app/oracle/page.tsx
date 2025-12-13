"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ApplicantTable } from "~~/components/surety/ApplicantTable";

const OracleDashboard: NextPage = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-base-100">
      <div className="page-container">
        {/* Header */}
        <div className="pt-8 pb-10">
          <h1 className="text-3xl font-bold">Oracle</h1>
          <p className="text-base-content/50 mt-1">NGO / Rehabilitation Center Admin</p>
        </div>

        {!isConnected ? (
          <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg text-base-content/70">
            <span className="w-2 h-2 bg-warning rounded-full"></span>
            Connect wallet to manage verifications
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="stat-minimal">
                <div className="stat-title">Verified</div>
                <div className="stat-value">1</div>
              </div>
              <div className="stat-minimal">
                <div className="stat-title">Pending</div>
                <div className="stat-value">2</div>
              </div>
              <div className="stat-minimal">
                <div className="stat-title">Total Bonds</div>
                <div className="stat-value">$150</div>
              </div>
            </div>

            {/* Applicants */}
            <ApplicantTable />

            {/* Info */}
            <div className="grid md:grid-cols-2 gap-4 mt-10">
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-2">Secure Verification</h3>
                <ul className="text-sm text-base-content/60 space-y-1">
                  <li>• BVN/NIN hashed client-side</li>
                  <li>• Raw IDs never stored</li>
                  <li>• Hash stored on IPFS</li>
                </ul>
              </div>
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-2">Risk Analysis</h3>
                <ul className="text-sm text-base-content/60 space-y-1">
                  <li>• Simulated AI scoring (1-10)</li>
                  <li>• Based on rehabilitation history</li>
                  <li>• Higher = lower employer risk</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OracleDashboard;
