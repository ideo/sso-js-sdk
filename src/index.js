import 'core-js/stable';
import 'regenerator-runtime/runtime';
import uuidv4 from 'uuid/v4';
import includes from 'lodash/includes';
import merge from 'lodash/merge';
import Cookies from 'js-cookie';
import nanoajax from 'nanoajax';
import promiseFinallyShim from 'promise.prototype.finally';

import SSOAppRoutes from 'sso_app_routes';

promiseFinallyShim.shim();

class IdeoSSO {
  // Optional params:
  //  env
  //  client
  //  redirect
  //  recoveryToken
  //  ssoHostname

  init(opts = {}) {
    this.opts = merge(
      {},
      {
        env: 'production'
      },
      opts
    );
    if (!this.opts.state) {
      this._setupStateCookie();
    }
  }

  initFromEnv(env = {}) {
    const {
      IDEO_SSO_HOST,
      IDEO_SSO_CLIENT_ID,
      BASE_HOST,
      IDEO_SSO_REDIRECT_PATH
    } = env;

    let redirect;
    if (BASE_HOST && IDEO_SSO_REDIRECT_PATH) {
      redirect = `${BASE_HOST}${IDEO_SSO_REDIRECT_PATH}`;
    }
    this.init({
      ssoHostname: IDEO_SSO_HOST,
      client: IDEO_SSO_CLIENT_ID,
      redirect
    });
  }

  get env() {
    return this.opts.env || 'production';
  }

  get ssoHostname() {
    return this.opts.ssoHostname;
  }

  get signInUrl() {
    return this._routes.signInUrl;
  }

  get signUpUrl() {
    return this._routes.signUpUrl;
  }

  get profileUrl() {
    return this._routes.profileUrl;
  }

  get baseApiUrl() {
    return this._routes.baseApiUrl;
  }

  // Legacy method that we're still supporting
  getSettingsUrl() {
    return this.profileUrl;
  }

  signUp({email = null, token = null, confirmationRedirectUri = null} = {}) {
    window.location.href = `${this._routes.signUpUrl}${this._oauthQueryParams({
      email,
      token,
      confirmationRedirectUri
    })}`;
  }

  signIn({email = null, confirmationRedirectUri = null} = {}) {
    window.location.href = this._authorizeUrl({email, confirmationRedirectUri});
  }

  logout(redirect = null) {
    return new Promise((resolve, reject) => {
      // Logout SSO Profile app
      nanoajax.ajax(
        {
          url: this._routes.apiUserSessionDestroyUrl,
          method: 'DELETE',
          withCredentials: true,
          cors: true
        },
        (code, response) => {
          if (this._successfulAjaxStatus(code)) {
            if (redirect) {
              window.location.href = redirect;
            }
            resolve();
          } else {
            reject(response);
          }
        }
      );
    });
  }

  getUserInfo() {
    return new Promise((resolve, reject) => {
      nanoajax.ajax(
        {
          url: this._routes.apiUserUrl,
          method: 'GET',
          responseType: 'json',
          withCredentials: true,
          cors: true
        },
        (code, response) => {
          if (this._successfulAjaxStatus(code)) {
            resolve(response);
          } else {
            reject(response);
          }
        }
      );
    });
  }

  // Private
  get _routes() {
    if (!this._ssoRoutesInstance) {
      SSOAppRoutes.init({env: this.env, ssoHostname: this.ssoHostname});
      this._ssoRoutesInstance = SSOAppRoutes;
    }
    return this._ssoRoutesInstance;
  }

  _authorizeUrl(opts = {}) {
    return `${this._routes.authorizeUrl}${this._oauthQueryParams(opts)}`;
  }

  _oauthQueryParams({email, token = null, confirmationRedirectUri = null} = {}) {
    let url =
      `?client_id=${this.opts.client}` +
      `&redirect_uri=${encodeURIComponent(this.opts.redirect)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(this.opts.state)}`;
    if (email) {
      url += `&email=${encodeURIComponent(email)}`;
    }
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    if (confirmationRedirectUri) {
      url += `&confirmation_redirect_uri=${encodeURIComponent(confirmationRedirectUri)}`;
    }
    return url;
  }

  _setupStateCookie() {
    // Check if there is an existing cookie, if so use it.
    if (this._getCookie('State')) {
      this.opts.state = this._getCookie('State');
    } else {
      // Generate new state
      this.opts.state = uuidv4();
      // Save for 1 week
      this._setCookie('State', this.opts.state, 24 * 7);
    }
  }

  get _isHttps() {
    return window.location.protocol === 'https';
  }

  _setCookie(key, value, expiresInHours = 1, domain = null) {
    const opts = {
      expires: this._hoursFromNow(expiresInHours),
      secure: this._isHttps
    };
    if (domain) {
      opts.domain = domain;
    }
    return Cookies.set(`IdeoSSO-${key}`, value, opts);
  }

  _getCookie(key) {
    return Cookies.get(`IdeoSSO-${key}`);
  }

  _hoursFromNow(numHours) {
    const d = new Date();
    const milliseconds = numHours * 60 * 60 * 1000;
    return d.setTime(d.getTime() + milliseconds);
  }

  _successfulAjaxStatus(code) {
    return includes([200, 301, 302], code);
  }
}

export default new IdeoSSO();
