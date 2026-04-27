<script lang="ts">
  import PlaceholderView from '$lib/components/PlaceholderView.svelte';
</script>

<PlaceholderView
  glyph="📋"
  title="칸반보드"
  highlights={[
    '에이전트별 이슈를 To Do → In Progress → Review → Done 칼럼으로 한눈에 파악',
    '드래그앤드롭으로 칼럼 이동, WebSocket 실시간 상태 동기화',
    'P4 changelist 번호와 연결되어 카드에서 바로 리뷰창으로 점프'
  ]}
/>
