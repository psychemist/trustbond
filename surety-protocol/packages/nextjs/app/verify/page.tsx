"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const VerifyPage: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [idType, setIdType] = useState<"BVN" | "NIN">("BVN");
  const [idNumber, setIdNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: "not_submitted" | "pending" | "verified" | "rejected";
    idType?: string;
    ipfsHash?: string;
    submittedAt?: string;
  } | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    ipfsUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (connectedAddress) {
      fetch(`/api/identity/submit?wallet=${connectedAddress}`)
        .then(res => res.json())
        .then(data => {
          if (data.found) {
            setVerificationStatus({
              status: data.status,
              idType: data.idType,
              ipfsHash: data.ipfsHash,
              submittedAt: data.submittedAt,
            });
          } else {
            setVerificationStatus({ status: "not_submitted" });
          }
        })
        .catch(console.error);
    }
  }, [connectedAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/identity/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: connectedAddress, idType, idNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({ success: true, message: data.message, ipfsUrl: data.ipfsUrl });
        setVerificationStatus({ status: "pending", idType, ipfsHash: data.ipfsHash });
        setIdNumber("");
      } else {
        setSubmitResult({ success: false, message: data.error });
      }
    } catch {
      setSubmitResult({ success: false, message: "Network error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg text-base-content/70">
          <span className="w-2 h-2 bg-warning rounded-full"></span>
          Connect wallet to verify identity
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="page-container">
        {/* Header */}
        <div className="pt-8 pb-10">
          <h1 className="text-3xl font-bold">Verify Identity</h1>
          <p className="text-base-content/50 mt-1">Submit Nigerian ID for employment eligibility</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {["Submit", "Review", "Bond", "Ready"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${(verificationStatus?.status === "pending" && i <= 1) ||
                    (verificationStatus?.status === "verified" && i <= 3) ||
                    (verificationStatus?.status !== "not_submitted" && i === 0)
                    ? "bg-base-content text-base-100"
                    : "bg-base-200 text-base-content/50"
                  }`}
              >
                {i + 1}
              </div>
              <span className="text-sm text-base-content/60 hidden md:block">{step}</span>
              {i < 3 && <div className="w-8 h-px bg-base-300"></div>}
            </div>
          ))}
        </div>

        {/* Status Banner */}
        {verificationStatus && verificationStatus.status !== "not_submitted" && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg mb-8 ${verificationStatus.status === "verified"
                ? "bg-success/10 text-success"
                : verificationStatus.status === "pending"
                  ? "bg-info/10 text-info"
                  : "bg-error/10 text-error"
              }`}
          >
            {verificationStatus.status === "verified" ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : verificationStatus.status === "pending" ? (
              <ClockIcon className="w-5 h-5" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5" />
            )}
            <div>
              <p className="font-medium">
                {verificationStatus.status === "verified"
                  ? "Identity Verified"
                  : verificationStatus.status === "pending"
                    ? "Pending Review"
                    : "Verification Failed"}
              </p>
              <p className="text-sm opacity-80">{verificationStatus.idType} submitted</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="card bg-base-100 p-6 mb-8">
          <h2 className="font-semibold mb-6">Submit ID</h2>

          <form onSubmit={handleSubmit}>
            {/* ID Type */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setIdType("BVN")}
                className={`p-4 rounded-lg border text-left transition-all ${idType === "BVN" ? "border-base-content bg-base-200" : "border-base-300"
                  }`}
              >
                <p className="font-medium">BVN</p>
                <p className="text-sm text-base-content/50">Bank Verification</p>
              </button>
              <button
                type="button"
                onClick={() => setIdType("NIN")}
                className={`p-4 rounded-lg border text-left transition-all ${idType === "NIN" ? "border-base-content bg-base-200" : "border-base-300"
                  }`}
              >
                <p className="font-medium">NIN</p>
                <p className="text-sm text-base-content/50">National ID</p>
              </button>
            </div>

            {/* Number Input */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">{idType} Number</label>
                <span className="text-xs text-base-content/50">{idNumber.length}/11</span>
              </div>
              <input
                type="text"
                placeholder="Enter 11 digits"
                className="input input-bordered w-full text-center text-xl font-mono tracking-widest"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                maxLength={11}
                required
              />
              <p className="text-xs text-base-content/40 mt-2">Hashed locally, never stored in plain text</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || idNumber.length !== 11 || verificationStatus?.status === "verified"}
              className={`btn btn-primary w-full ${isSubmitting ? "loading" : ""}`}
            >
              {isSubmitting
                ? "Uploading..."
                : verificationStatus?.status === "verified"
                  ? "Verified"
                  : "Submit"}
            </button>
          </form>

          {/* Result */}
          {submitResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg mt-6 text-sm ${submitResult.success ? "bg-success/10 text-success" : "bg-error/10 text-error"
                }`}
            >
              {submitResult.success ? <CheckCircleIcon className="w-4 h-4" /> : <ExclamationTriangleIcon className="w-4 h-4" />}
              {submitResult.message}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href="/" className="btn btn-ghost">
            ← Home
          </Link>
          {verificationStatus?.status === "verified" && (
            <Link href="/worker" className="btn btn-primary">
              Worker Dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
