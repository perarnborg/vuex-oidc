# vuex-oidc changelog

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
