const DEFAULT_TIME_ZONE = "Europe/Kyiv";

function ensureTimeZone(timeZone = DEFAULT_TIME_ZONE) {
  if (!process.env.TZ) {
    process.env.TZ = timeZone;
  }

  return process.env.TZ;
}

module.exports = {
  DEFAULT_TIME_ZONE,
  ensureTimeZone,
};
