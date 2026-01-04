import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MCBeList',
  description: 'Minecraft Bedrock Edition Community List',
  lang: 'ko-KR',
  base: '/mcbelist/',

  themeConfig: {
    nav: [
      { text: '홈', link: '/' },
      { text: '커뮤니티 목록', link: '/list' },
      { text: '커뮤니티 등록', link: '/submit' }
    ],

    sidebar: [
      {
        text: '메뉴',
        items: [
          { text: '커뮤니티 목록', link: '/list' },
          { text: '커뮤니티 등록', link: '/submit' },
          { text: '소개', link: '/about' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/mcbelist' }
    ],

    footer: {
      message: 'Minecraft Bedrock Edition Community List',
      copyright: 'Copyright © 2024-present'
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ]
})
