export default (state) => {
  return (to, from, next) => {
    state.oidcCheckAccess(to).then((hasAccess) => {
      if (hasAccess) {
        next()
      }
    })
  }
}
