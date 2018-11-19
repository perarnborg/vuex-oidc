const assert = require('assert');
const sinon = require('sinon');
const oidcConfig = require('./oidcTestConfig');
let vuexOidc;
let storeModule;

describe('createStoreModule', function() {
  before(function () {
    vuexOidc = require('../dist/vuex-oidc.cjs');
    storeModule = vuexOidc.vuexOidcCreateStoreModule(oidcConfig, {dispatchEventsOnWindow: true});
  });

  it('factory function should return a vuex module object', function() {
    assert.equal(typeof storeModule, 'object');
    assert.equal(typeof storeModule.state, 'object');
    assert.equal(typeof storeModule.getters, 'object');
    assert.equal(typeof storeModule.actions, 'object');
    assert.equal(typeof storeModule.mutations, 'object');
  });

  describe('.actions.oidcCheckAccess', function() {
    it('should resolve true for public routes if authenticated, and also signout user if state is not in storage', function() {
      const context = authenticatedContext();
      sinon.spy(context, 'commit');
      return storeModule.actions.oidcCheckAccess(context, publicRoute())
        .then(function(hasAccess) {
          assert.equal(hasAccess, true);
          assert.equal(context.commit.calledWith('unsetOidcAuth'), true);
          context.commit.restore();
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
    it('should resolve false for protected routes if not authenticated, and also dispatch auth redirect action', function() {
      const context = unAuthenticatedContext();
      sinon.spy(context, 'dispatch');
      return storeModule.actions.oidcCheckAccess(context, protectedRoute())
        .then(function(hasAccess) {
          assert.equal(hasAccess, false);
          assert.equal(context.dispatch.calledWith('authenticateOidc'), true);
          context.dispatch.restore();
        })
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
        })
    });
  });
});

function authenticatedContext() {
  const context = Object.assign(vuexOidc.vuexOidcCreateStoreModule(oidcConfig), {
    commit: function(mutation, payload) {},
    dispatch: function(action, payload) {}
  });
  context.state = Object.assign({}, context.state, oidcUser());
  return context;
}

function unAuthenticatedContext() {
  return Object.assign(vuexOidc.vuexOidcCreateStoreModule(oidcConfig), {
    commit: function(mutation, payload) {},
    dispatch: function(action, payload) {}
  });
}

function publicRoute() {
  return {
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
    meta: {
    }
  }
}

function oidcUser() {
  return {
    id_token: require('./id-token-2028-01-01')
  }
}
