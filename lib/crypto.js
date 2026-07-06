'use client';

/**
 * lib/crypto.js — Browser-only zero-knowledge encryption utilities.
 *
 * All functions use the Web Crypto API (window.crypto.subtle) exclusively.
 * No third-party cryptography libraries are used.
 *
 * Encryption scheme:
 *   • Key derivation : PBKDF2-SHA-256, 100 000 iterations, 16-byte random salt
 *   • Encryption     : AES-256-GCM, 12-byte random IV per operation
 *   • Encoding       : all binary values stored as lowercase hex strings
 *
 * Encrypted payload format stored in GitHub:
 * {
 *   "version"   : 1,
 *   "algorithm" : "AES-256-GCM",
 *   "salt"      : "<32-char hex>",   // 16 bytes
 *   "iv"        : "<24-char hex>",   // 12 bytes
 *   "ciphertext": "<hex string>"
 * }
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Uint8Array to a lowercase hex string. */
function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Convert a lowercase hex string to a Uint8Array. */
function fromHex(hex) {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ─── Key derivation ───────────────────────────────────────────────────────────

/**
 * Session-scoped key cache.
 * Maps salt (hex) → CryptoKey so we never run PBKDF2 twice for the same file
 * within a session.  This is essential for analytics performance when decrypting
 * up to 90 log files: first read pays the PBKDF2 cost once per file; all
 * subsequent reads are instant.  Cleared on logout with clearSessionPassword().
 *
 * Security note: the cache stores non-extractable CryptoKey objects.  The raw
 * key bytes never appear in JavaScript memory — only the opaque CryptoKey handle
 * returned by the Web Crypto API is cached.
 */
const _keyCache = new Map(); // salt_hex → CryptoKey

/**
 * Derive an AES-256-GCM CryptoKey from a password and salt using PBKDF2.
 * Results are cached per salt for the lifetime of the session.
 *
 * @param {string}     password  The user's plaintext password.
 * @param {Uint8Array} salt      16 random bytes.
 * @returns {Promise<CryptoKey>} A non-extractable AES-GCM key.
 */
async function deriveKey(password, salt) {
  const saltHex = toHex(salt);

  // Return cached key if available (avoids re-running PBKDF2 for same file)
  if (_keyCache.has(saltHex)) {
    return _keyCache.get(saltHex);
  }

  const enc = new TextEncoder();

  // Import the raw password as a PBKDF2 base key.
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,           // not extractable
    ['deriveKey']
  );

  // Derive an AES-256-GCM key.
  const key = await window.crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      hash:       'SHA-256',
      salt,
      iterations: 100_000,
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,           // not extractable — key can never leave the browser
    ['encrypt', 'decrypt']
  );

  _keyCache.set(saltHex, key);
  return key;
}


// ─── Primitive encrypt / decrypt ──────────────────────────────────────────────

/**
 * Encrypt a plaintext string with a derived CryptoKey.
 * Generates a fresh 12-byte IV for every call (IVs are never reused).
 *
 * @param {CryptoKey} key       An AES-256-GCM key.
 * @param {string}    plaintext UTF-8 text to encrypt.
 * @returns {{ iv: string, ciphertext: string }} Hex-encoded IV and ciphertext.
 */
