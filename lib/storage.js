import { readFile, writeFile, ensureFile, listDirectory } from './github';

// File paths
function getPaths(userId) {
  return {
    categories: `data/users/${userId}/categories.json`,
    subcategories: `data/users/${userId}/subcategories.json`,
    tasks: `data/users/${userId}/tasks.json`,
    profile: `data/users/${userId}/profile.json`,
    log: (date) => `data/users/${userId}/logs/${date}.json`,
  };
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories(userId) {
  const PATHS = getPaths(userId);
  const { content } = await ensureFile(PATHS.categories, []);
  return content || [];
}

export async function saveCategories(categories, userId) {
  const PATHS = getPaths(userId);
  const { sha } = await readFile(PATHS.categories, []);
  await writeFile(PATHS.categories, categories, 'Update categories', sha);
}

// ─── Subcategories ────────────────────────────────────────────────────────────

export async function getSubcategories(userId) {
  const PATHS = getPaths(userId);
  const { content } = await ensureFile(PATHS.subcategories, []);
  return content || [];
}

export async function saveSubcategories(subcategories, userId) {
  const PATHS = getPaths(userId);
  const { sha } = await readFile(PATHS.subcategories, []);
  await writeFile(PATHS.subcategories, subcategories, 'Update subcategories', sha);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(userId) {
  const PATHS = getPaths(userId);
  const { content } = await ensureFile(PATHS.tasks, []);
  return content || [];
}

export async function saveTasks(tasks, userId) {
  const PATHS = getPaths(userId);
  const { sha } = await readFile(PATHS.tasks, []);
  await writeFile(PATHS.tasks, tasks, 'Update tasks', sha);
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLog(date, userId) {
  const PATHS = getPaths(userId);
  const { content } = await ensureFile(PATHS.log(date), []);
  return content || [];
}

export async function saveDailyLog(date, logs, userId) {
  const PATHS = getPaths(userId);
  const { sha } = await readFile(PATHS.log(date), []);
  await writeFile(PATHS.log(date), logs, `Update log for ${date}`, sha);
}

export async function upsertLogEntry(date, entry, userId) {
  const logs = await getDailyLog(date, userId);
  const index = logs.findIndex((l) => l.id === entry.id);
  if (index >= 0) {
    logs[index] = { ...logs[index], ...entry };
  } else {
    logs.push(entry);
  }
  await saveDailyLog(date, logs, userId);
  return logs;
}

export async function deleteLogEntry(date, logId, userId) {
  const logs = await getDailyLog(date, userId);
  const filtered = logs.filter((l) => l.id !== logId);
  await saveDailyLog(date, filtered, userId);
  return filtered;
}

// ─── Get all logs ─────────────────────────────────────────────────────────────

export async function getAllLogs(userId, daysBack = 90) {
  const PATHS = getPaths(userId);
  try {
    const files = await listDirectory(`data/users/${userId}/logs`);
    const logFiles = files
      .filter((f) => f.name.endsWith('.json'))
      .map((f) => f.name.replace('.json', ''))
      .sort()
      .reverse()
      .slice(0, daysBack);

    const results = {};
    await Promise.all(
      logFiles.map(async (date) => {
        const logs = await getDailyLog(date, userId);
        results[date] = logs;
      })
    );
    return results;
  } catch (error) {
    // If logs directory doesn't exist yet, return empty results
    return {};
  }
}
