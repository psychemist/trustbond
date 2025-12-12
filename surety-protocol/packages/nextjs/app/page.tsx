"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { UserIcon, BuildingOffice2Icon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-2xl mb-2">Welcome to</span>
          <span className="block text-4xl font-bold">Surety Protocol</span>
        </h1>
        <p className="text-center text-lg mb-10">
          The Decentralized Employment & Insurance Layer for the Informal Sector.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Oracle Card */}
          <div className="card w-96 bg-base-100 shadow-xl border border-primary">
            <div className="card-body items-center text-center">
              <ShieldCheckIcon className="h-16 w-16 text-primary" />
              <h2 className="card-title mt-4">For NGOs / Oracles</h2>
              <p>Verify workers, mint Identity Badges, and manage risk scores.</p>
              <div className="card-actions justify-end mt-4">
                <Link href="/oracle" className="btn btn-primary">
                  Enter Oracle View
                </Link>
              </div>
            </div>
          </div>

          {/* Employer Card */}
          <div className="card w-96 bg-base-100 shadow-xl border border-secondary">
            <div className="card-body items-center text-center">
              <BuildingOffice2Icon className="h-16 w-16 text-secondary" />
              <h2 className="card-title mt-4">For Employers</h2>
              <p>Hire pre-vetted workers with insurance guarantees. Stream payments.</p>
              <div className="card-actions justify-end mt-4">
                <Link href="/employer" className="btn btn-secondary">
                  Enter Employer Market
                </Link>
              </div>
            </div>
          </div>

          {/* Worker Card */}
          <div className="card w-96 bg-base-100 shadow-xl border border-accent">
            <div className="card-body items-center text-center">
              <UserIcon className="h-16 w-16 text-accent" />
              <h2 className="card-title mt-4">For Workers</h2>
              <p>Access jobs, build reputation, and automate rent savings.</p>
              <div className="card-actions justify-end mt-4">
                <Link href="/worker" className="btn btn-accent">
                  Enter Worker Wallet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
