import { useEffect, useState } from 'react';
import api from '../api/axios';

const TIME_SLOTS = [
  '11:00-12:30',
  '12:30-14:00',
  '14:00-15:30',
  '18:00-19:30',
  '19:30-21:00',
  '21:00-22:30',
];

const AdminDashboard = () => {
  const [tab, setTab] = useState('reservations');

  return (
    <div className="container animate-fade-up">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage all reservations and restaurant tables.</p>
      </div>

      <div className="tabs">
        <button
          id="tab-reservations"
          className={tab === 'reservations' ? 'active' : ''}
          onClick={() => setTab('reservations')}
        >
          📋 Reservations
        </button>
        <button
          id="tab-tables"
          className={tab === 'tables' ? 'active' : ''}
          onClick={() => setTab('tables')}
        >
          🪑 Tables
        </button>
      </div>

      {tab === 'reservations' ? <ReservationsPanel /> : <TablesPanel />}
    </div>
  );
};

/* ── Reservations Panel ── */
const ReservationsPanel = () => {
  const [reservations, setReservations] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', timeSlot: '', guests: 1 });

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/reservations', { params });
      setReservations(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await api.patch(`/admin/reservations/${id}/cancel`);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setEditForm({ date: r.date, timeSlot: r.timeSlot, guests: r.guests });
  };

  const saveEdit = async (id) => {
    setError('');
    try {
      await api.put(`/admin/reservations/${id}`, editForm);
      setEditingId(null);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update reservation');
    }
  };

  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length;
  const cancelledCount = reservations.filter((r) => r.status === 'cancelled').length;

  return (
    <div>
      {error && <div className="error-message"><span>⚠️</span>{error}</div>}

      {/* Stats chips */}
      <div className="info-chips" style={{ marginBottom: 20 }}>
        <span className="chip">📊 {reservations.length} total</span>
        <span className="chip" style={{ color: 'var(--success-text)', borderColor: 'var(--success-border)', background: 'var(--success-bg)' }}>
          ✓ {confirmedCount} confirmed
        </span>
        <span className="chip" style={{ color: 'var(--error-text)', borderColor: 'var(--error-border)', background: 'var(--error-bg)' }}>
          ✕ {cancelledCount} cancelled
        </span>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="filter-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="dateFilter">Filter by Date</label>
            <input
              id="dateFilter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
            <label htmlFor="statusFilter">Filter by Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {(dateFilter || statusFilter) && (
            <button
              className="btn secondary btn-sm"
              style={{ marginTop: 'auto', height: 42 }}
              onClick={() => { setDateFilter(''); setStatusFilter(''); }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading reservations…</span>
          </div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No reservations found</div>
            <div className="empty-state-desc">Try adjusting your filters.</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Table</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.user?.name}</strong>
                      <div className="td-secondary">{r.user?.email}</div>
                    </td>

                    {editingId === r._id ? (
                      <>
                        <td>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                          />
                        </td>
                        <td>
                          <select
                            value={editForm.timeSlot}
                            onChange={(e) => setEditForm((f) => ({ ...f, timeSlot: e.target.value }))}
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>{slot}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Table {r.table?.tableNumber}
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            value={editForm.guests}
                            onChange={(e) => setEditForm((f) => ({ ...f, guests: Number(e.target.value) }))}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td><strong>{r.date}</strong></td>
                        <td>{r.timeSlot}</td>
                        <td>
                          Table {r.table?.tableNumber}
                          <div className="td-secondary">seats {r.table?.capacity}</div>
                        </td>
                        <td>{r.guests} guests</td>
                      </>
                    )}

                    <td>
                      <span className={`status-tag ${r.status}`}>{r.status}</span>
                    </td>

                    <td>
                      <div className="actions-cell">
                        {editingId === r._id ? (
                          <>
                            <button className="btn btn-sm" onClick={() => saveEdit(r._id)}>
                              Save
                            </button>
                            <button className="btn secondary btn-sm" onClick={() => setEditingId(null)}>
                              Discard
                            </button>
                          </>
                        ) : (
                          r.status === 'confirmed' && (
                            <>
                              <button className="btn secondary btn-sm" onClick={() => startEdit(r)}>
                                Edit
                              </button>
                              <button className="btn danger btn-sm" onClick={() => handleCancel(r._id)}>
                                Cancel
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Tables Panel ── */
const TablesPanel = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '' });
  const [creating, setCreating] = useState(false);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tables');
      setTables(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/admin/tables', {
        tableNumber: Number(newTable.tableNumber),
        capacity: Number(newTable.capacity),
      });
      setNewTable({ tableNumber: '', capacity: '' });
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create table');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (table) => {
    try {
      await api.put(`/admin/tables/${table._id}`, { isActive: !table.isActive });
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update table');
    }
  };

  const activeCount = tables.filter((t) => t.isActive).length;

  return (
    <div>
      {error && <div className="error-message"><span>⚠️</span>{error}</div>}

      {/* Stats */}
      <div className="info-chips" style={{ marginBottom: 20 }}>
        <span className="chip">🪑 {tables.length} total tables</span>
        <span className="chip" style={{ color: 'var(--success-text)', borderColor: 'var(--success-border)', background: 'var(--success-bg)' }}>
          ✓ {activeCount} active
        </span>
        <span className="chip" style={{ color: 'var(--text-muted)' }}>
          ✕ {tables.length - activeCount} inactive
        </span>
      </div>

      {/* Add table form */}
      <div className="card">
        <div className="section-title">Add New Table</div>
        <form onSubmit={handleCreate}>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="tableNumber">Table Number</label>
              <input
                id="tableNumber"
                type="number"
                min={1}
                placeholder="e.g. 7"
                value={newTable.tableNumber}
                onChange={(e) => setNewTable((f) => ({ ...f, tableNumber: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="capacity">Seating Capacity</label>
              <input
                id="capacity"
                type="number"
                min={1}
                placeholder="e.g. 4"
                value={newTable.capacity}
                onChange={(e) => setNewTable((f) => ({ ...f, capacity: e.target.value }))}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn" disabled={creating}>
            {creating ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Adding…
              </>
            ) : (
              '+ Add Table'
            )}
          </button>
        </form>
      </div>

      {/* Tables list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>All Tables</div>
        </div>
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading tables…</span>
          </div>
        ) : tables.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🪑</div>
            <div className="empty-state-title">No tables yet</div>
            <div className="empty-state-desc">Add your first table using the form above.</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Table #</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <strong>Table {t.tableNumber}</strong>
                    </td>
                    <td>{t.capacity} seats</td>
                    <td>
                      <span className={`status-tag ${t.isActive ? 'active' : 'inactive'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${t.isActive ? 'danger' : 'secondary'}`}
                        onClick={() => toggleActive(t)}
                      >
                        {t.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
