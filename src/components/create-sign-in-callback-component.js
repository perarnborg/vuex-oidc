export default (store) => {
  return {
    name: 'VuexOidcSignInCallbackComponent',
    mounted() {
      store.dispatch('oidcSignInCallback')
    }
  }
}
