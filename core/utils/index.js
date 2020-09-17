const output = require("@lerna/output");

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
    const withoutLabelMessage = `Issues without label${jiraLabelPattern ? ` by pattern ${jiraLabelPattern}` : ""}:`
    logger.warn("", withoutLabelMessage);
    output(withoutLabelMessage)

    text.forEach((text) => {
      logger.warn("", text);
      output(text)
    });
  } else {
    const allLinkedMessage = "All issues has linked packages!";
    logger.success("", allLinkedMessage);
    output(allLinkedMessage)
  }
}