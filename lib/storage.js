import { readFile, writeFile, listDirectory } from './github';

// File paths
function getPaths(userId) {
  return {
    categories:    `data/users/${userId}/categories.json`,
    subcategories: `data/users/${userId}/subcategories.json`,
    tasks:         `data/users/${userId}/tasks.json`,
    profile:       `data/users/${userId}/profile.json`,
    log: (date)  => `data/users/${userId}/logs/${date}.json`,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────
// All read functions return the raw value stored in GitHub.
// When the file does not exist, they return null.
// The server never inspects, constructs, or defaults application data —
// that would require knowledge of the plaintext schema.

async function readRaw(path) {
  const { content, sha } = await readFile(path);
  return { content, sha };   // content is null when the file is missing
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Returns the raw encrypted payload stored in GitHub, or null if the file
 * does not exist yet (first-time user).
 */
export async function getCategories(userId) {
  const { content } = await readRaw(getPaths(userId).categories);
  return content;   // null | EncryptedPayload
}

/**
 * Writes a pre-encrypted payload to GitHub.
 * @param {object} encryptedPayload  The full encrypted blob from the browser.
 * @param {string} userId
 */
export async function saveCategories(encryptedPayload, userId) {
  const { sha } = await readRaw(getPaths(userId).categories);
  await writeFile(getPaths(userId).categories, encryptedPayload, 'Update categories', sha);
}

// ─── Subcategories ────────────────────────────────────────────────────────────

export async function getSubcategories(userId) {
  const { content } = await readRaw(getPaths(userId).subcategories);
  return content;
}

export async function saveSubcategories(encryptedPayload, userId) {
  const { sha } = await readRaw(getPaths(userId).subcategories);
  await writeFile(getPaths(userId).subcategories, encryptedPayload, 'Update subcategories', sha);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(userId) {
  const { content } = await readRaw(getPaths(userId).tasks);
  return content;
}

export async function saveTasks(encryptedPayload, userId) {
  const { sha } = await readRaw(getPaths(userId).tasks);
  await writeFile(getPaths(userId).tasks, encryptedPayload, 'Update tasks', sha);
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLog(date, userId) {
  const { content } = await readRaw(getPaths(userId).log(date));
  return content;
}

export async function saveDailyLog(date, encryptedPayload, userId) {
  const { sha } = await readRaw(getPaths(userId).log(date));
  await writeFile(getPaths(userId).log(date), encryptedPayload, `Update log for ${date}`, sha);
}

// ─── Get all log file names ───────────────────────────────────────────────────

/**
 * Returns a list of available date strings (e.g. ["2026-06-28", ...]) for
 * which log files exist in GitHub.  The browser is responsible for fetching
 * and decrypting each file individually.
 */
export async function getLogDates(userId, daysBack = 90) {
  try {
    const files = await listDirectory(`data/users/${userId}/logs`);
    return files
      .filter((f) => f.name.endsWith('.json'))
      .map((f) => f.name.replace('.json', ''))
      .sort()
      .reverse()
      .slice(0, daysBack);
  } catch {
    return [];
  }
}

