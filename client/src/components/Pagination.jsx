export default function Pagination({ page, totalPages, onPrev, onNext }) {
  const hasPrev = page > 1;
  const hasNext = totalPages > 0 && page < totalPages;

  return (
    <nav className="pagination" aria-label="Trades pagination">
      <button type="button" onClick={onPrev} disabled={!hasPrev}>
        Prev
      </button>
      <span>
        Page {page} of {totalPages || 1}
      </span>
      <button type="button" onClick={onNext} disabled={!hasNext}>
        Next
      </button>
    </nav>
  );
}
