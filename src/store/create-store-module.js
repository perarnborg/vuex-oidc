import { getOidcConfig, createOidcUserManager } from '../services/oidc-helpers'
import { dispatchAuthenticationBrowserEvent } from '../services/browser-event'

export default (oidcSettings) => {

  const oidcConfig = getOidcConfig(oidcSettings)
  const oidcUserManager = createOidcUserManager(oidcSettings)

  const state = {
    access_token: null,
    id_token: null,
    user: null,
    error: null
  }

  const getters = {
    oidcIsAuthenticated: (state) => {
      if (state.access_token || state.id_token) {
        return true
      }
      return false
    },
    oidcUser: (state) => {
      return state.user
    },
    oidcAccessToken: (state) => {
      return state.access_token
    },
    oidcIdToken: (state) => {
      return state.id_token
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
            context.dispatch('authenticateOidc')
            hasAccess = false
          }
        }
        resolve(hasAccess)
      })
    },
    authenticateOidc (context) {
      const redirectPath = document.location.pathname + (document.location.search || '') + (document.location.hash || '')
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
            resolve(sessionStorage.getItem('vuex_oidc_active_route') || '/')
          })
          .catch(function (err) {
            context.commit('setOidcError', err)
            reject(err)
          })
      })
    },
    oidcWasAuthenticated(context, user) {
      context.commit('setOidcAuth', user)
      dispatchAuthenticationBrowserEvent()
    },
    authenticateOidcSilent(context) {
      oidcUserManager.signinSilent().then(function (user) {
        context.dispatch('oidcWasAuthenticatedSilent', user)
      }).catch(function () {
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
    setOidcError (state, error) {
      state.error = error
    }
  }

  return {
    state,
    getters,
    actions,
    mutations
  }
}
