const { HtmlValidate, FileSystemConfigLoader } = require('html-validate');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT } = require('./helpers');

test.describe('html-validate', function () {
  test.skip(function ({ browserName }) { return browserName !== 'chromium'; }, 'static check, engine independent: run once');

  for (const file of ['index.html', 'page-1.html', 'page-3.html', 'test/fixtures/stress.html']) {
    test(file + ' has 0 errors', async function () {
      const validator = new HtmlValidate(new FileSystemConfigLoader());
      const report = await validator.validateFile(path.join(ROOT, file));
      const messages = report.results.flatMap(function (r) {
        return r.messages.map(function (m) { return m.line + ':' + m.column + ' ' + m.ruleId + ' ' + m.message; });
      });
      expect(messages).toEqual([]);
    });
  }
});
