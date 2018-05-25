export default (store) => {
  return(to, from, next) => {
    store.dispatch('checkOidcAuthentication', to)
    next()
  }
}
