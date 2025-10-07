// Resume build script by Bradley C Bailey
// Copyright 2023-2025
import { readFile, writeFile, stat as statFile } from 'node:fs/promises';
import path from 'path';
import YAML from 'yaml';
import ejs from 'ejs';
import lodash from 'lodash';
import wordwrap from 'word-wrap';
import puppeteer from 'puppeteer';
import { micromark } from 'micromark';

const __dirname = path.dirname(process.argv[1]);
const outputDirectory = process.argv[2] || 'output';
const templateDirectory = 'templates';

// Map of format to render function
const formats = new Map([
  [ 'json', { fn: renderJson } ],
  [ 'txt',  { fn: renderText } ],
  [ 'md',   { fn: renderText } ],
  [ 'html', { fn: renderHtml, file: 'resume/index.html' } ],
  [ 'pdf',  { fn: renderPdf } ]
]);

// Template helpers
const helpers = {
  _: lodash,
  wordwrap,
  markdown: (text) => {
    // Anything more complicated will need require switching over to remark with smartypants
    return micromark(text).replace(/-{2,3}/g, '—')
  }
};

async function main() {
  // Read and parse YAML data
  const content = await readFile('resume.yaml', 'utf8');
  const data = YAML.parse(content);

  // Trim down work history
  data.experience = data.experience.slice(0, 7);

  // Render it as the different formats
  for (const [ type, format ] of formats.entries()) {
    const file = format.file || `resume.${type}`;
    console.log(`Rendering ${type}...`);
    try {
      const output = await format.fn({ format: type, ...data });
      await writeFile(path.join(outputDirectory, file), output);
    }
    catch (err) {
      console.error('ERROR: ' + err.message);
    }
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
      filename: file,
      ...opts
    });

  return output;
}

async function renderJson(data) {
  return JSON.stringify(data, null, 2);
}

async function renderText(data) {
  return await renderTemplate('text.ejs', data);
}

async function renderHtml(data) {
  return await renderTemplate('html.ejs', data);
}

async function renderPdf() {
  // Make sure html file exists first
  const htmlFormat = formats.get('html') || { file: 'resume/index.html' };
  const htmlPath = path.join(__dirname, outputDirectory, htmlFormat.file);
  try {
    await statFile(htmlPath);
  }
  catch (err) {
    throw new Error(`dependency ${htmlFormat.file} not found`);
  }

  // Navigate to the page with a headless browser and take a PDF capture of it
  // This uses the print stylesheet when creating the PDF.
  //
  // https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.page.md
  // https://blog.risingstack.com/pdf-from-html-node-js-puppeteer/
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'Letter' });
  await browser.close();

  return pdf;
}

main();
