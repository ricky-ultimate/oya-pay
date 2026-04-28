import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-8">
        <div>
          <h1
            className="text-4xl font-bold tracking-tight text-neutral-900"
            style={{ letterSpacing: "-0.5px" }}
          >
            OyaPay
          </h1>
          <p className="mt-3 text-lg text-neutral-500">
            Smart invoicing for African freelancers
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full h-11 bg-primary-500 text-white font-medium rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full h-11 bg-white text-primary-500 font-medium rounded-lg border border-primary-500 flex items-center justify-center hover:bg-primary-50 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-neutral-400">
          Create invoices, track payments, and get paid on time.
        </p>
      </div>
    </div>
  );
}
