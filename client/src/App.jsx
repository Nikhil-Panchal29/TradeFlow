import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCurrentPull,
  getStats,
  getTrades,
  startPull,
  getSymbols,
} from './api.js';
import Pagination from './components/Pagination.jsx';
import PullPanel from './components/PullPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import StatsStrip from './components/StatsStrip.jsx';
import TradesTable from './components/TradesTable.jsx';
import TradesToolbar from './components/TradesToolbar.jsx';
import { socket } from './socket.js';
import './App.css';

const EMPTY_TRADES = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 50,
  totalPages: 0,
};

function mergeJobFromPost(current, started) {
  return {
    ...(current ?? {}),
    _id: started.jobId,
    status: started.status,
    processedRecords: current?.processedRecords ?? 0,
    insertedRecords: current?.insertedRecords ?? 0,
    duplicateRecords: current?.duplicateRecords ?? 0,
    batchesDone: current?.batchesDone ?? 0,
    batchesTotal: current?.batchesTotal ?? 0,
    totalRecords: current?.totalRecords ?? 0,
  };
}

export default function App() {
  const [page, setPage] = useState(1);
  const [tradesData, setTradesData] = useState(EMPTY_TRADES);
  const [stats, setStats] = useState(null);
  const [job, setJob] = useState(null);
  const [pullError, setPullError] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [connection, setConnection] = useState(
    socket.connected ? 'connected' : 'connecting'
  );
  const [search, setSearch] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [sortBy, setSortBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  const [symbols, setSymbols] = useState([]);
  const [activeNav, setActiveNav] = useState('overview');

  const pageRef = useRef(page);
  const searchRef = useRef(search);
  const selectedSymbolRef = useRef(selectedSymbol);
  const sortByRef = useRef(sortBy);
  const orderRef = useRef(order);

  pageRef.current = page;
  searchRef.current = search;
  selectedSymbolRef.current = selectedSymbol;
  sortByRef.current = sortBy;
  orderRef.current = order;

  const loadPage = useCallback(async (pageNumber) => {
    const trades = await getTrades(pageNumber, {
      search: searchRef.current,
      symbol: selectedSymbolRef.current,
      sortBy: sortByRef.current,
      order: orderRef.current,
    });
    setTradesData(trades);
    setPage(trades.page ?? pageNumber);
  }, []);

  const refreshTradesAndStats = useCallback(async () => {
    const [trades, nextStats] = await Promise.all([
      getTrades(pageRef.current, {
        search: searchRef.current,
        symbol: selectedSymbolRef.current,
        sortBy: sortByRef.current,
        order: orderRef.current,
      }),
      getStats(),
    ]);
    setTradesData(trades);
    setStats(nextStats);
  }, []);

  const refreshAll = useCallback(async () => {
    const [trades, nextStats, current] = await Promise.all([
      getTrades(pageRef.current, {
        search: searchRef.current,
        symbol: selectedSymbolRef.current,
        sortBy: sortByRef.current,
        order: orderRef.current,
      }),
      getStats(),
      getCurrentPull(),
    ]);
    setTradesData(trades);
    setStats(nextStats);
    setJob(current);
  }, []);

  useEffect(() => {
    Promise.all([getTrades(1), getStats(), getCurrentPull(), getSymbols()])
      .then(([trades, nextStats, current, symbolsData]) => {
        setTradesData(trades);
        setStats(nextStats);
        setJob(current);
        setSymbols(Array.isArray(symbolsData?.symbols) ? symbolsData.symbols : []);
      })
      .catch((err) => {
        console.error('Initial data load error:', err);
      });
  }, []);

  useEffect(() => {
    function handleConnect() {
      setConnection('connected');
      refreshAll().catch(() => {});
    }

    function handleDisconnect() {
      setConnection('disconnected');
    }

    function handleReconnectAttempt() {
      setConnection('reconnecting');
    }

    function handlePullEvent(eventName, payload) {
      const nextJob = payload?.job ?? null;
      setJob(nextJob);
      if (eventName === 'pull:progress' || eventName === 'pull:completed') {
        refreshTradesAndStats().catch(() => {});
      }
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('pull:started', (payload) => handlePullEvent('pull:started', payload));
    socket.on('pull:progress', (payload) =>
      handlePullEvent('pull:progress', payload)
    );
    socket.on('pull:completed', (payload) =>
      handlePullEvent('pull:completed', payload)
    );
    socket.on('pull:failed', (payload) => handlePullEvent('pull:failed', payload));

    if (socket.connected) {
      setConnection('connected');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('pull:started');
      socket.off('pull:progress');
      socket.off('pull:completed');
      socket.off('pull:failed');
    };
  }, [refreshAll, refreshTradesAndStats]);

  const pullRunning = job?.status === 'running';

  async function handleStartPull() {
    setPullError('');
    setIsPulling(true);
    try {
      const started = await startPull();
      setJob((current) => mergeJobFromPost(current, started));
    } catch (err) {
      if (err.status === 409) {
        setPullError('A pull is already running');
        return;
      }
      setPullError(err.message ?? 'Failed to start pull');
    } finally {
      setIsPulling(false);
    }
  }

  function handlePrevPage() {
    if (page <= 1) return;
    loadPage(page - 1).catch(() => {});
  }

  function handleNextPage() {
    if (page >= tradesData.totalPages) return;
    loadPage(page + 1).catch(() => {});
  }

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    searchRef.current = value;
    setPage(1);
    loadPage(1).catch(() => {});
  }, [loadPage]);

  const handleSymbolChange = useCallback((symbol) => {
    setSelectedSymbol(symbol);
    selectedSymbolRef.current = symbol;
    setPage(1);
    loadPage(1).catch(() => {});
  }, [loadPage]);

  const handleSort = useCallback((field) => {
    const newOrder = sortBy === field && order === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setOrder(newOrder);
    sortByRef.current = field;
    orderRef.current = newOrder;
    setPage(1);
    loadPage(1).catch(() => {});
  }, [sortBy, order, loadPage]);

  return (
    <div className="dashboard">
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} connection={connection} />

      <main className="dashboard-main">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Trading Overview</h1>
            <p className="page-subtitle">Monitor trade ingestion and processing in real-time</p>
          </div>
        </div>

        <StatsStrip stats={stats} />
        <PullPanel
          job={job}
          pullError={pullError}
          onStartPull={handleStartPull}
          pullDisabled={pullRunning}
          isPulling={isPulling}
        />
        <div className="trades-card">
          <TradesToolbar
            search={search}
            onSearchChange={handleSearchChange}
            selectedSymbol={selectedSymbol}
            onSymbolChange={handleSymbolChange}
            sortBy={sortBy}
            order={order}
            symbols={symbols}
          />
          <TradesTable
            items={tradesData.items}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
          />
          <Pagination
            page={page}
            totalPages={tradesData.totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
          />
        </div>
      </main>
    </div>
  );
}
