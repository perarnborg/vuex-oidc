import { createOidcUserManager, processSilentSignInCallback, getOidcCallbackPath } from './services/oidc-helpers'
import createStoreModule from './store/create-store-module'
import createRouterMiddleware from './router/create-router-middleware'
import createNuxtRouterMiddleware from './router/create-nuxt-router-middleware'
import * as utils from './services/utils'
import { dispatchCustomBrowserEvent } from './services/browser-event'

export const vuexOidcCreateUserManager = createOidcUserManager

export const vuexOidcCreateStoreModule = createStoreModule

export const vuexOidcCreateNuxtRouterMiddleware = createNuxtRouterMiddleware

export const vuexOidcCreateRouterMiddleware = createRouterMiddleware

export const vuexOidcProcessSilentSignInCallback = processSilentSignInCallback

export const vuexOidcGetOidcCallbackPath = getOidcCallbackPath

export const vuexOidcUtils = utils

export const vuexDispatchCustomBrowserEvent = dispatchCustomBrowserEvent
