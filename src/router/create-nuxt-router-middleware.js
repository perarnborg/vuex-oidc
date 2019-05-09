export default (vuexNamespace) => {
  return (context) => {
    return new Promise((resolve, reject) => {
      context.store.dispatch((vuexNamespace ? vuexNamespace + '/' : '') + 'oidcCheckAccess', context.route)
        .then((hasAccess) => {
          if (hasAccess) {
            resolve()
          }
        })
        .catch(() => {
        })
    })
  }
}
