import 'babel-polyfill';
import uuidv4 from 'uuid/v4';
import merge from 'lodash/merge';
import Cookies from 'js-cookie';
import * as jQuery from 'jquery';
import promiseFinallyShim from 'promise.prototype.finally';

const $ = jQuery.noConflict();
promiseFinallyShim.shim();

class IdeoSSO {
  get env() {
    return this.opts.env || 'production';
  }

  get hostname() {
    switch (this.env) {
      case 'production': return 'https://profile.ideo.com';
      case 'staging': return 'https://ideo-sso-profile-staging.herokuapp.com';
      case 'local': return 'http://localhost:3000';
      default: return null;
    }
  }

  get logoutUrl() {
    return `${this.hostname}/users/sign_out`;
  }

  get signUpUrl() {
    return `${this.hostname}/users/sign_up`;
  }

  get authorizeUrl() {
    return `${this.hostname}/oauth/authorize`;
  }

  get forgotPasswordUrl() {
    return `${this.hostname}/users/password/new`;
  }

  get settingsUrl() {
    return `${this.hostname}/profile`;
  }

  get baseApiUrl() {
    return `${this.hostname}/api/v1`;
  }

  get userMigratedUrl() {
    return `${this.baseApiUrl}/user_migrations`;
  }

  get userUrl() {
    return `${this.baseApiUrl}/users/me`;
  }

  // Old function name - keep around until fully deprecated
  getSettingsUrl() {
    return this.ssoProfileSettingsUrl;
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

  signUp(email = null) {
    window.location.href = `${this.signUpUrl}${this._oauthQueryParams(email)}`;
  }

  signIn(email = null) {
    window.location.href = this._authorizeUrl(email);
  }

  logout(redirect = null) {
    return new Promise((resolve, reject) => {
      // Logout SSO Profile app
      $.ajax({
        url: this.logoutUrl,
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
        url: this.userUrl,
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
  _authorizeUrl(email = null) {
    return `${this.authorizeUrl}${this._oauthQueryParams(email)}`;
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
