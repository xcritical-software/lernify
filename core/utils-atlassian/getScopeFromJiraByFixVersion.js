const fetch = require('node-fetch');
const multimatch = require('multimatch');

// This module uses Jira REST API v3


const getHeaders = ({ jiraUserName, jiraToken }) => ({
  Authorization: `Basic ${Buffer.from(
    `${jiraUserName}:${jiraToken}`,
  ).toString('base64')}`,
  Accept: 'application/json',
});
const createRequest = async ({
  jiraUserName, jiraToken, jiraFixVersion, jiraDomain,
}) => {
  const fields = 'labels,summary,status,assignee,key';
  const maxResults = 100; // Limit results per page
  const url = `https://${jiraDomain}/rest/api/3/search/jql?jql=fixVersion=${jiraFixVersion}&fields=${fields}&maxResults=${maxResults}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders({ jiraUserName, jiraToken }),
  });

  return response;
};

const getScopeFromJiraByFixVersion = async ({
  jiraUserName, jiraToken, jiraFixVersion, jiraLabelPattern, jiraDomain,
}) => {
  const request = await createRequest({
    jiraUserName, jiraToken, jiraFixVersion, jiraDomain,
  });

  if (request.status !== 200) {
    const errorText = await request.text();
    throw new Error(`Jira API v3 error (${request.status}): ${errorText}`);
  }

  const result = await request.json();

  if (result.errorMessages) return result;

  // Note: API v3 may return paginated results with isLast field
  // This implementation processes the first page only
  if (!result.isLast && result.issues && result.issues.length > 0) {
    console.warn('Warning: Results may be paginated. Only processing first page.');
  }

  const labelsByPattern = [];

  const mappedIssues = result.issues.map((issue) => {
    const {
      fields: {
        labels, summary, status, assignee,
      },
      key,
    } = issue;
    const statusName = status.name;
    const assigneeName = assignee ? assignee.displayName : 'Unassigned';

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
