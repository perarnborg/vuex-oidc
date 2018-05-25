# vuex-oidc

Vue.js implementation of oidc-client using vuex and vue-router.

## Getting started

The library is available as an [npm package](https://www.npmjs.com/package/vuex-oidc).
To install the package run:

```bash
npm install vuex-oidc --save
```

### 1) Create your oidc settings

```js
export const oidcConfig = {
  authority: 'https://your_oidc_authority',
  client_id: 'your_client_id',
  redirect_uri: 'http://localhost:1337/oidc-callback',
  response_type: 'openid profile email api1',
  scope: 'openid profile'
}

```

Check out documentation for oidc-client to see all options: https://github.com/IdentityModel/oidc-client-js/wiki

### 2) Setup vuex

Import and use vuex module

```js
import { vuexOidcCreateStoreModule } from 'vuex-oidc'
import { oidcConfig } from '@/config'

export default new Vuex.Store({
  modules: {
    vuexOidcCreateStoreModule(oidcConfig)
  }
})

```

### 3) Setup route for Open id callback

```js
import { VuexOidcSigningCallbackComponent } from 'vuex-oidc'

const routes = [
  ...yourApplicationsRoutes,
  {
    path: '/oidc-callback', // Needs to match redirect_uri in you oidcConfig
    name: 'oidcCallback',
    component: VuexOidcSigningCallbackComponent,
    meta {
      isVuexOidcCallback: true
    }
  }
]

```

If you want to have a loader/spinner on the callback route this is what the markup of the callback component looks like:

```html
<div class="vuex-oidc-loader">
  <div class="vuex-oidc-loader__inner"></div>
</div>

```

### 4) Setup vue-router

Create the oidc router middleware with factory funtion vuexOidcCreateRouterMiddleware that takes your vuex store as argument.

```js
import Router from 'vue-router'
import { vuexOidcCreateRouterMiddleware } from 'vuex-oidc'

import store from '@/store'

const router = new Router({
  mode: 'history',
  routes: routes
})
router.beforeEach(vuexOidcCreateRouterMiddleware(store))

```

### 5) Control rendering in routes that require authentication

The vuex getter oidcIsAuthenticated can be used to check login. This can be done in any way you want. Here is an example
of how to condition rendering against authentication in a component.

```js
<template>
  <div v-if="oidcIsAuthenticated">
    Protected content
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'MyProtectedRouteComponent',
  computed: {
    ...mapGetters([
      'oidcIsAuthenticated'
    ])
  }
}
</script>

```

### 6) Optional: display signed in user info

Use vuex getter oidcUser.

```js
<template>
  <div v-if="oidcUser">
    Signed in as {{ oidcUser.email }}
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'MyProtectedRouteComponent',
  computed: {
    ...mapGetters([
      'oidcUser'
    ])
  }
}
</script>

```

### 7) Optional: set specific routes as public

```js
import { PublicRouteComponent } from '@/components/PublicRouteComponent'

const routes = [
  ...yourApplicationsRoutes,
  {
    path: '/public',
    name: 'publicRoute',
    component: PublicRouteComponent,
    meta: {
      isPublic: true
    }
  }
]

```

Routes with meta.isPublic will not require authentication. If you have setup a silent_redirect_uri a silent signIn will be made on public routes.


### 8) Optional: setup silent renew callback

```js
export const oidcConfig = {
  ...youOidcOtherSettings,
  silent_redirect_uri: 'http://localhost:1337/oidc-silent-renew.html',
  automaticSilentRenew: true // If true oidc-client will try to renew your token when it is about to expire
}

```

You have to make sure that you have an endpoint that matches the silent_redirect_uri setting. It should run the following code:


```js
import { vuexOidcProcessSilentSignInCallback } from 'vuex-oidc'
import { oidcConfig } from '@/config'

vuexOidcProcessSilentSignInCallback(oidcConfig)

```

## License

[MIT](LICENSE).
