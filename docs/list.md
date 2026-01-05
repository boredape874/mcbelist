---
title: 커뮤니티 목록
---

<script setup>
import CommunityList from './.vitepress/components/CommunityList.vue'
</script>

<section class="page-hero">
  <div class="page-hero__content">
    <p class="eyebrow">Community Index</p>
    <h1>커뮤니티 탐색</h1>
    <p>승인된 베드락 커뮤니티를 카테고리와 태그로 빠르게 찾아보세요.</p>
  </div>
  <div class="page-hero__panel">
    <div class="page-hero__card">
      <h3>필터 & 키워드</h3>
      <p>검색어, 카테고리, 태그를 조합해 원하는 곳만 골라냅니다.</p>
    </div>
    <div class="page-hero__card">
      <h3>반응 기반 선택</h3>
      <p>좋아요/싫어요 반응으로 커뮤니티 분위기를 참고하세요.</p>
    </div>
  </div>
</section>

<div class="page-section">
  <CommunityList />
</div>
