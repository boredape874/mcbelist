# MCBeList

마인크래프트 베드락 에디션 커뮤니티 리스트

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run docs:dev
```

## 빌드

```bash
npm run docs:build
```

## 프리뷰

```bash
npm run docs:preview
```

## GitHub Pages 배포

### 초기 설정

1. GitHub 저장소의 Settings > Pages로 이동
2. Source를 "GitHub Actions"로 설정
3. 코드를 main 브랜치에 푸시하면 자동으로 배포됩니다

### 배포 과정

- main 브랜치에 푸시할 때마다 자동으로 배포
- GitHub Actions를 통해 자동 빌드 및 배포
- 배포 URL: `https://yourusername.github.io/mcbelist/`

### base 경로 수정

만약 저장소 이름이 다르다면 `docs/.vitepress/config.js`의 `base` 값을 수정하세요:

```js
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

## Firebase 설정

### Authentication 활성화

Firebase Console > Authentication > Sign-in method에서:
- 이메일/비밀번호 로그인 활성화

### Firestore 보안 규칙

Firebase Console > Firestore Database > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /communities/{community} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.createdBy == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

## 기술 스택

- VitePress
- Firebase (Firestore, Authentication, Analytics)
- Vue 3

## 구조

```
mcbelist/
├── docs/
│   ├── .vitepress/
│   │   ├── config.js          # VitePress 설정
│   │   ├── firebase.js        # Firebase 설정
│   │   ├── components/
│   │   │   ├── AuthModal.vue  # 로그인/회원가입 모달
│   │   │   └── UserMenu.vue   # 사용자 메뉴
│   │   ├── composables/
│   │   │   └── useAuth.js     # 인증 상태 관리
│   │   └── theme/
│   │       ├── index.js       # 테마 설정
│   │       └── custom.css     # 커스텀 스타일
│   ├── index.md               # 홈페이지
│   ├── list.md                # 커뮤니티 목록
│   ├── submit.md              # 커뮤니티 등록
│   └── about.md               # 소개
└── package.json
```

## Firebase Firestore 구조

### communities 컬렉션

```javascript
{
  name: string,              // 커뮤니티 이름
  description: string,       // 설명
  category: string,          // 카테고리 (서버, 디스코드, 카페, 커뮤니티, 기타)
  link: string,              // 링크 (optional)
  tags: string[],            // 태그 배열
  createdAt: timestamp,      // 생성 시간
  createdBy: string,         // 작성자 UID
  createdByEmail: string     // 작성자 이메일
}
```

## 주요 기능

- 커뮤니티 목록 조회
- 이메일/비밀번호 회원가입 및 로그인
- 로그인한 사용자만 커뮤니티 등록 가능
- 카테고리별 분류
- 태그 시스템
