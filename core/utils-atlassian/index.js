function needShowOtherOptions(options) {
  const otherFilterOption = options.scope
    || options.ignore
    || options.private
    || options.since
    || options.excludeDependents
    || options.includeDependents
    || options.includeDependencies
    || options.includeMergedTags;

  return !!otherFilterOption;
};

const { showLinkedIssuesMessage } = require('./showLinkedIssuesMessage');
const { getScopeFromJiraByFixVersion } = require('./getScopeFromJiraByFixVersion');

module.exports = {
  showLinkedIssuesMessage,
  getScopeFromJiraByFixVersion,
  needShowOtherOptions
}