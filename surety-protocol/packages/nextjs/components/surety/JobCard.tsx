"use client";

import { ShieldCheckIcon, BanknotesIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

type WorkerProps = {
    name: string;
    role: string;
    trustScore: number;
    insuranceCover: string;
    isHired: boolean;
};

export const JobCard = ({ worker }: { worker: WorkerProps }) => {
    const [hired, setHired] = useState(worker.isHired);

    const handleHire = () => {
        // Mock Contract Interaction
        console.log("Hiring worker:", worker.name);
        console.log("Depositing Salary stream...");
        setHired(true);
    };

    // Trust Score Color Logic
    const scoreColor = worker.trustScore >= 8 ? "text-success" : worker.trustScore >= 5 ? "text-warning" : "text-error";
    const ringColor = worker.trustScore >= 8 ? "radial-progress text-success" : "radial-progress text-warning";

    return (
        <div className="card w-full bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="card-title text-2xl">{worker.name}</h2>
                        <div className="badge badge-outline mt-1">{worker.role}</div>
                    </div>

                    {/* Trust Meter Visual (Golden Spike) */}
                    <div className="flex flex-col items-center">
                        <div className={ringColor} style={{ "--value": worker.trustScore * 10 } as any} role="progressbar">
                            {worker.trustScore}/10
                        </div>
                        <span className="text-xs mt-1 font-bold">Risk Score</span>
                    </div>
                </div>

                {/* Insurance Badge */}
                <div className="alert alert-success mt-4 py-2 shadow-sm">
                    <ShieldCheckIcon className="h-6 w-6" />
                    <div>
                        <div className="text-xs">Insured Collateral</div>
                        <div className="font-bold">{worker.insuranceCover}</div>
                    </div>
                </div>

                <div className="divider my-2"></div>

                <div className="card-actions justify-end">
                    {hired ? (
                        <button className="btn btn-disabled w-full">Currently Employed</button>
                    ) : (
                        <button className="btn btn-primary w-full gap-2" onClick={handleHire}>
                            <BanknotesIcon className="h-5 w-5" />
                            Hire & Deposit Salary
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
