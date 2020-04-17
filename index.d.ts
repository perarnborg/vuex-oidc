import { ActionContext, Module, Store } from 'vuex';
import { OidcClientSettings, User, UserManager } from 'oidc-client';
import { Route, RouteConfig } from 'vue-router';

export interface VuexOidcClientSettings extends OidcClientSettings {
  authority: string;
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  maxAge?: string;
  uiLocales?: string;
  loginHint?: string;
  acrValues?: string;
  postLogoutRedirectUri?: string;
  popupRedirectUri?: string;
  silentRedirectUri?: string;
  automaticSilentRenew?: boolean;
}

export interface VuexOidcSigninRedirectOptions {
  useReplaceToNavigate?: boolean;
}

export interface VuexOidcSigninSilentOptions {}

export interface VuexOidcSigninPopupOptions {}

export interface VuexOidcStoreSettings {
  namespaced?: boolean;
  dispatchEventsOnWindow?: boolean;
  isPublicRoute?: (route: Route) => boolean;
  publicRoutePaths?: string[];
  routeBase?: string;
  defaultSigninRedirectOptions?: VuexOidcSigninRedirectOptions;
  defaultSigninSilentOptions?: VuexOidcSigninSilentOptions;
  defaultSigninPopupOptions?: VuexOidcSigninPopupOptions;
}

export interface VuexOidcStoreListeners {
  userLoaded?: (user: User) => void;
  userUnloaded?: () => void;
  accessTokenExpiring?: () => void;
  accessTokenExpired?: () => void;
  silentRenewError: () => void;
  userSignedOut?: () => void;
}

export interface VuexOidcState {
  access_token: string | null;
  id_token: string | null;
  user: any | null;
  scopes: string[] | null;
  is_checked: boolean;
  events_are_bound: boolean;
  error: string | null;
}

export function vuexOidcCreateUserManager(settings: VuexOidcClientSettings): UserManager;

export function vuexOidcCreateStoreModule(
  settings: VuexOidcClientSettings,
  storeSettings?: VuexOidcStoreSettings,
  listeners?: VuexOidcStoreListeners,
): Module<VuexOidcState, any>;

export function vuexOidcCreateNuxtRouterMiddleware(namespace?: string): any;

export function vuexOidcCreateRouterMiddleware(store: Store<any>, namespace?: string): any;

export function vuexOidcProcessSilentSignInCallback(): void;

export function vuexOidcProcessSignInCallback(settings: VuexOidcClientSettings): void;

export function vuexOidcGetOidcCallbackPath(callbackUri: string, routeBase?: string): void;

export namespace vuexOidcUtils {
  export function objectAssign(objs: any[]): any;

  export function parseJwt<T extends object>(jwt: string): T;

  export function firstLetterUppercase(str: string): string;

  export function camelCaseToSnakeCase(str: string): string;
}

export function vuexDispatchCustomBrowserEvent<T>(
  name: string,
  detail?: T,
  params?: EventInit,
): any;

// The following types are not exposed directly, they are part of the store
// and mostly for reference, or for use with vuex-class.

export interface VuexOidcStoreGetters {
  readonly oidcIsAuthenticated: boolean;
  readonly oidcUser: any | null;
  readonly oidcAccessToken: string | null;
  readonly oidcAccessTokenExp: number | null;
  readonly oidcScopes: string[] | null;
  readonly oidcIdToken: string | null;
  readonly oidcIdTokenExp: number | null;
  readonly oidcAuthenticationIsChecked: boolean | null;
  readonly oidcError: string | null;
  readonly oidcIsRoutePublic: (route: RouteConfig) => boolean;
}

export interface VuexOidcStoreActions {
  oidcCheckAccess: (route: Route) => Promise<boolean>;
  authenticateOidc: (payload: { redirectPath?: string }) => Promise<void>;
  authenticateOidcSilent: (payload: { options?: VuexOidcSigninSilentOptions }) => Promise<void>;
  authenticateOidcPopup: (payload: { options?: VuexOidcSigninPopupOptions }) => Promise<void>;
  oidcSignInCallback: (url?: string) => Promise<string>;
  oidcSignInPopupCallback: (url?: string) => Promise<User | undefined>;
  oidcWasAuthenticated: (user: User) => void;
  getOidcUser: () => void;
  addOidcEventListener: (payload: {
    eventName: string;
    eventListener: (...args: any[]) => void;
  }) => void;
  removeOidcEventListener: (payload: {
    eventName: string;
    eventListener: (...args: any[]) => void;
  }) => void;
  signOutOidc: () => void;
  removeOidcUser: () => void;
}

export interface VuexOidcStoreMutations {
  setOidcAuth: (user: User) => void;
  setOidcUser: (user: User) => void;
  unsetOidcAuth: () => void;
  setOidcAuthIsChecked: () => void;
  setOidcEventsAreBound: () => void;
  setOidcError: (err: Error | string | null) => void;
}
