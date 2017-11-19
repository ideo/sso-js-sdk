# SSO JavaScript SDK

This repository is the source driving the client-side of IDEO's Network Tool SSO account system.

# Using the SDK in your application

## Registration

Register your application by submitting your whitelisted URLs to the IDEO SSO team to retrieve a Client ID.

## Installation

> **TODO:** Move URLs to CDN / IDEO domain

Place in `<head>`:

```html
<link href="https://s3-us-west-2.amazonaws.com/ideo-sso-temp/1.0/css/ideo-sso-js-sdk.min.css" rel="stylesheet" />
```

Place before `</body>`:

```html
<script type="text/javascript" src="https://s3-us-west-2.amazonaws.com/ideo-sso-temp/1.0/js/ideo-sso-js-sdk.min.js"></script>
<script type="text/javascript">
  IdeoSSO.init({
    env: 'staging' || 'production',
    client: 'MY_CLIENT_ID',
    redirect: 'https://mysite.com/path/to/callback'
  });
</script>
```

## Usage

> **TODO:** Document the typical usage & public methods of the SDK


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

## Develop

1. `npm start`
2. Scripts will be available for use on http://localhost:9000 (e.g. http://localhost:9000/js/ideo-sso-js-sdk.js)

## Deployment

> **TODO:** Move to permanent S3 Bucket w/ CloudFront


Build & deploy to a temporary S3 bucket using temporary credentials:

```
npm run deploy
```
