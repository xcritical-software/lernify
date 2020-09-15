module.exports = require('./getScopeFromJiraByFixVersion');


module.exports.needShowOtherOptions = function needShowOtherOptions(options) {
  const otherFilterOption =
    options.scope ||
    options.ignore ||
    options.private ||
    options.since ||
    options.excludeDependents ||
    options.includeDependents ||
    options.includeDependencies ||
    options.includeMergedTags;
  return !!otherFilterOption;
};

const formatMessage = (jiraLabelPattern) => ({
  key,
  summary,
  status,
  assignee,
}) => {
  return `Issue ${key} ${summary} (Status: ${status}, Assignee: ${assignee}) has not linked package${
    jiraLabelPattern ? ` by pattern ${jiraLabelPattern}` : ""
  }.`;
};

module.exports.showLinkedIssuesMessage = function showLinkedIssuesMessage(issues, jiraLabelPattern, logger) {
  const issuesWithoutLabels = issues.filter(
    ({ hasLabelsByPattern }) => !hasLabelsByPattern
  );

  if (issuesWithoutLabels.length) {
    const text = issuesWithoutLabels.map(formatMessage(jiraLabelPattern));
    logger.warn("", "Issues without label by pattern: ");

    text.forEach((text) => {
      logger.useColor();
      logger.warn("", text);
    });
  } else {
    logger.success("", "All issues has linked packages!");
  }
}