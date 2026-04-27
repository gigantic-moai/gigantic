<script lang="ts">
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
</script>

<div class="flex min-h-screen w-full bg-(--color-bg-base) text-(--color-text-primary)">
  <Sidebar />

  <div class="flex-1 flex flex-col min-w-0">
    <header
      class="h-14 shrink-0 flex items-center px-6 border-b border-(--color-border-subtle) bg-(--color-bg-base)/80 backdrop-blur"
    >
      <Breadcrumb />
    </header>

    <main class="flex-1 overflow-y-auto p-6 lg:p-8">
      <slot />
    </main>
  </div>
</div>
