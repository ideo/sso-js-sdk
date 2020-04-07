# SSO JavaScript SDK
This repository is the source driving the client-side of IDEO's Network Tool SSO account system.

# Developing the SDK

## Local Setup

1. Use [nvm](https://github.com/creationix/nvm) to ensure consistent node version
2. `npm install`

## Develop

1. `npm start` (will build and then run webpack-dev-server)
2. Scripts will be available for use on http://localhost:9000 (e.g. http://localhost:9000/js/ideo-sso-js-sdk.js)

## Installing
1. `yarn add ideo/sso-js-sdk` or `npm install ideo/sso-js-sdk`
2. or in your `package.json` add `"ideo-sso-js-sdk": "ideo/sso-js-sdk"`, then run `yarn` or `npm install`

## Docs
1. `yarn docs`
2. `open docs/index.html`

## Usage
You'll find [usage instructions in our wiki](https://github.com/ideo/ideo-products/wiki/Integrating-Ideo-SSO).
