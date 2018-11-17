export default (store, vuexNamespace) => {
  return (to, from, next) => {
    store.dispatch((vuexNamespace ? vuexNamespace + '/' : '') + 'oidcCheckAccess', to)
      .then((hasAccess) => {
        if (hasAccess) {
          next()
        }
      })
  }
}
