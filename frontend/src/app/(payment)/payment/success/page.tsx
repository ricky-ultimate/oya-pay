"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PaymentVerificationResult } from "@/types";

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

type VerificationState =
  | { phase: "loading" }
  | { phase: "success"; data: PaymentVerificationResult }
  | { phase: "pending"; data: PaymentVerificationResult }
  | { phase: "failed"; data: PaymentVerificationResult }
  | { phase: "error"; message: string };

function CheckIcon() {
  return (
    <svg
      className="w-8 h-8 text-success-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-8 h-8 text-warning-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 px-4">
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 flex flex-col items-center gap-5 w-full max-w-md shadow-sm">
        <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
        <div className="text-center">
          <p className="text-base font-semibold text-neutral-900">
            Verifying your payment
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Please wait while we confirm your transaction.
          </p>
        </div>
      </div>
    </div>
  );
}

function SuccessView({ data }: { data: PaymentVerificationResult }) {
  const senderName = data.invoice?.businessName ?? data.invoice?.freelancerName;
  const router = useRouter();

  const nextSteps = [
    senderName
      ? `${senderName} has been notified of your payment.`
      : "The business has been notified of your payment.",
    data.invoice
      ? `Your payment reference is ${data.invoice.invoiceNumber}.`
      : `Your transaction reference is ${data.reference}.`,
    "A receipt has been sent to your email address.",
  ];

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
          <div className="bg-success-50 border-b border-success-100 px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
              <CheckIcon />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-success-900 tracking-tight"
                style={{ letterSpacing: "-0.5px" }}
              >
                Payment Received
              </h1>
              <p className="text-success-700 text-sm mt-1">
                Your transaction was completed successfully.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-success-200 px-6 py-4 w-full">
              <p className="text-3xl font-bold text-neutral-900 tabular-nums">
                {formatNaira(data.amount)}
              </p>
              {data.invoice && (
                <p className="text-sm text-neutral-500 mt-1">
                  {data.invoice.invoiceNumber}
                </p>
              )}
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col gap-5">
            {data.invoice && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Payment details
                </h2>
                <div className="bg-neutral-50 rounded-xl border border-neutral-100 divide-y divide-neutral-100">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-neutral-500">Invoice</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {data.invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-neutral-500">For</span>
                    <span className="text-sm font-semibold text-neutral-900 text-right max-w-[55%] truncate">
                      {data.invoice.title}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-neutral-500">Recipient</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {senderName}
                    </span>
                  </div>
                  {data.paidAt && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-neutral-500">Date</span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {new Date(data.paidAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                What happens next
              </h2>
              <ul className="flex flex-col gap-2.5">
                {nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 text-success-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-neutral-600 leading-relaxed">
                      {step}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                Go to Dashboard
              </button>
              {data.invoice && (
                <a
                  href={`mailto:${data.customer.email}`}
                  className="w-full h-11 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors flex items-center justify-center"
                >
                  Contact Sender
                </a>
              )}
            </div>

            <p className="text-center text-xs text-neutral-400">
              Reference: {data.reference}
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

function PendingView({ data }: { data: PaymentVerificationResult }) {
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
          <div className="bg-warning-50 border-b border-warning-100 px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center">
              <ClockIcon />
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-warning-900 tracking-tight"
                style={{ letterSpacing: "-0.5px" }}
              >
                Payment Pending
              </h1>
              <p className="text-warning-700 text-sm mt-1">
                Your transaction is being processed.
              </p>
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col gap-5">
            <p className="text-sm text-neutral-600 leading-relaxed">
              Your payment of{" "}
              <span className="font-semibold">{formatNaira(data.amount)}</span>{" "}
              is currently being processed by your bank. This typically takes a
              few minutes.
            </p>
            <p className="text-sm text-neutral-500">
              You will receive a confirmation once the payment clears. Keep your
              reference number for your records.
            </p>
            <div className="bg-neutral-50 rounded-xl border border-neutral-100 px-4 py-3">
              <p className="text-xs text-neutral-500">Transaction reference</p>
              <p className="text-sm font-mono font-semibold text-neutral-900 mt-0.5 break-all">
                {data.reference}
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/dashboard"
                className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Powered by OyaPay
        </p>
      </div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  const router = useRouter();

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
          <div className="bg-neutral-50 border-b border-neutral-100 px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div>
              <h1
                className="text-2xl font-bold text-neutral-900 tracking-tight"
                style={{ letterSpacing: "-0.5px" }}
              >
                Unable to Verify
              </h1>
              <p className="text-neutral-500 text-sm mt-1">{message}</p>
            </div>
          </div>

          <div className="px-6 py-6 flex flex-col gap-4">
            <p className="text-sm text-neutral-600 leading-relaxed">
              If you completed a payment, please check your bank statement or
              contact the business directly with your transaction details.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full h-11 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Powered by OyaPay
        </p>
      </div>
    </div>
  );
}

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>({ phase: "loading" });

  useEffect(() => {
    const reference =
      searchParams.get("reference") ?? searchParams.get("trxref");

    if (!reference) {
      setState({
        phase: "error",
        message: "No payment reference found in this URL.",
      });
      return;
    }

    api
      .verifyPaymentByReference(reference)
      .then((data) => {
        if (data.status === "success") {
          setState({ phase: "success", data });
        } else if (data.status === "pending") {
          setState({ phase: "pending", data });
        } else {
          setState({ phase: "failed", data });
        }
      })
      .catch(() => {
        setState({
          phase: "error",
          message:
            "We could not verify this payment. The reference may be invalid or expired.",
        });
      });
  }, [searchParams]);

  if (state.phase === "loading") return <LoadingSpinner />;
  if (state.phase === "success") return <SuccessView data={state.data} />;
  if (state.phase === "pending") return <PendingView data={state.data} />;
  if (state.phase === "failed") {
    return (
      <FailedRedirect
        reference={
          searchParams.get("reference") ?? searchParams.get("trxref") ?? ""
        }
        gatewayResponse={state.data.gatewayResponse}
      />
    );
  }
  return <ErrorView message={state.message} />;
}

function FailedRedirect({
  reference,
  gatewayResponse,
}: {
  reference: string;
  gatewayResponse: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams({
      reference,
      reason: gatewayResponse,
    });
    router.replace(`/payment/failed?${params.toString()}`);
  }, [router, reference, gatewayResponse]);

  return <LoadingSpinner />;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentSuccessInner />
    </Suspense>
  );
}
