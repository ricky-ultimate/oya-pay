import Link from "next/link";

const NAV_LINKS = [{ href: "/login", label: "Sign in" }];

function PlaceholderImage({
  description,
  aspectRatio = "aspect-video",
  className = "",
}: {
  description: string;
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={`${aspectRatio} ${className} bg-neutral-100 border border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-6 text-center`}
    >
      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      </div>
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
        Image placeholder
      </p>
      <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}

const FEATURES = [
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
    ),
    title: "Professional invoices",
    description:
      "Create beautiful, branded invoices in seconds. Attach PDFs, add line items, and include payment links automatically.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      </svg>
    ),
    title: "Automated follow-ups",
    description:
      "Set up intelligent reminder sequences via Email and WhatsApp. Your collection agent works 24/7 so you don't have to.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
        />
      </svg>
    ),
    title: "Paystack integration",
    description:
      "Clients pay directly from the invoice. Payments are verified and recorded automatically — no manual reconciliation.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
    title: "Recovery analytics",
    description:
      "See exactly which reminders recovered revenue. Understand client payment behaviour and optimise your follow-up strategy.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
        />
      </svg>
    ),
    title: "Client intelligence",
    description:
      "Every client gets a reliability score based on their payment history. Know who to trust before you start working.",
  },
  {
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
        />
      </svg>
    ),
    title: "WhatsApp reminders",
    description:
      "Reach clients where they actually respond. WhatsApp delivery dramatically improves payment conversion rates.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create your invoice",
    description:
      "Add your client, line items, and due date. OyaPay generates a professional PDF and a Paystack payment link instantly.",
  },
  {
    number: "02",
    title: "Send and schedule",
    description:
      "Deliver the invoice via Email and WhatsApp simultaneously. Choose your follow-up sequence — OyaPay handles the rest.",
  },
  {
    number: "03",
    title: "Get paid",
    description:
      "Clients pay with one click. Payments are automatically recorded and your collection agent is deactivated.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span
            className="text-lg font-bold tracking-tight text-neutral-900"
            style={{ letterSpacing: "-0.5px" }}
          >
            OyaPay
          </span>
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register"
              className="inline-flex items-center h-9 px-4 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center h-7 px-3 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-6 tracking-wide uppercase">
            Built for African freelancers
          </div>
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-none tracking-tight mb-6"
            style={{ letterSpacing: "-2px" }}
          >
            Get paid.
            <br />
            <span className="text-primary-500">On time.</span>
          </h1>
          <p className="text-xl text-neutral-500 leading-relaxed max-w-2xl mx-auto mb-10">
            OyaPay automates your invoicing and follow-ups so you can focus on
            your work — not chasing payments.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center h-12 px-8 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center h-12 px-8 bg-white text-neutral-700 text-sm font-semibold rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <PlaceholderImage
            description="Hero dashboard screenshot: A clean, full-width screenshot of the OyaPay dashboard showing the pipeline overview cards (Pending collection, At risk, Agents active, Recovered), the Needs attention section with client rows, and the monthly revenue chart. Should convey a modern, professional SaaS product. Light background, crisp UI."
            aspectRatio="aspect-[16/9]"
            className="shadow-2xl shadow-neutral-200/80 border-neutral-200"
          />
        </div>
      </section>

      <section className="py-24 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              Everything you need to get paid
            </h2>
            <p className="text-lg text-neutral-500 max-w-xl mx-auto">
              From invoice creation to payment confirmation, OyaPay handles the
              full collection cycle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-neutral-200 p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center h-6 px-2.5 bg-success-50 text-success-700 text-xs font-semibold rounded-full mb-4 uppercase tracking-wide">
                Automated collection
              </div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-5"
                style={{ letterSpacing: "-1px" }}
              >
                Your personal collection agent
              </h2>
              <p className="text-lg text-neutral-500 leading-relaxed mb-8">
                Define a follow-up sequence once. OyaPay sends pre-due
                reminders, overdue notices, and final warnings automatically —
                via Email and WhatsApp — until the invoice is settled.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Pre-due reminders to prevent late payments",
                  "Escalating overdue notices with payment links",
                  "WhatsApp delivery for higher open rates",
                  "Auto-deactivates when payment is received",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-neutral-600"
                  >
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
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <PlaceholderImage
              description="Follow-up timeline UI: A close-up screenshot or illustration of the OyaPay follow-up sequence configuration panel. Shows a vertical timeline with steps: Pre-due Reminder, First Overdue Notice, Second Overdue, Final Notice — each with day offset controls and Email/WhatsApp channel toggles. Clean, minimal design on white card background."
              aspectRatio="aspect-square"
            />
          </div>
        </div>
      </section>

      <section className="py-24 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <PlaceholderImage
              description="WhatsApp message mockup: A realistic smartphone screen showing a WhatsApp conversation where a freelancer's automated message is displayed. The message reads something like: 'Hi Amaka, a reminder that invoice INV-001 for ₦350,000 is due on 15 Jan 2025. Pay here: [link]'. Should feel authentic and Nigerian. Warm, natural lighting around the phone."
              aspectRatio="aspect-square"
              className="lg:order-first"
            />
            <div>
              <div className="inline-flex items-center h-6 px-2.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-4 uppercase tracking-wide">
                WhatsApp delivery
              </div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-5"
                style={{ letterSpacing: "-1px" }}
              >
                Reach clients where they respond
              </h2>
              <p className="text-lg text-neutral-500 leading-relaxed mb-6">
                Email open rates in Nigeria hover around 20%. WhatsApp messages
                are read within minutes. OyaPay delivers your reminders through
                both channels to maximise your chances of getting paid.
              </p>
              <p className="text-sm text-neutral-400">
                Powered by UltraMsg for reliable WhatsApp delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              Simple from start to payment
            </h2>
            <p className="text-lg text-neutral-500">
              Three steps. No complexity.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <div key={step.number} className="relative">
                {index < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-6 left-1/2 w-full h-px bg-neutral-200" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white text-sm font-bold flex items-center justify-center mb-4 z-10 relative">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-neutral-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-2xl font-bold text-neutral-900 tracking-tight mb-3"
              style={{ letterSpacing: "-0.5px" }}
            >
              Built for the way Africans work
            </h2>
            <p className="text-neutral-500">
              Real stories from freelancers using OyaPay.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I used to spend hours every week chasing payments. Now OyaPay handles it while I focus on client work.",
                name: "Tunde A.",
                role: "Brand designer, Lagos",
                imageDescription:
                  "Professional headshot of a Nigerian male creative professional, mid-30s, warm smile, casual-professional attire. Office or studio background. Natural lighting.",
              },
              {
                quote:
                  "The WhatsApp reminders changed everything. My clients respond within an hour compared to ignoring my emails for weeks.",
                name: "Ngozi E.",
                role: "Video editor, Abuja",
                imageDescription:
                  "Professional headshot of a Nigerian female creative professional, late-20s, confident expression, modern styling. Neutral or blurred studio background.",
              },
              {
                quote:
                  "I can finally see which clients pay late before I take on new projects. The reliability scores are invaluable.",
                name: "Emeka O.",
                role: "UI designer, Port Harcourt",
                imageDescription:
                  "Professional headshot of a Nigerian male designer, early-30s, professional but approachable look. Clean background.",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col gap-4"
              >
                <p className="text-sm text-neutral-600 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-neutral-100">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <svg
                      className="w-4 h-4 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-neutral-900 rounded-3xl p-12 text-center">
            <h2
              className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              Stop chasing. Start creating.
            </h2>
            <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">
              Join freelancers across Africa who get paid on time with OyaPay.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center h-12 px-8 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Create your account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="text-sm font-semibold text-neutral-900"
            style={{ letterSpacing: "-0.5px" }}
          >
            OyaPay
          </span>
          <p className="text-sm text-neutral-400">
            Smart invoicing for African freelancers.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
