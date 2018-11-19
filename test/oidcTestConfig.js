module.exports = {
  authority: 'https://your_oidc_authority',
  client_id: 'your_client_id',
  redirect_uri: 'http://localhost:1337/oidc-callback',
  silent_redirect_uri: 'http://localhost:1337/oidc-silent-callback',
  automaticSilentRenew: true,
  response_type: 'openid profile email api1',
  scope: 'openid profile'
}
