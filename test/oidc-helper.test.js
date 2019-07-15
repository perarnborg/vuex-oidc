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
  it('should translate settings that are snake_case in oidc-client from camelCase ', function() {
    const camelCaseOidcConfig = {
      ...oidcConfig,
      clientId: oidcConfig.client_id,
      redirectUri: oidcConfig.redirect_uri,
      responseType: oidcConfig.response_type
    };
    delete camelCaseOidcConfig.client_id;
    delete camelCaseOidcConfig.redirect_uri;
    delete camelCaseOidcConfig.response_type;
    let userManager;

    try {
      userManager = vuexOidc.vuexOidcCreateUserManager(camelCaseOidcConfig);
    }
    catch(error) {
    }
    assert.equal(typeof userManager, 'object')
  });
});

describe('oidcHelper.getOidcCallbackPath', function() {
  before(function () {
    vuexOidc = require('../dist/vuex-oidc.cjs');
  });

  it('should return path when router base is /', function() {
    const path = vuexOidc.vuexOidcGetOidcCallbackPath(oidcConfig, '/');
    assert.equal(path, '/oidc-callback');
  });

  it('should return path when router base is not /', function() {
    const routeBase = '/app/';
    const path = vuexOidc.vuexOidcGetOidcCallbackPath({
      ...oidcConfig,
      redirect_uri: 'http://localhost:1337' + routeBase + 'oidc-callback'
    }, routeBase)
    assert.equal(path, '/oidc-callback')
  });

  it('should return path without trailing /', function() {
    const path = vuexOidc.vuexOidcGetOidcCallbackPath({
      ...oidcConfig,
      redirect_uri: 'http://localhost:1337/oidc-callback/'
    }, '/')
    assert.equal(path, '/oidc-callback')
  });
});
