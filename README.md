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
    component: VuexOidcSigningCallbackComponent
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

```js
import { VuexOidcSigningCallbackComponent } from 'vuex-oidc'

const routes = [
  ...yourApplicationsRoutes,
  {
    path: '/oidc-callback', // Needs to match redirect_uri in you oidcConfig
    name: 'oidcCallback',
    component: VuexOidcSigningCallbackComponent
  }
]

```

### 5) Optional: set specific routes as public

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

If you have setup a silent_redirect_uri a silent signIn will be made on public routes.


### 6) Optional: setup silent renew callback

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
