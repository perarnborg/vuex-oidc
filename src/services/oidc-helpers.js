import { parseJwt } from './utils'
import { UserManager, WebStorageStateStore } from 'oidc-client'

const defaultOidcConfig = {
  userStore: new WebStorageStateStore(),
  loadUserInfo: true,
  automaticSilentRenew: false
}

const requiredConfigProperties = [
  'authority',
  'client_id',
  'redirect_uri',
  'response_type',
  'scope'
]

export const getOidcConfig = (oidcSettings) => {
  return Object.assign(
    {},
    defaultOidcConfig,
    oidcSettings
  )
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

export const processSilentSignInCallback = (oidcConfig) => {
  createOidcUserManager(Object.assign(
    {},
    oidcConfig,
    {
      silent_redirect_uri: null,
      automaticSilentRenew: false
    }
  )).signinSilentCallback()
}

export const tokenIsExpired = (token) => {
  const parsed = parseJwt(token)
  return parsed.exp * 1000 < new Date().getTime()
}
