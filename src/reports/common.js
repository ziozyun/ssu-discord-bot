const REPORT_BOUNDARY_PATTERN = /(ПОЧАТОК|КІНЕЦЬ)\s+ЗВІТУВАННЯ\s+ЗА/i;

function isReportBoundaryMessage(message) {
  return REPORT_BOUNDARY_PATTERN.test(getMessageContent(message));
}

function shouldIgnoreReportMessage(message) {
  return isReportBoundaryMessage(message);
}

function getMessageContent(message) {
  return String(message?.content || "");
}

module.exports = {
  getMessageContent,
  isReportBoundaryMessage,
  shouldIgnoreReportMessage,
};
