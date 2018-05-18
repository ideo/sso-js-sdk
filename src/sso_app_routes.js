class SSOAppRoutes {
  init(opts = {}) {
    this.env = opts.env || 'production';
  }

  get hostname() {
    switch (this.env) {
      case 'production': return 'https://profile.ideo.com';
      case 'staging': return 'https://ideo-sso-profile-staging.herokuapp.com';
      case 'local': return 'http://localhost:3000';
      default: return null;
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

  get userMigratedUrl() {
    return `${this.baseApiUrl}/user_migrations`;
  }

  get userUrl() {
    return `${this.baseApiUrl}/users/me`;
  }
}

export default new SSOAppRoutes();