export default (store, router) => {
  return {
    name: 'VuexOidcSignInCallbackComponent',
    mounted() {
      store.dispatch('oidcSignInCallback')
        .then(() => {
          router.push(sessionStorage.getItem('vuex_oidc_active_route') || '/')
        })
    }
  }
}
