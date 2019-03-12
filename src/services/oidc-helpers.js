import { objectAssign, parseJwt, firstLetterUppercase, camelCaseToSnakeCase } from './utils'
import { UserManager, WebStorageStateStore } from 'oidc-client'

const defaultOidcConfig = {
  userStore: new WebStorageStateStore(),
  loadUserInfo: true
}

const requiredConfigProperties = [
  'authority',
  'client_id',
  'redirect_uri',
  'response_type',
  'scope'
]

const settingsThatAreSnakeCasedInOidcClient = [
  'clientId',
  'redirectUri',
  'responseType',
  'maxAge',
  'uiLocales',
  'loginHint',
  'acrValues',
  'postLogoutRedirectUri',
  'popupRedirectUri',
  'silentRedirectUri'
]

const snakeCasedSettings = (oidcSettings) => {
  settingsThatAreSnakeCasedInOidcClient.forEach(setting => {
    if (typeof oidcSettings[setting] !== 'undefined') {
      oidcSettings[camelCaseToSnakeCase(setting)] = oidcSettings[setting]
    }
  })
  return oidcSettings
}

export const getOidcConfig = (oidcSettings) => {
  return objectAssign([
    defaultOidcConfig,
    snakeCasedSettings(oidcSettings),
    { automaticSilentRenew: false } // automaticSilentRenew is handled in vuex and not by user manager
  ])
}

export const createOidcUserManager = (oidcSettings) => {
  const oidcConfig = getOidcConfig(oidcSettings)
  requiredConfigProperties.forEach((requiredProperty) => {
    if (!oidcConfig[requiredProperty]) {
      throw new Error('Required oidc setting ' + requiredProperty + ' missing for creating UserManager')
    }
  })
  return new UserManager(oidcConfig)
}

export const addUserManagerEventListener = (oidcUserManager, eventName, eventListener) => {
  const addFnName = 'add' + firstLetterUppercase(eventName)
  if (typeof oidcUserManager.events[addFnName] === 'function' && typeof eventListener === 'function') {
    oidcUserManager.events[addFnName](eventListener)
  }
}

export const removeUserManagerEventListener = (oidcUserManager, eventName, eventListener) => {
  const removeFnName = 'remove' + firstLetterUppercase(eventName)
  if (typeof oidcUserManager.events[removeFnName] === 'function' && typeof eventListener === 'function') {
    oidcUserManager.events[removeFnName](eventListener)
  }
}

export const processSilentSignInCallback = () => {
  new UserManager().signinSilentCallback()
}

export const tokenExp = (token) => {
  if (token) {
    const parsed = parseJwt(token)
    return parsed.exp ? parsed.exp * 1000 : null
  }
  return null
}

export const tokenIsExpired = (token) => {
  const tokenExpiryTime = tokenExp(token)
  if (tokenExpiryTime) {
    return tokenExpiryTime < new Date().getTime()
  }
  return false
}
