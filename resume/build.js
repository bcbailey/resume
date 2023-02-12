import YAML from 'yaml';
import { readFile, writeFile } from 'node:fs/promises';
import ejs from 'ejs';
import wordwrap from 'word-wrap';
import lodash from 'lodash';

// Map of format to render function
const renderers = new Map([
  [ 'json', renderJson ],
  [ 'txt',  renderText ],
  [ 'md',   renderText ],
  [ 'html', renderHtml ],
  [ 'pdf',  renderPdf ]
]);

// Template Helpers
const helpers = {
  _: lodash,
  wordwrap
};

// Formats:
// 
// yaml
// json (JSON.stringify)
// txt (rendered from EJS template)
// html (rendered from EJS template, including screen and print stylesheets)
//      https://www.npmjs.com/package/textr or smartypants or retext
// pdf (render html in headless browser and then export to pdf with print stylesheet)
//      see: https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/


// Read in YAML and parse
// 

async function main() {
  const data = await readFile('resume.yaml', 'utf8');
  const parsed = YAML.parse(data);

  try {
    for (let type of renderers.keys()) {
      const content = await render(parsed, type);
      await write(`resume.${type}`, content);
    }
  }
  catch (err) {
    console.error(err.message);
  }
}

async function render(data, format, file) {
  const renderer = renderers.get(format);
  if (!renderer) {
    throw new Error(`No renderer found for ${format} format`);
  }

  let content;
  try {
    content = await renderer(data);
  }
  catch (err) {
    throw new Error(`Error rendering ${format}: ${err.message}`);
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