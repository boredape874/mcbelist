---
title: 관리자 페이지
---

<script setup>
import AdminPanel from './.vitepress/components/AdminPanel.vue'
</script>

<section class="page-hero">
  <div class="page-hero__content">
    <p class="eyebrow">Admin</p>
    <h1>관리자 대시보드</h1>
    <p>승인 대기 항목을 검토하고 공개 리스트를 관리합니다.</p>
  </div>
  <div class="page-hero__panel">
    <div class="page-hero__card">
      <h3>승인 관리</h3>
      <p>등록 요청을 승인하거나 거절해 목록을 유지합니다.</p>
    </div>
    <div class="page-hero__card">
      <h3>노출 순위</h3>
      <p>승인된 커뮤니티의 순위를 조정할 수 있습니다.</p>
    </div>
  </div>
</section>

<div class="page-section">
  <AdminPanel />
</div>
