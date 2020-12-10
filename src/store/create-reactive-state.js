import { computed, reactive, toRefs } from 'vue';
import { objectAssign } from '../services/utils';
import { getOidcConfig, getOidcCallbackPath, createOidcUserManager, addUserManagerEventListener, removeUserManagerEventListener, tokenIsExpired, tokenExp } from '../services/oidc-helpers';
import { dispatchCustomBrowserEvent } from '../services/browser-event';
import { openUrlWithIframe } from '../services/navigation';

const state = reactive({
  access_token: null,
  id_token: null,
  refresh_token: null,
  user: null,
  scopes: null,
  is_checked: false,
  events_are_bound: false,
  error: null
});

export default (oidcSettings, stateSettings = {}, oidcEventListeners = {}) => {
  const oidcConfig = getOidcConfig(oidcSettings);
  const oidcUserManager = createOidcUserManager(oidcSettings);
  stateSettings = objectAssign([
    {
      namespaced: false,
      isAuthenticatedBy: 'id_token'
    },
    stateSettings
  ]);
  const oidcCallbackPath = getOidcCallbackPath(oidcConfig.redirect_uri, stateSettings.routeBase || '/');
  const oidcPopupCallbackPath = getOidcCallbackPath(oidcConfig.popup_redirect_uri, stateSettings.routeBase || '/');
  const oidcSilentCallbackPath = getOidcCallbackPath(oidcConfig.silent_redirect_uri, stateSettings.routeBase || '/');

  // Add event listeners passed into factory function
  Object.keys(oidcEventListeners).forEach(eventName => {
    addUserManagerEventListener(oidcUserManager, eventName, oidcEventListeners[eventName])
  });

  if (stateSettings.dispatchEventsOnWindow) {
    // Dispatch oidc-client events on window (if in browser)
    const userManagerEvents = [
      'userLoaded',
      'userUnloaded',
      'accessTokenExpiring',
      'accessTokenExpired',
      'silentRenewError',
      'userSignedOut'
    ];
    userManagerEvents.forEach(eventName => {
      addUserManagerEventListener(oidcUserManager, eventName, (detail) => {
        dispatchCustomBrowserEvent(eventName, detail || {})
      })
    });
  }

  const fn = {
    isAuthenticated: (state) => !!state[stateSettings.isAuthenticatedBy],

    routeIsOidcCallback: (route) => {
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
    },

    routeIsPublic: (route) => {
      if (route.meta && route.meta.isPublic) {
        return true
      }
      if (route.meta && Array.isArray(route.meta) && route.meta.reduce((isPublic, meta) => meta.isPublic || isPublic, false)) {
        return true
      }
      if (stateSettings.publicRoutePaths && stateSettings.publicRoutePaths.map(path => path.replace(/\/$/, '')).indexOf(route.path.replace(/\/$/, '')) > -1) {
        return true
      }
      if (stateSettings.isPublicRoute && typeof stateSettings.isPublicRoute === 'function') {
        return stateSettings.isPublicRoute(route)
      }
      return false
    },

    errorPayload: (context, error) => {
      return {
        context,
        error: error && error.message ? error.message : error
      }
    },
  
    dispatchCustomErrorEvent: (eventName, payload) => {
      // oidcError and automaticSilentRenewError are not UserManagement events, they are events implemeted in vuex-oidc,
      if (typeof oidcEventListeners[eventName] === 'function') {
        oidcEventListeners[eventName](payload)
      }
      if (stateSettings.dispatchEventsOnWindow) {
        dispatchCustomBrowserEvent(eventName, payload)
      }
    }
  };

  const getters = {
    oidcIsAuthenticated: computed(() => isAuthenticated(state)),
    oidcUser: computed(() => state.user),
    oidcAccessToken: computed(() => tokenIsExpired(state.access_token) ? null : state.access_token),
    oidcAccessTokenExp: computed(() => tokenExp(state.access_token)),
    oidcScopes: computed(() => state.scopes),
    oidcIdToken: computed(() => tokenIsExpired(state.id_token) ? null : state.id_token),
    oidcIdTokenExp: computed(() => tokenExp(state.id_token)),
    oidcRefreshToken: computed(() => tokenIsExpired(state.refresh_token) ? null : state.refresh_token),
    oidcRefreshTokenExp: computed(() => tokenExp(state.refresh_token)),
    oidcAuthenticationIsChecked: computed(() => state.is_checked),
    oidcError: computed(() => state.error)
  };

  const mutations = {
    setOidcAuth(user) {
      state.id_token = user.id_token
      state.access_token = user.access_token
      state.refresh_token = user.refresh_token
      state.user = user.profile
      state.scopes = user.scopes
      state.error = null
    },
    setOidcUser(user) {
      state.user = user ? user.profile : null
    },
    unsetOidcAuth() {
      state.id_token = null
      state.access_token = null
      state.refresh_token = null
      state.user = null
    },
    setOidcAuthIsChecked() {
      state.is_checked = true
    },
    setOidcEventsAreBound() {
      state.events_are_bound = true
    },
    setOidcError(payload) {
      state.error = payload.error
      dispatchCustomErrorEvent('oidcError', payload)
    }
  };

  const methods = {
    authenticateOidcSilent: (payload = {}) => {
      // Take options for signinSilent from 1) payload or 2) storeSettings if defined there
      const options = payload.options || stateSettings.defaultSigninSilentOptions || {};
      return new Promise((resolve, reject) => {
        oidcUserManager.signinSilent(options)
          .then(user => {
            this.oidcWasAuthenticated(user);
            resolve(user);
          })
          .catch(err => {
            mutations.setOidcAuthIsChecked();
            if (payload.ignoreErrors) {
              resolve(null);
            } else {
              mutations.setOidcError(errorPayload('authenticateOidcSilent', err));
              reject(err);
            }
          })
      })
    },
    oidcCheckAccess (context, route) {
      return new Promise(resolve => {
        if (routeIsOidcCallback(route)) {
          resolve(true);
        }
        let hasAccess = true;
        const getUserPromise = new Promise(resolve => {
          oidcUserManager.getUser().then(user => {
            resolve(user);
          }).catch(() => {
            resolve(null);
          })
        })
        const isAuthenticatedInStore = isAuthenticated(state);
        getUserPromise.then(user => {
          if (!user || user.expired) {
            const authenticateSilently = oidcConfig.silent_redirect_uri && oidcConfig.automaticSilentSignin;
            if (routeIsPublic(route)) {
              if (isAuthenticatedInStore) {
                mutations.unsetOidcAuth();
              }
              if (authenticateSilently) {
                authenticateOidcSilent({ ignoreErrors: true })
                  .catch(() => {});
              }
            } else {
              const authenticate = () => {
                if (isAuthenticatedInStore) {
                  mutations.unsetOidcAuth();
                }
                this.authenticateOidc({
                  redirectPath: route.fullPath
                });
              }
              // If silent signin is set up, try to authenticate silently before denying access
              if (authenticateSilently) {
                this.authenticateOidcSilent(context, { ignoreErrors: true })
                  .then(() => {
                    oidcUserManager.getUser().then(user => {
                      if (!user || user.expired) {
                        authenticate();
                      }
                      resolve(!!user)
                    }).catch(() => {
                      authenticate();
                      resolve(false);
                    })
                  })
                  .catch(() => {
                    authenticate();
                    resolve(false);
                  });
                return;
              }
              // If no silent signin is set up, perform explicit authentication and deny access
              authenticate();
              hasAccess = false;
            }
          } else {
            this.oidcWasAuthenticated(user);
            if (!isAuthenticatedInStore) {
              if (oidcEventListeners && typeof oidcEventListeners.userLoaded === 'function') {
                oidcEventListeners.userLoaded(user);
              }
              if (stateSettings.dispatchEventsOnWindow) {
                dispatchCustomBrowserEvent('userLoaded', user);
              }
            }
          }
          resolve(hasAccess);
        })
      })
    },
    authenticateOidc(payload = {}) {
      if (typeof payload === 'string') {
        payload = { redirectPath: payload };
      }
      if (payload.redirectPath) {
        sessionStorage.setItem('vuex_oidc_active_route', payload.redirectPath);
      } else {
        sessionStorage.removeItem('vuex_oidc_active_route');
      }
      // Take options for signinRedirect from 1) payload or 2) storeSettings if defined there
      const options = payload.options || stateSettings.defaultSigninRedirectOptions || {};
      return oidcUserManager.signinRedirect(options).catch(err => {
        mutations.setOidcError(errorPayload('authenticateOidc', err))
      });
    },
    oidcSignInCallback(url) {
      return new Promise((resolve, reject) => {
        oidcUserManager.signinRedirectCallback(url)
          .then(user => {
            this.oidcWasAuthenticated(user);
            resolve(sessionStorage.getItem('vuex_oidc_active_route') || '/');
          })
          .catch(err => {
            mutations.setOidcError(errorPayload('oidcSignInCallback', err));
            mutations.setOidcAuthIsChecked();
            reject(err);
          });
      })
    },
    authenticateOidcPopup(payload = {}) {
      // Take options for signinPopup from 1) payload or 2) storeSettings if defined there
      const options = payload.options || stateSettings.defaultSigninPopupOptions || {};
      return oidcUserManager.signinPopup(options)
        .then(user => {
          this.oidcWasAuthenticated(user);
        })
        .catch(err => {
          mutations.setOidcError(errorPayload('authenticateOidcPopup', err));
        });
    },
    oidcSignInPopupCallback (context, url) {
      return new Promise((resolve, reject) => {
        oidcUserManager.signinPopupCallback(url)
          .catch(err => {
            mutations.setOidcError(errorPayload('oidcSignInPopupCallback', err));
            mutations.setOidcAuthIsChecked();
            reject(err);
          });
      });
    },
    oidcWasAuthenticated (context, user) {
      mutations.setOidcAuth(user);
      if (!context.state.events_are_bound) {
        oidcUserManager.events.addAccessTokenExpired(() => { mutations.unsetOidcAuth() });
        if (oidcSettings.automaticSilentRenew) {
          oidcUserManager.events.addAccessTokenExpiring(() => {
            authenticateOidcSilent(context)
              .catch((err) => {
                dispatchCustomErrorEvent('automaticSilentRenewError', errorPayload('authenticateOidcSilent', err));
              })
          });
        }
        mutations.setOidcEventsAreBound();
      }
      mutations.setOidcAuthIsChecked();
    },
    storeOidcUser (context, user) {
      return oidcUserManager.storeUser(user)
        .then(() => oidcUserManager.getUser())
        .then(user => this.oidcWasAuthenticated(user))
        .then(() => {})
        .catch(err => {
          mutations.setOidcError(errorPayload('storeOidcUser', err));
          mutations.setOidcAuthIsChecked();
          throw err;
        });
    },
    getOidcUser (context) {
      /* istanbul ignore next */
      return oidcUserManager.getUser().then(user => {
        mutations.setOidcUser(user);
        return user;
      });
    },
    addOidcEventListener (context, payload) {
      /* istanbul ignore next */
      addUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener);
    },
    removeOidcEventListener (context, payload) {
      /* istanbul ignore next */
      removeUserManagerEventListener(oidcUserManager, payload.eventName, payload.eventListener);
    },
    signOutOidc(payload) {
      return oidcUserManager.signoutRedirect(payload).then(() => {
        mutations.unsetOidcAuth();
      });
    },
    signOutOidcCallback() {
      return oidcUserManager.signoutRedirectCallback();
    },
    signOutPopupOidc(payload) {
      return oidcUserManager.signoutPopup(payload).then(() => {
        mutations.unsetOidcAuth();
      });
    },
    signOutPopupOidcCallback() {
      return oidcUserManager.signoutPopupCallback();
    },
    signOutOidcSilent(payload) {
      return new Promise((resolve, reject) => {
        try {
          oidcUserManager.getUser()
            .then((user) => {
              const args = objectAssign([
                payload || {},
                {
                  id_token_hint: user ? user.id_token : null
                }
              ]);
              if (payload && payload.id_token_hint) {
                args.id_token_hint = payload.id_token_hint;
              }
              oidcUserManager.createSignoutRequest(args)
                .then((signoutRequest) => {
                  openUrlWithIframe(signoutRequest.url)
                    .then(() => {
                      this.removeOidcUser();
                      resolve()
                    })
                    .catch((err) => reject(err));
                })
                .catch((err) => reject(err));
            })
            .catch((err) => reject(err));
        } catch (err) {
          reject(err);
        }
      })
    },
    removeUser() {
      return this.removeOidcUser();
    },
    removeOidcUser() {
      return oidcUserManager.removeUser().then(() => {
        mutations.unsetOidcAuth();
      });
    },
    clearStaleState() {
      return oidcUserManager.clearStaleState();
    },
    oidcIsRoutePublic() {
      return (route) => fn.routeIsPublic(route);
    }
  };

  const reactiveState = {
    ...stateSettings,
    ...toRefs(state),
    ...getters,
    ...methods
  };

  if (typeof reactiveState.dispatchEventsOnWindow !== 'undefined') {
    delete reactiveState.dispatchEventsOnWindow;
  }

  return reactiveState;
}
