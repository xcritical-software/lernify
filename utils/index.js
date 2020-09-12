module.exports = require('./getScopeFromJiraByFixVersion');

module.exports.toArray = item => {
  if (!item) return [];
  return Array.isArray(item) ? item : [item]
}