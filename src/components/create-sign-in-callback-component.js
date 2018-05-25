export default (store, router) => {
  return {
    name: 'VuexOidcSignInCallbackComponent',
    mounted() {
      store.dispatch('oidcSignInCallback')
        .then((redirectPath) => {
          router.push(redirectPath)
        })
    }
  }
}
