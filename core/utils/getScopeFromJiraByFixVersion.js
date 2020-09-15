const fetch = require('node-fetch');
const multimatch = require('multimatch');

/* test data */
const { jiraFixVersions } = require('./mocks');

const domen = 'https://maxiproject.atlassian.net/rest/api/2/';

const getHeaders = ({ jiraUserName, jiraToken }) => {
  return {
      'Authorization': `Basic ${Buffer.from(
        `${jiraUserName}:${jiraToken}`
      ).toString('base64')}`,
      'Accept': 'application/json'
    }
}
const createRequest = async ({ jiraUserName, jiraToken, jiraFixVersion }) => {
  const _url = `${domen}search?jql=fixVersion=${jiraFixVersion}`;
  return await fetch(_url, {
    method: 'GET',
    headers: getHeaders({ jiraUserName, jiraToken })
  })
}

module.exports.getScopeFromJiraByFixVersion = async ({ jiraUserName, jiraToken, jiraFixVersion, jiraLabelPattern }) => {
  // const request = await createRequest({ jiraUserName, jiraToken, jiraFixVersion });
  // const result = await request.json()
  const result = jiraFixVersions[jiraFixVersion];

  if (result.errorMessages) return result;

  const labelsByPattern = [];

  const mappedIssues = result.issues.map((issue) => {
    const {
      fields: { labels, summary, status, assignee },
      key
    } = issue;
    const statusName = status.name;
    const assigneeName = assignee.displayName;

    const _labelsByPattern = jiraLabelPattern
      ? multimatch(labels, jiraLabelPattern)
      : labels;

    labelsByPattern.push(..._labelsByPattern);

    return {
      key,
      labels,
      summary,
      status: statusName,
      assignee: assigneeName,
      hasLabelsByPattern: !!_labelsByPattern.length
    };
  });

  return {
    labels: labelsByPattern,
    issues: mappedIssues
  }
}