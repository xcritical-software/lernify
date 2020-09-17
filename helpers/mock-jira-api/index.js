/* exists */
const package1 = 'package-1';
const package2 = 'package-2';
const package3 = 'package-3';
const package4 = 'package-4';
const package5 = 'package-5';

/* not exists */
const package6 = 'package-6';
const package7 = 'package-7';

/* another */
const anotherLabel1 = 'another-label-1'
const anotherLabel2 = 'another-label-2'


const release1 = {
  100: [package1],
  101: [package2],
  102: [package3],
  103: [package4],
  104: [package5],
}// все пакеты, всё прилинковано
const release2 = {
  105: [package2],
  106: [package2],
  107: [package3],
  108: [package4],
  109: [package5],
}// 1ого пакета не хватает, всё прилинковано
const release3 = {
  110: [package1],
  111: [package2],
  112: [package3],
  113: [package4, package6],
  114: [package5],
}// 6 пакет не существует, всё прилинковано
const release4 = {
  115: [package1],
  116: [package2, package7],
  117: [package3],
  118: [package4, package6],
  119: [package5],
} // 6 и 7 пакет не существует, всё прилинковано
const release5 = {
  120: [package1],
  121: [],
  122: [package3],
  123: [package4],
  124: [package5],
} // 2ого пакета не хватает, задача не прилинкована
const release6 = {
  125: [package1],
  126: [],
  127: [package4],
  128: [package5],
  129: [package3, package7, package6],
} // 2ого пакета не хватает, 6 и 7 не существует, задача не прилинкована
const release7 = {
  130: [package1],
  131: [],
  132: [],
  133: [package5],
  134: [package7, package6],
} // 2-3-4 пакета не хватает, 6 и 7 не существует, задача не прилинкована, 

const release8 = {
  130: [anotherLabel1],
  131: [anotherLabel2, package2],
  132: [],
  133: [package5],
  134: [package7, package6],
} // 2-3-4 пакета не хватает, 6 и 7 не существует, задача не прилинкована, 

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

module.exports.mockJiraFixVersions = {
  '1.0.0': jiraApiObjCreator(release1),
  '2.0.0': jiraApiObjCreator(release2),
  '3.0.0': jiraApiObjCreator(release3),
  '4.0.0': jiraApiObjCreator(release4),
  '5.0.0': jiraApiObjCreator(release5),
  '6.0.0': jiraApiObjCreator(release6),
  '7.0.0': jiraApiObjCreator(release7),
  '8.0.0': jiraApiObjCreator(release8),
};
