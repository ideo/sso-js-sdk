/** @classdesc wrapper for various authentication/authorization routes */
class SSOAppRoutes {
  init(opts = {}) {
    this.env = opts.env || 'production';
    if (opts.ssoHostname) {
      this.ssoHostname = opts.ssoHostname;
    }
  }

  get hostname() {
    if (this.ssoHostname) {
      return this.ssoHostname;
    }
    switch (this.env) {
      case 'production':
        return 'https://profile.ideo.com';
      case 'staging':
        return 'https://ideo-sso-profile-staging.herokuapp.com';
      case 'local':
        return 'http://localhost:3000';
      default:
        return null;
    }
  }

  get signInUrl() {
    return `${this.hostname}/users/sign_in`;
  }

  get signUpUrl() {
    return `${this.hostname}/users/sign_up`;
  }

  get logoutUrl() {
    return `${this.hostname}/users/sign_out`;
  }

  get authorizeUrl() {
    return `${this.hostname}/oauth/authorize`;
  }

  get forgotPasswordUrl() {
    return `${this.hostname}/users/password/new`;
  }

  get profileUrl() {
    return `${this.hostname}/profile`;
  }

  // API Routes

  get baseApiUrl() {
    return `${this.hostname}/api/v1`;
  }

  get apiUserMigrationsUrl() {
    return `${this.baseApiUrl}/user_migrations`;
  }

  get apiUserUrl() {
    return `${this.baseApiUrl}/users/me`;
  }

  get apiUserSessionDestroyUrl() {
    return `${this.baseApiUrl}/sessions/`;
  }
}

export default new SSOAppRoutes();
