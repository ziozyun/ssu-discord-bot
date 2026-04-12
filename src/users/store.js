const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_USER_DATA_FILE = path.resolve(process.cwd(), "data/users.json");
let writeQueue = Promise.resolve();

function createUserInfoStore({ filePath = process.env.USER_DATA_FILE || DEFAULT_USER_DATA_FILE } = {}) {
  async function readAll() {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(content);

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {};
      }

      return data;
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      }

      throw error;
    }
  }

  async function getUser(userId) {
    const data = await readAll();

    return data[userId] || {};
  }

  async function updateUser(userId, patch, { now = new Date() } = {}) {
    return enqueueWrite(async () => {
      const data = await readAll();
      const userInfo = {
        ...(data[userId] || {}),
        ...patch,
        updatedAt: now.toISOString(),
      };

      data[userId] = userInfo;
      await writeAll(data);

      return userInfo;
    });
  }

  async function writeAll(data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const temporaryFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const content = `${JSON.stringify(sortUserData(data), null, 2)}\n`;

    await fs.writeFile(temporaryFilePath, content, "utf8");
    await fs.rename(temporaryFilePath, filePath);
  }

  return {
    filePath,
    getUser,
    readAll,
    updateUser,
  };
}

function enqueueWrite(operation) {
  const nextWrite = writeQueue.then(operation, operation);

  writeQueue = nextWrite.catch(() => {});

  return nextWrite;
}

function sortUserData(data) {
  return Object.fromEntries(
    Object.entries(data)
      .sort(([firstUserId], [secondUserId]) => firstUserId.localeCompare(secondUserId))
      .map(([userId, userInfo]) => [
        userId,
        Object.fromEntries(Object.entries(userInfo).sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))),
      ]),
  );
}

module.exports = {
  DEFAULT_USER_DATA_FILE,
  createUserInfoStore,
};
