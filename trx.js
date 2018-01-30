var uuid = require('node-uuid');
var os = require('os');

function pad(n, width, z) {
  z = z || '0';
  n = Math.abs(Math.floor(n)) + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var toISOString = function(time) {
    var date = new Date(time),
        tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-';
    return date.getFullYear() 
        + '-' + pad(date.getMonth() + 1, 2)
        + '-' + pad(date.getDate(), 2)
        + 'T' + pad(date.getHours(), 2)
        + ':' + pad(date.getMinutes(), 2) 
        + ':' + pad(date.getSeconds(), 2) 
        + '.' + pad(date.getMilliseconds(), 3) + '0000'
        + dif + pad(tzo / 60, 2) 
        + ':' + pad(tzo % 60, 2);
};

var duration = function (start, finish) {
  var diff = finish.getTime() - start.getTime();
  return pad((diff / 1000 / 60 / 60) % 100, 2)
        + ':' + pad((diff / 1000 / 60) % 60, 2) 
        + ':' + pad((diff / 1000) % 60, 2) 
        + '.' + pad(diff % 1000, 3) + '0000';
};

function escape(str) {
  return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
};

module.exports = function (testResults) {
    var start = Math.min.apply(null, testResults.specs.map(spec => spec.start.getTime()));
    var finish = Math.max.apply(null, testResults.specs.map(spec => spec.finish.getTime()));

    var specs = testResults.specs.map(spec => {
        spec.suite = escape(spec.suite);
        spec.description = escape(spec.description);
        return {
            name: `${spec.suite} ${spec.description}`,
            executionId: uuid(),
            testId: uuid(),
            result: spec
        };
    });

    const suites = {};
    testResults.specs.forEach(spec => suites[spec.suite] = uuid());

    var fullOutcome = testResults.specs.some(spec => spec.outcome == 'Failed') ? 'Failed' : 'Completed';
    var passed = testResults.specs.filter(spec => spec.outcome == 'Passed');
    var failed = testResults.specs.filter(spec => spec.outcome == 'Failed');
    var executed = testResults.specs.filter(spec => spec.outcome != 'NotExecuted');
    var notExecuted = testResults.specs.filter(spec => spec.outcome == 'NotExecuted');

    // Am I going to hell for this?
    return `<?xml version="1.0" encoding="UTF-8"?>
<TestRun id="${uuid()}" name="${testResults.name}" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010">
  <Times creation="${toISOString(start)}" start="${toISOString(start)}" finish="${toISOString(finish)}" />
  <Results>
    ${specs.map(spec =>
    `<UnitTestResult executionId="${spec.executionId}" testId="${spec.testId}" testName="${spec.name}" computerName="${os.hostname()}" duration="${duration(spec.result.start, spec.result.finish)}" startTime="${toISOString(spec.result.start)}" endTime="${toISOString(spec.result.finish)}" testType="13cdc9d9-ddb5-4fa4-a97d-d965ccfc6d4b" outcome="${spec.result.outcome}" testListId="${suites[spec.result.suite]}">
      ${spec.result.outcome == 'Failed' ? `<Output>
        <ErrorInfo>
          <Message>${escape(spec.result.message)}</Message>
          <StackTrace>${escape(spec.result.stackTrace)}</StackTrace>
        </ErrorInfo>
      </Output>` : ``}
    </UnitTestResult>
    `).join('')}
  </Results>
  <TestDefinitions>
    ${specs.map(spec =>
    `<UnitTest name="${spec.name}" id="${spec.testId}">
      <Execution id="${spec.executionId}" />
      <TestMethod codeBase="${testResults.name}" className="${spec.result.suite}" name="${spec.name}" />
    </UnitTest>
    `).join('')}
  </TestDefinitions>
  <TestEntries>
    ${specs.map(spec =>
    `<TestEntry testId="${spec.testId}" executionId="${spec.executionId}" testListId="${suites[spec.result.suite]}" />
    `).join('')}
  </TestEntries>
  <TestLists>
    ${Object.keys(suites).map(suite =>
    `<TestList name="${suite}" id="${suites[suite]}" />
    `).join('')}
  </TestLists>
  <ResultSummary outcome="${fullOutcome}">
    <Counters total="${testResults.specs.length}" executed="${executed.length}" passed="${passed.length}" failed="${failed.length}" />
    <Output>
      ${notExecuted.map(spec =>
      `<StdOut>Test '${spec.name}' was skipped in the test run.</StdOut>
      `).join('')}
    </Output>
  </ResultSummary>
</TestRun>`;
};
