import { createOidcUserManager } from '../services/oidc-helpers'

export default (oidcConfig) => {

  const oidcUserManager = createOidcUserManager(oidcConfig)

  const state = {
    access_token: null,
    id_token: null,
    user: null
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
    }
  }

  const actions = {
    checkOidcAuthentication (context, route) {
      if (!context.getters.oidcIsAuthenticated && !route.meta.isOidcCallback) {
        if (route.meta.isPublic) {
          context.dispatch('authenticateOidcSilent')
        } else if (oidcConfig.silent_redirect_uri){
          context.dispatch('authenticateOidc', route)
        }
      }
    },
    authenticateOidc (context, route) {
      sessionStorage.setItem('vuex_oidc_active_route', route.path)
      oidcUserManager.signinRedirect().catch(function(err) {
        console.log(err)
      })
    },
    oidcSignInCallback(context) {
      oidcUserManager.signinRedirectCallback().then(function (user) {
        context.dispatch('oidcWasAuthenticated', user)
      }).catch(function (err) {
        if (err.message === 'No matching state found in storage') {
        }
      })
    },
    oidcWasAuthenticated(context, user) {
      context.commit('setOidcAuth', user)
      context.dispatch('getOidcUser')
    },
    authenticateOidcSilent(context) {
      oidcUserManager.signinSilent().then(function (user) {
        context.dispatch('oidcWasAuthenticatedSilent', user)
      }).catch(function () {
      })
    },
    oidcWasAuthenticatedSilent(context, user) {
      context.commit('setOidcAuth', user)
      context.dispatch('getOidcUser')
    },
    getOidcUser (context) {
      oidcUserManager.getOidcUser().then(function(user) {
        context.commit('setOidcUser', user.profile)
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
    },
    setOidcUser (state, user) {
      state.user = user
    },
    unsetOidcAuth (state) {
      state.token = null
      state.token = null
    }
  }

  return {
    state,
    getters,
    actions,
    mutations
  }
}
