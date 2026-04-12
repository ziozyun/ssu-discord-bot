function getStatusResultKey(content) {
  const normalizedContent = String(content || "").toLowerCase();

  if (/(^|[^\p{L}])не\s*(вдало|вивезли)([^\p{L}]|$)/u.test(normalizedContent)) {
    return "failed";
  }

  if (/(^|[^\p{L}])(вдало|вивезли)([^\p{L}]|$)/u.test(normalizedContent)) {
    return "successful";
  }

  return null;
}

module.exports = {
  getStatusResultKey,
};
