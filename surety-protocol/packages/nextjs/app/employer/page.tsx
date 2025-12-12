"use client";

import { JobCard } from "~~/components/surety/JobCard";

const workers = [
    { name: "Tunde A.", role: "Carpenter", trustScore: 9, insuranceCover: "N200,000", isHired: false },
    { name: "Chioma O.", role: "Plumber", trustScore: 7, insuranceCover: "N150,000", isHired: false },
    { name: "Emeka K.", role: "Electrician", trustScore: 10, insuranceCover: "N500,000", isHired: true },
];

export default function EmployerPage() {
    return (
        <div className="flex flex-col items-center p-10 min-h-screen">
            <div className="flex justify-between w-full max-w-6xl mb-8 items-center">
                <div>
                    <h1 className="text-4xl font-bold text-secondary">Employer Marketplace</h1>
                    <p>Hire skilled workers backed by Surety Protocol insurance.</p>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Total Insured Value</div>
                        <div className="stat-value text-secondary">N850,000</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {workers.map((worker, idx) => (
                    <JobCard key={idx} worker={worker} />
                ))}
            </div>
        </div>
    );
}
