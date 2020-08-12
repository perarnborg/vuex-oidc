const assert = require('assert');
const sinon = require('sinon');
const sinonSandbox = sinon.createSandbox();
const oidcConfig = require('./oidcTestConfig');
let vuexOidc;
let storeModule;
let UserManager;

describe('createStoreModule', function() {
  before(function () {
    vuexOidc = require('../dist/vuex-oidc.cjs');
    storeModule = vuexOidc.vuexOidcCreateStoreModule(oidcConfig, {dispatchEventsOnWindow: true});
    UserManager = require('oidc-client').UserManager;
  });

  afterEach(function () {
    sinonSandbox.restore();
  });

  it('factory function should return a vuex module object', function() {
    assert.equal(typeof storeModule, 'object');
    assert.equal(typeof storeModule.state, 'object');
    assert.equal(typeof storeModule.getters, 'object');
    assert.equal(typeof storeModule.actions, 'object');
    assert.equal(typeof storeModule.mutations, 'object');
  });

  describe('.actions.oidcCheckAccess', function() {
    describe('check public routes', function() {
      it('should resolve true for public routes if authenticated', function() {
        const context = authenticatedContext();
        return storeModule.actions.oidcCheckAccess(context, publicRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, true);
          })
      });
      it('should resolve true for public routes if not authenticated, and also dispatch silent auth action', function() {
        const context = unAuthenticatedContext();
        sinon.spy(context, 'dispatch');
        return storeModule.actions.oidcCheckAccess(context, publicRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, true);
            assert.equal(context.dispatch.calledWith('authenticateOidcSilent'), true);
            context.dispatch.restore();
          })
      });
    });
    describe('check callback routes', function() {
      it('should resolve true for oidcCallbackRoutes routes if authenticated', function() {
        return storeModule.actions.oidcCheckAccess(authenticatedContext(), oidcCallbackRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, true);
          })
      });
      it('should resolve true for oidcCallbackRoutes routes if not authenticated', function() {
        return storeModule.actions.oidcCheckAccess(unAuthenticatedContext(), oidcCallbackRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, true);
          })
      });
    });
    describe('check protected routes', function() {
      it('should resolve false for protected routes if not authenticated, and also dispatch auth redirect action', function() {
        const context = unAuthenticatedContext();
        sinon.spy(context, 'dispatch');
        sinonSandbox.stub(UserManager.prototype, 'signinSilent').callsFake(silentSigningFailedPromise);
        sinonSandbox.stub(UserManager.prototype, 'getUser').callsFake(getNoUserPromise);
        return storeModule.actions.oidcCheckAccess(context, protectedRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, false);
            assert.equal(context.dispatch.calledWith('authenticateOidc'), true);
            context.dispatch.restore();
          })
      });
      it('should resolve true for protected routes if authenticated in both vuex and in storage', function() {
        const context = authenticatedContext();
        sinonSandbox.stub(UserManager.prototype, 'getUser').callsFake(getUserPromise);
        return storeModule.actions.oidcCheckAccess(context, protectedRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, true);
          })
      });
      it('should resolve true for protected routes if not authenticated in vuex, but in storage.', function() {
        const context = unAuthenticatedContext();
        sinonSandbox.stub(UserManager.prototype, 'getUser').callsFake(getUserPromise);
        return storeModule.actions.oidcCheckAccess(context, protectedRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, true);
          })
      });
      it('should resolve false for protected routes if authenticated in vuex, but not in storage. Also signout user from vuex and dispatch auth redirect action.', function() {
        const context = authenticatedContext();
        sinon.spy(context, 'dispatch');
        sinon.spy(context, 'commit');
        sinonSandbox.stub(UserManager.prototype, 'signinSilent').callsFake(silentSigningFailedPromise);
        sinonSandbox.stub(UserManager.prototype, 'getUser').callsFake(getNoUserPromise);
        return storeModule.actions.oidcCheckAccess(context, protectedRoute())
          .then(function(hasAccess) {
            assert.equal(hasAccess, false);
            assert.equal(context.commit.calledWith('unsetOidcAuth'), true);
            assert.equal(context.dispatch.calledWith('authenticateOidc'), true);
            context.commit.restore();
          })
      });
    });
  });

  describe('.actions.oidcWasAuthenticated', function() {
    it('should set user in store and bind events', function() {
      const context = unAuthenticatedContext();
      sinon.spy(context, 'commit');
      storeModule.actions.oidcWasAuthenticated(context, oidcUser());
      assert.equal(context.commit.getCall(0).args[0], 'setOidcAuth');
      assert.equal(context.commit.getCall(0).args[1].id_token, oidcUser().id_token);
      assert.equal(context.commit.getCall(1).args[0], 'setOidcEventsAreBound');
      context.commit.restore();
    });
  });

  describe('.actions.oidcSignInCallback', function() {
    it('callback sets error if state is not found in store', function() {
      const context = unAuthenticatedContext();
      sinon.spy(context, 'commit');
      return storeModule.actions.oidcSignInCallback(context, oidcUser())
        .then(function(redirectUrl) {
          assert.equal(redirectUrl, false);
          context.commit.restore();
        })
        .catch(function(error) {
          assert.equal(typeof error, 'object');
          context.commit.restore();
        });
    });
  });

  describe('.actions.authenticateOidc', function() {
    it('performs signinRedirect with empty arguments by default', function() {
      const context = unAuthenticatedContext();
      const payload = {
        redirectPath: '/'
      };
      sinonSandbox.stub(UserManager.prototype, 'signinRedirect').callsFake(resolveArgumentsPromise);
      return context.actions.authenticateOidc(context, payload)
        .then(function(signinRedirectOptions) {
          assert.equal(typeof signinRedirectOptions, 'object');
          assert.equal(Object.keys(signinRedirectOptions).length, 0);
        });
    });
    it('performs signinRedirect with arguments if specified in payload', function() {
      const context = unAuthenticatedContext();
      const payload = {
        redirectPath: '/',
        options: {
          useReplaceToNavigate: true
        }
      };
      sinonSandbox.stub(UserManager.prototype, 'signinRedirect').callsFake(resolveArgumentsPromise);
      return context.actions.authenticateOidc(context, payload)
        .then(function(signinRedirectOptions) {
          assert.equal(typeof signinRedirectOptions, 'object');
          assert.equal(signinRedirectOptions.useReplaceToNavigate, true);
        });
    });
    it('performs signinRedirect with arguments if specified in default options', function() {
      const context = unAuthenticatedContext({
        defaultSigninRedirectOptions: {
          useReplaceToNavigate: true
        }
      });
      const payload = {
        redirectPath: '/'
      };
      sinonSandbox.stub(UserManager.prototype, 'signinRedirect').callsFake(resolveArgumentsPromise);
      return context.actions.authenticateOidc(context, payload)
        .then(function(signinRedirectOptions) {
          assert.equal(typeof signinRedirectOptions, 'object');
          assert.equal(signinRedirectOptions.useReplaceToNavigate, true);
        });
    });
  });

  describe('.getters.oidcIsRoutePublic', function() {
    it('should not call isPublicRoute when not a function', function() {
      const route = {
        path: '/',
        meta: {}
      };
      storeModule = vuexOidc.vuexOidcCreateStoreModule(oidcConfig, {isPublicRoute: 'not a function'});
      assert.equal(storeModule.getters.oidcIsRoutePublic(storeModule.state)(route), false);
    });

    it('should call isPublicRoute', function() {
      const route = {
        path: '/',
        meta: {}
      };
      const isPublicRoute = sinon.stub().returns(true);

      storeModule = vuexOidc.vuexOidcCreateStoreModule(oidcConfig, {isPublicRoute});
      assert.equal(storeModule.getters.oidcIsRoutePublic(storeModule.state)(route), true);
      assert.equal(isPublicRoute.calledWith(route), true);
    });
  });
});

