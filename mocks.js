/* exists */
const project1 = 'project-1';
const project2 = 'project-2';
const project3 = 'project-3';
const project4 = 'project-4';
const project5 = 'project-5';

/* not exists */
const project6 = 'project-6';
const project7 = 'project-7';

let i = 100;
// все пакеты, всё прилинковано
// 1ого пакета не хватает, всё прилинковано
// 6 пакет не существует, всё прилинковано
// 6 и 7 пакет не существует, всё прилинковано
// 2ого пакета не хватает, задача не прилинкована
// 2ого пакета не хватает, 6 и 7 не существует, задача не прилинкована


const release1 = {
  100: [project1],
  101: [project2],
  102: [project3],
  103: [project4],
  104: [project5],
}// все пакеты, всё прилинковано
const release2 = {
  105: [project2],
  106: [project2],
  107: [project3],
  108: [project4],
  109: [project5],
}// 1ого пакета не хватает, всё прилинковано
const release3 = {
  110: [project1],
  111: [project2],
  112: [project3],
  113: [project4, project6],
  114: [project5],
}// 6 пакет не существует, всё прилинковано
const release4 = {
  115: [project1],
  116: [project2, project7],
  117: [project3],
  118: [project4, project6],
  119: [project5],
} // 6 и 7 пакет не существует, всё прилинковано
const release5 = {
  120: [project1],
  121: [],
  122: [project3],
  123: [project4],
  124: [project5],
} // 2ого пакета не хватает, задача не прилинкована
const release6 = {
  125: [project1],
  126: [],
  127: [project4],
  128: [project5],
  129: [project3, project7, project6],
} // 2ого пакета не хватает, 6 и 7 не существует, задача не прилинкована




const jiraApiObjCreator = (issues = {}) => {
  const mappedIssues = Object.entries(issues).map(([number, labels]) => {
    return {
      fields: {
        labels: labels,
        summary: `This is test issue to ${labels.join(', ')} labels`,
        status: {name: 'Closed'} ,
        assignee: {
          displayName: 'Gnom Gnomich'
        }
      },
      key: `DUMMY-CRM-${number}`
    }
  });
  return {
    issues: mappedIssues
  }
}

module.exports.jiraFixVersions = {
  '1.0.0': jiraApiObjCreator(release1),
  '2.0.0': jiraApiObjCreator(release2),
  '3.0.0': jiraApiObjCreator(release3),
  '4.0.0': jiraApiObjCreator(release4),
  '5.0.0': jiraApiObjCreator(release5),
  '6.0.0': jiraApiObjCreator(release6),
};