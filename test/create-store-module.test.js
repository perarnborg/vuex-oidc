const assert = require('assert');
const sinon = require('sinon');
const oidcConfig = require('./oidcTestConfig');
let vuexOidc;
let storeModule;

describe('createStoreModule', function() {
  before(function () {
    vuexOidc = require('../dist/vuex-oidc.cjs');
    storeModule = vuexOidc.vuexOidcCreateStoreModule(oidcConfig);
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
});

function authenticatedContext() {
  const context = Object.assign(vuexOidc.vuexOidcCreateStoreModule(oidcConfig), {
    commit: function(mutation, payload) {},
    dispatch: function(action, payload) {}
  });
  context.state = Object.assign({}, context.state, {
    id_token: require('./id-token-2028-01-01')
  });
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
