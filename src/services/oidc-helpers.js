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

export const createOidcUserManager = (oidcConfig) => {
  Object.keys(oidcConfig).forEach((requiredProperty) => {
    if (!oidcConfig[requiredProperty]) {
      throw new Error('Required oidc settin ' + requiredProperty + ' missing for creating UserManager')
    }
  })
  return new UserManager(Object.assign(
    {},
    defaultOidcConfig,
    oidcConfig
  ))
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
