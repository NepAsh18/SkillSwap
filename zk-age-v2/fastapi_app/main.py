"""
FastAPI backend combining:
  1. Mock issuer  (/issue)  - stands in for a real KYC/ID check
  2. Verifier     (/verify) - checks a Schnorr ZK proof, no secret ever seen
  3. Registry     (/registry) - transparency: see public keys marked age-verified

Run with:
  uvicorn fastapi_app.main:app --port 8001 --reload
"""

import sys
import json
import secrets
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI
from pydantic import BaseModel, Field
from core.schnorr import derive_secret_from_code, keygen, verify, nullifier_for
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ZK Age Verification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONTEXT = "age-verification-v1"

# ── Persistence ──────────────────────────────────────────────────────────
# Plain in-memory dicts get wiped every time `--reload` restarts the worker
# process (which happens on any file save, not just deliberate edits). This
# was the actual bug: the browser cached a `y` from before a restart, and
# the fresh in-memory registry had never seen it. Persisting to disk survives
# reloads. A real deployment would use a real database instead of JSON files.

REGISTRY_FILE = Path(__file__).parent / "registry.json"
NULLIFIERS_FILE = Path(__file__).parent / "nullifiers.json"


def load_registry() -> dict:
    if REGISTRY_FILE.exists():
        return json.loads(REGISTRY_FILE.read_text())
    return {}


def save_registry():
    REGISTRY_FILE.write_text(json.dumps(registry))


def load_nullifiers() -> set:
    if NULLIFIERS_FILE.exists():
        return set(json.loads(NULLIFIERS_FILE.read_text()))
    return set()


def save_nullifiers():
    NULLIFIERS_FILE.write_text(json.dumps(list(used_nullifiers)))


registry: dict[str, dict] = load_registry()   # y (str) -> {"issued_from_id": "...masked..."}
used_nullifiers: set[str] = load_nullifiers()


class IssueRequest(BaseModel):
    id_number: str = Field(..., min_length=8, max_length=8, pattern=r"^\d{8}$")


class IssueResponse(BaseModel):
    x: str          # PRIVATE secret -- client stores this, never resend it
    y: str          # PUBLIC key -- now registered as "18+ verified"
    code: int       # the enumerated 4-digit value, shown for transparency/debugging


class VerifyRequest(BaseModel):
    y: str
    t: str
    s: str


class VerifyResponse(BaseModel):
    valid: bool
    reason: str


def enumerate_code(id_number: str) -> int:
    """Your original idea: positions 1, 4, 7, 8 (1-indexed) of the 8-digit ID."""
    d = [int(ch) for ch in id_number]
    return int(f"{d[0]}{d[3]}{d[6]}{d[7]}")


@app.post("/issue", response_model=IssueResponse)
def issue_credential(req: IssueRequest):
    code = enumerate_code(req.id_number)
    salt = secrets.randbits(128)

    x = derive_secret_from_code(code, salt)
    x, y = keygen(x)

    registry[str(y)] = {"issued_from_id_masked": req.id_number[:2] + "******" + req.id_number[-2:]}
    save_registry()  # <-- persists so a --reload restart doesn't lose it

    return IssueResponse(x=str(x), y=str(y), code=code)


@app.post("/verify", response_model=VerifyResponse)
def verify_proof(req: VerifyRequest):
    print("\n========== VERIFY REQUEST ==========")
    print("Received:", req)

    y = int(req.y)
    y_str = str(y)
    print("Public key:", y_str[:30] + "...")
    print("Registry contains key:", y_str in registry)

    if y_str not in registry:
        print("FAILED: Public key not found in registry")
        return VerifyResponse(
            valid=False,
            reason="This public key was never issued an 18+ credential.",
        )

    proof = {"t": req.t, "s": req.s, "context": CONTEXT}
    print("Running Schnorr verification...")
    result = verify(y, proof)
    print("Verification result:", result)

    if not result:
        print("FAILED: Invalid Schnorr proof")
        return VerifyResponse(
            valid=False,
            reason="Invalid proof -- does not match the registered credential.",
        )

    nf = nullifier_for(y, CONTEXT)
    print("Nullifier:", nf)

    if nf in used_nullifiers:
        print("FAILED: Replay detected")
        return VerifyResponse(
            valid=False,
            reason="Replay detected -- this proof context was already used.",
        )

    used_nullifiers.add(nf)
    save_nullifiers()  # <-- persists so a --reload restart doesn't lose it
    print("SUCCESS")
    print("====================================\n")

    return VerifyResponse(valid=True, reason="Proof valid. Age verified.")


@app.get("/registry")
def view_registry():
    """Transparency endpoint: what's public. Note: no secrets appear here."""
    return {"registered_public_keys": list(registry.keys()), "count": len(registry)}


@app.get("/health")
def health():
    return {"status": "ok"}