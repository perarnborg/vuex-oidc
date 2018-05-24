import { createOidcUserManager, processSilentSignInCallback } from './services/oidc-helpers'
import createStoreModule from './store/vuex-oidc-create-store-module'
import SignInCallbackComponent from './components/VuexOidcSignInCallbackComponent.vue'
import routerMiddleware from './router/vuex-oidc-router-middleware'

export const vuexOidcCreateUserManager = createOidcUserManager

export const vuexOidcCreateStoreModule = createStoreModule

export const VuexOidcSignInCallbackComponent = SignInCallbackComponent

export const vuexOidcRouterMiddleware = routerMiddleware

export const vuexOidcProcessSilentSignInCallback = processSilentSignInCallback
