export default (store) => {
  return(to, from, next) => {
    store.dispatch('checkAuthentication', to)
  }
}
