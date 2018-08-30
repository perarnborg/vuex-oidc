const assert = require('assert')
const vuexOidc = require('../dist/vuex-oidc.cjs')
const oidcConfig = require('./oidcTestConfig')

describe('createStoreModule', function() {
  it('should be a factory function', function() {
    const createStoreModule = vuexOidc.vuexOidcCreateStoreModule(oidcConfig)
    assert(typeof createStoreModule, 'function')
  });
});
