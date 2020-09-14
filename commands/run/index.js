"use strict";

const pMap = require("p-map");

const Command = require("@lerna/command");
const npmRunScript = require("@lerna/npm-run-script");
const output = require("@lerna/output");
const Profiler = require("@lerna/profiler");
const timer = require("@lerna/timer");
const runTopologically = require("@lerna/run-topologically");
const ValidationError = require("@lerna/validation-error");
const { getFilteredPackages } = require("@lerna/filter-options");
const { getScopeFromJiraByFixVersion } = require('../../utils')

module.exports = factory;

const toNotLinkedPackageWarnMessage = jiraLabelPattern => ({ key, summary, status, assignee }) => {
  return `Issue ${key} ${summary} (Status: ${status}, Assignee: ${assignee}) has not linked package${jiraLabelPattern ? ` by pattern ${jiraLabelPattern}` : ''}.`
}

const dummyLogger = {
  notice: () => {}
}

function factory(argv) {
  return new RunCommand(argv);
}

function showLinkedIssuesMessage (issues, jiraLabelPattern) {
  const issuesWithoutLabels = issues.filter(({ hasLabelsByPattern }) => !hasLabelsByPattern);

  if (issuesWithoutLabels.length) {
    const text = issuesWithoutLabels.map(toNotLinkedPackageWarnMessage(jiraLabelPattern));
    this.logger.warn('','Issues without label by pattern: ');

    text.forEach(text => {
      this.logger.useColor();
      this.logger.warn('',text)
    });

  } else {
    this.logger.success('','All issues has linked packages!');
  }
};

function needShowOtherOptions() {
  const otherFilterOption =
     this.options.scope
  || this.options.ignore
  || this.options.private
  || this.options.since
  || this.options.excludeDependents
  || this.options.includeDependents
  || this.options.includeDependencies
  || this.options.includeMergedTags;
  return !!otherFilterOption
}

/*
задачи без лейблов
пакеты по джире
пакеты найденные по опциям // this.scope || this.
пакеты на которых запустится

по джире - на которых запустится  = прилинкованы в джире,
  но пакет отсутствует в репозитории или у него отсутствет команда (комманд)

найденные по опциям - по джире = переданы в опциях, но отсутствуют в джира, // this.scope || this.

найденные по опциям - на которых запустится = переданы в опциях,
  но не прилинкованы в джире но отсутствует пакет отсутствует в репозитории или у него отсутствет команда (комманд) //this.scope

*/

class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  async initialize() {
    const { script, npmClient = "npm" } = this.options;

    this.options.log = dummyLogger;
    this.script = script;
    this.args = this.options["--"] || [];
    this.npmClient = npmClient;

    if (!script) {
      throw new ValidationError("ENOSCRIPT", "You must specify a lifecycle script to run");
    }

    // inverted boolean options
    this.bail = this.options.bail !== false;
    this.prefix = this.options.prefix !== false;

    let chain = Promise.resolve();
    const { userName, token, jiraFixVersion, jiraLabelPattern } = this.options;

    let filteredOptions = this.options;
    let filteredPackages = null;
    if (jiraFixVersion) {
      if (!userName || !token) throw Error('UserName and token is required for get scope by jiraFixVersion');

      const allPackages = [...this.packageGraph].map(([name]) => name);
      const { labels, issues } = await getScopeFromJiraByFixVersion({ userName, token, jiraFixVersion, jiraLabelPattern });
      filteredOptions = {
        scope: labels,
        continueIfNoMatch: true,
        log: dummyLogger
      };

      filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, filteredOptions);

      showLinkedIssuesMessage.apply(this, [issues, jiraLabelPattern]);

      this.logger.info('',`Jira linked packages: ` + labels.join(', '));

      const inJiraButNotExists = labels.filter(pkg => !allPackages.includes(pkg));
      if (inJiraButNotExists.length) {
        this.logger.warn('', `Linked packages is not exists in project: %j`, inJiraButNotExists.join(', '))
      }


      const filteredPackagesOtherOpts = await getFilteredPackages(
        this.packageGraph,
        this.execOpts,
        this.options
        );

