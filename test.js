import YAML from 'yaml';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    phone: { type: 'string' },
    email: { type: 'string' },
    address: { type: 'string' },
    url: { type: 'string' },
    introduction: { type: 'string' },

    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          location: { type: 'string' },
          url: { type: 'string' },
          dates: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' }
            },
            required: [ 'start' ],
            additionalProperties: false
          },
          description: { type: 'string' },
        },
        required: [ 'title', 'company', 'dates' ],
        additionalProperties: false
      }
    },

    skills: {
      type: 'array',
      anyOf: [
        {
          items: { type: 'string' }
        },
        {
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: {
                type: 'array',
                items: { type: 'string' }
              },
            },
            required: [ 'items' ],
            additionalProperties: false
          }
        }
      ]
    },

    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          school: { type: 'string' },
          location: { type: 'string' },
          url: { type: 'string' },
          dates: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' }
            },
            required: [ 'start' ],
            additionalProperties: false
          },
          description: { type: 'string' },
        },
        required: [ 'title', 'school', 'dates' ],
        additionalProperties: false
      }
    },

    references: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  required: [
    'name',
    'phone',
    'email',
    'introduction',
    'experience',
    'skills'
  ],
  additionalProperties: false
};

async function main() {
  let content;
  let data;

  // 1. First load the YAML file and make sure it can be read and parsed
  try {
    content = await readFile('resume.yaml', 'utf8');
    data = YAML.parse(content);
  } catch (err) {
    console.error('Error parsing YAML: ' + err);
    process.exit(1);
  }

  // 2. Then run schema validation against it
  const ajv = new Ajv();
  const valid = ajv.validate(schema, data);
  if (!valid) {
    console.log('YAML has the following schema errors:');
    console.log(ajv.errors);
    process.exit(1);
  }
}

main();