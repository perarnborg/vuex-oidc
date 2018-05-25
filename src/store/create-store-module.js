import { createOidcUserManager } from '../services/oidc-helpers'

export default (oidcConfig, router) => {

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
    checkOidcAuthentication ({ getters, dispatch }, route) {
      if (!getters.oidcIsAuthenticated && !route.meta.isOidcCallback) {
        if (route.meta.isPublic) {
          dispatch('authenticateOidcSilent')
        } else if (oidcConfig.silent_redirect_uri){
          dispatch('authenticateOidc', route)
        }
      }
    },
    authenticateOidc ({ dispatch }, route) {
      sessionStorage.setItem('vuex_oidc_active_route', route.path)
      oidcUserManager.signinRedirect().catch(function(err) {
        console.log(err)
      })
    },
    oidcSignInCallback({ dispatch }) {
      oidcUserManager.signinRedirectCallback().then(function (user) {
        dispatch('oidcWasAuthenticated', user)
      }).catch(function (err) {
        if (err.message === 'No matching state found in storage') {
        }
      })
    },
    oidcWasAuthenticated({ dispatch, commit }, user) {
      commit('setOidcAuth', user)
      dispatch('getOidcUser')
      router.push(sessionStorage.getItem('vuex_oidc_active_route') || '/')
    },
    authenticateOidcSilent({ dispatch }) {
      oidcUserManager.signinSilent().then(function (user) {
        dispatch('oidcWasAuthenticatedSilent', user)
      }).catch(function () {
      })
    },
    oidcWasAuthenticatedSilent({ dispatch, commit }, user) {
      commit('setOidcAuth', user)
      dispatch('getOidcUser')
    },
    getOidcUser ({ commit }) {
      oidcUserManager.getOidcUser().then(function(user) {
        commit('setOidcUser', user.profile)
      }).catch(function(err) {
        console.log(err)
      })
    },
    signOutOidc ({ commit }) {
      oidcUserManager.signoutRedirect().then(function(resp) {
        commit('unsetOidcAuth')
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
