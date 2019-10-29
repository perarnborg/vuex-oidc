import { objectAssign } from '../services/utils'
import { getOidcConfig, getOidcCallbackPath, createOidcUserManager, addUserManagerEventListener, removeUserManagerEventListener, tokenIsExpired, tokenExp } from '../services/oidc-helpers'
import { dispatchCustomBrowserEvent } from '../services/browser-event'

export default (oidcSettings, storeSettings = {}, oidcEventListeners = {}) => {
  const oidcConfig = getOidcConfig(oidcSettings)
  const oidcUserManager = createOidcUserManager(oidcSettings)
  storeSettings = objectAssign([
    { namespaced: false },
    storeSettings
  ])
  const oidcCallbackPath = getOidcCallbackPath(oidcConfig.redirect_uri, storeSettings.routeBase || '/')
  const oidcPopupCallbackPath = getOidcCallbackPath(oidcConfig.popup_redirect_uri, storeSettings.routeBase || '/')

  // Add event listeners passed into factory function
  Object.keys(oidcEventListeners).forEach(eventName => {
    addUserManagerEventListener(oidcUserManager, eventName, oidcEventListeners[eventName])
  })

  if (storeSettings.dispatchEventsOnWindow) {
    // Dispatch oidc-client events on window (if in browser)
    const userManagerEvents = [
      'userLoaded',
      'userUnloaded',
      'accessTokenExpiring',
      'accessTokenExpired',
      'silentRenewError',
      'userSignedOut'
    ]
    userManagerEvents.forEach(eventName => {
      addUserManagerEventListener(oidcUserManager, eventName, (detail) => {
        dispatchCustomBrowserEvent(eventName, detail ? detail : {})
      })
    })
  }

  const state = {
    access_token: null,
    id_token: null,
    user: null,
    scopes: null,
    is_checked: false,
    events_are_bound: false,
    error: null
  }

  const isAuthenticated = (state) => {
    if (state.id_token) {
      return true
    }
    return false
  }

  const routeIsOidcCallback = (route) => {
    if (route.meta&&route.meta.isOidcCallback) {
      return true
    }
    if (route.path && route.path.replace(/\/$/, '') === oidcCallbackPath) {
      return true
    }
    if (route.path && route.path.replace(/\/$/, '') === oidcPopupCallbackPath) {
      return true
    }
    return false
  }

  const routeIsPublic = (route) => {
    if (route.meta&&route.meta.isPublic) {
      return true
    }
    if (storeSettings.publicRoutePaths) {
      return storeSettings.publicRoutePaths.map(path => path.replace(/\/$/, '')).indexOf(route.path.replace(/\/$/, '')) > -1
    }
    if (storeSettings.isPublicRoute && typeof storeSettings.isPublicRoute === 'function') {
      return storeSettings.isPublicRoute(route);
    }
    return false
  }

  /* istanbul ignore next */
  const getters = {
    oidcIsAuthenticated: (state) => {
      return isAuthenticated(state)
    },
    oidcUser: (state) => {
      return state.user
    },
    oidcAccessToken: (state) => {
      return tokenIsExpired(state.access_token) ? null : state.access_token
    },
    oidcAccessTokenExp: (state) => {
      return tokenExp(state.access_token)
    },
    oidcScopes: (state) => {
      return state.scopes
    },
    oidcIdToken: (state) => {
      return tokenIsExpired(state.id_token) ? null : state.id_token
    },
    oidcIdTokenExp: (state) => {
      return tokenExp(state.id_token)
    },
    oidcAuthenticationIsChecked: (state) => {
      return state.is_checked
    },
    oidcError: (state) => {
      return state.error
    },
    oidcIsRoutePublic: (state) => {
      return (route) => {
        return routeIsPublic(route)
      }
    }
  }

  const actions = {
    oidcCheckAccess (context, route) {
      return new Promise(resolve => {
        if (routeIsOidcCallback(route)) {
          resolve(true)
          return
        }
        let hasAccess = true
        let getUserPromise = new Promise(resolve => {
          oidcUserManager.getUser().then(user => {
            resolve(user)
          }).catch(() => {
            resolve(null)
          })
        })
        let isAuthenticatedInStore = isAuthenticated(context.state)
        getUserPromise.then(user => {
          if (!user || user.expired) {
            if (isAuthenticatedInStore) {
              context.commit('unsetOidcAuth')
            }
            if (routeIsPublic(route)) {
              if (oidcConfig.silent_redirect_uri) {
                context.dispatch('authenticateOidcSilent')
              }
            } else {
              context.dispatch('authenticateOidc', {
                redirectPath: route.fullPath
              })
              hasAccess = false
            }
          } else {
            context.dispatch('oidcWasAuthenticated', user);
            if (!isAuthenticatedInStore) {
              if (oidcEventListeners && typeof oidcEventListeners.userLoaded === 'function') {
                oidcEventListeners.userLoaded(user);
              }
              if (storeSettings.dispatchEventsOnWindow) {
                dispatchCustomBrowserEvent('userLoaded', user)
              }
            }
          }
          resolve(hasAccess)
        })
      })
    },
    authenticateOidc (context, payload = {}) {
      if (typeof payload === 'string') {
        payload = { redirectPath: payload }
      }
      if (payload.redirectPath) {
        sessionStorage.setItem('vuex_oidc_active_route', payload.redirectPath)
      } else {
        sessionStorage.removeItem('vuex_oidc_active_route')
      }
      // Take options for signinRedirect from 1) payload or 2) storeSettings if defined there
      const options = payload.options || storeSettings.defaultSigninRedirectOptions || {}
      return oidcUserManager.signinRedirect(options).catch(err => {
        context.commit('setOidcError', errorPayload('authenticateOidc', err))
      })
    },
    oidcSignInCallback (context, url) {
      return new Promise((resolve, reject) => {
        oidcUserManager.signinRedirectCallback(url)
          .then(user => {
            context.dispatch('oidcWasAuthenticated', user)
            resolve(sessionStorage.getItem('vuex_oidc_active_route') || '/')
          })
          .catch(err => {
            context.commit('setOidcError', errorPayload('oidcSignInCallback', err))
            context.commit('setOidcAuthIsChecked')
            reject(err)
          })
      })
    },
    authenticateOidcSilent (context, payload = {}) {
      // Take options for signinSilent from 1) payload or 2) storeSettings if defined there
      const options = payload.options || storeSettings.defaultSigninSilentOptions || {}
      return oidcUserManager.signinSilent(options)
        .then(user => {
          context.dispatch('oidcWasAuthenticated', user)
        })
        .catch(err => {
          context.commit('setOidcError', errorPayload('authenticateOidcSilent', err))
          context.commit('setOidcAuthIsChecked')
        })
    },
    authenticateOidcPopup (context, payload = {}) {
      // Take options for signinPopup from 1) payload or 2) storeSettings if defined there
      const options = payload.options || storeSettings.defaultSigninPopupOptions || {}
      return oidcUserManager.signinPopup(options)
        .then(user => {
          context.dispatch('oidcWasAuthenticated', user)
        })
        .catch(err => {
          context.commit('setOidcError', errorPayload('authenticateOidcPopup', err))
        })
    },
    oidcSignInPopupCallback (context, url) {
      return new Promise((resolve, reject) => {
        oidcUserManager.signinPopupCallback(url)
          .catch(err => {
            context.commit('setOidcError', errorPayload('oidcSignInPopupCallback', err))
            context.commit('setOidcAuthIsChecked')
            reject(err)
          })
      })
    },
    oidcWasAuthenticated (context, user) {
      context.commit('setOidcAuth', user)
      if (!context.state.events_are_bound) {
        oidcUserManager.events.addAccessTokenExpired(() => { context.commit('unsetOidcAuth') })
        if (oidcSettings.automaticSilentRenew) {
          oidcUserManager.events.addAccessTokenExpiring(() => { context.dispatch('authenticateOidcSilent') })
        }
        context.commit('setOidcEventsAreBound')
      }
      context.commit('setOidcAuthIsChecked')
    },
    getOidcUser (context) {
      /* istanbul ignore next */
      return oidcUserManager.getUser().then(user => {
        context.commit('setOidcUser', user)
        return user
      })
    },
    addOidcEventListener (context, payload) {
      /* istanbul ignore next */
      addUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener)
    },
    removeOidcEventListener (context, payload) {
      /* istanbul ignore next */
      removeUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener)
    },
    signOutOidc (context) {
      /* istanbul ignore next */
      oidcUserManager.signoutRedirect().then(() => {
        context.commit('unsetOidcAuth')
      })
    },
    removeUser (context) {
      /* istanbul ignore next */
      return context.dispatch('removeOidcUser')
    },
    removeOidcUser (context) {
      /* istanbul ignore next */
      return oidcUserManager.removeUser().then(() => {
        context.commit('unsetOidcAuth')
      })
    }
  }

  /* istanbul ignore next */
  const mutations = {
    setOidcAuth (state, user) {
      state.id_token = user.id_token
      state.access_token = user.access_token
      state.user = user.profile
      state.scopes = user.scopes
      state.error = null
    },
    setOidcUser (state, user) {
      state.user = user.profile
    },
    unsetOidcAuth (state) {
      state.id_token = null
      state.access_token = null
      state.user = null
    },
    setOidcAuthIsChecked (state) {
      state.is_checked = true
    },
    setOidcEventsAreBound (state) {
      state.events_are_bound = true
    },
    setOidcError (state, payload) {
      state.error = payload.error
      dispatchErrorEvent(payload)
    }
  }

  const errorPayload = (context, error) => {
    return {
      context,
      error: error && error.message ? error.message : error
    }
  }

  const dispatchErrorEvent = payload => {
    // oidcError is not a userManagementEvent, it is an event implemeted in vuex-oidc,
    if(typeof oidcEventListeners.oidcError === 'function') {
      oidcEventListeners.oidcError(payload)
    }
    if (storeSettings.dispatchEventsOnWindow) {
      dispatchCustomBrowserEvent('oidcError', payload)
    }
  }

  const storeModule = objectAssign([
    storeSettings,
    {
      state,
      getters,
      actions,
      mutations
    }
  ])

  if (typeof storeModule.dispatchEventsOnWindow !== 'undefined') {
    delete storeModule.dispatchEventsOnWindow
  }

  return storeModule
}
