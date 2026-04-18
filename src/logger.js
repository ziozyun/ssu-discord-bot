const util = require("node:util");

function createLogger(scope = "app", { stream = process.stdout, errorStream = process.stderr } = {}) {
  function write(level, messages) {
    const line = [
      new Date().toISOString(),
      level.toUpperCase().padEnd(5),
      `[${scope}]`,
      ...messages.map(formatLogValue),
    ].join(" ");

    const targetStream = level === "error" ? errorStream : stream;
    targetStream.write(`${line}\n`);
  }

  return {
    debug: (...messages) => write("debug", messages),
    error: (...messages) => write("error", messages),
    info: (...messages) => write("info", messages),
    warn: (...messages) => write("warn", messages),
  };
}

function formatLogValue(value) {
  if (value instanceof Error) {
    return value.stack || value.message;
  }

  if (typeof value === "string") {
    return value;
  }

  return util.inspect(value, {
    breakLength: Infinity,
    colors: false,
    depth: 5,
  });
}

module.exports = {
  createLogger,
};
