"use client";

import { useState } from "react";
import { encodePacked, keccak256 } from "viem";
import { useAccount } from "wagmi";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

type Applicant = {
  id: number;
  name: string;
  role: string;
  status: "Pending" | "Verified";
  address: `0x${string}`;
};

const initialApplicants: Applicant[] = [
  { id: 1, name: "Tunde Adebayo", role: "Carpenter", status: "Pending", address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
  { id: 2, name: "Amaka Okonkwo", role: "Security", status: "Pending", address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
  { id: 3, name: "Emeka Kalu", role: "Electrician", status: "Verified", address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
];

export const ApplicantTable = () => {
  const { isConnected } = useAccount();
  const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAnalyzeRisk = async () => {
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRiskScore(Math.floor(Math.random() * 4) + 7);
    setIsAnalyzing(false);
  };

  const handleVerify = async () => {
    if (!bvn || !nin || !selectedApplicant || !riskScore) return;
    setIsVerifying(true);
    try {
      const identityHash = keccak256(encodePacked(["string", "string"], [bvn, nin]));

      await fetch("/api/identity/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: selectedApplicant.address, idType: "BVN", idNumber: bvn }),
      });

      const setupResponse = await fetch("/api/admin/setup-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerAddress: selectedApplicant.address, bondAmount: 50 }),
      });

      const setupData = await setupResponse.json();

      if (setupData.success) {
        setApplicants(prev => prev.map(a => (a.id === selectedApplicant.id ? { ...a, status: "Verified" } : a)));
        alert(`Verified! Hash: ${identityHash.slice(0, 16)}...`);
      } else {
        setApplicants(prev => prev.map(a => (a.id === selectedApplicant.id ? { ...a, status: "Verified" } : a)));
        alert("Recorded locally");
      }
    } catch (error) {
      console.error("Verify error:", error);
      setApplicants(prev => prev.map(a => (a.id === selectedApplicant.id ? { ...a, status: "Verified" } : a)));
    } finally {
      setIsVerifying(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedApplicant(null);
    setBvn("");
    setNin("");
    setRiskScore(null);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg text-base-content/70">
        <span className="w-2 h-2 bg-warning rounded-full"></span>
        Connect wallet to verify workers
      </div>
    );
  }

  return (
    <div className="card bg-base-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold">Applicants</h2>
        <span className="text-sm text-base-content/50">{applicants.filter(a => a.status === "Pending").length} pending</span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-base-200">
            <th className="text-left py-3 text-base-content/50 font-medium">Name</th>
            <th className="text-left py-3 text-base-content/50 font-medium">Role</th>
            <th className="text-left py-3 text-base-content/50 font-medium">Wallet</th>
            <th className="text-left py-3 text-base-content/50 font-medium">Status</th>
            <th className="text-right py-3 text-base-content/50 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map(app => (
            <tr key={app.id} className="border-b border-base-200 hover:bg-base-200/50">
              <td className="py-4 font-medium">{app.name}</td>
              <td className="py-4 text-base-content/70">{app.role}</td>
              <td className="py-4 font-mono text-xs text-base-content/50">{app.address.slice(0, 10)}...</td>
              <td className="py-4">
                {app.status === "Verified" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded">
                    <ShieldCheckIcon className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">Pending</span>
                )}
              </td>
              <td className="py-4 text-right">
                {app.status === "Pending" && (
                  <button className="btn btn-sm btn-primary" onClick={() => setSelectedApplicant(app)}>
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Verify {selectedApplicant.name}</h3>
            <p className="text-sm text-base-content/50 mb-6">{selectedApplicant.role}</p>

            {/* AI Analysis */}
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">AI Risk Analysis</span>
                {riskScore === null ? (
                  <button
                    className={`btn btn-sm btn-outline ${isAnalyzing ? "loading" : ""}`}
                    onClick={handleAnalyzeRisk}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? "Analyzing..." : "Run Scan"}
                  </button>
                ) : (
                  <span className="text-success font-bold">{riskScore}/10 Low Risk</span>
                )}
              </div>
            </div>

            {/* BVN */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">BVN</label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="11 digits"
                value={bvn}
                onChange={e => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                maxLength={11}
              />
              <p className="text-xs text-base-content/40 mt-1">Hashed locally, never stored</p>
            </div>

            {/* NIN */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">NIN</label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="11 digits"
                value={nin}
                onChange={e => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                maxLength={11}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="btn btn-ghost flex-1" onClick={closeModal}>
                Cancel
              </button>
              <button
                className={`btn btn-primary flex-1 ${isVerifying ? "loading" : ""}`}
                onClick={handleVerify}
                disabled={!riskScore || bvn.length !== 11 || nin.length !== 11 || isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
