import 'babel-polyfill';
import uuidv4 from 'uuid/v4';
import includes from 'lodash/includes';
import merge from 'lodash/merge';
import Cookies from 'js-cookie';
import nanoajax from 'nanoajax';
import promiseFinallyShim from 'promise.prototype.finally';

import SSOAppRoutes from 'sso_app_routes';

promiseFinallyShim.shim();

/** Class representing IdeoSSO js SDK */
class IdeoSSO {
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

  /**
   * @returns {string} the env provided during init
   */
  get env() {
    return this.opts.env || 'production';
  }

  /**
   * @returns {string} the ssoHostname provided during init
   */
  get ssoHostname() {
    return this.opts.ssoHostname;
  }

  /**
   * @returns {string} where users can log in
   */
  get signInUrl() {
    return this._routes.signInUrl;
  }

  /**
   * @returns {string} where users can register for a new account
   */
  get signUpUrl() {
    return this._routes.signUpUrl;
  }

  /**
   * @returns {string} the profile page & settings URL
   */
  get profileUrl() {
    return this._routes.profileUrl;
  }

  get baseApiUrl() {
    return this._routes.baseApiUrl;
  }

  /**
   * Legacy method
   *
   * @see {@link profileUrl}
   * @returns the profile page & settings URL
   */
  getSettingsUrl() {
    return this.profileUrl;
  }

  /**
   * Redirect a user to the SSO sign up page.
   * An authenticated user will be returned to your callback URL per the oAuth flow.
   * If you'd like to ensure the user is logged out (if they had a session), use IdeoSSO.logout() first, which returns a promise.
   *
   * @param {object} signUpParams sign up params
   * @param {string} signUpParams.email - address that you'd like to pre-populate the form with
   * @param {string} signUpParams.token - Network tool's generated invitation token
   * @param {string} signUpParams.confirmationRedirectUri - where the client will be redirected to after confirmation
   */
  signUp({email = null, token = null, confirmationRedirectUri = null} = {}) {
    window.location.href = `${this._routes.signUpUrl}${this._oauthQueryParams({
      email,
      token,
      confirmationRedirectUri
    })}`;
  }

  /**
   * Redirect a user into the network tool's authorization flow.
   * An authenticated user will be returned to your callback URL per the oAuth flow.
   *
   * @param {object} signInParams sign in params
   * @param {string} signInParams.email - address that you'd like to pre-populate the form with
   * @param {string} signInParams.confirmationRedirectUri - where the client will be redirected to after confirmation
   */
  signIn({email = null, confirmationRedirectUri = null} = {}) {
    window.location.href = this._authorizeUrl({email, confirmationRedirectUri});
  }

  /**
   * Redirect a user into the network tool's authorization flow.
   * An authenticated user will be returned to your callback URL per the oAuth flow.
   *
   * @param {string} redirect where the client will be redirected to logging out
   * @returns {Promise} Promise object with call to destroy user session
   */
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

  /**
   * Get a JSON representation of the currently-logged in user
   *
   * @returns {Promise} Promise object with call to get user info
   */
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
