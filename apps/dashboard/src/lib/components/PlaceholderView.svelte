<script lang="ts">
  export let glyph: string;
  export let title: string;
  export let subtitle: string = 'W3–4에서 구현 예정';
  export let highlights: string[] = [];
</script>

<section class="max-w-3xl">
  <header class="flex items-center gap-4 mb-6">
    <div
      class="flex items-center justify-center w-14 h-14 rounded-xl bg-(--color-bg-elevated) border border-(--color-border-subtle) text-3xl"
      aria-hidden="true"
    >
      {glyph}
    </div>
    <div>
      <h1 class="text-2xl font-semibold text-(--color-text-primary)">{title}</h1>
      <p class="text-sm text-(--color-accent) font-mono mt-1">{subtitle}</p>
    </div>
  </header>

  {#if highlights.length > 0}
    <div
      class="rounded-lg border border-(--color-border-subtle) bg-(--color-bg-surface) p-5"
    >
      <h2
        class="text-[10px] uppercase tracking-widest text-(--color-text-muted) font-semibold mb-3"
      >
        핵심 기능
      </h2>
      <ul class="space-y-2">
        {#each highlights as line}
          <li class="flex items-start gap-3 text-sm text-(--color-text-secondary)">
            <span class="text-(--color-accent) mt-1 leading-none">▸</span>
            <span>{line}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <slot />
</section>
