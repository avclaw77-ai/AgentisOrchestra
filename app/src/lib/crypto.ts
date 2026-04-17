import { randomBytes, createCipheriv, createDecipheriv, createHash, scryptSync, timingSafeEqual } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const TAG_LENGTH = 16

// ---------------------------------------------------------------------------
// Startup validation: catch misconfigured keys early with a clear message
// ---------------------------------------------------------------------------
function validateEncryptionKeyFormat(): void {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    console.error(
      "\n[FATAL] ENCRYPTION_KEY is not set.\n" +
      "Generate one with: openssl rand -hex 32\n" +
      "Then add it to your .env file.\n"
    )
    return
  }
  if (key === "REPLACE_ME_run_openssl_rand_hex_32") {
    console.error(
      "\n[FATAL] ENCRYPTION_KEY is still the placeholder value.\n" +
      "Generate a real key: openssl rand -hex 32\n" +
      "Then replace the value in your .env file.\n"
    )
    return
  }
  if (key.length !== 64 && key.length !== 32) {
    console.error(
      `\n[FATAL] ENCRYPTION_KEY has invalid length (${key.length}).\n` +
      "Expected: 64 hex characters (32 bytes).\n" +
      "Generate one with: openssl rand -hex 32\n"
    )
    return
  }
  if (key.length === 64 && !/^[0-9a-fA-F]+$/.test(key)) {
    console.error(
      "\n[FATAL] ENCRYPTION_KEY contains non-hex characters.\n" +
      "Generate a valid key: openssl rand -hex 32\n"
    )
  }
}

// Run validation on module load (server start)
validateEncryptionKeyFormat()

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is required. Run: openssl rand -hex 32")
  if (key.length === 64) return Buffer.from(key, "hex")
  if (key.length === 32) return Buffer.from(key, "utf-8")
  throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars or 32 raw chars). Run: openssl rand -hex 32")
}

/** Encrypt a plaintext string. Returns "iv:ciphertext:tag" in hex. */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`
}

/** Decrypt a "iv:ciphertext:tag" string back to plaintext. */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey()
  const [ivHex, encryptedHex, tagHex] = encoded.split(":")
  if (!ivHex || !encryptedHex || !tagHex) throw new Error("Invalid encrypted format")

  const iv = Buffer.from(ivHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const tag = Buffer.from(tagHex, "hex")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final("utf-8")
}

/** Hash a password with scrypt (CPU+memory-hard, resistant to GPU attacks). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(32)
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `${salt.toString("hex")}:${derived.toString("hex")}`
}

/** Verify a password against a "salt:derivedKey" scrypt string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, expectedHex] = stored.split(":")
  if (!saltHex || !expectedHex) return false
  const salt = Buffer.from(saltHex, "hex")
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return timingSafeEqual(derived, Buffer.from(expectedHex, "hex"))
}

/** Generate a random session token. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex")
}

/** Hash a session token for storage. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
