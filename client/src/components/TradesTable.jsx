const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function formatTimestamp(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN');
}

function SortableHeader({ children, field, sortBy, order, onSort }) {
  const isActive = sortBy === field;
  const sortIcon = isActive ? (order === 'asc' ? '↑' : '↓') : '';

  return (
    <th
      className={isActive ? 'sortable-header active' : 'sortable-header'}
      onClick={() => onSort(field)}
      aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="header-content">
        {children}
        {sortIcon && <span className="sort-icon">{sortIcon}</span>}
      </span>
    </th>
  );
}

export default function TradesTable({ items, sortBy, order, onSort }) {
  return (
    <div className="table-wrap">
      <table className="trades-table">
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '28%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Trade ID</th>
            <th>Client</th>
            <SortableHeader field="symbol" sortBy={sortBy} order={order} onSort={onSort}>
              Symbol
            </SortableHeader>
            <SortableHeader field="quantity" sortBy={sortBy} order={order} onSort={onSort}>
              Quantity
            </SortableHeader>
            <SortableHeader field="price" sortBy={sortBy} order={order} onSort={onSort}>
              Price
            </SortableHeader>
            <SortableHeader field="timestamp" sortBy={sortBy} order={order} onSort={onSort}>
              Timestamp
            </SortableHeader>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty">
                No trades yet.
              </td>
            </tr>
          ) : (
            items.map((trade) => (
              <tr key={trade.tradeId} className={trade.isNew ? 'new-row' : ''}>
                <td data-label="Trade ID">{trade.tradeId}</td>
                <td data-label="Client" className="client-cell">{trade.client}</td>
                <td data-label="Symbol" className="symbol-cell"><span>{trade.symbol}</span></td>
                <td data-label="Quantity">{trade.quantity}</td>
                <td data-label="Price">{inr.format(trade.price)}</td>
                <td data-label="Timestamp">{formatTimestamp(trade.timestamp)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
