/* exists */
const project1 = 'package-1';
const project2 = 'package-2';
const project3 = 'package-3';
const project4 = 'package-4';
const project5 = 'package-5';

/* not exists */
const project6 = 'package-6';
const project7 = 'package-7';

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 1.0.0
const release1 = {
  100: [project1],
  101: [project2],
  102: [project3],
  103: [project4],
  104: [project5],
}// все пакеты, всё прилинковано
// lerna info filter [ 'package-1', 'package-2', 'package-3', 'package-4', 'package-5' ]
// lerna success All issues has linked packages!
// lerna info Jira linked packages: package-1, package-2, package-3, package-4, package-5
// lerna notice filter including ["package-1","package-2","package-3","package-4","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna"]
// lerna info Executing command in 5 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 2.0.0
const release2 = {
  105: [project2],
  106: [project2],
  107: [project3],
  108: [project4],
  109: [project5],
}// 1ого пакета не хватает, всё прилинковано
// lerna info filter [ 'package-2', 'package-2', 'package-3', 'package-4', 'package-5' ]
// lerna success All issues has linked packages!
// lerna info Jira linked packages: package-2, package-2, package-3, package-4, package-5
// lerna notice filter including ["package-2","package-3","package-4","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna","package-1"]
// lerna info Executing command in 4 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 3.0.0
const release3 = {
  110: [project1],
  111: [project2],
  112: [project3],
  113: [project4, project6],
  114: [project5],
}// 6 пакет не существует, всё прилинковано
// lerna success All issues has linked packages!
// lerna info Jira linked packages: package-1, package-2, package-3, package-4, package-6, package-5
// lerna WARN Linked packages is not exists in project: "package-6"
// lerna notice filter including ["package-1","package-2","package-3","package-4","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna"]
// lerna info Executing command in 5 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 4.0.0
const release4 = {
  115: [project1],
  116: [project2, project7],
  117: [project3],
  118: [project4, project6],
  119: [project5],
} // 6 и 7 пакет не существует, всё прилинковано
// lerna success All issues has linked packages!
// lerna info Jira linked packages: package-1,package-2,package-7,package-3,package-4,package-6,package-5
// lerna WARN Linked packages is not exists in project: ["package-7","package-6"]
// lerna notice filter including ["package-1","package-2","package-3","package-4","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna"]
// lerna info Executing command in 5 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 5.0.0
const release5 = {
  120: [project1],
  121: [],
  122: [project3],
  123: [project4],
  124: [project5],
} // 2ого пакета не хватает, задача не прилинкована
// lerna WARN Issues without label by pattern:
// lerna WARN Issue DUMMY-CRM-121 This is test issue to  labels (Status: Closed, Assignee: Gnom Gnomich) has not linked package.
// lerna info Jira linked packages: package-1,package-3,package-4,package-5
// lerna notice filter including ["package-1","package-3","package-4","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna","package-2"]
// lerna info Executing command in 4 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 6.0.0
const release6 = {
  125: [project1],
  126: [],
  127: [project4],
  128: [project5],
  129: [project3, project7, project6],
} // 2ого пакета не хватает, 6 и 7 не существует, задача не прилинкована
// lerna WARN Issues without label by pattern:
// lerna WARN Issue DUMMY-CRM-126 This is test issue to  labels (Status: Closed, Assignee: Gnom Gnomich) has not linked package.
// lerna info Jira linked packages: package-1,package-4,package-5,package-3,package-7,package-6
// lerna WARN Linked packages is not exists in project: ["package-7","package-6"]
// lerna notice filter including ["package-1","package-3","package-4","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna","package-2"]
// lerna info Executing command in 4 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 7.0.0
const release7 = {
  130: [project1],
  131: [],
  132: [],
  133: [project5],
  134: [project7, project6],
} // 2-3-4 пакета не хватает, 6 и 7 не существует, задача не прилинкована, 
// lerna WARN Issues without label by pattern:
// lerna WARN Issue DUMMY-CRM-131 This is test issue to  labels (Status: Closed, Assignee: Gnom Gnomich) has not linked package.
// lerna WARN Issue DUMMY-CRM-132 This is test issue to  labels (Status: Closed, Assignee: Gnom Gnomich) has not linked package.
// lerna info Jira linked packages: package-1,package-5,package-7,package-6
// lerna WARN Linked packages is not exists in project: ["package-7","package-6"]
// lerna notice filter including ["package-1","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna","package-2","package-3","package-4"]
// lerna info Executing command in 2 packages: "npm run build"

// node .\core\lerna\cli.js run build --jiraUserName s --jiraToken 1 --jiraFixVersion 7.0.0 --scope package-1 --scope package-3
// lerna WARN Issues without label by pattern:
// lerna WARN Issue DUMMY-CRM-131 This is test issue to  labels (Status: Closed, Assignee: Gnom Gnomich) has not linked package.
// lerna WARN Issue DUMMY-CRM-132 This is test issue to  labels (Status: Closed, Assignee: Gnom Gnomich) has not linked package.
// lerna info Jira linked packages: package-1,package-5,package-7,package-6
// lerna WARN Linked packages is not exists in project: ["package-7","package-6"]
// lerna info filter [ 'package-1', 'package-3' ]
// lerna info Packages by other options: package-1,package-3
// lerna WARN Packages filtered by other options is not linked in jira: ["package-3"]
// lerna notice filter including ["package-1","package-5"]
// lerna notice excluding ["@xc-lerna/run","lerna","package-2","package-3","package-4"]
// lerna info Executing command in 2 packages: "npm run build"

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
  '7.0.0': jiraApiObjCreator(release7),
};