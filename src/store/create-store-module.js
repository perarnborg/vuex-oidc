import { objectAssign, firstLetterUppercase } from '../services/utils'
import { getOidcConfig, createOidcUserManager, tokenIsExpired, tokenExp } from '../services/oidc-helpers'
import { dispatchAuthenticationBrowserEvent } from '../services/browser-event'

export default (oidcSettings, moduleOptions = {}, oidcEventListeners = {}) => {

  const oidcConfig = getOidcConfig(oidcSettings)
  const oidcUserManager = createOidcUserManager(oidcSettings)
  moduleOptions = objectAssign([
    {namespaced: false},
    moduleOptions
  ])

  Object.keys(oidcEventListeners).forEach(eventName => {
    const addFnName = 'add' + firstLetterUppercase(eventName)
    const eventListener = oidcEventListeners[eventName]
    if (typeof oidcUserManager.events[addFnName] === 'function' && typeof eventListener === 'function') {
      oidcUserManager.events[addFnName](eventListener)
    }
  })

  const state = {
    access_token: null,
    id_token: null,
    user: null,
    is_checked: false,
    error: null
  }

  const getters = {
    oidcIsAuthenticated: (state) => {
      if (state.access_token && !tokenIsExpired(state.access_token)) {
        return true
      }
      if (state.id_token && !tokenIsExpired(state.id_token)) {
        return true
      }
      return false
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
      return new Promise((resolve) => {
        let hasAccess = true
        if (!context.getters.oidcIsAuthenticated && !route.meta.isOidcCallback) {
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
    },
    authenticateOidc (context, redirectPath) {
      redirectPath += (document.location.search || '') + (document.location.hash || '')
      sessionStorage.setItem('vuex_oidc_active_route', redirectPath)
      oidcUserManager.signinRedirect().catch(function(err) {
        context.commit('setOidcError', err)
        console.log(err)
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
    oidcWasAuthenticated(context, user) {
      context.commit('setOidcAuth', user)
      if (oidcSettings.automaticSilentRenew) {
        oidcUserManager.events.addAccessTokenExpiring(() => { context.dispatch('authenticateOidcSilent') })
      }
      dispatchAuthenticationBrowserEvent()
    },
    authenticateOidcSilent(context) {
      oidcUserManager.signinSilent().then(function (user) {
        context.dispatch('oidcWasAuthenticatedSilent', user)
        context.commit('setOidcAuthIsChecked')
      }).catch(function () {
        context.commit('setOidcAuthIsChecked')
      })
    },
    oidcWasAuthenticatedSilent(context, user) {
      context.commit('setOidcAuth', user)
      dispatchAuthenticationBrowserEvent()
    },
    getOidcUser (context) {
      oidcUserManager.getUser().then(function(user) {
        context.commit('setOidcUser', user)
      }).catch(function(err) {
        console.log(err)
      })
    },
    addOidcEventListener (context, payload) {
      const addFn = oidcUserManager.events['add' + firstLetterUppercase(payload.eventName)]
      if (typeof addFn === 'function' && typeof payload.eventListener === 'function') {
        addFn(payload.eventListener)
      }
    },
    removeOidcEventListener (context, payload) {
      const removeFn = oidcUserManager.events['remove' + firstLetterUppercase(payload.eventName)]
      if (typeof removeFn === 'function' && typeof payload.eventListener === 'function') {
        removeFn(payload.eventListener)
      }
    },
    signOutOidc (context) {
      oidcUserManager.signoutRedirect().then(function(resp) {
        context.commit('unsetOidcAuth')
      }).catch(function(err) {
        console.log(err)
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
