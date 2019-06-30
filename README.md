# Zero Bundler
Zero config bundler for npm package. Support custom `babel config` and `typescript config`.

## Installation
`yarn add zero-bundler --dev`

## Usage
Update your `package.json`:
```json
{
  "source": "./src/index.js", // Entry file
  "main": "dist/index.js", // Output commonjs module
  "modules": "dist/index.m.js", // Output ES module
  "scripts": {
    "build": "zero"
  },
}

```
Then run `yarn build`.
