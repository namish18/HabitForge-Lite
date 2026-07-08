import { Octokit } from '@octokit/rest';

let octokitInstance = null;

function getOctokit() {
  if (!octokitInstance) {
    octokitInstance = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  return octokitInstance;
}

const OWNER = process.env.GITHUB_OWNER;
const REPO  = process.env.GITHUB_REPO;

/**
 * Read a file from GitHub repository
 */
export async function readFile(path) {
  try {
    const octokit = getOctokit();
    const response = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path,
    });

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return {
      content: JSON.parse(content),
      sha: response.data.sha,
    };
  } catch (error) {
    if (error.status === 404) {
      return { content: null, sha: null };
    }
    throw error;
  }
}

/**
 * Write a file to GitHub repository (create or update)
 */
export async function writeFile(path, data, message, sha = null) {
  const octokit = getOctokit();
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const params = {
    owner: OWNER,
    repo: REPO,
    path,
    message: message || `Update ${path}`,
    content,
  };

  if (sha) {
    params.sha = sha;
  }

  const response = await octokit.repos.createOrUpdateFileContents(params);
  return response.data;
}

/**
 * Ensure a file exists, creating it with default content if not
 */
export async function ensureFile(path, defaultContent) {
  const { content, sha } = await readFile(path);
  if (content === null) {
    await writeFile(path, defaultContent, `Initialize ${path}`);
    return { content: defaultContent, sha: null };
  }
  return { content, sha };
}

/**
 * List files in a directory
 */
export async function listDirectory(dirPath) {
  try {
    const octokit = getOctokit();
    const response = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: dirPath,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Delete a file from GitHub repository
 */
export async function deleteFile(path, sha, message) {
  const octokit = getOctokit();
  await octokit.repos.deleteFile({
    owner: OWNER,
    repo: REPO,
    path,
    message: message || `Delete ${path}`,
    sha,
  });
}
