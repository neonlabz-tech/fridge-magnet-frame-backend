const fs = require('fs');

// Read Jest JSON report
const report = JSON.parse(fs.readFileSync('jest-report.json', 'utf8'));

// 🔥 Severity Logic
function getSeverity(test) {
  const msg = test.failureMessages.join(' ').toLowerCase();

  if (msg.includes('expected 400') || msg.includes('validation')) return 'High';
  if (msg.includes('expected 401') || msg.includes('unauthorized'))
    return 'High';
  if (msg.includes('expected 403') || msg.includes('forbidden')) return 'High';
  if (msg.includes('expected 200') || msg.includes('expected 201'))
    return 'Medium';

  return 'Low';
}

// 🔥 Severity Icon (optional)
function getSeverityIcon(severity) {
  if (severity === 'High') return '🔴';
  if (severity === 'Medium') return '🟠';
  return '🟡';
}

// 🔥 Endpoint Extractor
function getEndpoint(testName) {
  const match = testName.match(/\/auth\/[a-z-]+/);
  return match ? match[0] : 'Unknown';
}

//Table Alignment
function pad(text, width) {
  return text.length >= width
    ? text.slice(0, width)
    : text + ' '.repeat(width - text.length);
}

let bugReport = `
BUG REPORT — AUTO GENERATED
Project: Auth System

========================================
`;

let summaryTable = `
📊 SUMMARY TABLE

${'-'.repeat(22)}${'-'.repeat(62)}${'-'.repeat(16)}
| ${pad('Endpoint', 20)} | ${pad('Issue', 60)} | ${pad('Severity', 10)} |
|${'-'.repeat(22)}|${'-'.repeat(62)}|${'-'.repeat(12)}|
`;

let bugCount = 0;

// Loop through failed tests
report.testResults.forEach((suite) => {
  suite.assertionResults.forEach((test) => {
    if (test.status === 'failed') {
      bugCount++;

      const severity = getSeverity(test);
      const icon = getSeverityIcon(severity);
      const endpoint = getEndpoint(test.fullName);

      // Clean error message
      const cleanMsg = test.failureMessages
        .join(' ')
        .replace(/\u001b\[.*?m/g, '')
        .split('\n')[0];

      // 🔴 Detailed Bug Section
      bugReport += `
${icon} Bug #${bugCount}

Test Case:
${test.fullName}

Endpoint:
${endpoint}

Severity:
${severity}

❌ Issue:
${cleanMsg}

📌 Expected:
API should return correct response as per test case

⚠️ Actual:
Test failed (unexpected behavior)

----------------------------------------
`;

      // 📊 Summary Table Row
      //summaryTable += `| ${endpoint} | ${cleanMsg} | ${icon} ${severity} |\n`;
      const col1 = pad(endpoint, 20);
      const col2 = pad(cleanMsg, 60);
      const col3 = pad(`${icon} ${severity}`, 10);

      summaryTable += `| ${col1} | ${col2} | ${col3} |\n`;
    }
  });
});

// Final Output
bugReport += `
========================================
Total Bugs Found: ${bugCount}
========================================

${summaryTable}
`;

// Write file
fs.writeFileSync('bug-report.txt', bugReport);

console.log('✅ Bug report with summary table generated!');
