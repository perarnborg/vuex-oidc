export const objectAssign = (objects) => {
  return objects.reduce(function (r, o) {
    Object.keys(o).forEach(function (k) {
      r[k] = o[k];
    });
    return r;
  }, {});
}

export const parseJwt = (token) => {
  var base64Url = token.split('.')[1]
  var base64 = base64Url.replace('-', '+').replace('_', '/')
  return JSON.parse(window.atob(base64))
}

export const firstLetterUppercase = (string) => {
  return string && string.length > 0 ? string.charAt(0).toUpperCase() + string.slice(1) : ''
}
