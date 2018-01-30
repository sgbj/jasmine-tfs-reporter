var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var trx = require('./trx');

function TfsReporter(options) {

    var specTimes = {};
    var testResults;
    var currentSuite = '';
    var outputDir = options && options.outputDir ? options.outputDir : 'testresults';
    var outputFile = options && options.outputFile ? options.outputFile : 'testresults_${date}.xml';

    this.jasmineStarted = function (info) {
        testResults = {
            name: path.join(outputDir, outputFile.replace('${date}', new Date().toISOString().replace(/:/g, ''))),
            agent: {},
            specs: []
        };
    };

    this.suiteStarted = function (suite) {
        currentSuite = suite.fullName;
    };
    this.specStarted = function (spec) {
        specTimes[spec.id] = { start: new Date() };
    };
    this.specDone = function (spec) {
        var now = Date.now();
        var duration = (now - specTimes[spec.id].start)/1000;
        testResults.specs.push({
            id: spec.id,
            suite: currentSuite,
            description: spec.description,
            start: specTimes[spec.id].start,
            finish: new Date(now),
            time: duration,
            outcome: spec.status == 'passed' ? 'Passed' :
                spec.status == 'failed' ? 'Failed' :
                'NotExecuted',
            message: spec.failedExpectations.length > 0 ? 
                spec.failedExpectations.map(e => e.message).join('\n') : 
                spec.pendingReason,
            stackTrace: spec.failedExpectations.map(e => e.stack).join('\n')
        });
    };

    this.jasmineDone = function () {
        mkpath.sync(outputDir);
        fs.writeFileSync(testResults.name, trx(testResults));
    };
}

module.exports = TfsReporter;
