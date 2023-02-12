import { readFile, writeFile, stat as statFile } from 'node:fs/promises';
import YAML from 'yaml';
import ejs from 'ejs';
import wordwrap from 'word-wrap';
import lodash from 'lodash';
import puppeteer from 'puppeteer';

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
      console.log(`Rendering ${type}...`);
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

// https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.page.md
// https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/
async function renderPdf(data) {
  // Make sure html file exists first
  const exists = await statFile('index.html');
  if (!exists) {
    throw new Error('Unable to render PDF: index.html not found');
  }

  // Navigate to the page with a headless browser and take a PDF capture of it
  // This uses the print stylesheet when creating the PDF
  const resume = 'file://' + process.cwd() + '/index.html';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(resume, { waitUntil: 'load' });
  const pdf = await page.pdf({ format: 'Letter' });
  await browser.close();

  return pdf;
}

main();