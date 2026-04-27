<script lang="ts">
  import { page } from '$app/stores';
  import {
    KanbanSquare,
    LayoutDashboard,
    GitBranch,
    GitPullRequest,
    BookOpen,
    MessageSquareText,
    Cpu
  } from 'lucide-svelte';

  interface NavItem {
    href: string;
    label: string;
    icon: typeof KanbanSquare;
    glyph: string;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const sections: NavSection[] = [
    {
      title: '대시보드',
      items: [
        { href: '/kanban', label: '칸반보드', icon: KanbanSquare, glyph: '📋' },
        { href: '/overview', label: '오버뷰', icon: LayoutDashboard, glyph: '🌐' },
        { href: '/waterfall', label: '워터폴', icon: GitBranch, glyph: '🔽' },
        { href: '/review', label: '리뷰', icon: GitPullRequest, glyph: '🔍' }
      ]
    },
    {
      title: '에이전트',
      items: [{ href: '/agents', label: '에이전트 관리', icon: Cpu, glyph: '⚡' }]
    },
    {
      title: '지식',
      items: [
        { href: '/wiki', label: '위키', icon: BookOpen, glyph: '📚' },
        { href: '/scrum', label: '스크럼', icon: MessageSquareText, glyph: '💬' }
      ]
    }
  ];

  $: pathname = $page.url.pathname;
  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/');
  }
</script>

<aside
  class="hidden md:flex md:flex-col w-(--spacing-sidebar) shrink-0 border-r border-(--color-border-subtle) bg-(--color-bg-surface)"
>
  <a
    href="/"
    class="flex items-center gap-3 px-5 py-5 border-b border-(--color-border-subtle) hover:bg-(--color-bg-hover) transition-colors"
  >
    <span class="text-2xl leading-none" aria-hidden="true">🗿</span>
    <div class="flex flex-col">
      <span class="font-semibold tracking-wide text-(--color-text-primary)"
        >Gigantic</span
      >
      <span class="text-[11px] uppercase tracking-widest text-(--color-accent)"
        >Moai Dashboard</span
      >
    </div>
  </a>

  <nav class="flex-1 overflow-y-auto py-4">
    {#each sections as section}
      <div class="mb-6">
        <h3
          class="px-5 mb-2 text-[10px] uppercase tracking-widest text-(--color-text-muted) font-semibold"
        >
          {section.title}
        </h3>
        <ul class="flex flex-col">
          {#each section.items as item}
            {@const active = isActive(item.href)}
            <li>
              <a
                href={item.href}
                class="
                  flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                  border-l-2
                  {active
                  ? 'border-(--color-accent) bg-(--color-bg-elevated) text-(--color-text-primary)'
                  : 'border-transparent text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)'}
                "
                aria-current={active ? 'page' : undefined}
              >
                <span class="text-base w-5 text-center" aria-hidden="true"
                  >{item.glyph}</span
                >
                <span class="truncate">{item.label}</span>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>

  <div
    class="px-5 py-3 border-t border-(--color-border-subtle) text-[11px] text-(--color-text-muted)"
  >
    <div class="flex items-center justify-between">
      <span>v0.0.1</span>
      <span class="font-mono">W1–2 · D-1</span>
    </div>
  </div>
</aside>
