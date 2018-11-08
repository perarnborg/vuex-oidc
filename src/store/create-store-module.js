import { objectAssign, firstLetterUppercase } from '../services/utils'
import { getOidcConfig, createOidcUserManager, addUserManagerEventListener, removeUserManagerEventListener, tokenIsExpired, tokenExp } from '../services/oidc-helpers'
import { dispatchCustomBrowserEvent } from '../services/browser-event'

export default (oidcSettings, moduleOptions = {}, oidcEventListeners = {}) => {

  const oidcConfig = getOidcConfig(oidcSettings)
  const oidcUserManager = createOidcUserManager(oidcSettings)
  moduleOptions = objectAssign([
    {namespaced: false},
    moduleOptions
  ])

  // Add event listeners passed into factory function
  Object.keys(oidcEventListeners).forEach(eventName => {
    addUserManagerEventListener(oidcUserManager, eventName, oidcEventListeners[eventName])
  })

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
    addUserManagerEventListener(oidcUserManager, eventName, () => { dispatchCustomBrowserEvent(eventName) })
  })

  const state = {
    access_token: null,
    id_token: null,
    user: null,
    is_checked: false,
    events_are_bound: false,
    error: null
  }

  const isAuthenticated = (state) => {
    if (state.id_token && !tokenIsExpired(state.id_token)) {
      return true
    }
    return false
  }

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
    }
  }

  const actions = {
    oidcCheckAccess (context, route) {
      return new Promise(resolve => {
        if (route.meta.isOidcCallback) {
          resolve(true)
        }
        let hasAccess = true
        let getUserPromise = new Promise(resolveUser => { resolveUser(null) })
        let isAuthenticatedInStore = isAuthenticated(context.state)
        if (isAuthenticatedInStore) {
          getUserPromise = new Promise(resolveUser => {
            oidcUserManager.getUser().then(function(user) {
              resolveUser(user)
            }).catch(() => {
              resolveUser(null)
            })
          })
        }
        getUserPromise.then(user => {
          if (!user) {
            if (isAuthenticatedInStore) {
              context.commit('unsetOidcAuth')
            }
            if (route.meta.isPublic) {
              if (oidcConfig.silent_redirect_uri) {
                context.dispatch('authenticateOidcSilent')
              }
            } else {
              context.dispatch('authenticateOidc', route.path)
              hasAccess = false
            }
          }
          resolve(hasAccess)
        })
      })
    },
    authenticateOidc (context, redirectPath) {
      redirectPath += (document.location.search || '') + (document.location.hash || '')
      sessionStorage.setItem('vuex_oidc_active_route', redirectPath)
      oidcUserManager.signinRedirect().catch(function(err) {
        context.commit('setOidcError', err)
      })
    },
    oidcSignInCallback(context) {
      return new Promise((resolve, reject) => {
        oidcUserManager.signinRedirectCallback()
          .then(function (user) {
            context.dispatch('oidcWasAuthenticated', user)
            context.commit('setOidcAuthIsChecked')
            resolve(sessionStorage.getItem('vuex_oidc_active_route') || '/')
          })
          .catch(function (err) {
            context.commit('setOidcError', err)
            context.commit('setOidcAuthIsChecked')
            reject(err)
          })
      })
    },
    authenticateOidcSilent(context) {
      oidcUserManager.signinSilent().then(function (user) {
        context.dispatch('oidcWasAuthenticated', user)
        context.commit('setOidcAuthIsChecked')
      }).catch(function () {
        context.commit('setOidcAuthIsChecked')
      })
    },
    oidcWasAuthenticated(context, user) {
      context.commit('setOidcAuth', user)
      if (!context.state.events_are_bound) {
        oidcUserManager.events.addAccessTokenExpired(() => { context.commit('unsetOidcAuth') })
        if (oidcSettings.automaticSilentRenew) {
          oidcUserManager.events.addAccessTokenExpiring(() => { context.dispatch('authenticateOidcSilent') })
        }
        context.commit('setOidcEventsAreBound')
      }
    },
    getOidcUser (context) {
      oidcUserManager.getUser().then(function(user) {
        context.commit('setOidcUser', user)
      }).catch(function(err) {
      })
    },
    addOidcEventListener (context, payload) {
      addUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener)
    },
    removeOidcEventListener (context, payload) {
      removeUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener)
    },
    signOutOidc (context) {
      oidcUserManager.signoutRedirect().then(function(resp) {
        context.commit('unsetOidcAuth')
      }).catch(function(err) {
      })
    }
  }

  const mutations = {
    setOidcAuth (state, user) {
      state.id_token = user.id_token
      state.access_token = user.access_token
      state.user = user.profile
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
    setOidcError (state, error) {
      state.error = error && error.message ? error.message : error
    }
  }

  return objectAssign([
    moduleOptions,
    {
      state,
      getters,
      actions,
      mutations
    }
  ])
}
