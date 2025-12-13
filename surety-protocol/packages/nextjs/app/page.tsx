"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="page-container pt-16 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 rounded-full text-sm text-base-content/70 mb-8">
            <ShieldCheckIcon className="w-4 h-4" />
            Decentralized Employment Insurance
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-base-content mb-6">
            SuretyDAO
          </h1>

          <p className="text-xl text-base-content/60 mb-12 max-w-xl mx-auto leading-relaxed">
            Secure employment bonds for high-risk workers. GPS-verified attendance, automatic wage splits, and
            insurance protection.
          </p>

          {/* Wallet Status */}
          {isConnected ? (
            <div className="inline-flex items-center gap-6 px-6 py-4 bg-base-200 rounded-lg">
              <div className="text-left">
                <p className="text-xs text-base-content/50 uppercase tracking-wider">Connected</p>
                <code className="text-sm font-mono">
                  {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
                </code>
              </div>
              <div className="h-8 w-px bg-base-300"></div>
              <div className="text-left">
                <p className="text-xs text-base-content/50 uppercase tracking-wider">Balance</p>
                <span className="text-lg font-semibold">${formattedBalance}</span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-base-200 rounded-lg text-base-content/70">
              <span className="w-2 h-2 bg-warning rounded-full animate-pulse"></span>
              Connect wallet to get started
            </div>
          )}
        </div>
      </div>

      {/* Role Cards */}
      <div className="bg-base-200 py-20">
        <div className="page-container">
          <h2 className="text-sm uppercase tracking-wider text-base-content/50 text-center mb-10">Choose your role</h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Employer */}
            <Link href="/employer" className="group">
              <div className="card bg-base-100 p-8 h-full card-hover">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-base-200 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-base-content" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-base-content/30 group-hover:text-base-content group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Employer</h3>
                <p className="text-base-content/60 text-sm leading-relaxed">
                  Hire verified workers with insurance protection. Pay weekly wages with automatic splits.
                </p>
              </div>
            </Link>

            {/* Worker */}
            <Link href="/worker" className="group">
              <div className="card bg-base-100 p-8 h-full card-hover">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-base-200 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-base-content" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-base-content/30 group-hover:text-base-content group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Worker</h3>
                <p className="text-base-content/60 text-sm leading-relaxed">
                  Check in at job sites, build your trust score, and receive protected wages weekly.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Wage Split Section */}
      <div className="page-container py-20">
        <h2 className="text-sm uppercase tracking-wider text-base-content/50 text-center mb-10">Wage Distribution</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="stat-minimal text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CurrencyDollarIcon className="w-5 h-5 text-base-content/40" />
            </div>
            <div className="stat-value">85%</div>
            <div className="stat-title">Worker</div>
          </div>

          <div className="stat-minimal text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheckIcon className="w-5 h-5 text-base-content/40" />
            </div>
            <div className="stat-value">5%</div>
            <div className="stat-title">Insurance</div>
          </div>

          <div className="stat-minimal text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HomeModernIcon className="w-5 h-5 text-base-content/40" />
            </div>
            <div className="stat-value">5%</div>
            <div className="stat-title">Savings</div>
          </div>

          <div className="stat-minimal text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-base-content/40 text-sm">DAO</span>
            </div>
            <div className="stat-value">5%</div>
            <div className="stat-title">Protocol</div>
          </div>
        </div>
      </div>

      {/* Trust System */}
      <div className="bg-base-200 py-20">
        <div className="page-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm uppercase tracking-wider text-base-content/50 text-center mb-10">Trust System</h2>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-3">GPS</div>
                <p className="text-sm text-base-content/60">Daily check-ins verify work attendance</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-3">5/7</div>
                <p className="text-sm text-base-content/60">Weekly check-ins required for payout</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-3">50+</div>
                <p className="text-sm text-base-content/60">Minimum trust score for wages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center border-t border-base-200">
        <p className="text-sm text-base-content/40">Built for Africa · Powered by Base · ETH Global Bangkok 2024</p>
      </div>
    </div>
  );
};

export default Home;
