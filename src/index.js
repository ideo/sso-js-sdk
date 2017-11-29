import OktaSignIn from '@okta/okta-signin-widget';
import OktaAuth from '@okta/okta-auth-js/jquery';
import uuidv4 from 'uuid/v4';

import 'index.scss';

class IdeoSSO {
  get oktaAuth() {
    return this._oktaAuth || this._setupOktaAuth();
  }

  get oktaSignIn() {
    return this._oktaSignIn || this._setupOktaSignIn();
  }

  get oktaBaseUrl() {
    return this._env === 'production' ? 'https://dev-744644.oktapreview.com' : '';
  }

  init(opts = {}) {
    this._env = opts.env || 'production';
    this._client = opts.client;
    this._redirect = opts.redirect;
    this._setupStateCookie();
  }

  renderSignIn(selector) {
    this.oktaSignIn.renderEl(
      {el: selector || '#osw-container'},
      res => { // Success
        // The properties in the response object depend on two factors:
        // 1. The type of authentication flow that has just completed, determined by res.status
        // 2. What type of token the widget is returning

        // The user has started the password recovery flow, and is on the confirmation
        // screen letting them know that an email is on the way.
        if (res.status === 'FORGOT_PASSWORD_EMAIL_SENT') {
          // Any followup action you want to take
          return;
        }

        // The user has started the unlock account flow, and is on the confirmation
        // screen letting them know that an email is on the way.
        if (res.status === 'UNLOCK_ACCOUNT_EMAIL_SENT') {
          // Any followup action you want to take
          return;
        }

        // The user has successfully completed the authentication flow
        if (res.status === 'SUCCESS') {
          // OIDC response

          // If the widget is configured for OIDC with a single responseType, the
          // response will be the token.
          // i.e. authParams.responseType = 'id_token':
          // console.log(res);
          // console.log(res.claims);
          this.oktaSignIn.tokenManager.add('my_id_token', res);

          // If the widget is configured for OIDC with multiple responseTypes, the
          // response will be an array of tokens:
          // i.e. authParams.responseType = ['id_token', 'token']
          // signIn.tokenManager.add('my_id_token', res[0]);
          // signIn.tokenManager.add('my_access_token', res[1]);
        }
      },
      err => { // Error
        // The widget will handle most types of errors - for example, if the user
        // enters an invalid password or there are issues authenticating.
        //
        // This function is invoked with errors the widget cannot recover from:
        // 1. Known errors: CONFIG_ERROR, UNSUPPORTED_BROWSER_ERROR, OAUTH_ERROR
        // 2. Uncaught exceptions
        console.warn(err);
      }
    );
  }

  logout(redirect = null) {
    return new Promise(resolve => {
      this.oktaAuth.signOut().finally(() => {
        if (redirect) {
          window.location.href = redirect;
        }
        resolve();
      });
    });
  }

  reviveSession() {
    return new Promise((resolve, reject) => {
      this.oktaAuth.session.get().then(res => {
        if (res.status !== 'ACTIVE') {
          return reject(new Error('Not logged in'));
        }
        this.oktaAuth.token.getWithoutPrompt().then(data => {
          // TODO: nonce
          window.location.href = 'https://dev-744644.oktapreview.com/oauth2/v1/authorize?client_id=' +
            this._client + '&response_type=code&scope=openid+email&prompt=none' +
            '&redirect_uri=' + encodeURIComponent(this._redirect) +
            '&state=' + encodeURIComponent(this._state) + '&nonce=TODOn-0S6_WzA2Mj';
          return data;
        }).catch(() => {
          this.oktaAuth.session.close();
          return reject(new Error('Not logged in'));
        });
      }).catch(err => {
        // Not logged in
        console.info('Not logged in:', err);
        return reject(new Error('Not logged in'));
      });
    });
  }

  _setupOktaAuth() {
    this._oktaAuth = new OktaAuth({
      url: this.oktaBaseUrl,
      clientId: this._client,
      redirectUri: this._redirect,
      responseType: 'code',
      state: this._state
    });

    return this._oktaAuth;
  }

  _setupOktaSignIn() {
    this._oktaSignIn = new OktaSignIn({
      baseUrl: this.oktaBaseUrl,
      authParams: {
        responseType: 'code',
        state: this._state
      },
      registration: {
        // THIS will be fixed later
        // click: () => {
        //   console.log('TODO: Sign Up page');
        //   // TODO: window.location.href = 'https://dev-744644.oktapreview.com/sign-up';
        // }
        parseSchema: (schema, onSuccess, onFailure) => {
          console.log('parseSchema', schema, onSuccess, onFailure);
        },
        preSubmit: (postData, onSuccess, onFailure) => {
          console.log('preSubmit', postData, onSuccess, onFailure);
        },
        postSubmit: (response, onSuccess, onFailure) => {
          console.log('postSubmit', response, onSuccess, onFailure);
        }
      },
      features: {
        registration: true,
        rememberMe: true
      },
      clientId: this._client,
      redirectUri: this._redirect,
      idps: [
        {type: 'GOOGLE', id: '0oacyjisdvanWuodH0h7'},
        {type: 'FACEBOOK', id: '0oad2c6zwsKAF2aEy0h7'}
      ],
      idpDisplay: 'PRIMARY',
      oAuthTimeout: 300000 // 5 minutes
    });

    return this._oktaSignIn;
  }

  _setupStateCookie() {
    this._state = uuidv4();
    const d = new Date();
    d.setTime(d.getTime() + (2 * 60 * 60 * 1000));
    // TODO: https only cookie
    document.cookie = `IdeoSSO-State=${this._state};expires=${d.toUTCString()};path=/`;
  }
}

export default new IdeoSSO();
