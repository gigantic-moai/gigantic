<script lang="ts">
  import { page } from '$app/stores';
  import { ChevronRight, Home } from 'lucide-svelte';

  const labels: Record<string, string> = {
    kanban: '칸반보드',
    overview: '오버뷰',
    waterfall: '워터폴',
    review: '리뷰',
    wiki: '위키',
    scrum: '스크럼',
    agents: '에이전트 관리'
  };

  $: segments = $page.url.pathname.split('/').filter(Boolean);
</script>

<nav
  class="flex items-center gap-2 text-xs text-(--color-text-secondary)"
  aria-label="breadcrumb"
>
  <a
    href="/"
    class="flex items-center gap-1 hover:text-(--color-text-primary) transition-colors"
  >
    <Home size={12} />
    <span>홈</span>
  </a>
  {#each segments as segment, i}
    <ChevronRight size={12} class="text-(--color-text-muted)" />
    {#if i === segments.length - 1}
      <span class="text-(--color-text-primary) font-medium">
        {labels[segment] ?? segment}
      </span>
    {:else}
      <a
        href={'/' + segments.slice(0, i + 1).join('/')}
        class="hover:text-(--color-text-primary) transition-colors"
      >
        {labels[segment] ?? segment}
      </a>
    {/if}
  {/each}
</nav>
