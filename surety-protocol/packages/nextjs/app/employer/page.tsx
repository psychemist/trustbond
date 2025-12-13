"use client";

import { useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { CheckCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const MOCK_USDC_ADDRESS = "0x30fc0581b29fa881bc91b776bec6e5b2bb506e96" as const;
const SURETY_BOND_ADDRESS = "0x0f5eaa5822c0b62f7a7c7835089fe58e5122cb3f" as const;

const DEMO_WORKERS = [
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as `0x${string}`,
    name: "Tunde Adebayo",
    location: "Bariga Market",
    skills: ["Cleaning", "Maintenance"],
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as `0x${string}`,
    name: "Amaka Okonkwo",
    location: "Yaba Tech Area",
    skills: ["Security", "Stock Management"],
  },
];

const WorkerCard = ({
  workerAddress,
  name,
  location,
  skills,
}: {
  workerAddress: `0x${string}`;
  name: string;
  location: string;
  skills: string[];
}) => {
  const [weeklyWage, setWeeklyWage] = useState("100");
  const [isHiring, setIsHiring] = useState(false);
  const [hiringStep, setHiringStep] = useState<"idle" | "approving" | "hiring">("idle");

  const { data: workerData } = useScaffoldReadContract({
    contractName: "SuretyBond",
    functionName: "getWorker",
    args: [workerAddress],
  });

  const { writeContractAsync: hireWorker } = useScaffoldWriteContract({
    contractName: "SuretyBond",
  });

  const { writeContractAsync: approveUsdc } = useWriteContract();

  const isVerified = workerData?.isVerified || false;
  const trustScore = workerData?.trustScore ? Number(workerData.trustScore) : 0;
  const bondAmount = workerData?.bondAmount ? formatUnits(workerData.bondAmount, 6) : "0";
  const isEmployed = workerData?.isEmployed || false;

  const handleHire = async () => {
    setIsHiring(true);
    try {
      const wageInUsdc = parseUnits(weeklyWage, 6);
      const totalDeposit = wageInUsdc * 4n;

      setHiringStep("approving");
      await approveUsdc({
        address: MOCK_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [SURETY_BOND_ADDRESS, totalDeposit],
      });

      setHiringStep("hiring");
      await hireWorker({
        functionName: "hireWorker",
        args: [workerAddress, wageInUsdc],
      });

      alert(`Successfully hired! Deposited ${formatUnits(totalDeposit, 6)} USDC`);
    } catch (error: any) {
      console.error("Hire failed:", error);
      alert(`Hire failed: ${error.message || "Check console"}`);
    } finally {
      setIsHiring(false);
      setHiringStep("idle");
    }
  };

  return (
    <div className={`card bg-base-100 ${isEmployed ? "ring-2 ring-success" : ""}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-base-content/60" />
            </div>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="text-sm text-base-content/50">{location}</p>
            </div>
          </div>
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">
              <ShieldCheckIcon className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {skills.map(skill => (
            <span key={skill} className="text-xs px-2 py-1 bg-base-200 rounded text-base-content/70">
              {skill}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-base-200 rounded-lg p-3">
            <p className="text-xs text-base-content/50 uppercase tracking-wider mb-1">Trust</p>
            <p className="text-xl font-bold">{trustScore}%</p>
            <div className="w-full bg-base-300 rounded-full h-1 mt-2">
              <div className="bg-base-content h-1 rounded-full" style={{ width: `${trustScore}%` }}></div>
            </div>
          </div>
          <div className="bg-base-200 rounded-lg p-3">
            <p className="text-xs text-base-content/50 uppercase tracking-wider mb-1">Bond</p>
            <p className="text-xl font-bold">${bondAmount}</p>
            <p className="text-xs text-base-content/50 mt-1">USDC</p>
          </div>
        </div>

        {/* Wallet */}
        <div className="text-xs text-base-content/40 mb-4">
          <Address address={workerAddress} size="sm" />
        </div>

        {/* Actions */}
        {isEmployed ? (
          <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg text-success text-sm">
            <CheckCircleIcon className="w-4 h-4" />
            Currently Employed
          </div>
        ) : isVerified && Number(bondAmount) > 0 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                value={weeklyWage}
                onChange={e => setWeeklyWage(e.target.value)}
                className="input input-bordered flex-1 text-sm"
                placeholder="Weekly wage"
              />
              <button onClick={handleHire} disabled={isHiring} className={`btn btn-primary ${isHiring ? "loading" : ""}`}>
                {hiringStep === "approving" ? "Approving..." : hiringStep === "hiring" ? "Hiring..." : "Hire"}
              </button>
            </div>
            <p className="text-xs text-base-content/50">4 weeks upfront: ${Number(weeklyWage) * 4}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg text-warning text-sm">
            <ExclamationTriangleIcon className="w-4 h-4" />
            {!isVerified ? "Pending verification" : "No bond staked"}
          </div>
        )}
      </div>
    </div>
  );
};

const EmployerDashboard: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";

  return (
    <div className="min-h-screen bg-base-100">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pt-8">
          <div>
            <h1 className="text-3xl font-bold">Employer</h1>
            <p className="text-base-content/50 mt-1">Hire verified workers with insurance</p>
          </div>
          {isConnected && (
            <div className="bg-base-200 rounded-lg px-4 py-3">
              <p className="text-xs text-base-content/50 uppercase tracking-wider">Balance</p>
              <p className="text-xl font-bold">${formattedBalance}</p>
            </div>
          )}
        </div>

        {!isConnected ? (
          <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg text-base-content/70">
            <span className="w-2 h-2 bg-warning rounded-full"></span>
            Connect wallet to hire workers
          </div>
        ) : (
          <>
            {/* Workers Grid */}
            <div className="mb-12">
              <h2 className="text-sm uppercase tracking-wider text-base-content/50 mb-4">Available Workers</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {DEMO_WORKERS.map(worker => (
                  <WorkerCard
                    key={worker.address}
                    workerAddress={worker.address}
                    name={worker.name}
                    location={worker.location}
                    skills={worker.skills}
                  />
                ))}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-1">Wage Split</h3>
                <p className="text-sm text-base-content/60">85% worker, 5% insurance, 5% savings, 5% protocol</p>
              </div>
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-1">Insurance</h3>
                <p className="text-sm text-base-content/60">Workers have bonds that can be slashed for theft</p>
              </div>
              <div className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-medium mb-1">Verification</h3>
                <p className="text-sm text-base-content/60">All workers verified by rehabilitation centers</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
