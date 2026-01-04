# 로그인/회원가입 가이드

## Firebase Authentication 설정

이 사이트는 Firebase Authentication을 사용합니다. Firebase Console에서 다음 설정이 필요합니다:

### 1. Firebase Console 설정

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택 (mcbelist)
3. Authentication > Sign-in method로 이동
4. 다음 로그인 방법 활성화:
   - **이메일/비밀번호**: 사용 설정
   - **Google**: 사용 설정 (선택사항)

### 2. 지원하는 로그인 방법

#### 이메일/비밀번호
- 이메일과 비밀번호로 회원가입
- 비밀번호는 최소 6자 이상
- 이메일 인증은 선택사항

#### Google 로그인
- Google 계정으로 빠른 로그인
- 별도 비밀번호 불필요
- Firebase Console에서 Google 로그인을 활성화해야 합니다

## 사용자 기능

### 로그인 상태
- 우측 상단 네비게이션 바에 로그인 버튼 표시
- 로그인 시 사용자 이메일과 로그아웃 버튼 표시

### 커뮤니티 등록
- 로그인한 사용자만 커뮤니티 등록 가능
- 등록된 커뮤니티에는 작성자 정보 저장

## Firestore 보안 규칙

Firebase Console > Firestore Database > Rules에서 다음 규칙을 설정하세요:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // communities 컬렉션
    match /communities/{community} {
      // 모든 사용자가 읽기 가능
      allow read: if true;

      // 로그인한 사용자만 쓰기 가능
      allow create: if request.auth != null
        && request.resource.data.createdBy == request.auth.uid;

      // 작성자만 수정/삭제 가능
      allow update, delete: if request.auth != null
        && resource.data.createdBy == request.auth.uid;
    }
  }
}
```

이 규칙은:
- 누구나 커뮤니티 목록을 볼 수 있음
- 로그인한 사용자만 커뮤니티를 등록할 수 있음
- 작성자만 자신의 게시물을 수정/삭제할 수 있음

## 문제 해결

### "권한 없음" 오류
- Firestore 보안 규칙이 올바르게 설정되었는지 확인
- 로그인 상태인지 확인

### Google 로그인 실패
- Firebase Console에서 Google 로그인이 활성화되었는지 확인
- authDomain이 올바르게 설정되었는지 확인

### 이메일 로그인 실패
- Firebase Console에서 이메일/비밀번호 로그인이 활성화되었는지 확인
- 비밀번호가 6자 이상인지 확인
