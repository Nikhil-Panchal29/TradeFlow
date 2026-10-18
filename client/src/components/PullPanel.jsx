function displayStatus(job) {
  if (!job?.status) return 'idle';
  if (job.status === 'running') return 'running';
  if (job.status === 'completed') return 'completed';
  if (job.status === 'failed') return 'failed';
  return 'idle';
}

export default function PullPanel({ job, pullError, onStartPull, pullDisabled, isPulling }) {
  const status = displayStatus(job);
  const total = job?.totalRecords ?? 0;
  const processed = job?.processedRecords ?? 0;
  const batchesDone = job?.batchesDone ?? 0;
  const batchesTotal = job?.batchesTotal ?? 0;
  const inserted = job?.insertedRecords ?? 0;
  const duplicates = job?.duplicateRecords ?? 0;

  const progressCells = Array.from({ length: 60 }, (_, i) => {
    if (i < batchesDone) return 'completed';
    if (i === batchesDone && status === 'running') return 'active';
    if (status === 'failed') return 'failed';
    return 'pending';
  });

  return (
    <section className="pull-panel" aria-label="Pull job">
      <div className="pull-panel-header">
        <h2>Import</h2>
        <button
          type="button"
          onClick={onStartPull}
          disabled={pullDisabled}
          className="btn-primary"
          aria-live="polite"
        >
          {isPulling ? <span className="btn-spinner" /> : 'Pull Trades'}
        </button>
      </div>
      {pullError ? <p className="pull-error">{pullError}</p> : null}
      <dl className="pull-metrics">
        <div>
          <dt>Status</dt>
          <dd className={`status status-${status}`}>{status}</dd>
        </div>
        <div>
          <dt>Records</dt>
          <dd>
            {processed} / {total || '—'}
          </dd>
        </div>
        <div>
          <dt>Batches</dt>
          <dd>
            {batchesDone} / {batchesTotal || '—'}
          </dd>
        </div>
        <div>
          <dt>Inserted</dt>
          <dd>{inserted}</dd>
        </div>
        <div>
          <dt>Duplicates</dt>
          <dd>{duplicates}</dd>
        </div>
      </dl>
      {batchesTotal > 0 && (
        <div className="progress-tape" aria-label="Progress by batch">
          {progressCells.map((cellState, i) => (
            <div
              key={i}
              className={`progress-cell ${cellState}`}
              aria-label={`Batch ${i + 1} ${cellState}`}
            />
          ))}
        </div>
      )}
      {job?.error ? <p className="pull-error">{job.error}</p> : null}
    </section>
  );
}
