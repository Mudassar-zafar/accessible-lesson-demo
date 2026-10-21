/*
  Builds stress.html from index.html: every component twice, the second copy
  with its text tripled, so tests can prove unique IDs, independent instances
  and long-label layout. Run: node test/fixtures/build-stress.js
*/
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const start = html.indexOf('<section class="cnx-section">\n          <h2 id="parts-title">');
const end = html.indexOf('<nav class="cnx-pager"');
if (start < 0 || end < 0) {
  throw new Error('component markers not found in index.html');
}
const components = html.slice(start, end).replace(/ id="[a-z-]+-title"/g, '');

// Triple the text inside text-only elements and attribute values used as names.
function longer(markup) {
  return markup
    .replace(/(<(p|legend|li|span|h3|summary)[^>]*>)([^<]{8,})(<\/\2>)/g, function (m, open, tag, text, close) {
      return open + text + ' ' + text + ' ' + text + close;
    })
    .replace(/data-topic="([^"]+)"/g, 'data-topic="$1, $1, $1"')
    .replace(/data-label="([^"]+)"/g, 'data-label="$1, second copy"');
}

const head = html.slice(0, html.indexOf('<main'))
  .replace(/href="css\//g, 'href="../../css/')
  .replace(/<title>[^<]*<\/title>/, '<title>Stress test: two copies of every component</title>')
  .replace(/href="page-1.html"/g, 'href="../../page-1.html"');
const scripts = html.slice(html.indexOf('<script'), html.indexOf('</body>')).replace(/src="js\//g, 'src="../../js/');

const out = head +
  '<main id="main" tabindex="-1">\n' +
  '        <h1>Stress test: two copies of every component</h1>\n' +
  '        <p>The first copy matches the lesson page. The second copy has three times the text.</p>\n' +
  '        ' + components.replace(/src="assets\//g, 'src="../../assets/') +
  longer(components.replace(/src="assets\//g, 'src="../../assets/')) +
  '</main>\n    </div>\n\n    ' + scripts + '</body>\n</html>\n';

fs.writeFileSync(path.join(__dirname, 'stress.html'), out);
console.log('wrote test/fixtures/stress.html');
