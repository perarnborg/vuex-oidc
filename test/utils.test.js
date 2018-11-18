const assert = require('assert')
const { vuexOidcUtils } = require('../dist/vuex-oidc.cjs')

describe('utils.objectAssign', function() {
  it('should merge objects as a new object', function() {
    const objA = {prop1: 1, prop2: 'a'}
    const objB = {prop1: 2, prop3: 'b'}
    const merged = vuexOidcUtils.objectAssign([objA, objB])
    assert.equal(typeof merged, 'object')
    assert.equal(merged.prop1, objB.prop1)
    assert.equal(merged.prop2, objA.prop2)
    assert.equal(merged.prop3, objB.prop3)
    objB.prop1 = 3
    assert.notEqual(merged.prop1, objB.prop1)
  });
});

describe('utils.parseJwt', function() {
  it('parses a valid token', function() {
    const parsed = vuexOidcUtils.parseJwt(require('./id-token-2028-01-01'));
    assert.equal(parsed.email, 'janedoe@example.com');
  });
  it('parses a an object when parsing an invalid token', function() {
    const parsed = vuexOidcUtils.parseJwt('asd');
    assert.equal(typeof parsed, 'object');
  });
});

describe('utils.firstLetterUppercase', function() {
  it('return a string with first letter uppercased', function() {
    assert.equal(vuexOidcUtils.firstLetterUppercase('userLoaded'), 'UserLoaded')
  });
});
