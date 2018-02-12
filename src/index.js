import OktaSignIn from '@okta/okta-signin-widget';
import OktaAuth from '@okta/okta-auth-js/jquery';
import uuidv4 from 'uuid/v4';
import merge from 'lodash/merge';
import Cookies from 'js-cookie';
import nanoajax from 'nanoajax'; // TODO: Remove nanoajax now that jQuery is required
import * as jQuery from 'jquery';

import 'index.scss';

const $ = jQuery.noConflict();

class IdeoSSO {
  get oktaAuth() {
    return this._oktaAuth || this._setupOktaAuth();
  }

  get oktaSignIn() {
    return this._oktaSignIn || this._setupOktaSignIn();
  }

  get oktaBaseUrl() {
    return this.opts.env === 'production' ? 'https://dev-744644.oktapreview.com' : '';
  }

  get ssoProfileHostname() {
    return 'https://ideo-sso-profile.herokuapp.com';
  }

  // URL used to set a forgot password redirect cookie
  get ssoProfileSetRedirectUrl() {
    return `${this.ssoProfileHostname}/cookies/forgot_password_redirect`;
  }

  get ssoProfileLogoutUrl() {
    return `${this.ssoProfileHostname}/sign_out`;
  }

  get ssoProfileUserMigratedUrl() {
    return `${this.ssoProfileHostname}/api/v1/user_migrations`;
  }

  // Expected params:
  //  env
  //  client
  //  redirect
  //  recoveryToken

  init(opts = {}) {
    this.opts = merge({}, {
      env: 'production'
    }, opts);
    if (!this.opts.state) {
      this._setupStateCookie();
    }
  }

  signIn() {
    window.location.href = `${this.ssoProfileHostname}/oauth?client_id=${this.opts.client}` +
      '&redirect_uri=' + encodeURIComponent(this.opts.redirect) +
      `&state=${this.opts.state}`;
    // '&nonce=n-0S6_WzA2Mj' + // eslint-disable-line
    // `&sessionToken=${res.session.token}`;
  }

  logout(redirect = null) {
    return new Promise(resolve => {
      // Logout OKTA JS
      this.oktaAuth.signOut().finally(() => {
        // Logout SSO Profile app
        nanoajax.ajax({
          url: this.ssoProfileLogoutUrl,
          cors: true,
          withCredentials: true,
          method: 'GET'
        }, () => {
          if (redirect) {
            window.location.href = redirect;
          }
          resolve();
        });
      });
    });
  }

  getSettingsUrl() {
    return `${this.ssoProfileHostname}/profile`;
  }

