// 관리자 UID 목록
export const ADMIN_UIDS = [
  'KDwAH579lFVH69LoN0QnXIrPBXp2'
]

// 카테고리 목록
export const CATEGORIES = [
  '오픈채팅방',
  '디스코드',
  '기타'
]

// 사용 가능한 태그 목록
export const AVAILABLE_TAGS = [
  'PvP',
  'PvE',
  '생존',
  '크리에이티브',
  '미니게임',
  'RPG',
  '어드벤처',
  '건축',
  '레드스톤',
  '모드',
  '애드온',
  '친목',
  '대규모',
  '소규모',
  '한국어',
  '영어',
  '초보환영',
  '숙련자',
  '이벤트',
  '경제',
  '스카이블록',
  '서바이벌',
  '하드코어'
]

// 관리자 확인 함수
export function isAdmin(uid) {
  return ADMIN_UIDS.includes(uid)
}
