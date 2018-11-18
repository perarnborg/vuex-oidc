const assert = require('assert');
const oidcConfig = require('./oidcTestConfig');
let vuexOidc;

describe('oidcHelper.createOidcUserManager', function() {
  before(function () {
    vuexOidc = require('../dist/vuex-oidc.cjs');
  });

  it('should create a UserManager', function() {
    const userManager = vuexOidc.vuexOidcCreateUserManager(oidcConfig)
    assert.equal(typeof userManager, 'object')
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
      };
      delete faultyOidcConfig[requiredSetting];
      let userManager;

      try {
        userManager = vuexOidc.vuexOidcCreateUserManager(faultyOidcConfig);
      }
      catch(error) {
      }
      assert.notEqual(typeof userManager, 'object');
    });
  });
});
