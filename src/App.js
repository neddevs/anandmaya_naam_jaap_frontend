import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Square, HandsPraying } from 'lucide-react'; // Icons for the buttons

const API_URL = "http://localhost:5000/api/sessions";

function App() {
  // --- 1. STATE VARIABLES ---
  const [divineName, setDivineName] = useState('Ram');
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [history, setHistory] = useState([]);

  const names = ['Ram', 'Radha', 'Krishna', 'Shiva', 'Durga', 'Hanuman', 'Ganesh', 'Others'];

  // --- 2. LOGIC FUNCTIONS ---

  // START SESSION
  const startSession = () => {
    setIsActive(true);
    setCount(0); // Reset count for new session
    setStartTime(new Date()); // Record start time
  };

  // STOP SESSION & SAVE TO DB
  const stopSession = async () => {
    const endTime = new Date();
    setIsActive(false);

    // Prepare the data to send to Backend
    const sessionData = {
      divineName,
      count,
      startTime,
      endTime
    };

    try {
      // Send data to our Backend API
      await axios.post(`${API_URL}/save`, sessionData);
      alert("Jaap Session Saved!");
      fetchHistory(); // Refresh history list after saving
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session.");
    }
  };

  // FETCH HISTORY (90 Days)
  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Load history when the app first opens
  useEffect(() => {
    fetchHistory();
  }, []);

  // --- 3. THE USER INTERFACE (UI) ---
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📿 Naam Jaap Counter</h1>

      {/* Dropdown to select Divine Name */}
      <div style={styles.section}>
        <label>Select Divine Name: </label>
        <select
          value={divineName}
          onChange={(e) => setDivineName(e.target.value)}
          disabled={isActive} // Can't change name during a session
          style={styles.select}
        >
          {names.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {/* Play / Stop Buttons */}
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

      {/* THE MAIN COUNTER BUTTON */}
      <div style={styles.counterSection}>
        <button
          onClick={() => isActive && setCount(count + 1)}
          style={{ ...styles.jaapBtn, opacity: isActive ? 1 : 0.5 }}
        >
          <div style={styles.countNumber}>{count}</div>
          <div style={styles.clickText}>{isActive ? `Click for ${divineName}` : 'Press Start First'}</div>
        </button>
      </div>

      {/* HISTORY LIST */}
      <div style={styles.historySection}>
        <h3>Recent History (Last 90 Days)</h3>
        <div style={styles.historyList}>
          {history.map((item, index) => (
            <div key={index} style={styles.historyItem}>
              <span>{new Date(item.startTime).toLocaleDateString()}</span>
              <strong>{item.divineName}</strong>
              <span>{item.count} Jaaps</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple CSS-in-JS for styling
const styles = {
  container: { textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#fff5e6', minHeight: '100vh' },
  title: { color: '#804000' },
  section: { margin: '20px 0' },
  select: { padding: '8px', borderRadius: '5px', fontSize: '16px' },
  controls: { marginBottom: '30px' },
  playBtn: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  stopBtn: { padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' },
  jaapBtn: { width: '200px', height: '200px', borderRadius: '50%', border: '8px solid #804000', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'transform 0.1s' },
  countNumber: { fontSize: '48px', fontWeight: 'bold', color: '#804000' },
  clickText: { fontSize: '14px', color: '#666' },
  historySection: { marginTop: '40px', textAlign: 'left', maxWidth: '400px', margin: '40px auto' },
  historyList: { backgroundColor: 'white', padding: '10px', borderRadius: '10px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }
};

export default App;