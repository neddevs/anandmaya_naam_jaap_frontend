import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Square, Trophy, History, Clock, Volume2, VolumeX, BarChart3, User, LogOut, Lock, Mail, Calendar as CalIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_URL = "http://localhost:5000/api";

const THEME = {
  bg: "#fff5e6",
  card: "#ffffff",
  textBrown: "#5c2e00",
  primary: "#804000",
  accent: "#a0522d",
  fontHeading: "'Cormorant Garamond', serif",
  fontText: "'Inter', sans-serif",
};

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });

  const [divineName, setDivineName] = useState('Ram');
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [popups, setPopups] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const [viewRange, setViewRange] = useState(30);
  const [realStats, setRealStats] = useState({ totalChants: 0, sessions: 0, totalTime: 0, avg: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyStats, setDailyStats] = useState({ totalChants: 0, sessions: 0, avg: 0 });

  const names = ['Ram', 'Radha', 'Krishna', 'Shiva', 'Durga', 'Hanuman', 'Ganesh', 'Others'];
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio('/audio/bird.mp3'));

  // --- AUDIO LOGIC ---
  const toggleBackgroundMusic = () => {
    audioRef.current.loop = true;
    if (isAudioEnabled) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => console.log("User must interact first"));
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  // --- AUTH LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/${authMode === 'login' ? 'login' : 'register'}`, authData);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) { alert(err.response?.data?.message || "Auth Failed"); }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsActive(false);
  };

  // --- ANALYTICS LOGIC ---
  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API_URL}/sessions/stats?days=${viewRange}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRealStats(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchDailyStats = async (date) => {
    if (!user) return;
    const formatted = moment(date).format('YYYY-MM-DD');
    try {
      const res = await axios.get(`${API_URL}/sessions/daily-stats?date=${formatted}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDailyStats(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); }, [user, viewRange]);
  useEffect(() => { fetchDailyStats(selectedDate); }, [user, selectedDate]);

  // --- CHANTING LOGIC ---
  useEffect(() => {
    if (isActive) timerRef.current = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const handleChant = () => {
    if (!isActive) return;
    setCount(prev => prev + 1);
    const utterance = new SpeechSynthesisUtterance(divineName);
    utterance.rate = 1.4;
    window.speechSynthesis.speak(utterance);
    const id = Date.now();
    setPopups([...popups, { id, x: Math.random() * 60 - 30 }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 800);
  };

  const startSession = () => {
    setCount(0); // RESET COUNTER TO 0
    setElapsedTime(0);
    setIsActive(true);
  };

  const stopSession = async () => {
    setIsActive(false);
    window.speechSynthesis.cancel();
    try {
      await axios.post(`${API_URL}/sessions/save`, {
        divineName, count, duration: elapsedTime, startTime: new Date(), endTime: new Date()
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchStats();
      fetchDailyStats(selectedDate);
    } catch (e) { console.error(e); }
  };

  // --- UI SCREENS ---
  if (!user) {
    return (
      <div style={{ ...styles.appContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.authCard}>
          <h1 style={styles.authTitle}>{authMode === 'login' ? 'Login' : 'Sign Up'}</h1>
          <form onSubmit={handleAuth} style={styles.authForm}>
            {authMode === 'signup' && <div style={styles.inputGroup}><User size={18} /><input placeholder="Name" onChange={e => setAuthData({ ...authData, name: e.target.value })} required /></div>}
            <div style={styles.inputGroup}><Mail size={18} /><input type="email" placeholder="Email" onChange={e => setAuthData({ ...authData, email: e.target.value })} required /></div>
            <div style={styles.inputGroup}><Lock size={18} /><input type="password" placeholder="Password" onChange={e => setAuthData({ ...authData, password: e.target.value })} required /></div>
            <button type="submit" style={styles.primaryBtn}>{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
          </form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={styles.toggleAuth}>
            {authMode === 'login' ? "New here? Create account" : "Have an account? Login"}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <button onClick={toggleBackgroundMusic} style={styles.musicToggle}>
        {isAudioEnabled ? <Volume2 color={THEME.primary} /> : <VolumeX color={THEME.primary} />}
      </button>

      <div style={styles.topNav}>
        <span style={{ fontWeight: 600 }}>Pranam, {user.name}</span>
        <button onClick={logout} style={styles.logoutBtn}><LogOut size={16} /> Logout</button>
      </div>

      <header style={styles.header}>
        <h1 style={styles.mainTitle}>📿 Naam Jaap Counter</h1>
      </header>

      <main style={{ ...styles.main, flexDirection: window.innerWidth > 1024 ? 'row' : 'column' }}>
        {/* LEFT COLUMN: ACTION */}
        <section style={{ ...styles.column, flex: 1.2 }}>
          {!isActive ? (
            <motion.div style={styles.mainCard}>
              <h2 style={styles.cardHeading}>Start Session</h2>
              <div style={styles.nameGrid}>
                {names.map(n => (
                  <button key={n} onClick={() => setDivineName(n)} style={{ ...styles.nameBadge, backgroundColor: divineName === n ? THEME.primary : 'white', color: divineName === n ? 'white' : THEME.textBrown }}>
                    {n}
                  </button>
                ))}
              </div>
              <button onClick={startSession} style={styles.primaryBtn}><Play size={20} fill="white" /> Start Chanting</button>
            </motion.div>
          ) : (
            <div style={styles.activeZone}>
              <div style={styles.activeHeader}><h2>{divineName}</h2><button onClick={stopSession} style={styles.stopBtn}>End Session</button></div>
              <div style={styles.counterCircleWrapper}>
                <AnimatePresence>{popups.map(p => (<motion.div key={p.id} initial={{ y: 0, opacity: 1 }} animate={{ y: -150, opacity: 0 }} style={{ ...styles.popup, left: `calc(50% + ${p.x}px)` }}>{divineName}</motion.div>))}</AnimatePresence>
                <button onClick={handleChant} style={styles.bigCircle}>
                  <span style={styles.bigCount}>{count}</span>
                  <span style={styles.label}>CHANTS</span>
                </button>
              </div>
              <div style={styles.timerDisplay}><span>{moment.utc(elapsedTime * 1000).format('mm:ss')}</span><p>Elapsed Time</p></div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: ANALYTICS */}
        <section style={{ ...styles.column, flex: 1 }}>
          {/* OVERALL STATS */}
          <div style={styles.glassCard}>
            <h3 style={styles.sectionTitle}><BarChart3 size={18} /> Overall Progress</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h4>{realStats.totalChants}</h4><p>Total Chants</p></div>
              <div style={styles.statCard}><h4>{realStats.sessions}</h4><p>Sessions</p></div>
            </div>
            <div style={styles.rangeBox}>
              {[7, 30, 90, 365].map(r => (
                <button key={r} onClick={() => setViewRange(r)} style={{ ...styles.rangeBtn, backgroundColor: viewRange === r ? THEME.primary : 'white', color: viewRange === r ? 'white' : THEME.textBrown }}>{r}D</button>
              ))}
            </div>
          </div>

          {/* CALENDAR STATS */}
          <div style={{ ...styles.glassCard, marginTop: '20px' }}>
            <h3 style={styles.sectionTitle}><CalIcon size={18} /> Daily Journey</h3>
            <div style={styles.calendarWrapper}>
              <Calendar onChange={setSelectedDate} value={selectedDate} maxDate={new Date()} minDate={moment().subtract(1, 'year').toDate()} />
            </div>
            <div style={{ ...styles.statsGrid, marginTop: '20px' }}>
              <div style={{ ...styles.statCard, backgroundColor: THEME.bg }}>
                <h4 style={{ fontSize: '1.2rem' }}>{dailyStats.totalChants}</h4>
                <p style={{ fontSize: '10px' }}>Chants on {moment(selectedDate).format('MMM D')}</p>
              </div>
              <div style={{ ...styles.statCard, backgroundColor: THEME.bg }}>
                <h4 style={{ fontSize: '1.2rem' }}>{dailyStats.sessions}</h4>
                <p style={{ fontSize: '10px' }}>Sessions</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', padding: '20px', backgroundColor: THEME.bg, fontFamily: THEME.fontText },
  authCard: { backgroundColor: 'white', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
  authTitle: { fontFamily: THEME.fontHeading, fontSize: '2.5rem', color: THEME.primary },
  authForm: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ddd', padding: '12px', borderRadius: '12px' },
  toggleAuth: { marginTop: '20px', fontSize: '13px', color: THEME.primary, cursor: 'pointer', fontWeight: 600 },
  topNav: { display: 'flex', justifyContent: 'space-between', maxWidth: '1100px', margin: '0 auto 20px auto', alignItems: 'center', color: THEME.textBrown },
  logoutBtn: { backgroundColor: 'transparent', border: 'none', color: THEME.primary, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' },
  header: { textAlign: 'center', marginBottom: '40px' },
  mainTitle: { fontFamily: THEME.fontHeading, fontSize: '3.5rem', margin: 0, fontWeight: 700, color: THEME.textBrown },
  main: { display: 'flex', gap: '30px', maxWidth: '1100px', margin: '0 auto', alignItems: 'flex-start' },
  column: { width: '100%' },
  mainCard: { backgroundColor: THEME.card, borderRadius: '32px', padding: '40px', boxShadow: '0 20px 40px rgba(128,64,0,0.08)', textAlign: 'center' },
  cardHeading: { fontFamily: THEME.fontHeading, fontSize: '2.2rem', color: THEME.primary, marginBottom: '20px' },
  nameGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' },
  nameBadge: { padding: '12px', borderRadius: '14px', border: `1px solid ${THEME.primary}`, cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  primaryBtn: { width: '100%', padding: '15px', backgroundColor: THEME.primary, color: 'white', border: 'none', borderRadius: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  activeZone: { textAlign: 'center' },
  activeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', color: THEME.primary },
  stopBtn: { padding: '8px 16px', borderRadius: '10px', border: `1px solid ${THEME.primary}`, backgroundColor: 'transparent', color: THEME.primary, cursor: 'pointer' },
  counterCircleWrapper: { position: 'relative', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  bigCircle: { width: '240px', height: '240px', borderRadius: '50%', backgroundColor: 'white', border: `8px solid ${THEME.bg}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  bigCount: { fontSize: '70px', fontWeight: 700, color: THEME.primary },
  label: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: THEME.primary, opacity: 0.5 },
  popup: { position: 'absolute', fontSize: '2.5rem', fontWeight: 700, pointerEvents: 'none', fontFamily: THEME.fontHeading, color: THEME.primary },
  timerDisplay: { marginTop: '20px', fontSize: '1.5rem', fontWeight: 600, color: THEME.primary },
  glassCard: { backgroundColor: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' },
  sectionTitle: { fontFamily: THEME.fontHeading, fontSize: '1.6rem', color: THEME.primary, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  statCard: { backgroundColor: THEME.bg, padding: '15px', borderRadius: '18px', textAlign: 'center' },
  rangeBox: { display: 'flex', gap: '8px', marginTop: '20px' },
  rangeBtn: { flex: 1, padding: '8px', borderRadius: '10px', border: `1px solid ${THEME.primary}`, cursor: 'pointer', fontSize: '11px', fontWeight: 600 },
  musicToggle: { position: 'fixed', bottom: '30px', right: '30px', backgroundColor: 'white', border: 'none', padding: '15px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 100 },
  calendarWrapper: { backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden' }
};

export default App;