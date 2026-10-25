import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { apiRequest, getToken } from "../utils/api";

/**
 * VerifyEmail
 * -----------
 * Opened from the link in the verification email (/verify-email/:token).
 * Works whether or not the user is logged in on this device.
 */
// One request per token, even if React runs the effect twice (StrictMode in
// development) — a verification link only works once.
const requests = new Map();
function verifyOnce(token) {
  if (!requests.has(token)) {
    requests.set(token, apiRequest("/api/auth/verify-email", { method: "POST", body: { token }, auth: false }));
  }
  return requests.get(token);
}

export default function VerifyEmail({ onVerified }) {
  const { token } = useParams();
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyOnce(token);
        if (cancelled) return;
        setState({ status: "ok", message: `${res.email} is verified.` });
        if (onVerified) onVerified();
      } catch (err) {
        if (!cancelled) setState({ status: "error", message: err.message || "This link is not valid." });
      }
    })();
    return () => { cancelled = true; };
    // Run once per token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loggedIn = !!getToken();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl border border-[#ECE7F4] shadow-sm p-10 max-w-md w-full text-center">
        {state.status === "loading" && (
          <>
            <RefreshCw className="mx-auto animate-spin text-[#8B6FE8]" size={40} />
            <h1 className="font-heading font-black text-2xl text-accent mt-6">Verifying your email…</h1>
          </>
        )}
        {state.status === "ok" && (
          <>
            <CheckCircle className="mx-auto text-success" size={48} />
            <h1 className="font-heading font-black text-2xl text-accent mt-6">Email verified</h1>
            <p className="text-gray-500 font-medium mt-2">{state.message}</p>
          </>
        )}
        {state.status === "error" && (
          <>
            <XCircle className="mx-auto text-danger" size={48} />
            <h1 className="font-heading font-black text-2xl text-accent mt-6">Link not valid</h1>
            <p className="text-gray-500 font-medium mt-2">{state.message}</p>
          </>
        )}
        {state.status !== "loading" && (
          <Link to={loggedIn ? "/dashboard" : "/"} className="btn-game btn-cute inline-flex mt-8">
            {loggedIn ? "Go to dashboard" : "Go to login"}
          </Link>
        )}
      </div>
    </div>
  );
}
