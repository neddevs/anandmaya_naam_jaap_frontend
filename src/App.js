import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Square } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Essential for Calendar styling
import moment from 'moment';

const API_URL = "http://localhost:5000/api/sessions";

function App() {
  // --- 1. STATE VARIABLES ---
  const [divineName, setDivineName] = useState('Ram');
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [history, setHistory] = useState([]);

  // NEW STATES FOR PHASE 6
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyStats, setDailyStats] = useState([]);

  const names = ['Ram', 'Radha', 'Krishna', 'Shiva', 'Durga', 'Hanuman', 'Ganesh', 'Others'];

  // --- 2. LOGIC FUNCTIONS ---

  // START SESSION
  const startSession = () => {
    setIsActive(true);
    setCount(0);
    setStartTime(new Date());
  };

  // STOP SESSION & SAVE TO DB
  const stopSession = async () => {
    const endTime = new Date();
    setIsActive(false);

    const sessionData = {
      divineName,
      count,
      startTime,
      endTime
    };

    try {
      await axios.post(`${API_URL}/save`, sessionData);
      alert("Jaap Session Saved!");
      fetchHistory(); // Refresh general history
      fetchDailyStats(selectedDate); // Refresh the calendar view stats
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session.");
    }
  };

  // FETCH HISTORY (General list)
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // NEW FUNCTION: Fetch stats for the date clicked on calendar
  const fetchDailyStats = async (date) => {
    try {
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const response = await axios.get(`${API_URL}/stats/${formattedDate}`);
      setDailyStats(response.data);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  };

  // Load general history on startup
  useEffect(() => {
    fetchHistory();
  }, []);

  // Update daily stats whenever the user clicks a different date on the calendar
  useEffect(() => {
    fetchDailyStats(selectedDate);
  }, [selectedDate]);

  // --- 3. THE USER INTERFACE (UI) ---
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📿 Naam Jaap Counter</h1>

      {/* --- COUNTER SECTION --- */}
      <div style={styles.section}>
        <label>Select Divine Name: </label>
        <select
          value={divineName}
          onChange={(e) => setDivineName(e.target.value)}
          disabled={isActive}
          style={styles.select}
        >
          {names.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div style={styles.controls}>
        {!isActive ? (
          <button onClick={startSession} style={styles.playBtn}>
            <Play size={20} /> Start Session
          </button>
        ) : (
          <button onClick={stopSession} style={styles.stopBtn}>
            <Square size={20} /> Stop & Save
          </button>
        )}
      </div>

      <div style={styles.counterSection}>
        <button
          onClick={() => isActive && setCount(count + 1)}
          style={{ ...styles.jaapBtn, opacity: isActive ? 1 : 0.5 }}
        >
          <div style={styles.countNumber}>{count}</div>
          <div style={styles.clickText}>{isActive ? `Click for ${divineName}` : 'Press Start First'}</div>
        </button>
      </div>

      <hr style={styles.divider} />

      {/* --- CALENDAR & DAILY STATS SECTION --- */}
      <div style={styles.calendarSection}>
        <h2 style={styles.subTitle}>📅 Journey History</h2>
        <div style={styles.calendarFlex}>

          <div style={styles.calendarWrapper}>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              maxDate={new Date()} // Prevents selecting future dates
              minDate={moment().subtract(90, 'days').toDate()} // Limits to 90 days
            />
          </div>

          <div style={styles.statsWrapper}>
            <h3>Stats for {moment(selectedDate).format('LL')}</h3>
            {dailyStats.length > 0 ? (
              dailyStats.map((session, index) => (
                <div key={index} style={styles.statRow}>
                  <strong>{session.divineName}</strong>
                  <span>{session.count} Jaaps</span>
                </div>
              ))
            ) : (
              <p style={{ color: '#999' }}>No sessions recorded for this day.</p>
            )}
          </div>

        </div>
      </div>

      {/* --- RECENT ACTIVITY LIST --- */}
      <div style={styles.historySection}>
        <h3>Recent Activity</h3>
        <div style={styles.historyList}>
          {history.slice(0, 5).map((item, index) => (
            <div key={index} style={styles.historyItem}>
              <span>{moment(item.startTime).format('MMM D')}</span>
              <strong>{item.divineName}</strong>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- UPDATED STYLES ---
const styles = {
  container: { textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#fff5e6', minHeight: '100vh' },
  title: { color: '#804000', marginBottom: '30px' },
  subTitle: { color: '#804000', fontSize: '1.5rem' },
  section: { margin: '20px 0' },
  select: { padding: '8px', borderRadius: '5px', fontSize: '16px', border: '1px solid #804000' },
  controls: { marginBottom: '30px' },
  playBtn: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  stopBtn: { padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  jaapBtn: { width: '220px', height: '220px', borderRadius: '50%', border: '10px solid #804000', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', outline: 'none' },
  countNumber: { fontSize: '54px', fontWeight: 'bold', color: '#804000' },
  clickText: { fontSize: '14px', color: '#666' },
  divider: { margin: '50px auto', width: '80%', border: '0', borderTop: '1px solid #dcc' },

  calendarSection: { maxWidth: '900px', margin: '0 auto' },
  calendarFlex: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', marginTop: '20px' },
  calendarWrapper: { backgroundColor: '#fff', padding: '10px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  statsWrapper: { flex: '1', minWidth: '280px', textAlign: 'left', backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },

  historySection: { marginTop: '50px', textAlign: 'left', maxWidth: '400px', margin: '50px auto' },
  historyList: { backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }
};

export default App;