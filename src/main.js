import { createOidcUserManager, processSilentSignInCallback } from './services/oidc-helpers'
import createStoreModule from './store/create-store-module'
import createRouterMiddleware from './router/create-router-middleware'
import * as utils from './services/utils'

export const vuexOidcCreateUserManager = createOidcUserManager

export const vuexOidcCreateStoreModule = createStoreModule

export const vuexOidcCreateRouterMiddleware = createRouterMiddleware

export const vuexOidcProcessSilentSignInCallback = processSilentSignInCallback

export const vuexOidcUtils = utils
