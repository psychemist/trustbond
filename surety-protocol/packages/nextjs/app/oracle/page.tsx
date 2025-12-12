"use client";

import { ApplicantTable } from "~~/components/surety/ApplicantTable";

export default function OraclePage() {
    return (
        <div className="flex flex-col items-center p-10 min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-primary">Oracle Dashboard</h1>
            <p className="mb-8">Verify worker identities and assess risk scores.</p>

            <div className="w-full max-w-4xl">
                <ApplicantTable />
            </div>
        </div>
    );
}
