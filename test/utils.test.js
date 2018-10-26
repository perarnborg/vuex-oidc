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
