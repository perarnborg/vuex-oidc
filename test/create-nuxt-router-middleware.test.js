const assert = require('assert')
const sinon = require('sinon');
let vuexOidc;
let mockContext;

describe('nuxt-router-middleware', function() {
  before(function () {
    vuexOidc = require('../dist/vuex-oidc.cjs');
    mockContext = {
      store: {
        dispatch: function(action, to) {
          console.log('dispatch', action, to)
          return new Promise(function(resolve) {
            resolve(true);
          });
        }
      },
      route: {
        path: '/'
      }
    };
  });

  it('returns resolving promise if check access is true', function(done) {
    const routerMiddleware = vuexOidc.vuexOidcCreateNuxtRouterMiddleware();
    routerMiddleware(mockContext)
      .then(() => {
        done();
      });
  });
});
