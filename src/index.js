import 'babel-polyfill';
import uuidv4 from 'uuid/v4';
import merge from 'lodash/merge';
import Cookies from 'js-cookie';
import * as jQuery from 'jquery';
import promiseFinallyShim from 'promise.prototype.finally';

import SSOAppRoutes from 'sso_app_routes';

const $ = jQuery.noConflict();
promiseFinallyShim.shim();

class IdeoSSO {
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

  get env() {
    return this.opts.env || 'production';
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

  signUp(email = null) {
    window.location.href = `${this._routes.signUpUrl}${this._oauthQueryParams(email)}`;
  }

  signIn(email = null) {
    window.location.href = this._authorizeUrl(email);
  }

  logout(redirect = null) {
    return new Promise((resolve, reject) => {
      // Logout SSO Profile app
      $.ajax({
        url: this._routes.logoutUrl,
        cors: true,
        withCredentials: true,
        method: 'GET'
      }).then(() => {
        console.log('got here', redirect);
        if (redirect) {
          window.location.href = redirect;
        }
        resolve();
      }, err => {
        reject(err);
      });
    });
  }

  getUserInfo() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: this._routes.userUrl,
        dataType: 'json',
        cors: true,
        withCredentials: true,
        method: 'GET',
        async: false
      }).then(data => {
        resolve(data);
      }, err => {
        reject(err);
      });
    });
  }

  // Private
  get _routes() {
    if (!this._ssoRoutesInstance) {
      SSOAppRoutes.init(this.env);
      this._ssoRoutesInstance = SSOAppRoutes;
    }
    return this._ssoRoutesInstance;
  }

  _authorizeUrl(email = null) {
    return `${this._routes.authorizeUrl}${this._oauthQueryParams(email)}`;
  }

  _oauthQueryParams(email) {
    let url = `?client_id=${this.opts.client}` +
              `&redirect_uri=${encodeURIComponent(this.opts.redirect)}` +
              `&response_type=code` +
              `&state=${encodeURIComponent(this.opts.state)}`;
    if (email) {
      url += `&email=${encodeURIComponent(email)}`;
    }
    return url;
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

  _hoursFromNow(numHours) {
    const d = new Date();
    return d.setTime(d.getTime() + (numHours * 60 * 60 * 1000));
  }
}

export default new IdeoSSO();
