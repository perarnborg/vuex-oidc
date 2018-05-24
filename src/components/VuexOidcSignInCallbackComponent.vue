<template>
  <div class="vuex-oidc-loader">
    <div class="vuex-oidc-loader__inner"></div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'VuexOidcSignInCallbackComponent',
  methods: mapActions([
    'vuexOidcSignInCallback'
  ]),
  mounted() {
    this.vuexOidcSignInCallback()
  }
}
</script>
