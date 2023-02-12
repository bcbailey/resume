import YAML from 'yaml';
import { readFile, writeFile } from 'node:fs/promises';
import ejs from 'ejs';
import wordwrap from 'word-wrap';
import lodash from 'lodash';

// Formats:
// 
// json (JSON.stringify)
// txt (rendered from EJS template)
// html (rendered from EJS template, including screen and print stylesheets)
//      https://www.npmjs.com/package/textr or smartypants or retext
// pdf (render html in headless browser and then export to pdf with print stylesheet)
//      see: https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/

// Map of format to render function
const renderers = new Map([
  [ 'json', { fn: renderJson } ],
  [ 'txt',  { fn: renderText } ],
  [ 'md',   { fn: renderText } ],
  [ 'html', { fn: renderHtml, file: 'index.html' } ],
  [ 'pdf',  { fn: renderPdf } ]
]);

// Template helpers
const helpers = {
  _: lodash,
  wordwrap
};

async function main() {
  // Read and parse YAML data
  const content = await readFile('resume.yaml', 'utf8');
  const data = YAML.parse(content);

  try {
    renderers.forEach(async (renderer, type) => {
      const file = renderer.file || `resume.${type}`;
      const output = await render(type, renderer.fn, data);
      await write(file, output);
    });
  }
  catch (err) {
    console.error(err.message);
  }
}

async function render(type, fn, data) {
  let content;
  try {
    content = await fn(data);
  }
  catch (err) {
    throw new Error(`Error rendering ${type}: ${err.message}`);
  }

  return content;
}

async function write(file, content) {
  try {
    await writeFile(file, content);
  }
  catch (err) {
    throw new Error(`Error writing ${file}: ${err.message}`);
  }
}

async function renderTemplate(file, data, opts={}) {
  const template = await readFile(file, 'utf8');
  const output = ejs.render(template, {
      ...helpers,
      ...data
    },
    {
      root: process.cwd(),
      filename: file
    });

  return output;
}

async function renderJson(data) {
  return JSON.stringify(data, null, 2);
}

async function renderText(data) {
  return renderTemplate('text.ejs', data);
}

async function renderHtml(data) {
  return renderTemplate('html.ejs', data);
}

async function renderPdf(data) {
  // Make sure resume.html exists first
  return 'Not implemented yet';
}

main();