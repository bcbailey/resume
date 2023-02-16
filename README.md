# My Resume

This repo contains the scripts used to generate all of the formats of my resume
from the `resume.yaml` file.

https://memoryleak.org/resume/

## Validating

```sh
npm test
```

This will validate that the `resume.yaml` file is valid and matches the
specified JSON schema.

## Building

```sh
npm run build
```

Running the above command will generate the following:

```
output
├── resume
│   ├── index.html
│   └── resume.css
├── resume.json
├── resume.md
├── resume.pdf
├── resume.txt
└── resume.yaml
```

## Output Formats

The above build script can generate the following file formats using the input
data.

### .txt

### .md

This is a simple text or markdown file format. It is built using the
`templates/text.ejs` template.

### .json

This is a JSON respresentation of the data.

### .yaml

This is the master data format.

### .html

This is an HTML version of the resume. It is built using the
`templates/html.ejs` template file, and anything in the `assets/` directory.

### .pdf

This is the PDF version. It is built by using `puppeteer` to load the HTML in a
headless browser. It then prints it to PDF taking advantage of print
stylesheets.

## Cleanup

```sh
npm run clean
```

This removes any extra build artifacts.