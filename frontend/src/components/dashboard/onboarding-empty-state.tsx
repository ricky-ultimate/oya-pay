import Link from "next/link";

const STEPS = [
  { step: "1", title: "Create", desc: "Add your client and line items" },
  { step: "2", title: "Send", desc: "Deliver via WhatsApp or Email" },
  { step: "3", title: "Get paid", desc: "We chase late payments for you" },
];

export function OnboardingEmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-12 flex flex-col items-center text-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-primary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
          Welcome to OyaPay
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
          Create your first invoice, send it to your client, and let OyaPay
          chase the payment for you.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
        {STEPS.map((item) => (
          <div
            key={item.step}
            className="flex flex-col items-center gap-2 px-2"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-bold flex items-center justify-center">
              {item.step}
            </div>
            <p className="text-sm font-semibold text-neutral-900">
              {item.title}
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
      <Link
        href="/invoices/create"
        className="inline-flex items-center gap-2 h-11 px-6 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
      >
        Create your first invoice
      </Link>
      <Link
        href="/clients"
        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        Or add a client first
      </Link>
    </div>
  );
}
