# SSO JavaScript SDK

This repository is the source driving the client-side of IDEO's Network Tool SSO account system.

# Using the SDK in your application

## Registration

Register your application by submitting your whitelisted URLs to the IDEO SSO team to retrieve a Client ID.

## Installation

Place in `<head>`:

```html
<link href="https://d3none3dlnlrde.cloudfront.net/1.0/css/ideo-sso-js-sdk.min.css" rel="stylesheet" />
```

Place before `</body>`:

```html
<script type="text/javascript" src="https://d3none3dlnlrde.cloudfront.net/1.0/js/ideo-sso-js-sdk.min.js"></script>
<script type="text/javascript">
  IdeoSSO.init({
    env: 'staging' || 'production',
    client: 'MY_CLIENT_ID',
    redirect: 'https://mysite.com/path/to/callback'
  });
</script>
```

## Usage

You'll find usage instructions in our demo app: (ideo/sso-demo-rails)[https://github.com/ideo/sso-demo-rails]


# Developing the SDK

## Local Setup

1. Use (nvm)[https://github.com/creationix/nvm] to ensure consistent node version
2. `npm install`
3. Configure an AWS profile:

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
npm link
cd /path/to/sso-js-sdk
npm link @okta/okta-signin-widget
```


## Develop

1. `npm start`
2. Scripts will be available for use on http://localhost:9000 (e.g. http://localhost:9000/js/ideo-sso-js-sdk.js)

## Deployment

Build & deploy to the S3 environment:

```
npm run deploy:prod
npm run deploy:stg
```
