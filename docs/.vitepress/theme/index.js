import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { h } from 'vue'
import UserMenu from '../components/UserMenu.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(UserMenu)
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Firebase는 클라이언트 사이드에서만 초기화
    if (typeof window !== 'undefined') {
      import('../firebase.js').then(({ initFirebase }) => {
        initFirebase()
      })
    }
  }
}
