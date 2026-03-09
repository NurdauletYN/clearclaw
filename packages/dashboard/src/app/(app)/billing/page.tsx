import Link from "next/link";
import { PaymentConfirm } from "../../../components/PaymentConfirm";
import { RestoreAccessButton } from "../../../components/RestoreAccessButton";
import { getSupabaseAuthServerClient } from "../../../lib/supabase-auth-server";
import { getSupabaseServerClient, type SubscriptionRow } from "../../../lib/supabase-server";

const BASE_CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL ?? "#";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const buildCheckoutUrl = (email: string | null): string => {
  if (!email || BASE_CHECKOUT_URL === "#") return BASE_CHECKOUT_URL;
  const url = new URL(BASE_CHECKOUT_URL);
  // Pre-fill email and pass it as custom data so the webhook identifies the user.
  url.searchParams.set("checkout[email]", email);
  url.searchParams.set("checkout[custom][user_email]", email);
  // After payment, send the user back to our activation screen.
  url.searchParams.set("checkout[success_url]", `${APP_URL}/billing?payment=success`);
  return url.toString();
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
    past_due: "bg-orange-900/50 text-orange-400"
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colours[status] ?? "bg-slate-800 text-slate-400"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

const PRO_FEATURES = [
  "Up to 5 connected devices",
  "Unlimited event history",
  "Anomaly scoring & real-time alerts",
  "Full session history & replay",
  "Permission profiles",
  "Priority support"
];

type BillingPageProps = {
  searchParams: { payment?: string };
};

export default async function BillingPage({ searchParams }: BillingPageProps): Promise<JSX.Element> {
  // Show the payment activation screen while the webhook processes
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
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      subscription = (data as SubscriptionRow | null) ?? null;
    } catch {
      // no active subscription
    }
  }

  const isSubscribed = subscription !== null;
  const checkoutUrl = buildCheckoutUrl(userEmail);

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>

      {isSubscribed && subscription ? (
        <>
          {/* Active subscription card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Current plan
                </p>
                <p className="mt-1 text-2xl font-bold">Pro</p>
              </div>
              <StatusBadge status={subscription.status} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
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
              <div className="space-y-1">
                <dt className="text-slate-500">Account</dt>
                <dd className="truncate font-medium">{subscription.user_email}</dd>
              </div>
            </dl>
          </div>

          <p className="text-sm text-slate-500">
            To cancel or update your subscription, visit your{" "}
            <a
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 underline hover:text-brand-300"
            >
              Lemon Squeezy customer portal
            </a>
            .
          </p>
        </>
      ) : (
        /* No active subscription — upgrade wall */
        <div className="rounded-xl border border-brand-500/40 bg-slate-900 p-8 ring-1 ring-brand-500/20">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Required to access the dashboard
            </p>
            <div className="mt-3 flex items-end gap-1">
              <span className="text-4xl font-extrabold">$9</span>
              <span className="mb-1 text-slate-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Full access from day one. Cancel any time.
            </p>
          </div>

          <ul className="mb-8 grid grid-cols-2 gap-2 text-sm text-slate-300">
            {PRO_FEATURES.map((feat) => (
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
            href={checkoutUrl}
            className="block rounded-lg bg-brand-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Subscribe — $9/month
          </Link>

          {userEmail && (
            <p className="mt-3 text-center text-xs text-slate-600">
              Signing up as <span className="text-slate-400">{userEmail}</span>
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <RestoreAccessButton />
          </div>
        </div>
      )}
    </div>
  );
}
