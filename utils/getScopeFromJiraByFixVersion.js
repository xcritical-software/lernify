const fetch = require('node-fetch');
const multimatch = require('multimatch');

const domen = 'https://maxiproject.atlassian.net/rest/api/2/';

const getHeaders = ({ userName, token }) => {
  return {
      'Authorization': `Basic ${Buffer.from(
        `${userName}:${token}`
      ).toString('base64')}`,
      'Accept': 'application/json'
    }
}
const createRequest = async ({ userName, token, jiraFixVersion }) => {
  const _url = `${domen}search?jql=fixVersion=${jiraFixVersion}`;
  return await fetch(_url, {
    method: 'GET',
    headers: getHeaders({ userName, token })
  })
}

module.exports.getScopeFromJiraByFixVersion = async ({ userName, token, jiraFixVersion, jiraLabelPattern }) => {
  const request = await createRequest({ userName, token, jiraFixVersion });
  const result = await request.json()

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