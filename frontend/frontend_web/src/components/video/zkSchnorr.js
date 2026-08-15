// Direct JS port of core/schnorr.py's prove() — same group, same math.
// Uses native BigInt (arbitrary precision), no external crypto library needed.

// RFC 3526, 1536-bit MODP Group (Group 5) — MUST match core/schnorr.py exactly.
const P = BigInt(
  "0x" +
    "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD" +
    "129024E088A67CC74020BBEA63B139B22514A08798E3404" +
    "DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C" +
    "245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406" +
    "B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE" +
    "45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD" +
    "24CF5F83655D23DCA3AD961C62F356208552BB9ED529077" +
    "096966D670C354E4ABC9804F1746C08CA18217C32905E46" +
    "2E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF" +
    "06F4C52C9DE2BCBF6955817183995497CEA956AE515D225" +
    "6A0CCB0B15059BB90D51C22FF15AC7EE5DBB2E9E29C5CE0" +
    "72B9BF06FA0623804C4E4A4D9C24B8B9F1CB9F0E9E4A1A9"
);
const G = 2n;
const Q = (P - 1n) / 2n;

function modPow(base, exp, mod) {
  base %= mod;
  let result = 1n;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

function randomBigIntBelow(max) {
  const bytes = new Uint8Array(Math.ceil(max.toString(2).length / 8) + 1);
  crypto.getRandomValues(bytes);
  let hex = "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return (BigInt(hex) % (max - 1n)) + 1n;
}

async function sha256ToBigInt(message) {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return BigInt("0x" + hex);
}

async function challenge(y, t, context) {
  const h = await sha256ToBigInt(`${G}:${y}:${t}:${context}`);
  return h % Q;
}

/**
 * Produces a Schnorr proof {t, s} that the caller knows `x` such that
 * y = g^x mod p — WITHOUT sending x anywhere. This is the exact
 * counterpart to core.schnorr.prove() in the Python backend.
 */
export async function proveSchnorr(x, y, context = "age-verification-v1") {
  const k = randomBigIntBelow(Q);
  const t = modPow(G, k, P);
  const c = await challenge(y, t, context);
  const s = (k + c * x) % Q;
  return { t: t.toString(), s: s.toString(), context };
}