  _reviveSession() {
    return new Promise((resolve, reject) => {
      this.oktaAuth.session.get().then(res => {
        if (res.status !== 'ACTIVE') {
          return reject(new Error('Not logged in'));
        }
        this.oktaAuth.token.getWithoutPrompt().then(data => {
          window.location.href = 'https://dev-744644.oktapreview.com/oauth2/v1/authorize?client_id=' +
            this.opts.client + '&response_type=code&scope=openid+profile+email&prompt=none' +
            '&redirect_uri=' + encodeURIComponent(this.opts.redirect) +
            '&state=' + encodeURIComponent(this.opts.state);
          // TODO: nonce + '&nonce=TODOn-0S6_WzA2Mj';
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

  _renderSignIn(selector) {
    this.oktaSignIn.renderEl(
      {el: selector || '#osw-container'},
      res => { // Success
        // The properties in the response object depend on two factors:
        // 1. The type of authentication flow that has just completed, determined by res.status
        // 2. What type of token the widget is returning

        // The user has started the password recovery flow, and is on the confirmation
        // screen letting them know that an email is on the way.
        if (res.status === 'FORGOT_PASSWORD_EMAIL_SENT') {
          // Set cookie on SSO Profile app so we know where to
          // redirect user back to from reset password link
          this._saveForgotPasswordRedirect(window.location.href);

          // If the user came in from a migration, we now mark the user as migrated
          this._flagUserAsMigrated();
          return;
        }

        // The user has started the unlock account flow, and is on the confirmation
        // screen letting them know that an email is on the way.
        if (res.status === 'UNLOCK_ACCOUNT_EMAIL_SENT') {
          // Any followup action you want to take
          return;
        }

        // TODO: This was necessary for the "SESSION" authScheme for self-registration
        // The user has successfully completed the authentication flow
        // if (res.status === 'SUCCESS') {
        //   // SESSION response
        //   // res.session.setCookieAndRedirect(this.opts.redirect);
        //   window.location.href = `${this.oktaBaseUrl}/oauth2/v1/authorize?client_id=${this.opts.client}` +
        //     '&response_type=code' +
        //     '&scope=openid+profile+email' +
        //     '&prompt=none' +
        //     '&redirect_uri=' + encodeURIComponent(this.opts.redirect) +
        //     `&state=${this.opts.state}` +
        //     '&nonce=n-0S6_WzA2Mj' +
        //     `&sessionToken=${res.session.token}`;
        // }

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

  _setupOktaAuth() {
    this._oktaAuth = new OktaAuth({
      url: this.oktaBaseUrl,
      clientId: this.opts.client,
      redirectUri: this.opts.redirect,
      responseType: 'code',
      state: this.opts.state
    });

    return this._oktaAuth;
  }

  _setupOktaSignIn() {
    const params = {
      baseUrl: this.oktaBaseUrl,
      authParams: {
        responseType: 'code',
        state: this.opts.state,
        scopes: ['openid', 'email', 'profile']
      },
      features: {
        router: true,
        registration: true,
        rememberMe: true
      },
      clientId: this.opts.client,
      redirectUri: this.opts.redirect,
      processCreds: this._checkMigratedUser.bind(this),
      idps: [
        {type: 'FACEBOOK', id: '0oad2c6zwsKAF2aEy0h7'},
        {type: 'GOOGLE', id: '0oacyjisdvanWuodH0h7'}
      ],
      idpDisplay: 'PRIMARY',
      oAuthTimeout: 300000 // 5 minutes
    };

    if (this.opts.recoveryToken) {
      params.recoveryToken = this.opts.recoveryToken;
    }

    this._oktaSignIn = new OktaSignIn(params);

    return this._oktaSignIn;
  }

  _setupStateCookie() {
    this.opts.state = uuidv4();
    // TODO: https only cookie
    this._setCookie('State', this.opts.state, 2);
  }

  _setCookie(key, value, expiresInHours = 1, domain = null) {
    const opts = {expires: this._hoursFromNow(expiresInHours)};

    if (domain) {
      opts.domain = domain;
    }

    return Cookies.set(`IdeoSSO-${key}`, value, opts);
  }

  _getCookie(key) {
    return Cookies.get(`IdeoSSO-${key}`);
  }

  // Sets cookie so we can redirect user back to the app they used to initiate the password reset
  //
  // Notes:
  // Safari needs a POST request to set a cross-domain cookie.
  // IE8 and IE9 do not support setting cookies in cross-domain requests.

  _saveForgotPasswordRedirect(url) {
    const saveRedirectUrl = `${this.ssoProfileSetRedirectUrl}?url=${encodeURIComponent(url)}`;

    nanoajax.ajax({
      url: saveRedirectUrl,
      cors: true,
      method: 'POST'
    });
  }

  _hoursFromNow(numHours) {
    const d = new Date();
    return d.setTime(d.getTime() + (numHours * 60 * 60 * 1000));
  }

  _flagUserAsMigrated() {
    const email = this._getCookie('MigrationUser');
    if (email) {
      $.ajax(this.ssoProfileUserMigratedUrl, {
        type: 'DELETE',
        data: {email}
      });
    }
  }

  _checkMigratedUser(creds, callback) {
    $.get(this.ssoProfileUserMigratedUrl, {email: creds.username})
      .done((data, status, xhr) => {
        if (xhr.status === 200) {
          $('a.js-forgot-password').trigger('click');
          this._setCookie('MigrationUser', creds.username, 2);
          setTimeout(() => {
            const container = $('.forgot-password .o-form-content');
            container.find('h2.okta-form-title').hide();
            container.find('input[name="username"]').val(creds.username);
            // Have to trigger a user-event on the input so that Okta's validation captures the value change
            container.find('input[name="username"]').trigger($.Event('keydown', {which: 39})); // eslint-disable-line new-cap
            container.prepend([
              $('<h2 class="okta-form-title o-form-head"></h2>').text('HELLO, AGAIN!'),
              $('<p class="fancy-body" align="center"></p>').text('We\'ve made changes to your account, to give you access to other IDEO tools.'),
              $('<p class="fancy-body" align="center"></p>').text('Let\'s do a quick reset of your password, so you can take full advantage of the full power of what we\'re building.')
            ]);
          }, 250);
        } else {
          callback();
        }
      }).fail(() => {
        callback();
      });
  }
}

export default new IdeoSSO();
