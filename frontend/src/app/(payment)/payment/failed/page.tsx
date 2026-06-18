"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4">
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 flex flex-col items-center gap-5 w-full max-w-md shadow-sm">
        <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
        <p className="text-base font-semibold text-neutral-900">Loading...</p>
      </div>
    </div>
  );
}

function PaymentFailedInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams.get("reference") ?? searchParams.get("trxref");
  const reason = searchParams.get("reason");

  const displayReason =
    reason && reason.toLowerCase() !== "declined"
      ? reason
      : "Your payment could not be processed at this time.";

  const retryUrl = reference
    ? `https://checkout.paystack.com/${reference}`
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <span
            className="text-xl font-bold text-neutral-900 tracking-tight"
            style={{ letterSpacing: "-0.4px" }}
          >
            OyaPay
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-error-50 border-b border-error-100 px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-error-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-error-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-error-900 tracking-tight"
                style={{ letterSpacing: "-0.5px" }}
              >
                Payment Failed
              </h1>
              <p className="text-error-700 text-sm mt-1">{displayReason}</p>
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                What may have gone wrong
              </h2>
              <ul className="flex flex-col gap-2">
                {[
                  "Insufficient funds in your account",
                  "Your card or bank declined the transaction",
                  "The payment session timed out",
                  "A temporary issue with the payment gateway",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 flex-shrink-0 mt-2" />
                    <span className="text-sm text-neutral-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {reference && (
              <div className="bg-neutral-50 rounded-xl border border-neutral-100 px-4 py-3">
                <p className="text-xs text-neutral-500">
                  Transaction reference
                </p>
                <p className="text-sm font-mono font-semibold text-neutral-900 mt-0.5 break-all">
                  {reference}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              {retryUrl ? (
                <a
                  href={retryUrl}
                  className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center"
                >
                  Retry Payment
                </a>
              ) : (
                <button
                  onClick={() => router.back()}
                  className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Go Back
                </button>
              )}
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>

            <p className="text-center text-xs text-neutral-500">
              Need help?{" "}
              <Link
                href="mailto:support@oyapay.com"
                className="text-primary-600 font-semibold hover:underline"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Powered by OyaPay
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentFailedInner />
    </Suspense>
  );
}
