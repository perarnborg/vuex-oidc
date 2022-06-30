import { objectAssign } from '../services/utils'
import { getOidcConfig, getOidcCallbackPath, createOidcUserManager, addUserManagerEventListener, removeUserManagerEventListener, tokenIsExpired, tokenExp } from '../services/oidc-helpers'
import { dispatchCustomBrowserEvent } from '../services/browser-event'
import { openUrlWithIframe } from '../services/navigation'

export default (oidcSettings, storeSettings = {}, oidcEventListeners = {}) => {
  const oidcConfig = getOidcConfig(oidcSettings)
  const oidcUserManager = createOidcUserManager(oidcSettings)
  storeSettings = objectAssign([
    {
      namespaced: false,
      isAuthenticatedBy: 'id_token',
      removeUserWhenTokensExpire: true
    },
    storeSettings
  ])
  const oidcCallbackPath = getOidcCallbackPath(oidcConfig.redirect_uri, storeSettings.routeBase || '/')
  const oidcPopupCallbackPath = getOidcCallbackPath(oidcConfig.popup_redirect_uri, storeSettings.routeBase || '/')
  const oidcSilentCallbackPath = getOidcCallbackPath(oidcConfig.silent_redirect_uri, storeSettings.routeBase || '/')

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
        dispatchCustomBrowserEvent(eventName, detail || {})
      })
    })
  }

  const state = {
    access_token: null,
    id_token: null,
    refresh_token: null,
    user: null,
    scopes: null,
    is_checked: false,
    events_are_bound: false,
    error: null
  }

  const isAuthenticated = (state) => {
    if (state[storeSettings.isAuthenticatedBy]) {
      return true
    }

    return false
  }

  const authenticateOidcSilent = (context, payload = {}) => {
    // Take options for signinSilent from 1) payload or 2) storeSettings if defined there
    const options = payload.options || storeSettings.defaultSigninSilentOptions || {}
    return new Promise((resolve, reject) => {
      oidcUserManager.signinSilent(options)
        .then(user => {
          context.dispatch('oidcWasAuthenticated', user)
          resolve(user)
        })
        .catch(err => {
          context.commit('setOidcAuthIsChecked')
          if (payload.ignoreErrors) {
            resolve(null)
          } else {
            context.commit('setOidcError', errorPayload('authenticateOidcSilent', err))
            reject(err)
          }
        })
    })
  }

  const routeIsOidcCallback = (route) => {
    if (route.meta && route.meta.isOidcCallback) {
      return true
    }
    if (route.meta && Array.isArray(route.meta) && route.meta.reduce((isOidcCallback, meta) => meta.isOidcCallback || isOidcCallback, false)) {
      return true
    }
    if (route.path && route.path.replace(/\/$/, '') === oidcCallbackPath) {
      return true
    }
    if (route.path && route.path.replace(/\/$/, '') === oidcPopupCallbackPath) {
      return true
    }
    if (route.path && route.path.replace(/\/$/, '') === oidcSilentCallbackPath) {
      return true
    }
    return false
  }

  const routeIsPublic = (route) => {
    if (route.meta && route.meta.isPublic) {
      return true
    }
    if (route.meta && Array.isArray(route.meta) && route.meta.reduce((isPublic, meta) => meta.isPublic || isPublic, false)) {
      return true
    }
    if (storeSettings.publicRoutePaths && storeSettings.publicRoutePaths.map(path => path.replace(/\/$/, '')).indexOf(route.path.replace(/\/$/, '')) > -1) {
      return true
    }
    if (storeSettings.isPublicRoute && typeof storeSettings.isPublicRoute === 'function') {
      return storeSettings.isPublicRoute(route)
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
      return storeSettings.removeUserWhenTokensExpire && tokenIsExpired(state.id_token) ? null : state.id_token
    },
    oidcIdTokenExp: (state) => {
      return storeSettings.removeUserWhenTokensExpire ? tokenExp(state.id_token) : null
    },
    oidcRefreshToken: (state) => {
      return tokenIsExpired(state.refresh_token) ? null : state.refresh_token
    },
    oidcRefreshTokenExp: (state) => {
      return tokenExp(state.refresh_token)
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
        const getUserPromise = new Promise(resolve => {
          oidcUserManager.getUser().then(user => {
            resolve(user)
          }).catch(() => {
            resolve(null)
          })
        })
        const isAuthenticatedInStore = isAuthenticated(context.state)
        getUserPromise.then(user => {
          if (!user || user.expired) {
            const authenticateSilently = oidcConfig.silent_redirect_uri && oidcConfig.automaticSilentSignin
            if (routeIsPublic(route)) {
              if (isAuthenticatedInStore) {
                context.commit('unsetOidcAuth')
              }
              if (authenticateSilently) {
                authenticateOidcSilent(context, { ignoreErrors: true })
                  .catch(() => {})
              }
            } else {
              const authenticate = () => {
                if (isAuthenticatedInStore) {
                  context.commit('unsetOidcAuth')
                }
                context.dispatch('authenticateOidc', {
                  redirectPath: route.fullPath
                })
              }
              // If silent signin is set up, try to authenticate silently before denying access
              if (authenticateSilently) {
                authenticateOidcSilent(context, { ignoreErrors: true })
                  .then(() => {
                    oidcUserManager.getUser().then(user => {
                      if (!user || user.expired) {
                        authenticate()
                      }
                      resolve(!!user)
                    }).catch(() => {
                      authenticate()
                      resolve(false)
                    })
                  })
                  .catch(() => {
                    authenticate()
                    resolve(false)
                  })
                return
              }
              // If no silent signin is set up, perform explicit authentication and deny access
              authenticate()
              hasAccess = false
            }
          } else {
            context.dispatch('oidcWasAuthenticated', user)
            if (!isAuthenticatedInStore) {
              if (oidcEventListeners && typeof oidcEventListeners.userLoaded === 'function') {
                oidcEventListeners.userLoaded(user)
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
      const options = payload.options || storeSettings.defaultSigninRedirectOptions || {}
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
      return authenticateOidcSilent(context, payload)
    },
    authenticateOidcPopup (context, payload = {}) {
      // Take options for signinPopup from 1) payload or 2) storeSettings if defined there
      const options = payload.options || storeSettings.defaultSigninPopupOptions || {}
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
        oidcUserManager.events.addAccessTokenExpired(() => {
          if (storeSettings.removeUserWhenTokensExpire) {
            context.commit('unsetOidcAuth')
          } else {
            context.commit('unsetOidcAccessToken')
          }
        })
        if (oidcSettings.automaticSilentRenew) {
          oidcUserManager.events.addAccessTokenExpiring(() => {
            authenticateOidcSilent(context)
              .catch((err) => {
                dispatchCustomErrorEvent('automaticSilentRenewError', errorPayload('authenticateOidcSilent', err))
              })
          })
        }
        context.commit('setOidcEventsAreBound')
      }
      context.commit('setOidcAuthIsChecked')
    },
    storeOidcUser (context, user) {
      return oidcUserManager.storeUser(user)
        .then(() => oidcUserManager.getUser())
        .then(user => context.dispatch('oidcWasAuthenticated', user))
        .then(() => {})
        .catch(err => {
          context.commit('setOidcError', errorPayload('storeOidcUser', err))
          context.commit('setOidcAuthIsChecked')
          throw err
        })
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
    signOutOidc (context, payload) {
      /* istanbul ignore next */
      return oidcUserManager.signoutRedirect(payload).then(() => {
        context.commit('unsetOidcAuth')
      })
    },
    signOutOidcCallback (context) {
      /* istanbul ignore next */
      return oidcUserManager.signoutRedirectCallback()
    },
    signOutPopupOidc (context, payload) {
      /* istanbul ignore next */
      return oidcUserManager.signoutPopup(payload).then(() => {
        context.commit('unsetOidcAuth')
      })
    },
    signOutPopupOidcCallback (context) {
      /* istanbul ignore next */
      return oidcUserManager.signoutPopupCallback()
    },
    signOutOidcSilent (context, payload) {
      /* istanbul ignore next */
      return new Promise((resolve, reject) => {
        try {
          oidcUserManager.getUser()
            .then((user) => {
              const args = objectAssign([
                payload || {},
                {
                  id_token_hint: user ? user.id_token : null
                }
              ])
              if (payload && payload.id_token_hint) {
                args.id_token_hint = payload.id_token_hint
              }
              oidcUserManager.createSignoutRequest(args)
                .then((signoutRequest) => {
                  openUrlWithIframe(signoutRequest.url)
                    .then(() => {
                      context.dispatch('removeOidcUser')
                      resolve()
                    })
                    .catch((err) => reject(err))
                })
                .catch((err) => reject(err))
            })
            .catch((err) => reject(err))
        } catch (err) {
          reject(err)
        }
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
    },
    clearStaleState () {
      return oidcUserManager.clearStaleState()
    },
    startSilentRenew () {
      return oidcUserManager.startSilentRenew()
    },
    stopSilentRenew () {
      return oidcUserManager.stopSilentRenew()
    }
  }

  /* istanbul ignore next */
  const mutations = {
    setOidcAuth (state, user) {
      state.id_token = user.id_token
      state.access_token = user.access_token
      state.refresh_token = user.refresh_token
      state.user = user.profile
      state.scopes = user.scopes
      state.error = null
    },
    setOidcUser (state, user) {
      state.user = user ? user.profile : null
    },
    unsetOidcAuth (state) {
      state.id_token = null
      state.access_token = null
      state.refresh_token = null
      state.user = null
    },
    unsetOidcAccessToken (state) {
      state.access_token = null
      state.refresh_token = null
    },
    setOidcAuthIsChecked (state) {
      state.is_checked = true
    },
    setOidcEventsAreBound (state) {
      state.events_are_bound = true
    },
    setOidcError (state, payload) {
      state.error = payload.error
      dispatchCustomErrorEvent('oidcError', payload)
    }
  }

  const errorPayload = (context, error) => {
    return {
      context,
      error: error && error.message ? error.message : error
    }
  }

  const dispatchCustomErrorEvent = (eventName, payload) => {
    // oidcError and automaticSilentRenewError are not UserManagement events, they are events implemeted in vuex-oidc,
    if (typeof oidcEventListeners[eventName] === 'function') {
      oidcEventListeners[eventName](payload)
    }
    if (storeSettings.dispatchEventsOnWindow) {
      dispatchCustomBrowserEvent(eventName, payload)
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