        if (needShowOtherOptions.call(this)) {
          this.logger.info('','Packages by other options: ' + filteredPackagesOtherOpts.map(({ name }) => name).join(', '))

          const inOtherOptsNotInJira = filteredPackagesOtherOpts
            .map(pkg => pkg.name)
            .filter(pkg => !labels.includes(pkg));

          if (inOtherOptsNotInJira.length) {
            this.logger.warn('', `Packages filtered by other options is not linked in jira: %j`, inOtherOptsNotInJira.join(', '))
          }

      };

      } else {
      filteredPackages = await getFilteredPackages(this.packageGraph, this.execOpts, filteredOptions);
    }




    chain = chain.then(() => {
      this.packagesWithScript =
      script === "env"
      ? filteredPackages
      : filteredPackages.filter(pkg => pkg.scripts && pkg.scripts[script]);
    });


    return chain.then(() => {
      this.count = this.packagesWithScript.length;
      this.packagePlural = this.count === 1 ? "package" : "packages";
      this.joinedCommand = [this.npmClient, "run", this.script].concat(this.args).join(" ");

      if (!this.count) {
        this.logger.success("run", `No packages found with the lifecycle script '${script}'`);

        // still exits zero, aka "ok"
        return false;
      } else {
        this.logger.notice('filter', 'including %j', this.packagesWithScript.map(p => p.name))
      }
    });
  }

  execute() {
    this.logger.info(
      "",
      "Executing command in %d %s: %j",
      this.count,
      this.packagePlural,
      this.joinedCommand
    );

    let chain = Promise.resolve();
    const getElapsed = timer();

    if (this.options.parallel) {
      chain = chain.then(() => this.runScriptInPackagesParallel());
    } else if (this.toposort) {
      chain = chain.then(() => this.runScriptInPackagesTopological());
    } else {
      chain = chain.then(() => this.runScriptInPackagesLexical());
    }

    if (this.bail) {
      // only the first error is caught
      chain = chain.catch(err => {
        process.exitCode = err.code;

        // rethrow to halt chain and log properly
        throw err;
      });
    } else {
      // detect error (if any) from collected results
      chain = chain.then(results => {
        /* istanbul ignore else */
        if (results.some(result => result.failed)) {
          // propagate "highest" error code, it's probably the most useful
          const codes = results.filter(result => result.failed).map(result => result.code);
          const exitCode = Math.max(...codes, 1);

          this.logger.error("", "Received non-zero exit code %d during execution", exitCode);
          process.exitCode = exitCode;
        }
      });
    }

    return chain.then(() => {
      this.logger.success(
        "run",
        "Ran npm script '%s' in %d %s in %ss:",
        this.script,
        this.count,
        this.packagePlural,
        (getElapsed() / 1000).toFixed(1)
      );
      this.logger.success("", this.packagesWithScript.map(pkg => `- ${pkg.name}`).join("\n"));
    });
  }

  getOpts(pkg) {
    // these options are NOT passed directly to execa, they are composed in npm-run-script
    return {
      args: this.args,
      npmClient: this.npmClient,
      prefix: this.prefix,
      reject: this.bail,
      pkg,
    };
  }

  getRunner() {
    return this.options.stream
      ? pkg => this.runScriptInPackageStreaming(pkg)
      : pkg => this.runScriptInPackageCapturing(pkg);
  }

  runScriptInPackagesTopological() {
    let profiler;
    let runner;

    if (this.options.profile) {
      profiler = new Profiler({
        concurrency: this.concurrency,
        log: this.logger,
        outputDirectory: this.options.profileLocation,
      });

      const callback = this.getRunner();
      runner = pkg => profiler.run(() => callback(pkg), pkg.name);
    } else {
      runner = this.getRunner();
    }

    let chain = runTopologically(this.packagesWithScript, runner, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
    });

    if (profiler) {
      chain = chain.then(results => profiler.output().then(() => results));
    }

    return chain;
  }

  runScriptInPackagesParallel() {
    return pMap(this.packagesWithScript, pkg => this.runScriptInPackageStreaming(pkg));
  }

  runScriptInPackagesLexical() {
    return pMap(this.packagesWithScript, this.getRunner(), { concurrency: this.concurrency });
  }

  runScriptInPackageStreaming(pkg) {
    return npmRunScript.stream(this.script, this.getOpts(pkg));
  }

  runScriptInPackageCapturing(pkg) {
    const getElapsed = timer();
    return npmRunScript(this.script, this.getOpts(pkg)).then(result => {
      this.logger.info(
        "run",
        "Ran npm script '%s' in '%s' in %ss:",
        this.script,
        pkg.name,
        (getElapsed() / 1000).toFixed(1)
      );
      output(result.stdout);

      return result;
    });
  }
}

module.exports.RunCommand = RunCommand;
