const fs = require("node:fs/promises");
const path = require("node:path");
const { MAX_DISPATCH_CACHE_SIZE } = require("./cache");

const DEFAULT_DISPATCH_CACHE_FILE = path.resolve(process.cwd(), "data/notification-dispatch-cache.json");
let writeQueue = Promise.resolve();

function createDispatchCacheStore({
  filePath = process.env.NOTIFICATION_DISPATCH_CACHE_FILE || DEFAULT_DISPATCH_CACHE_FILE,
  maxEntries = MAX_DISPATCH_CACHE_SIZE,
} = {}) {
  async function readCache() {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(content);

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return new Map();
      }

      return new Map(
        Object.entries(data)
          .filter(([, value]) => Number.isFinite(value))
          .slice(-maxEntries),
      );
    } catch (error) {
      if (error.code === "ENOENT") {
        return new Map();
      }

      throw error;
    }
  }

  async function writeCache(cache) {
    return enqueueWrite(async () => {
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      const entries = Array.from(cache.entries()).slice(-maxEntries);
      const data = Object.fromEntries(entries);
      const temporaryFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

      await fs.writeFile(temporaryFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
      await fs.rename(temporaryFilePath, filePath);
    });
  }

  return {
    filePath,
    readCache,
    writeCache,
  };
}

function enqueueWrite(operation) {
  const nextWrite = writeQueue.then(operation, operation);

  writeQueue = nextWrite.catch(() => {});

  return nextWrite;
}

module.exports = {
  DEFAULT_DISPATCH_CACHE_FILE,
  createDispatchCacheStore,
};
