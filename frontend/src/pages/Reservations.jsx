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

const todayStr = () => new Date().toISOString().split('T')[0];

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    date: todayStr(),
    timeSlot: TIME_SLOTS[0],
    guests: 2,
    tableId: '',
  });

  const fetchMyReservations = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/reservations/my');
      setReservations(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reservations');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  useEffect(() => {
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      setForm((f) => ({ ...f, tableId: '' }));
      try {
        const res = await api.get('/tables/availability', {
          params: { date: form.date, timeSlot: form.timeSlot, guests: form.guests },
        });
        setAvailableTables(res.data.data);
      } catch {
        setAvailableTables([]);
      } finally {
        setCheckingAvailability(false);
      }
    };

    if (form.date && form.timeSlot && form.guests) {
      checkAvailability();
    }
  }, [form.date, form.timeSlot, form.guests]);

  const handleChange = (field) => (e) => {
    const value = field === 'guests' ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.tableId) {
      setError('Please select an available table.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/reservations', form);
      setSuccess('🎉 Reservation confirmed! Your table is booked.');
      fetchMyReservations();
      setForm((f) => ({ ...f, tableId: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setError('');
    try {
      await api.patch(`/reservations/${id}/cancel`);
      fetchMyReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const confirmedCount = reservations.filter((r) => r.status === 'confirmed').length;

  return (
    <div className="container animate-fade-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">My Reservations</h1>
            <p className="page-subtitle">Book a new table or manage your existing reservations.</p>
          </div>
          <div className="info-chips">
            <span className="chip">📅 {confirmedCount} upcoming</span>
          </div>
        </div>
      </div>

      {error && <div className="error-message"><span>⚠️</span>{error}</div>}
      {success && <div className="success-message"><span>✓</span>{success}</div>}

      {/* ── New Reservation Form ── */}
      <div className="card">
        <div className="section-title">New Reservation</div>

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                min={todayStr()}
                value={form.date}
                onChange={handleChange('date')}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="timeSlot">Time Slot</label>
              <select id="timeSlot" value={form.timeSlot} onChange={handleChange('timeSlot')}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 200 }}>
            <label htmlFor="guests">Number of Guests</label>
            <input
              id="guests"
              type="number"
              min={1}
              max={20}
              value={form.guests}
              onChange={handleChange('guests')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tableId">Available Table</label>
            {checkingAvailability ? (
              <div className="availability-checking">
                <div className="spinner" />
                Checking availability…
              </div>
            ) : (
              <>
                <select
                  id="tableId"
                  value={form.tableId}
                  onChange={handleChange('tableId')}
                  required
                  disabled={availableTables.length === 0}
                >
                  <option value="">— Select a table —</option>
                  {availableTables.map((t) => (
                    <option key={t._id} value={t._id}>
                      Table {t.tableNumber} · seats {t.capacity}
                    </option>
                  ))}
                </select>
                {availableTables.length === 0 && (
                  <div className="no-tables-message">
                    ⚠️ No tables available for this selection.
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn"
            disabled={submitting || checkingAvailability || availableTables.length === 0}
            style={{ marginTop: 4 }}
          >
            {submitting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Booking…
              </>
            ) : (
              '🍽 Book Table'
            )}
          </button>
        </form>
      </div>

      {/* ── Existing Reservations ── */}
      <div className="card">
        <div className="section-title">Your Bookings</div>

        {loadingList ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>Loading your reservations…</span>
          </div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No reservations yet</div>
            <div className="empty-state-desc">Use the form above to book your first table.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Table</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.date}</strong>
                    </td>
                    <td>{r.timeSlot}</td>
                    <td>
                      Table {r.table?.tableNumber}
                      <div className="td-secondary">seats {r.table?.capacity}</div>
                    </td>
                    <td>{r.guests} guests</td>
                    <td>
                      <span className={`status-tag ${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status === 'confirmed' && (
                        <button
                          className="btn danger btn-sm"
                          onClick={() => handleCancel(r._id)}
                        >
                          Cancel
                        </button>
                      )}
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

export default Reservations;
