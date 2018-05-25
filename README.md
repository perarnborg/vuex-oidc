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
export const oidcSettings = {
  authority: 'https://your_oidc_authority',
  client_id: 'your_client_id',
  redirect_uri: 'http://localhost:1337/oidc-callback',
  response_type: 'openid profile email api1',
  scope: 'openid profile'
}

```

Check out documentation for oidc-client to see all options: https://github.com/IdentityModel/oidc-client-js/wiki

### 2) Setup vuex

Import and use vuex module. Is is created with a factory function that takes your oidc config as argument.

```js
import { vuexOidcCreateStoreModule } from 'vuex-oidc'

import { oidcSettings } from '@/config'

export default new Vuex.Store({
  modules: {
    vuexOidcCreateStoreModule(oidcSettings)
  }
})

```

### 3) Setup route for Open id callback

Create a callback component. The component will be rendered during the time that the callback is made, so feel free to add
any loader/spinner if you want.

```js
<template>
  <div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

import { router } from '@/routes/router'

export default {
  name: 'OidcCallback',
  methods: {
    ...mapActions([
      'oidcSignInCallback'
    ])
  },
  mounted() {
    this.oidcSignInCallback()
      .then((redirectPath) => {
        router.push(redirectPath)
      })
      .catch((err) => {
        console.error(err)
        router.push('/oidc-callback-error') // Handle errors any way you want
      })
  }
}
</script>
```

Setup the route with your callback component. Note the meta properties isVuexOidcCallback and isPublic which are required
for this route.

```js
import OidcCallback from '@/components/OidcCallback'

const routes = [
  ...yourApplicationsRoutes,
  {
    path: '/oidc-callback', // Needs to match redirect_uri in you oidcSettings
    name: 'oidcCallback',
    component: OidcCallback,
    meta {
      isVuexOidcCallback: true,
      isPublic: true
    }
  }
]

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

If you want to determin access on an app/layout level you can check if a user has access by checking oidcIsAuthenticated
and isPublic of current route.

```js
<template>
  <div v-if="hasAccess">
    Protected content
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters([
      'oidcIsAuthenticated'
    ]),
    hasAccess: function() {
      return this.oidcIsAuthenticated || this.$route.meta.isPublic
    }
  }
}
</script>
```


### 6) Optional: display signed in user info and show sign out button

Use vuex getter oidcUser to show user info. Use vuex action signOutOidc to sign out user.

```js
<template>
  <div v-if="oidcUser">
    Signed in as {{ oidcUser.email }}
    <button @click="signOutOidc">Sign out</button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'MyProtectedRouteComponent',
  computed: {
    ...mapGetters([
      'oidcUser'
    ])
  },
  methods: {
    ...mapActions([
      'signOutOidc'
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
export const oidcSettings = {
  ...youOidcOtherSettings,
  silent_redirect_uri: 'http://localhost:1337/oidc-silent-renew.html',
  automaticSilentRenew: true // If true oidc-client will try to renew your token when it is about to expire
}

```

You have to make sure that you have an endpoint that matches the silent_redirect_uri setting. It should run the following code:


```js
import { vuexOidcProcessSilentSignInCallback } from 'vuex-oidc'

import { oidcSettings } from '@/config'

vuexOidcProcessSilentSignInCallback(oidcSettings)

```

## License

[MIT](LICENSE).