function authenticatedContext(storeSettings = {}) {
  const context = Object.assign(vuexOidc.vuexOidcCreateStoreModule(oidcConfig, storeSettings, { oidcError: oidcMockOidcError }), {
    commit: function(mutation, payload) {},
    dispatch: function(action, payload) {}
  });
  context.state = Object.assign({}, context.state, oidcUser());
  return context;
}

function unAuthenticatedContext(storeSettings = {}) {
  return Object.assign(vuexOidc.vuexOidcCreateStoreModule(oidcConfig, storeSettings, { oidcError: oidcMockOidcError }), {
    commit: function(mutation, payload) {},
    dispatch: function(action, payload) {}
  });
}

function publicRoute() {
  return {
    path: '/',
    meta: {
      isPublic: true
    }
  }
}

function oidcCallbackRoute() {
  return {
    meta: {
      isOidcCallback: true
    }
  }
}

function protectedRoute() {
  return {
    path: '/protected',
    meta: {
    }
  }
}

function getUserPromise() {
  return new Promise(function(resolve) {
    resolve(oidcUser());
  });
}

function getNoUserPromise() {
  return new Promise(function(resolve) {
    resolve(null);
  });
}

function silentSigningFailedPromise() {
  return new Promise(function(resolve, reject) {
    reject(new Error('No user'));
  });
}

function oidcUser() {
  return {
    id_token: require('./id-token-2028-01-01')
  }
}

function resolveArgumentsPromise(argument) {
  return new Promise(function(resolve) {
    resolve(argument);
  });
}

function oidcMockOidcError() {
}
