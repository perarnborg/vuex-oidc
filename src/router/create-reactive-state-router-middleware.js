export default ({ oidcCheckAccess }) => {
  return (to, from, next) => {
    oidcCheckAccess(to).then((hasAccess) => {
      if (hasAccess) {
        next()
      }
    })
  }
}
