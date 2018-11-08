import { objectAssign } from './utils'

// Use native custom event or DIY for IE
function createCustomEvent (eventName, detail, params) {
  const prefixedEventName = 'vuexoidc:' + eventName

  if (typeof window.CustomEvent === 'function') {
    params = objectAssign([params, { detail: detail }])
    return new window.CustomEvent(prefixedEventName, params)
  }

  params = params || { bubbles: false, cancelable: false }
  params = objectAssign([params, { detail: detail }])
  var evt = document.createEvent('CustomEvent')
  evt.initCustomEvent(
    prefixedEventName,
    params.bubbles,
    params.cancelable,
    params.detail
  )
  return evt
}

export function dispatchCustomBrowserEvent (eventName, detail = {}, params = {}) {
  if (window) {
    const event = createCustomEvent(
      eventName,
      objectAssign([{}, detail]),
      params
    )
    window.dispatchEvent(event)
  }
}
