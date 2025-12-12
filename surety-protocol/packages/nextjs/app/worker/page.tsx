"use client";

import { WorkerBalance } from "~~/components/surety/WorkerBalance";

export default function WorkerPage() {
    return (
        <div className="flex flex-col items-center p-10 min-h-screen">
            <h1 className="text-4xl font-bold mb-2 text-accent">Worker Wallet</h1>
            <p className="mb-8 text-xl">Welcome back, Tunde!</p>

            <WorkerBalance />
        </div>
    );
}
