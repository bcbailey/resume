import { readFile, writeFile, stat as statFile } from 'node:fs/promises';
import path from 'path';
import YAML from 'yaml';
import ejs from 'ejs';
import wordwrap from 'word-wrap';
import lodash from 'lodash';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(process.argv[1]);
const outputDirectory = process.argv[2] || 'output';
const templateDirectory = 'templates';

// Map of format to render function
const renderers = new Map([
  [ 'json', { fn: renderJson } ],
  [ 'txt',  { fn: renderText } ],
  [ 'md',   { fn: renderText } ],
  [ 'html', { fn: renderHtml, file: 'resume/index.html' } ],
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

  for (const [ type, renderer ] of renderers.entries()) {
    const { fn, file = `resume.${type}` } = renderer;

    try {
      console.log(`Rendering ${type}...`);
      const output = await render(type, fn, data);
      await write(path.join(outputDirectory, file), output);
    }
    catch (err) {
      console.error(err.message);
    }
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
  const template = await readFile(path.join(templateDirectory, file), 'utf8');
  const output = ejs.render(template, {
      ...helpers,
      ...data
    },
    {
      root: __dirname,
      views: [ path.join(__dirname, templateDirectory) ],
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
  const htmlPath = path.join(__dirname, outputDirectory, renderers.get('html').file);
  try {
    await statFile(htmlPath);
  }
  catch (err) {
    throw new Error('index.html not found');
  }

  // Navigate to the page with a headless browser and take a PDF capture of it
  // This uses the print stylesheet when creating the PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'load' });
  const pdf = await page.pdf({ format: 'Letter' });
  await browser.close();

  return pdf;
}

main();