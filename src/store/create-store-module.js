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
    checkAuthentication ({ getters, dispatch }, route) {
      if (!getters.oidcIsAuthenticated && !route.meta.isOidcCallback) {
        if (route.meta.isPublic) {
          dispatch('authenticateSilent')
        } else if (oidcConfig.silent_redirect_uri){
          dispatch('authenticate', route)
        }
      }
    },
    authenticate ({ dispatch }, route) {
      sessionStorage.setItem('vuex_oidc_active_route', route.path)
      oidcUserManager.signinRedirect().catch(function(err) {
        console.log(err)
      })
    },
    signInCallback({ dispatch }) {
      oidcUserManager.signinRedirectCallback().then(function (user) {
        dispatch('wasAuthenticated', user)
      }).catch(function (err) {
        if (err.message === 'No matching state found in storage') {
        }
      })
    },
    wasAuthenticated({ dispatch, commit }, user) {
      commit('setAuth', user)
      dispatch('getUser')
      router.push(sessionStorage.getItem('vuex_oidc_active_route') || '/')
    },
    authenticateSilent({ dispatch }) {
      oidcUserManager.signinSilent().then(function (user) {
        dispatch('wasAuthenticatedSilent', user)
      }).catch(function () {
      })
    },
    wasAuthenticatedSilent({ dispatch, commit }, user) {
      commit('setAuth', user)
      dispatch('getUser')
    },
    getUser ({ commit }) {
      oidcUserManager.getUser().then(function(user) {
        commit('setUser', user.profile)
      }).catch(function(err) {
        console.log(err)
      })
    },
    signOut ({ commit }) {
      oidcUserManager.signoutRedirect().then(function(resp) {
        commit('unsetAuth')
      }).catch(function(err) {
        console.log(err)
      })
    }
  }

  const mutations = {
    setAuth (state, user) {
      state.id_token = user.id_token
      state.access_token = user.access_token
    },
    setUser (state, user) {
      state.user = user
    },
    unsetAuth (state) {
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
