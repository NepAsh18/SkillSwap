"""
Streamlit UI simulating the "device" role in a real deployment (the part
that would normally be your browser / mobile app). It:

  1. Lets you enter a synthetic 8-digit ID and call the issuer (/issue).
  2. Holds the PRIVATE secret x only in Streamlit's session state
     (never sent anywhere after issuance -- simulating local device storage).
  3. Generates a real Schnorr ZK proof locally, using the same core.schnorr
     module the backend uses to verify -- proving happens client-side.
  4. Submits ONLY the proof (t, s, y) to /verify -- x never leaves this app.

Run with:
  streamlit run streamlit_app/ui.py
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import requests
import streamlit as st

from core.schnorr import prove

API_URL = "http://localhost:8001"

st.set_page_config(page_title="ZK Age Verification Demo", page_icon="🔒")
st.title("🔒 ZK Age Verification — Demo")

st.markdown(
    """
This demonstrates a real (if simplified) zero-knowledge proof: the app
proves it holds a valid 18+ credential **without ever sending the secret
to the server** — only a proof derived from it.
"""
)

if "credential" not in st.session_state:
    st.session_state.credential = None
if "last_proof" not in st.session_state:
    st.session_state.last_proof = None

st.header("1. Issue a credential (mock KYC step)")
st.caption(
    "In a real system this endpoint would sit behind actual identity verification. "
    "Here you can enter any synthetic 8-digit code for testing."
)

id_number = st.text_input("8-digit ID number", value="35074383", max_chars=8)

if st.button("Request credential from issuer"):
    if not (id_number.isdigit() and len(id_number) == 8):
        st.error("Must be exactly 8 digits.")
    else:
        try:
            resp = requests.post(f"{API_URL}/issue", json={"id_number": id_number}, timeout=5)
            resp.raise_for_status()
            st.session_state.credential = resp.json()
            st.success("Credential issued and stored locally (this session only).")
        except requests.RequestException as e:
            st.error(f"Could not reach issuer API: {e}")

if st.session_state.credential:
    cred = st.session_state.credential
    with st.expander("Credential details (would normally stay on-device, shown here for the demo)"):
        st.write("Enumerated code (from ID digits 1,4,7,8):", cred["code"])
        st.write("Public key `y` (this is what got registered as '18+ verified'):")
        st.code(cred["y"][:60] + "...")
        st.write("Private secret `x` (NEVER sent to the server again):")
        st.code(cred["x"][:60] + "...")

st.header("2. Generate & submit a ZK proof")
st.caption("This computes the proof locally, then sends only the proof — not the secret.")

if st.button("Generate proof and verify age", disabled=st.session_state.credential is None):
    cred = st.session_state.credential
    x = int(cred["x"])
    y = int(cred["y"])

    proof = prove(x, y)
    st.session_state.last_proof = proof

    try:
        resp = requests.post(
            f"{API_URL}/verify",
            json={"y": str(y), "t": proof["t"], "s": proof["s"]},
            timeout=5,
        )
        resp.raise_for_status()
        result = resp.json()
        if result["valid"]:
            st.success(f"✅ {result['reason']}")
        else:
            st.error(f"❌ {result['reason']}")
    except requests.RequestException as e:
        st.error(f"Could not reach verifier API: {e}")

if st.session_state.last_proof:
    with st.expander("What was actually sent to the server"):
        st.json(
            {
                "y (public key)": st.session_state.credential["y"][:40] + "...",
                "t (proof commitment)": st.session_state.last_proof["t"][:40] + "...",
                "s (proof response)": st.session_state.last_proof["s"][:40] + "...",
            }
        )
        st.caption("Notice: `x` and `code` are absent — the server never sees them.")

st.header("3. Try to cheat (forge a proof without the real secret)")
st.caption("This shows the soundness property: without x, you can't produce a valid proof.")

if st.button("Attempt forged proof"):
    if st.session_state.credential is None:
        st.warning("Issue a credential first so there's a registered `y` to target.")
    else:
        from core.schnorr import keygen

        y = int(st.session_state.credential["y"])
        fake_x, _ = keygen()  # attacker doesn't know the real x
        forged_proof = prove(fake_x, y)  # tries to prove against the REAL y anyway

        try:
            resp = requests.post(
                f"{API_URL}/verify",
                json={"y": str(y), "t": forged_proof["t"], "s": forged_proof["s"]},
                timeout=5,
            )
            result = resp.json()
            st.error(f"Forged proof result: {result['reason']} (valid={result['valid']})")
        except requests.RequestException as e:
            st.error(f"Could not reach verifier API: {e}")

st.divider()
if st.button("View public registry (transparency check)"):
    try:
        resp = requests.get(f"{API_URL}/registry", timeout=5)
        st.json(resp.json())
        st.caption("This is everything the server ever stores. No secrets appear here.")
    except requests.RequestException as e:
        st.error(f"Could not reach API: {e}")
