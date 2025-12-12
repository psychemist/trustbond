"use client";

import { useState } from "react";
import { keccak256, encodePacked } from "viem";
// import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type Applicant = {
    id: number;
    name: string;
    role: string;
    status: "Pending" | "Verified";
    address: string;
};

const initialApplicants: Applicant[] = [
    { id: 1, name: "Tunde A.", role: "Carpenter", status: "Pending", address: "0xMockAddress1..." },
    { id: 2, name: "Chioma O.", role: "Plumber", status: "Pending", address: "0xMockAddress2..." },
];

export const ApplicantTable = () => {
    const [applicants, setApplicants] = useState<Applicant[]>(initialApplicants);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [bvn, setBvn] = useState("");
    const [nin, setNin] = useState("");
    const [riskScore, setRiskScore] = useState<number | null>(null);

    const handleAnalyzeRisk = () => {
        // Fake AI Delay
        setTimeout(() => {
            setRiskScore(Math.floor(Math.random() * (10 - 1 + 1) + 1)); // 1-10 Score
        }, 1000);
    };

    const handleVerify = async () => {
        if (!bvn || !nin || !selectedApplicant) return;

        // SECURITY: Client-side Hashing
        // We never send BVN/NIN to the backend or blockchain
        const identityHash = keccak256(encodePacked(["string", "string"], [bvn, nin]));

        console.log("Verifying Worker:", selectedApplicant.name);
        console.log("Generated Identity Hash:", identityHash);
        console.log("Risk Score:", riskScore);

        // TODO: Call Smart Contract
        // writeContract({ functionName: "verifyWorker", args: [selectedApplicant.address, identityHash, riskScore] });

        // Mock Update UI
        setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? { ...a, status: "Verified" } : a));
        setSelectedApplicant(null);
        setBvn("");
        setNin("");
        setRiskScore(null);
    };

    return (
        <div className="overflow-x-auto bg-base-100 rounded-xl shadow-xl p-4">
            <table className="table w-full">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {applicants.map((app) => (
                        <tr key={app.id}>
                            <td>{app.name}</td>
                            <td>{app.role}</td>
                            <td>
                                <span className={`badge ${app.status === "Verified" ? "badge-success" : "badge-warning"}`}>
                                    {app.status}
                                </span>
                            </td>
                            <td>
                                {app.status === "Pending" && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => setSelectedApplicant(app)}
                                    >
                                        Verify
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Verification Modal */}
            {selectedApplicant && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Verify Identity: {selectedApplicant.name}</h3>

                        <div className="py-4 space-y-4">
                            {/* Golden Spike: AI Integration */}
                            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                <span>AI Risk Analysis</span>
                                {riskScore === null ? (
                                    <button className="btn btn-xs btn-outline" onClick={handleAnalyzeRisk}>Run AI Scan</button>
                                ) : (
                                    <span className="font-bold text-success">Score: {riskScore}/10</span>
                                )}
                            </div>

                            {/* Secure Identity Form */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Enter BVN (Privately Hashed)</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered"
                                    value={bvn}
                                    onChange={(e) => setBvn(e.target.value)}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Enter NIN (Privately Hashed)</span>
                                </label>
                                <input
                                    type="password"
                                    className="input input-bordered"
                                    value={nin}
                                    onChange={(e) => setNin(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-primary"
                                onClick={handleVerify}
                                disabled={!riskScore || !bvn || !nin}
                            >
                                Mint Identity Badge
                            </button>
                            <button className="btn" onClick={() => setSelectedApplicant(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
