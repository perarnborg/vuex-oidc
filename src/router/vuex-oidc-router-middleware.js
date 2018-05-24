export default (to, from, next) => {
  store.dispatch('checkAuthentication', to)
}
