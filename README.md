# jasmine-tfs-reporter
A Jasmine/Protractor plugin for reporting test results to TFS.

## usage

Add the jasmine-tfs-reporter to your project:

```
npm install --save jasmine-tfs-reporter
```

Example protractor.conf.js for adding the reporter to the Angular CLI e2e tests:

```js
// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/docs/referenceConf.js

/*global jasmine */
var SpecReporter = require('jasmine-spec-reporter');
var TfsReporter = require('jasmine-tfs-reporter');

exports.config = {
  allScriptsTimeout: 11000,
  specs: [
    './e2e/**/*.e2e-spec.ts'
  ],
  capabilities: {
    'browserName': 'phantomjs',
    'phantomjs.binary.path': require('phantomjs-prebuilt').path,
    'phantomjs.ghostdriver.cli.args': ['--loglevel=DEBUG']
  },
  directConnect: true,
  baseUrl: 'http://localhost:4200/',
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000,
    print: function() {}
  },
  useAllAngular2AppRoots: true,
  beforeLaunch: function() {
    require('ts-node').register({
      project: 'e2e'
    });
  },
  onPrepare: function() {
    jasmine.getEnv().addReporter(new SpecReporter());
    jasmine.getEnv().addReporter(new TfsReporter());
  }
};
```

Setup the build steps in TFS:

![build-steps](https://cloud.githubusercontent.com/assets/5178445/20040961/d9b691ee-a426-11e6-9be2-266533274269.png)

Git gud code br0.

![test-results](https://cloud.githubusercontent.com/assets/5178445/20040962/daf0cc3c-a426-11e6-8467-82e0699b7fd1.png)
