import { readFile, writeFile, ensureFile } from './github';

const REGISTRY_PATH = 'data/users/registry.json';

export async function getRegistry() {
  const { content } = await ensureFile(REGISTRY_PATH, []);
  return content || [];
}

export async function saveRegistry(registry) {
  const { sha } = await readFile(REGISTRY_PATH);

  await writeFile(
    REGISTRY_PATH,
    registry,
    'Update user registry',
    sha
  );
}

export async function findUserByUsername(username) {
  const registry = await getRegistry();

  return registry.find(
    (user) => user.username === username
  );
}