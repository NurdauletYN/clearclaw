import Link from "next/link";
import { PaymentConfirm } from "../../../components/PaymentConfirm";
import { getSupabaseAuthServerClient } from "../../../lib/supabase-auth-server";
import { getSupabaseServerClient, type SubscriptionRow } from "../../../lib/supabase-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const PAYPAL_BASE_URL = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_URL ?? "#";

/**
 * Builds a PayPal checkout URL.
 *
 * If the env var is a standard PayPal CGI "Buy Now" link
 * (https://www.paypal.com/cgi-bin/webscr?...) we append the return and
 * cancel_return parameters so the user lands back on our site after paying.
 *
 * If it's a paypal.me link we return it as-is — PayPal.me does not support
 * custom return URLs, so the user must click "Claim my access" manually when
 * they return to the billing page.
 */
const buildPayPalUrl = (): string => {
  if (PAYPAL_BASE_URL === "#") return "#";
  try {
    const url = new URL(PAYPAL_BASE_URL);
    if (url.hostname === "www.paypal.com" && url.pathname.includes("webscr")) {
      url.searchParams.set("return", `${APP_URL}/billing?payment=success`);
      url.searchParams.set("cancel_return", `${APP_URL}/billing`);
      url.searchParams.set("rm", "1"); // POST data on return
    }
    return url.toString();
  } catch {
    return PAYPAL_BASE_URL;
  }
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

const StatusBadge = ({ status }: { status: string }): JSX.Element => {
  const colours: Record<string, string> = {
    active: "bg-emerald-900/50 text-emerald-400",
    cancelled: "bg-yellow-900/50 text-yellow-400",
    expired: "bg-red-900/50 text-red-400",
    paused: "bg-slate-800 text-slate-400",
    past_due: "bg-orange-900/50 text-orange-400",
    pending: "bg-yellow-900/50 text-yellow-400"
  };
  const labels: Record<string, string> = {
    active: "Active",
    cancelled: "Cancelled",
    expired: "Expired",
    paused: "Paused",
    past_due: "Past due",
    pending: "Verifying payment…"
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colours[status] ?? "bg-slate-800 text-slate-400"}`}
    >
      {labels[status] ?? status}
    </span>
  );
};

const LIFETIME_FEATURES = [
  "Unlimited connected devices",
  "Unlimited event history",
  "Plain-English event feed",
  "Anomaly scoring & real-time alerts",
  "Full session history & replay",
  "Permission profiles",
  "All future features",
  "Priority email support"
];

type BillingPageProps = {
  searchParams: { payment?: string };
};

export default async function BillingPage({ searchParams }: BillingPageProps): Promise<JSX.Element> {
  // Returned from PayPal — show the claim / activation flow
  if (searchParams.payment === "success") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold">Billing</h1>
        <PaymentConfirm />
      </div>
    );
  }

  let userEmail: string | null = null;
  try {
    const authClient = getSupabaseAuthServerClient();
    const {
      data: { user }
    } = await authClient.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // non-fatal
  }

  let subscription: SubscriptionRow | null = null;
  if (userEmail) {
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_email", userEmail)
        .in("status", ["active", "paused", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      subscription = (data as SubscriptionRow | null) ?? null;
    } catch {
      // no subscription found
    }
  }

  const isActive = subscription?.status === "active" || subscription?.status === "paused";
  const isPending = subscription?.status === "pending";
  const paypalUrl = buildPayPalUrl();

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      {isActive && subscription ? (
        <>
          {/* Active subscription card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Current plan
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {subscription.plan === "lifetime" ? "Lifetime Access" : "Pro"}
                </p>
              </div>
              <StatusBadge status={subscription.status} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {subscription.plan === "lifetime" ? (
                <div className="space-y-1">
                  <dt className="text-slate-500">Access</dt>
                  <dd className="font-medium text-emerald-400">Lifetime — never expires</dd>
                </div>
              ) : (
                <>
                  {subscription.renews_at && (
                    <div className="space-y-1">
                      <dt className="text-slate-500">Renews</dt>
                      <dd className="font-medium">{formatDate(subscription.renews_at)}</dd>
                    </div>
                  )}
                  {subscription.ends_at && (
                    <div className="space-y-1">
                      <dt className="text-slate-500">Access until</dt>
                      <dd className="font-medium">{formatDate(subscription.ends_at)}</dd>
                    </div>
                  )}
                </>
              )}
              <div className="space-y-1">
                <dt className="text-slate-500">Account</dt>
                <dd className="truncate font-medium">{subscription.user_email}</dd>
              </div>
            </dl>
          </div>

          <p className="text-sm text-slate-500">
            Questions?{" "}
            <a
              href="mailto:support@clearclaw.dev"
              className="text-brand-400 underline hover:text-brand-300"
            >
              support@clearclaw.dev
            </a>
          </p>
        </>
      ) : isPending ? (
        /* Pending verification */
        <div className="rounded-xl border border-yellow-500/30 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-300">Payment received — verifying</p>
              <p className="mt-0.5 text-sm text-slate-400">
                We&apos;re confirming your PayPal payment. Your access will be activated shortly.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Expected wait: a few minutes to a few hours. You&apos;ll be able to access the dashboard
            automatically once verified.{" "}
            <a href="mailto:support@clearclaw.dev" className="text-brand-400 underline hover:text-brand-300">
              Contact support
            </a>{" "}
            if you&apos;ve been waiting longer than 24 hours.
          </p>
        </div>
      ) : (
        /* No subscription — upgrade wall */
        <div className="rounded-xl border border-brand-500/40 bg-slate-900 p-8 ring-1 ring-brand-500/20">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Lifetime access · one-time payment
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-extrabold">$49</span>
              <span className="mb-1 text-slate-400">one time</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Pay once. Use forever. All future features included.
            </p>
          </div>

          <ul className="mb-8 grid grid-cols-2 gap-2 text-sm text-slate-300">
            {LIFETIME_FEATURES.map((feat) => (
              <li key={feat} className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {feat}
              </li>
            ))}
          </ul>

          <Link
            href={paypalUrl}
            className="block rounded-lg bg-[#0070ba] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#005ea6]"
          >
            Pay $49 with PayPal
          </Link>

          {userEmail && (
            <p className="mt-3 text-center text-xs text-slate-600">
              Purchasing for <span className="text-slate-400">{userEmail}</span>
            </p>
          )}

          <p className="mt-4 text-center text-xs text-slate-600">
            Already paid?{" "}
            <Link
              href="/billing?payment=success"
              className="text-brand-400 underline hover:text-brand-300"
            >
              Claim your access here
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
