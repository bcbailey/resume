import { readFile } from 'node:fs/promises';
import YAML from 'yaml';
import Ajv from 'ajv';

async function main() {
  // 1. First load the YAML file and make sure it can be read and parsed
  let content, data;
  try {
    content = await readFile('resume.yaml', 'utf8');
    data = YAML.parse(content);
  } catch (err) {
    console.error('Error parsing YAML: ' + err);
    process.exitCode = 1;
    return;
  }

  // 2. Then run schema validation against it
  const schema = JSON.parse(await readFile('./schema.json', 'utf8'));
  const ajv = new Ajv();
  const valid = ajv.validate(schema, data);
  if (!valid) {
    console.log('YAML has the following schema errors:');
    console.log(ajv.errors);
    process.exitCode = 1;
    return;
  }
}

main();