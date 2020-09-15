"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "run <script>";

exports.describe = "Run an npm script in each package that contains that script";

exports.builder = yargs => {
  yargs
    .example("$0 run build -- --silent", "# `npm run build --silent` in all packages with a build script")
    .parserConfiguration({
      "populate--": true,
    })
    .positional("script", {
      describe: "The npm script to run. Pass flags to send to the npm client after --",
      type: "string",
    })
    .options({
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to run scripts (npm, yarn, pnpm, ...).",
        defaultDescription: "npm",
        type: "string",
        requiresArg: true,
      },
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
      },
      parallel: {
        group: "Command Options:",
        describe: "Run script with unlimited concurrency, streaming prefixed output.",
        type: "boolean",
      },
      "no-bail": {
        group: "Command Options:",
        describe: "Continue running script despite non-zero exit in a given package.",
        type: "boolean",
      },
      bail: {
        // proxy for --no-bail
        hidden: true,
        type: "boolean",
      },
      // This option controls prefix for stream output so that it can be disabled to be friendly
      // to tools like Visual Studio Code to highlight the raw results
      "no-prefix": {
        group: "Command Options:",
        describe: "Do not prefix streaming output.",
        type: "boolean",
      },
      prefix: {
        // proxy for --no-prefix
        hidden: true,
        type: "boolean",
      },
      profile: {
        group: "Command Options:",
        describe: "Profile script executions and output performance profile to default location.",
        type: "boolean",
      },
      "profile-location": {
        group: "Command Options:",
        describe: "Output performance profile to custom location instead of default project root.",
        type: "string",
      },
      jiraFixVersion: {
        describe: "Full name Fix Version from Jira",
        type: "string"
      },
      jiraLabelPattern: {
        describe: 'Pattern for filter labels',
        type: 'string'        
      },
      jiraUserName: {
        describe: 'Jira userName (for get linked labels from jira)',
        type: 'string'
      },
      jiraToken: {
        describe: 'Jira API token (for get linked labels from jira) https://id.atlassian.com/manage-profile/security/api-tokens',
        type: 'string'
      }
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
