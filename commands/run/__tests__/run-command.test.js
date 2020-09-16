"use strict";

jest.mock("@lerna/npm-run-script");
const npmRunScript = require("@lerna/npm-run-script");
const output = require("@lerna/output");

const initFixture = require("../../../helpers/init-fixture")(__dirname);

const lernaRun = require("../../../helpers/command-runner")(require("../command"));

const package1 = 'package-1'
const package2 = 'package-2'
const package3 = 'package-3'
const package4 = 'package-4'
const package5 = 'package-5'



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
      const packages = [package1, package2, package3, package4, package5]; // all
      
      expect(logLines).toEqual(packages);
    });
    
    it("--scope package-2 --scope package-4", async () => {
      await lernaRun(testDir)("start", "--scope" ,"package-2" ,"--scope" ,"package-4");
      const logLines = output.logged().split("\n");
      const packages = [package2, package4]; // all
      expect(logLines).toEqual(packages);
    });
    
    it("Without jiraUserName - error", async () => {
      const command = lernaRun(testDir)("start", "--jiraToken" ,"123" ,"--jiraFixVersion" ,"1.0.0");
      expect(command).rejects.toThrow("jiraUserName and jiraToken is required for get scope by jiraFixVersion");
    });
    
    it("Without jiraToken - error", async () => {
      const command = lernaRun(testDir)("start", "--jiraUserName" ,"123" ,"--jiraFixVersion" ,"1.0.0");
      expect(command).rejects.toThrow("jiraUserName and jiraToken is required for get scope by jiraFixVersion");
    });

    it("--scope package-2 --scope package-4", async () => {
      await lernaRun(testDir)("start", "--jiraUserName" ,"123" , "--jiraToken", "111", "--jiraFixVersion" ,"2.0.0");
      const logLines = output.logged().split("\n");
      const packages = [package1, package2, package3, package4, package5]; // all
      console.log('!!!', logLines)
      expect(logLines).toEqual(packages);
    });

  })
});
