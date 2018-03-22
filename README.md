# SSO JavaScript SDK

This repository is the source driving the client-side of IDEO's Network Tool SSO account system.

You'll find [usage instructions in our wiki](https://github.com/ideo/ideo-products/wiki/Ideo-SSO#2-add-the-js-sdk).

# Developing the SDK

## Local Setup

1. Use (nvm)[https://github.com/creationix/nvm] to ensure consistent node version
2. `npm install`
3. Install (AWS CLI)[https://aws.amazon.com/cli/]
  - Option 1: using (pip)[https://pip.readthedocs.io/en/stable/installing/]. If you see the `Uninstalling a distutils installed project (six) has been deprecated` error, you can try running the install with these flags: `pip install awsebcli --upgrade --ignore-installed six`
  - Option 2: using brew: `brew install awscli`

4. Configure an AWS profile after provisioning the profile in IAM:
```
aws configure --profile ideo-sso
  AWS Access Key ID [None]: *****
  AWS Secret Access Key [None]: *****
  Default region name [None]: us-west-2
  Default output format [None]: text
```

4. Grab the latest from our [signin widget fork](https://github.com/ideo/okta-signin-widget)
5. Link the fork locally
```
cd /path/to/okta-signin-widget
npm run build:release
npm link
cd /path/to/sso-js-sdk
npm link @okta/okta-signin-widget
```

## Develop

1. `npm start` (will build and then run webpack-dev-server)
2. Scripts will be available for use on http://localhost:9000 (e.g. http://localhost:9000/js/ideo-sso-js-sdk.js)

## Deployment

Build & deploy to the S3 environment:

```
npm run deploy:prod
npm run deploy:stg
```
