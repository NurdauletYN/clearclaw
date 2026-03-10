"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (opts: {
        hostedButtonId: string;
      }) => { render: (selector: string) => Promise<void> };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const BUTTON_ID = process.env.NEXT_PUBLIC_PAYPAL_BUTTON_ID ?? "";
const SDK_URL = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&components=hosted-buttons&disable-funding=venmo&currency=USD`;

type Status = "loading" | "ready" | "error" | "unconfigured";

export const PayPalButton = (): JSX.Element => {
  const containerId = `paypal-container-${BUTTON_ID}`;
  const rendered = useRef(false);
  const [status, setStatus] = useState<Status>(
    CLIENT_ID && BUTTON_ID ? "loading" : "unconfigured"
  );

  useEffect(() => {
    if (!CLIENT_ID || !BUTTON_ID) return;
    if (rendered.current) return;

    const renderButton = (): void => {
      if (!window.paypal || rendered.current) return;
      rendered.current = true;
      window.paypal
        .HostedButtons({ hostedButtonId: BUTTON_ID })
        .render(`#${containerId}`)
        .then(() => setStatus("ready"))
        .catch(() => setStatus("error"));
    };

    // SDK might already be loaded (e.g. hot-reload)
    if (window.paypal) {
      renderButton();
      return;
    }

    // Avoid injecting the script twice
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-paypal-sdk="clearclaw"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", renderButton);
      return () => existingScript.removeEventListener("load", renderButton);
    }

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.setAttribute("data-paypal-sdk", "clearclaw");
    script.onload = renderButton;
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);
  }, [containerId]);

  if (status === "unconfigured") {
    return (
      <p className="text-center text-sm text-slate-500">
        Payment button not configured — set{" "}
        <code className="text-slate-400">NEXT_PUBLIC_PAYPAL_CLIENT_ID</code> and{" "}
        <code className="text-slate-400">NEXT_PUBLIC_PAYPAL_BUTTON_ID</code>.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-sm text-red-400">
        PayPal failed to load. Please refresh or{" "}
        <a href="mailto:support@clearclaw.dev" className="underline">
          contact support
        </a>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Spinner shown while the SDK loads; hidden once PayPal renders its button */}
      {status === "loading" && (
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-brand-500" />
      )}
      {/* PayPal injects its button into this div */}
      <div id={containerId} className="w-full" />
    </div>
  );
};
