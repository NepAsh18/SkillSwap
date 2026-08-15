import { useState } from "react";
import { useAgeVerification } from "../../hooks/useAgeVerification";
import ErrorBanner from "../common/ErrorBanner";
import { proveSchnorr } from "./zkSchnorr";



const ISSUER_URL = process.env.REACT_APP_ISSUER_URL || "http://localhost:8001";
const CREDENTIAL_KEY = "zk-age-credential";

async function getOrIssueCredential(fakeIdNumber) {
  const cached = localStorage.getItem(CREDENTIAL_KEY);
  if (cached) return JSON.parse(cached);

  const res = await fetch(`${ISSUER_URL}/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_number: fakeIdNumber }),
  });
  if (!res.ok) throw new Error("Issuer rejected the ID");

  const credential = await res.json(); // { x, y, code }
  // Real deployment: use a secure enclave / platform keystore instead of
  // localStorage. Flagging that plainly since this is a known weak point.
  localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(credential));
  return credential;
}

export default function AgeGateModal({ onVerified, onCancel }) {
  const { submitProof, isSubmitting, error } = useAgeVerification();
  const [step, setStep] = useState("intro"); // intro | generating | submitting
  const [proofError, setProofError] = useState(null);

  async function generateProof() {
    // Wherever your app already keeps the synthetic ID for this project —
    // swap this line for your real source.
    const fakeIdNumber = localStorage.getItem("dev-fake-id-number") || "35074383";

    const credential = await getOrIssueCredential(fakeIdNumber);
    const x = BigInt(credential.x);
    const y = BigInt(credential.y);

    const { t, s } = await proveSchnorr(x, y);

    // This is the ENTIRE payload sent to the backend — no x, no code.
    return { y: y.toString(), t, s };
  }

  async function handleVerify() {
    setProofError(null);
    setStep("generating");

    let proof;
    try {
      proof = await generateProof();
    } catch (err) {
      setProofError("Could not generate proof: " + err.message);
      setStep("intro");
      return;
    }

    setStep("submitting");
    const success = await submitProof(proof); // now an object, not a string — see note below
    if (success) {
      onVerified();
    } else {
      setStep("intro");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-stone-900">Age-restricted content</h2>
        <p className="mt-2 text-sm text-stone-600">
          This video is marked 18+. Verify your age locally on this device to
          continue — no personal data leaves your browser.
        </p>
        {(error || proofError) && (
          <div className="mt-3">
            <ErrorBanner error={error || proofError} />
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={isSubmitting || step !== "intro"}
            className="rounded-md bg-stone-900 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {step === "generating" && "Generating proof…"}
            {step === "submitting" && "Verifying…"}
            {step === "intro" && "Verify age"}
          </button>
        </div>
      </div>
    </div>
  );
}
