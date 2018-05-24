const assert = require('assert')
const vuexOidc = require('../dist/vuex-oidc.cjs')
const oidcConfig = require('./oidcTestConfig')

describe('oidcHelper.createOidcUserManager', function() {
  it('should create a UserManager', function() {
    const userManager = vuexOidc.vuexOidcCreateUserManager(oidcConfig)
    assert(typeof userManager, 'object')
  });
  [
    'authority',
    'client_id',
    'redirect_uri',
    'response_type',
    'scope'
  ].forEach((requiredSetting) => {
    it('should fail without oidc required setting ' + requiredSetting, function() {
      const faultyOidcConfig = {
        ...oidcConfig
      }
      delete faultyOidcConfig[requiredSetting]
      let userManager

      try {
        userManager = vuexOidc.vuexOidcCreateUserManager(faultyOidcConfig)
      }
      catch(error) {
      }
      assert.notEqual(typeof userManager, 'object')
    });
  })
});
