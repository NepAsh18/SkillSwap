# ZK Age Verification — Runnable Demo (pure Python, no circom/node needed)

## What changed from the previous version
The circom/snarkjs version needed downloads and a build toolchain you
couldn't run. This version uses a **Schnorr Zero-Knowledge Proof of
Knowledge** instead of a SNARK circuit — it's a real, well-established ZK
protocol (proves "I know secret x behind public y" without revealing x),
implemented in ~120 lines of pure Python. No external downloads, no
compilation step, nothing but `pip install`.

## Files
- `core/schnorr.py` — the actual ZK math (prove/verify/keygen)
- `fastapi_app/main.py` — issuer + verifier backend
- `streamlit_app/ui.py` — UI to enter an ID, issue a credential, generate
  and submit a proof, and even try to forge one (to see it get rejected)

## Run it

```bash
pip install fastapi uvicorn streamlit pydantic requests

# Terminal 1
uvicorn fastapi_app.main:app --port 8001 --reload

# Terminal 2
streamlit run streamlit_app/ui.py
```

Open the Streamlit URL it prints (usually http://localhost:8501).

## What to actually do in the UI
1. Enter any 8-digit number, click "Request credential from issuer" — this
   simulates the trust step (a real KYC/ID check would happen here instead).
2. Click "Generate proof and verify age" — this computes a real ZK proof
   locally and sends only the proof (not the secret) to the server.
3. Click "Attempt forged proof" — watch it get rejected, since a proof
   without the real secret can't pass verification even though every
   formula involved is public.
4. Click "View public registry" — see that the server only ever stores
   public keys, never secrets.

## Already verified working (I ran this end-to-end before handing it over)
- Legit proof → accepted
- Forged proof (wrong secret) → rejected
- Replay of the same proof → rejected

## For your report: what's real vs. simulated
| Part | Status |
|---|---|
| `/issue` doing real identity verification | **Simulated** — say this explicitly |
| The Schnorr ZK proof itself | **Real** cryptography, not obfuscation |
| Soundness (can't fake without the secret) | **Real** — demonstrated by the forgery button |
| Zero-knowledge (verifier learns nothing about x) | **Real** — server only ever sees `(y, t, s)` |
| Replay protection | **Real** — nullifier tracked server-side |

## Mapping back to your original stack
- The `enumerate_code()` function in `fastapi_app/main.py` still does your
  digits-1,4,7,8 idea — it's now the *input* to a secure secret, not the
  security mechanism itself.
- To wire into your existing Spring backend: point Spring's HTTP client at
  this FastAPI's `/verify` endpoint instead of the Node sidecar from the
  circom version — same idea, much simpler dependency (one Python service
  instead of Python+Node+circom).
- To wire into your existing React modal: replace `generateProof()` with a
  call that does what `core/schnorr.py`'s `prove()` does — same handful of
  lines, portable to JS with a big-integer library (e.g. `bigint-crypto-utils`).