async function encrypt(key, plaintext) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    iv:         toHex(iv),
    ciphertext: toHex(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * Decrypt an AES-256-GCM ciphertext.
 * Throws if the authentication tag fails (tampered or wrong key).
 *
 * @param {CryptoKey} key        An AES-256-GCM key.
 * @param {string}    ivHex      Hex-encoded 12-byte IV.
 * @param {string}    cipherHex  Hex-encoded ciphertext (includes 16-byte GCM tag).
 * @returns {Promise<string>}    Decrypted UTF-8 string.
 */
async function decrypt(key, ivHex, cipherHex) {
  const iv         = fromHex(ivHex);
  const ciphertext = fromHex(cipherHex);

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ─── High-level encrypt / decrypt ────────────────────────────────────────────

/**
 * Encrypt any JSON-serialisable value.
 * Generates a unique 16-byte salt (so every file has an independently derived key)
 * and a unique 12-byte IV (so no two encryptions share an IV).
 *
 * @param {string} password   The user's plaintext password.
 * @param {*}      data       Any JSON-serialisable value.
 * @returns {Promise<object>} Encrypted payload ready for GitHub storage.
 */
export async function encryptData(password, data) {
  const salt   = window.crypto.getRandomValues(new Uint8Array(16));
  const key    = await deriveKey(password, salt);
  const { iv, ciphertext } = await encrypt(key, JSON.stringify(data));

  return {
    version:   1,
    algorithm: 'AES-256-GCM',
    salt:      toHex(salt),
    iv,
    ciphertext,
  };
}

/**
 * Decrypt a payload produced by encryptData().
 * Re-derives the key from the salt stored in the payload — the key itself is
 * never stored anywhere.
 *
 * @param {string} password  The user's plaintext password.
 * @param {object} payload   Encrypted payload from GitHub.
 * @returns {Promise<*>}     The original JSON-parsed value.
 * @throws If the authentication tag fails or the payload is malformed.
 */
export async function decryptData(password, payload) {
  if (!payload || payload.version !== 1 || payload.algorithm !== 'AES-256-GCM') {
    throw new Error('Invalid or unsupported encrypted payload');
  }

  const salt = fromHex(payload.salt);
  const key  = await deriveKey(password, salt);
  const plaintext = await decrypt(key, payload.iv, payload.ciphertext);
  return JSON.parse(plaintext);
}

// ─── Session key store ────────────────────────────────────────────────────────
//
// The derived CryptoKey is kept in module-level memory only.
// It is NEVER written to localStorage, sessionStorage, cookies, or
// any other persistent storage.
//
// This store also holds the raw password temporarily so that the high-level
// helpers (encryptData / decryptData) can re-derive per-file keys without
// requiring the caller to pass the password on every call.
//
// The password is held here only because PBKDF2 is key-derivation, not
// key-encryption: the derived key changes per salt, so we must keep the
// password to derive a fresh key for each new file.  It is cleared on logout.

let _sessionPassword = null;

/**
 * Store the user's password in memory so that encrypt/decrypt helpers can
 * derive per-file keys without the caller passing the password every time.
 * Called immediately after a successful login, before the password is discarded
 * from the login form state.
 *
 * @param {string} password  The user's plaintext password.
 */
export function setSessionPassword(password) {
  _sessionPassword = password;
}

/**
 * Clear the in-memory password and the derived-key cache.
 * Must be called on logout so no key material lingers after the session ends.
 */
export function clearSessionPassword() {
  _sessionPassword = null;
  _keyCache.clear();
}


/**
 * Return whether a session password is currently held in memory.
 */
export function hasSessionPassword() {
  return _sessionPassword !== null;
}

// ─── Convenience wrappers that use the stored session password ────────────────

/**
 * Encrypt data using the current session password.
 * Throws if no session password has been set (user not logged in).
 *
 * @param {*} data  Any JSON-serialisable value.
 * @returns {Promise<object>} Encrypted payload.
 */
export async function encryptWithSession(data) {
  if (!_sessionPassword) {
    throw new Error('No active session — please log in again');
  }
  return encryptData(_sessionPassword, data);
}

/**
 * Decrypt a payload using the current session password.
 * Throws if no session password has been set (user not logged in).
 *
 * @param {object} payload  Encrypted payload from GitHub.
 * @returns {Promise<*>}    The original value.
 */
export async function decryptWithSession(payload) {
  if (!_sessionPassword) {
    throw new Error('No active session — please log in again');
  }
  return decryptData(_sessionPassword, payload);
}

/**
 * Check if a plain object looks like an encrypted payload produced by this module.
 * Used to gracefully handle legacy plaintext files or un-initialised files.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isEncryptedPayload(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.version === 1 &&
    value.algorithm === 'AES-256-GCM' &&
    typeof value.salt === 'string' &&
    typeof value.iv === 'string' &&
    typeof value.ciphertext === 'string'
  );
}
