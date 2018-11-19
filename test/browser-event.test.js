const assert = require('assert')
const sinon = require('sinon');
let vuexDispatchCustomBrowserEvent;

describe('browser-event.dispatchCustomBrowserEvent', function() {
  before(function () {
    vuexDispatchCustomBrowserEvent = require('../dist/vuex-oidc.cjs').vuexDispatchCustomBrowserEvent;
  });

  it('triggers an event on window', function() {
    const eventName = 'testEvent';
    sinon.spy(window, 'dispatchEvent');
    vuexDispatchCustomBrowserEvent(eventName);
    assert.equal(window.dispatchEvent.getCall(0).args[0].name, 'vuexoidc:' + eventName);
    window.dispatchEvent.restore();
  });
});
