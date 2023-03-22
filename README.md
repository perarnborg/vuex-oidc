# vuex-oidc

Vue.js implementation of [oidc-client-ts](https://github.com/authts/oidc-client-ts) (or [oidc-client](https://github.com/IdentityModel/oidc-client-js) in <v4) using vuex and vue-router.

> :warning: **Breaking changes**: vuex-oidc v4 introduces some breaking changes.
>
> * oidc-client-ts instead of oidc-client is now a required peer dependency
> * The Implicit Flow is no longer supported, Authorization Code Flow with PKCE is the only supported OAuth flow type
> * `vuexOidcProcessSilentSignInCallback`, which previously took no arguments, now needs the oidcSettings as an argument.

## Documentation

See the [wiki](https://github.com/perarnborg/vuex-oidc/wiki) for documentation on how to implement vuex-oidc. Docs for v3 can be found [here](https://github.com/perarnborg/vuex-oidc/wiki/v3).

## Examples

An example of an implementation can be found [here](https://github.com/perarnborg/vuex-oidc-example).

An example using Nuxt can be found [here](https://github.com/perarnborg/vuex-oidc-example-nuxt).

## Build status

Tests are run on https://travis-ci.org

[![Build Status](https://travis-ci.org/perarnborg/vuex-oidc.svg?branch=master)](https://travis-ci.org/perarnborg/vuex-oidc)

## License

[MIT](LICENSE).
