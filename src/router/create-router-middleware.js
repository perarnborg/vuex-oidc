export default (store) => {
  return(to, from, next) => {
    store.dispatch('oidcCheckAccess', to)
      .then((hasAccess) {
        if (hasAccess) {
          next()
        }
      })
  }
}
