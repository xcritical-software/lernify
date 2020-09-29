const fetch = require('node-fetch');
const multimatch = require('multimatch');


const domen = 'https://maxiproject.atlassian.net/rest/api/2/';

const getHeaders = ({ jiraUserName, jiraToken }) => ({
  Authorization: `Basic ${Buffer.from(
    `${jiraUserName}:${jiraToken}`,
  ).toString('base64')}`,
  Accept: 'application/json',
});
const createRequest = async ({ jiraUserName, jiraToken, jiraFixVersion }) => {
  const url = `${domen}search?jql=fixVersion=${jiraFixVersion}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders({ jiraUserName, jiraToken }),
  });

  return response;
};

const getScopeFromJiraByFixVersion = async ({
  jiraUserName, jiraToken, jiraFixVersion, jiraLabelPattern,
}) => {
  const request = await createRequest({ jiraUserName, jiraToken, jiraFixVersion });

  if (request.status !== 200) {
    throw Error('Api error');
  }

  const result = await request.json();

  if (result.errorMessages) return result;

  const labelsByPattern = [];

  const mappedIssues = result.issues.map((issue) => {
    const {
      fields: {
        labels, summary, status, assignee,
      },
      key,
    } = issue;
    const statusName = status.name;
    const assigneeName = assignee.displayName;

    const issueLabelsByPattern = jiraLabelPattern
      ? multimatch(labels, jiraLabelPattern)
      : labels;

    labelsByPattern.push(...issueLabelsByPattern);

    return {
      key,
      labels,
      summary,
      status: statusName,
      assignee: assigneeName,
      hasLabelsByPattern: !!issueLabelsByPattern.length,
    };
  });

  return {
    labels: labelsByPattern,
    issues: mappedIssues,
  };
};

module.exports.getScopeFromJiraByFixVersion = getScopeFromJiraByFixVersion;
