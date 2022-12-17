# vuex-oidc changelog

## 4.0.0
*2022-12-18*

### Breaking Changes
* oidc-client-ts instead of oidc-client is now a required peer dependency
* The Implicit Flow is no longer supported, Authorization Code Flow with PKCE is the only supported OAuth flow type
* `vuexOidcProcessSilentSignInCallback`, which previously took no arguments, now needs the oidcSettings as an argument.

## 3.11.0
*2022-06-30*

### Features
* Stop relying on exp claim to check if access tokens are expired
* Allow not removing user when tokens expire

## 3.10.2
*2021-02-09*

### Fixes
* Add missing typing

## 3.10.1
*2020-10-09*

### Fixes
* Check expired user when signing in silently in check access
* Add error payloads to typings

## 3.10.0
*2020-09-17*

### Features
* Support nuxt route meta arrays

### Fixes
* Fix storeSettings.isPublicRoute being ignored when publicRoutePaths is set
* Ignore oidcError in some silent authentications

## 3.9.8
*2020-09-14*

### Fixes
* Fix for automaticSilentRenew and automaticSilentSignin

## 3.9.7
*2020-09-06*

### Fixes
* Add automaticSilentRenewError event

## 3.9.6
*2020-09-02*

### Fixes
* Fix silentSignOut not removing user from storage
* Minor type script fixes of action typings

## 3.9.5
*2020-09-02*

### Fixes
* Fix authenticateOidcSilent not getting rejected if it fails

## 3.9.4
*2020-09-02*

### Fixes
* Fix error in silentSignOut

## 3.9.3
*2020-09-02*

### Fixes
* Fix error in silentSignOut

## 3.9.2
*2020-09-01*

### Fixes
* Send id_token_hint in signOutOidcSilent

## 3.9.1
*2020-08-29*

### Fixes
* silent_redirect_uri is always public if it is an app route

## 3.9.0
*2020-08-29*

### Features
* vuexOidcProcessSilentSignInCallback returns promise

## 3.8.0
*2020-08-18*

### Features
* signOutOidcSilent action added

## 3.7.2
*2020-08-18*

### Fixes
* Change import of oidc-client

## 3.7.1
*2020-08-17*

### Bug fixes
* Fix authenticateOidcSilent action not returning promise
* Fix incorrect type script type for getOidcUser action

## 3.7.0
*2020-08-14*

### Feature
* Attempt silent signin on protected routes

## 3.6.0
*2020-08-14*

### Chore
* Update Babel
* Update oidc-client

## 3.5.3
*2020-08-05*

### Fixes
* Fix type script inconsistencies

## 3.5.2
*2020-08-05*

### Bug fixes
* Fix type error when dispatching getOidcUser if there is no user

## 3.5.1
*2020-04-21*

### Features
* Add 2 missing type script typings

## 3.5.0
*2020-04-16*

### Features
* Add type script typings
* isAuthenticatedBy setting that can use access_token for isAuthenticated getter and access checker
* Store refresh token in store

## 3.4.3
*2020-03-11*

### Features
* Add storeOidcUser action
* Add clearStaleState action

## 3.4.2
*2020-03-11*

### Features
* Add signOutOidcCallback, signOutPopupOidc and signOutPopupOidcCallback actions

## 3.4.1
*2020-02-06*

### Features
* Add automaticSilentSignin option to config

## 3.4.0
*2019-12-30*

### Chore
* Update dependencies

### Features
* Add payload to signoutOidc which is passed on as args to signoutRedirect

## 3.3.1
*2019-11-06*

### Chore
* Implementing linting with StandardJS
* Remove vue-router as peer dependency

## 3.3.0
*2019-10-22*

### Features
* Implement signinPopup with authenticateOidcPopup action

### Chore
* Change name of removeUser action to removeOidcUser. removeUser is still a synonym

## 3.2.0
*2019-10-17*

### Features
* Allow options for authenticateOidc and authenticateOidcSilent actions

## 3.1.6
*2019-10-12*

### Features
* Return promise in getOidcUser

## 3.1.5
*2019-09-23*

### Features
* Add oidcError event

## 3.1.4
*2019-09-22*

### Features
* Add removeUser action to have a client side signout

## 3.1.3
*2019-09-22*

### Features
* Remove special handling of router hash mode

## 3.1.2
*2019-09-10*

### Features
* Fix payload in window events

## 3.1.1
*2019-09-03*

### Features
* Add url paramater to oidcSignInCallback action

## 3.1.0
*2019-09-01*

### Features
* Enable support for vue-router hash mode.

## 3.0.0
*2019-08-15*

### Breaking Changes
* oidc-client is now a peer dependency, and it needs to be installed separately.

### Chore
* Upgrade dev dependencies, to Babel 7 and Rollup 1.

## 2.0.4
*2019-07-29*

### Features
* Add isPublicRoute option to store in order to customize check from client.

## 2.0.3
*2019-07-29*

### Bug fixes
* publicRoutePaths works with trailing slashes.

## 2.0.2
*2019-07-16*

### Bug fixes
* Fix getOidcCallbackPath for trailing slash and routeBase + add tests.

## 2.0.1
*2019-05-29*

### Features
* Implemented scopes retrieval.

## 2.0.0
*2019-05-11*

### Features
* Nuxt support added.

## 1.15.3
*2019-03-31*

### Bug fixes
* Fix error on expiration events.

## 1.15.2
*2019-03-28*

### Features
* Dispatch userLoaded event when user is loaded from storage.
* Make sure auto silent renew is starting after user is loaded from storage.

## 1.15.1
*2019-03-27*

### Chore
* Control minor version of oidc-client.

## 1.15.0
*2019-03-25*

### Features
* Check access checks userManager before reauthenticating.

## 1.14.0
*2019-03-12*

### Chore
* Translate settings from camelCase to snake_case.

## 1.13.0
*2019-02-12*

### Chore
* Update dependencies.

## 1.12.1
*2018-12-06*

### Bug fixes
* Catch silent auth error.

## 1.12.0
*2018-12-04*

### Chore
* Implement Travis CI.

### Features
* Let oidc-client check expiration.

## 1.11.3
*2018-11-15*

### Chore
* Update oidc-client.

## 1.11.2
*2018-11-09*

### Features
* Only dispatch window events if setting is true.

## 1.11.1
*2018-11-08*

### Chore
* Start linting.

## 1.11.0
*2018-11-09*

### Features
* Check user in oidc-client when checking access
* Sign out user in store if signed out in oidc-client
* Dispatch browser events for each oidc-client event.

## 1.10.5
*2018-10-29*

### Bug fixes
* Fix bug in process silent renew.

## 1.10.4
*2018-10-29*

### Bug fixes
* Fix expiration check.

## 1.10.3
*2018-10-29*

### Features
* Implement oidc automatic renewal within vuex.

## 1.10.2
*2018-10-29*

### Bug fixes
* Fix expiration date.

## 1.10.1
*2018-10-29*

### Bug fixes
* Handle unexpected tokens.

## 1.10.0
*2018-10-26*

### Features
* Change interface for events.
