"use strict";

jest.mock("@lerna/npm-run-script");

const npmRunScript = require("@lerna/npm-run-script");
const output = require("@lerna/output");

const { mockJiraFixVersions } = require("../../../helpers/mock-jira-api");
const initFixture = require("../../../helpers/init-fixture")(__dirname);
const lernaRun = require("../../../helpers/command-runner")(require("../command"));


jest.mock('node-fetch', () => {
  return (url, { headers }) => {
    const { Authorization } = headers;
    const basicToken = Authorization.split('Basic ')[1];
    const [user, token] = Buffer
      .from(basicToken, 'base64')
      .toString('ascii')
      .split(':');

    const fixVersion = url.split('fixVersion=')[1];
    return {
      status: user === 'admin' && token === '12345' ? 200 : 401, 
      json: () => mockJiraFixVersions[fixVersion]
    }
  }
});

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

const allLinkedMessage = "All issues has linked packages!";

describe("RunCommand", () => {
  npmRunScript.mockImplementation((script, { pkg }) => Promise.resolve({ code: 0, stdout: pkg.name }));
  npmRunScript.stream.mockImplementation(() => Promise.resolve({ code: 0 }));
  afterEach(() => {
    process.exitCode = undefined;
  });

  describe("In a basic repo", () => {
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture("basic");
    });

    it("All packages", async () => {
      await lernaRun(testDir)("start");
      const logLines = output.logged().split("\n");

      const res = [`including ${[package1, package2, package3, package4, package5]}`]
      
      expect(logLines).toEqual(res);
    });
    
    it("--scope package-2 --scope package-4", async () => {
      await lernaRun(testDir)(
        "start", 
        "--scope", "package-2" ,
        "--scope", "package-4"
      );
      const logLines = output.logged().split("\n");
      
      const res = [
        `including ${[package2, package4]}`,
        `excluding ${[package1, package3, package5]}`
      ]

      expect(logLines).toEqual(res);
    });
    
    it("Without jiraUserName - error", async () => {
      const command = lernaRun(testDir)("start", "--jiraToken" ,"123" ,"--jiraFixVersion" ,"1.0.0");
      expect(command).rejects.toThrow("jiraUserName and jiraToken is required for get scope by jiraFixVersion");
    });
    
    it("Without jiraToken - error", async () => {
      const command = lernaRun(testDir)("start", "--jiraUserName" ,"123" ,"--jiraFixVersion" ,"1.0.0");
      expect(command).rejects.toThrow("jiraUserName and jiraToken is required for get scope by jiraFixVersion");
    });
    
    it("Invalid creds", async () => {
      const command = lernaRun(testDir)("start", "--jiraUserName" ,"123", "--jiraToken" , "123" ,"--jiraFixVersion" ,"1.0.0");
      expect(command).rejects.toThrow("Api error");
    });
    
    it("1.0.0 All in Release", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "1.0.0"
      );
      const logLines = output.logged().split("\n");
      
      const jiraPackages = [package1, package2, package3, package4, package5]; 
      const res = [
        allLinkedMessage,
        `Jira linked packages: ${jiraPackages}`,
        `including ${jiraPackages}`
      ];
      
      expect(logLines).toEqual(res)
    });
    
    it("2.0.0 Release Without 1st package", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "2.0.0"
      );
      const logLines = output.logged().split("\n");
      
      const jiraPackages = [package2, package2, package3, package4, package5]; 
      const res = [
        allLinkedMessage,
        `Jira linked packages: ${jiraPackages}`,
        `including ${[package2, package3, package4, package5]}`,
        `excluding ${[package1]}`
      ];

      expect(logLines).toEqual(res)
    });
    
    it("3.0.0 All linked, 6st not exists", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "3.0.0"
      );
      const logLines = output.logged().split("\n");

      const jiraPackages = [package1, package2, package3, package4, package6, package5]; 
      const res = [
        allLinkedMessage,
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[package6]}`,
        `including ${[package1, package2, package3, package4, package5]}`,
      ];

      expect(logLines).toEqual(res)
    });

    it("4.0.0 All linked, 6st and 7st not exists", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "4.0.0"
      );
      const logLines = output.logged().split("\n");

      const jiraPackages = [package1, package2, package7, package3, package4, package6, package5]; 
      const res = [
        allLinkedMessage,
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[package7,package6]}`,
        `including ${[package1, package2, package3, package4, package5]}`,
      ];

      expect(logLines).toEqual(res)
    });

    it("5.0.0 2st package not linked, 6st and 7st not exists, 121 Issue has not linked package", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "5.0.0"
      );
      const logLines = output.logged().split("\n");

      const jiraPackages = [package1, package3, package4, package5]; 
      const res = [
        "Issues without label:",
        "Issue DUMMY-CRM-121 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        `Jira linked packages: ${jiraPackages}`,
        `including ${[package1, package3, package4, package5]}`,
        `excluding ${[package2]}`,
      ];

      expect(logLines).toEqual(res)
    });

    it("6.0.0 2st package not linked, 6st and 7st not exists, 126 Issue has not linked package", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "6.0.0"
      );
      const logLines = output.logged().split("\n");

      const jiraPackages = [package1, package4, package5, package3, package7, package6]; 
      const res = [
        "Issues without label:",
        "Issue DUMMY-CRM-126 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[package7, package6]}`,
        `including ${[package1, package3, package4, package5]}`,
        `excluding ${[package2]}`,
      ];
      
      expect(logLines).toEqual(res)
    });
    
    it("7.0.0 Release Without 2-3-4 packages", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "7.0.0"
      );
      const logLines = output.logged().split("\n");

      const jiraPackages = [package1, package5, package7, package6]; 
      const res = [
        "Issues without label:",
        "Issue DUMMY-CRM-131 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        "Issue DUMMY-CRM-132 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[package7, package6]}`,
        `including ${[package1, package5]}`,
        `excluding ${[package2, package3, package4]}`,
      ];
      
      expect(logLines).toEqual(res)
    });
    
    it("7.0.0 Release Without 2-3-4 packages --scope package-3 --scope package-4 --scope package-5", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "7.0.0",
        "--scope", package3,
        "--scope", package4,
        '--scope', package5
      );
      const logLines = output.logged().split("\n");
      
      const jiraPackages = [package1, package5, package7, package6]; 
      const res = [
        "Issues without label:",
        "Issue DUMMY-CRM-131 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        "Issue DUMMY-CRM-132 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[package7, package6]}`,
        `Packages by other options: ${[package3, package4, package5]}`,
        `Packages filtered by other options is not linked in jira: ${[package3, package4]}`,
        `including ${[package1, package5]}`,
        `excluding ${[package2, package3, package4]}`,
      ];

      expect(logLines).toEqual(res)
    });
    
    it("8.0.0 Release Without 2-3-4 packages, add another label", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "8.0.0",
      );
      const logLines = output.logged().split("\n");
      
      const jiraPackages = [anotherLabel1, anotherLabel2, package2, package5, package7, package6]; 
      const res = [
        "Issues without label:",
        "Issue DUMMY-CRM-137 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package.",
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[anotherLabel1, anotherLabel2, package7, package6]}`,
        `including ${[package2, package5]}`,
        `excluding ${[package1, package3, package4]}`,
      ];

      expect(logLines).toEqual(res)
    });
    
    it("8.0.0 Release Without 2-3-4 packages, add another label, add jiraLabelPattern package-*", async () => {
      await lernaRun(testDir)(
        "start", 
        "--jiraUserName" , "admin", 
        "--jiraToken" , "12345" , 
        "--jiraFixVersion" , "8.0.0",
        "--jiraLabelPattern", 'package-*'
      );
      const logLines = output.logged().split("\n");
      
      const jiraPackages = [package2, package5, package7, package6]; 
      const res = [
        "Issues without label by pattern package-*:",
        "Issue DUMMY-CRM-135 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package by pattern package-*.",
        "Issue DUMMY-CRM-137 This is test issue (Status: Closed, Assignee: Gnom Gnomich) has not linked package by pattern package-*.",
        `Jira linked packages: ${jiraPackages}`,
        `Linked packages is not exists in project: ${[package7, package6]}`,
        `including ${[package2, package5]}`,
        `excluding ${[package1, package3, package4]}`,
      ];

      expect(logLines).toEqual(res)
    });


  })
});