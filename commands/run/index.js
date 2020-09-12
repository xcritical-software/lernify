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
const { getScopeFromJiraByFixVersion, toArray } = require('../../utils')

module.exports = factory;

const coloredStatus = test => test;
const toNotLinkedPackageWarnMessage = jiraLabelPattern => ({ key, summary, status, assignee }) => {
  return `Issue ${key} ${summary} (Status: ${coloredStatus(status)}, Assignee: ${assignee}) has not linked package${jiraLabelPattern ? ` by pattern ${jiraLabelPattern}` : ''}.`
}

function factory(argv) {
  return new RunCommand(argv);
}

class RunCommand extends Command {
  get requiresGit() {
    return false;
  }

  async initialize() {
    const { script, npmClient = "npm" } = this.options;

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
    console.log(jiraFixVersion)
    if (jiraFixVersion && (!userName || !token)) {
      throw Error('UserName and token is required for get scope by jiraFixVersion');
    };
    
    let filteredOptions = this.options;

    if (jiraFixVersion) {
      const { labels, issues } = await getScopeFromJiraByFixVersion({ userName, token, jiraFixVersion, jiraLabelPattern });
      labels.push('package-3', 'package-5')
      filteredOptions = { 
        scope: labels,
        continueIfNoMatch: true
      };

      console.log(`Jira linked packages: `, labels.join(', '));

      const issuesWithoutLabels = issues.filter(({ hasLabelsByPattern }) => !hasLabelsByPattern);

      if (issuesWithoutLabels.length) {
        const text = issuesWithoutLabels.map(toNotLinkedPackageWarnMessage(jiraLabelPattern)).join('\n\r');
        console.log(text);
      } else {
        console.log('All issues has linked packages!')
      }
      console.log('!!!labels', labels);
      // TODO посмотреть где выводятся сообщения внутри filteredOptions, их желательно убрать
      const filteredPackagesJira = await getFilteredPackages(this.packageGraph, this.execOpts, filteredOptions);
      console.log('!!!74filteredPackagesJira', filteredPackagesJira)
      // тут у нас те которые получилось найти в репозитории, из тех что пришли с джиры. если есть разница - вывести разницу (в репозитории отсутствуют пакеты: ), иначе сказать что все пакеты присутствуют в репозитории
      /* показать разницу между пакетами из jira (labels) и между тем что есть в проекте (filteredPackagesJira) */

      
      const filteredPackagesOptions = await getFilteredPackages(this.packageGraph, this.execOpts, this.options)
      console.log('!!!filteredPackagesOptions', filteredPackagesOptions)
      // тут у нас пакеты которые по опциям остальным. если есть разница с теми что пришло в jira - показать(в jira не прилинкованы пакеты: ), иначе сказать что пакеты по остальным опциям соответствуют тем что в jira прилинкованы 
      // показать разницу между пакетами из jira (labels) и тем что получилось после фильтра по опциям (filteredPackagesOptions)


      /*
      вывести 3 списка
      command ${script} will be run at ${filteredPackagesJira}
      linked packages: ${labels}
      filtered by other props: ${filteredPackagesOptions}
      */

    }
    
    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, filteredOptions));
    chain = chain.then(filteredPackages => {
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
