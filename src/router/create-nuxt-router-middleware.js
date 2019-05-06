export default (store, vuexNamespace) => {
  return (context) => {
    return new Promise((resolve, reject) => {
      store.dispatch((vuexNamespace ? vuexNamespace + '/' : '') + 'oidcCheckAccess', context.route.path)
        .then((hasAccess) => {
          if (hasAccess) {
            resolve()
          } else {
            reject()
          }
        })
        .catch(() => {
          reject()
        })
    })
  }
}
