import { readFile, writeFile, ensureFile, listDirectory } from './github';

// File paths
const PATHS = {
  categories: 'data/categories.json',
  subcategories: 'data/subcategories.json',
  tasks: 'data/tasks.json',
  log: (date) => `data/logs/${date}.json`,
};

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  const { content } = await ensureFile(PATHS.categories, []);
  return content || [];
}

export async function saveCategories(categories) {
  const { sha } = await readFile(PATHS.categories);
  await writeFile(PATHS.categories, categories, 'Update categories', sha);
}

// ─── Subcategories ────────────────────────────────────────────────────────────

export async function getSubcategories() {
  const { content } = await ensureFile(PATHS.subcategories, []);
  return content || [];
}

export async function saveSubcategories(subcategories) {
  const { sha } = await readFile(PATHS.subcategories);
  await writeFile(PATHS.subcategories, subcategories, 'Update subcategories', sha);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks() {
  const { content } = await ensureFile(PATHS.tasks, []);
  return content || [];
}

export async function saveTasks(tasks) {
  const { sha } = await readFile(PATHS.tasks);
  await writeFile(PATHS.tasks, tasks, 'Update tasks', sha);
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLog(date) {
  const { content } = await ensureFile(PATHS.log(date), []);
  return content || [];
}

export async function saveDailyLog(date, logs) {
  const { sha } = await readFile(PATHS.log(date));
  await writeFile(PATHS.log(date), logs, `Update log for ${date}`, sha);
}

export async function upsertLogEntry(date, entry) {
  const logs = await getDailyLog(date);
  const index = logs.findIndex((l) => l.id === entry.id);
  if (index >= 0) {
    logs[index] = { ...logs[index], ...entry };
  } else {
    logs.push(entry);
  }
  await saveDailyLog(date, logs);
  return logs;
}

export async function deleteLogEntry(date, logId) {
  const logs = await getDailyLog(date);
  const filtered = logs.filter((l) => l.id !== logId);
  await saveDailyLog(date, filtered);
  return filtered;
}

// ─── Get all logs ─────────────────────────────────────────────────────────────

export async function getAllLogs(daysBack = 90) {
  const files = await listDirectory('data/logs');
  const logFiles = files
    .filter((f) => f.name.endsWith('.json'))
    .map((f) => f.name.replace('.json', ''))
    .sort()
    .reverse()
    .slice(0, daysBack);

  const results = {};
  await Promise.all(
    logFiles.map(async (date) => {
      const logs = await getDailyLog(date);
      results[date] = logs;
    })
  );
  return results;
}
