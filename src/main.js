import { createOidcUserManager, processSilentSignInCallback, processSignInCallback, getOidcCallbackPath } from './services/oidc-helpers'
import createStoreModule from './store/create-store-module'
import createRouterMiddleware from './router/create-router-middleware'
import createNuxtRouterMiddleware from './router/create-nuxt-router-middleware'
import * as utils from './services/utils'
import { dispatchCustomBrowserEvent } from './services/browser-event'
import createReactiveState from './store/create-reactive-state'
import createReactiveStateRouterMiddleware from './router/create-reactive-state-router-middleware'

export const vuexOidcCreateUserManager = createOidcUserManager

export const vuexOidcCreateStoreModule = createStoreModule

export const vuexOidcCreateReactiveState = createReactiveState

export const vuexOidcCreateNuxtRouterMiddleware = createNuxtRouterMiddleware

export const vuexOidcCreateRouterMiddleware = createRouterMiddleware

export const vuexOidcCreateReactiveStateRouterMiddleware = createReactiveStateRouterMiddleware

export const vuexOidcProcessSilentSignInCallback = processSilentSignInCallback

export const vuexOidcProcessSignInCallback = processSignInCallback

export const vuexOidcGetOidcCallbackPath = getOidcCallbackPath

export const vuexOidcUtils = utils

export const vuexDispatchCustomBrowserEvent = dispatchCustomBrowserEvent
