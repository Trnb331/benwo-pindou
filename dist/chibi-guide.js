'use strict';
(() => {
  const status = document.getElementById('chibiCopyStatus');
  document.querySelectorAll('[data-chibi-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const field = document.getElementById(button.dataset.chibiCopy);
      if (!field) return;
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(field.value); copied = true; } catch {}
      }
      if (!copied) {
        field.focus();
        field.select();
        field.setSelectionRange(0, field.value.length);
        try { copied = document.execCommand('copy'); } catch {}
      }
      if (status) status.textContent = copied
        ? '已复制，可以粘贴到豆包。'
        : '已选中提示词，请长按或使用复制快捷键。';
    });
  });
  document.getElementById('chibiUpload')?.addEventListener('click', () => {
    const mode = document.getElementById('pixelMode');
    if (mode) mode.value = 'cartoon';
    for (const [id, value] of [['width', '100'], ['limit', '16']]) {
      const field = document.getElementById(id);
      if (field) {
        field.value = value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    location.hash = 'generate';
    document.getElementById('file')?.click();
  });
})();
