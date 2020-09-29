const output = require('@lerna/output');

const formatMessage = (jiraLabelPattern) => ({
  key,
  summary,
  status,
  assignee,
}) => `Issue ${key} ${summary} (Status: ${status}, Assignee: ${assignee}) has not linked package${
  jiraLabelPattern ? ` by pattern ${jiraLabelPattern}` : ''
}.`;

function showLinkedIssuesMessage(issues, jiraLabelPattern, logger) {
  const issuesWithoutLabels = issues.filter(
    ({ hasLabelsByPattern }) => !hasLabelsByPattern,
  );

  if (issuesWithoutLabels.length) {
    const texts = issuesWithoutLabels.map(formatMessage(jiraLabelPattern));
    const withoutLabelMessage = `Issues without label${jiraLabelPattern ? ` by pattern ${jiraLabelPattern}` : ''}:`;
    logger.warn('', withoutLabelMessage);
    output(withoutLabelMessage);

    texts.forEach((text) => {
      logger.warn('', text);
      output(text);
    });
  } else {
    const allLinkedMessage = 'All issues has linked packages!';
    logger.success('', allLinkedMessage);
    output(allLinkedMessage);
  }
};


module.exports.showLinkedIssuesMessage = showLinkedIssuesMessage;