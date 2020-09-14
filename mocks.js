// node core/lerna/cli  run build --userName sergeyb@xcritical.software --token Ut20Kw46oZj3835hsKIu4562 --jiraFixVersion CrmFrontReact-1.1.70  --jiraLabelPattern @crm-front/*
const starter = `node core/lerna/cli run `;

const execa = require('execa');
const log = require('npmlog')

const toArg = (key, value) => {
  if (!value) return `--${key}`;
  return `--${key} ${value}`;
}
const withStarter = str => starter + str;


const package1 = 'package-1';
const package2 = 'package-2';
const package3 = 'package-3';
const package4 = 'package-4';
const package5 = 'package-5';

const myUserName = `sergeyb@xcritical.software`;
const myToken = `Ut20Kw46oZj3835hsKIu4562`;
const defaultJiraFixVersion = `CrmFrontReact-1.1.70`;
const defaultJiraLabelPattern = `@crm-front/*`;


const createCommand = (command, args = {}) => {
  return withStarter(`${command} ${ Object.entries(args).map(([key, value]) => toArg(key, value)).join(' ') }`)
};

const getJiraReleaseArgs = {
  userName: myUserName,
  token: myToken,
  jiraFixVersion: defaultJiraFixVersion,
  jiraLabelPattern: defaultJiraLabelPattern
}


const command = createCommand('start', getJiraReleaseArgs);

(async () => {
  try {
    log.info('started command: ', command)
    const { stderr } = await execa(command);
    log.error(stderr)
  } catch (error) {
    console.log(error)
  }
})()
