export function renderSeminarError(container) {
  if (!container) return;
  container.innerHTML = `
    <section class="seminar-error" role="alert">
      <h1>자료를 불러올 수 없습니다</h1>
      <p>요청한 세미나 자료를 확인한 뒤 다시 시도해 주세요.</p>
    </section>
  `;
}
