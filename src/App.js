import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Square, Trophy, History, Clock, Volume2, VolumeX, BarChart3, User, LogOut, Lock, Mail, Calendar as CalIcon, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_URL = "http://localhost:5000/api";

const THEME = {
  bg: "#fff5e6",
  card: "#ffffff",
  statsCardBg: "#fffbe6", // Lightest Yellow for Stats/Daily Summary
  textBrown: "#5c2e00",//dark brown 
  primary: "#804000",//light brown for font
  accent: "#a0522d",//lightest brown
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

  const toggleBackgroundMusic = () => {
    audioRef.current.loop = true;
    if (isAudioEnabled) audioRef.current.pause();
    else audioRef.current.play().catch(() => { });
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/${authMode === 'login' ? 'login' : 'register'}`, authData);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
    } catch (err) { alert(err.response?.data?.message || "Auth Failed"); }
  };

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

  if (!user) {
    return (
      <div style={{ ...styles.appContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.authCard}>
          <h1 style={styles.authTitle}>{authMode === 'login' ? 'Login' : 'Sign Up'}</h1>
          <p style={{ fontFamily: THEME.fontText, opacity: 0.6, marginBottom: '20px' }}>Access your spiritual dashboard</p>
          <form onSubmit={handleAuth} style={styles.authForm}>
            {authMode === 'signup' && <div style={styles.inputGroup}><User size={18} color={THEME.primary} /><input style={styles.modernInput} placeholder="Name" onChange={e => setAuthData({ ...authData, name: e.target.value })} required /></div>}
            <div style={styles.inputGroup}><Mail size={18} color={THEME.primary} /><input style={styles.modernInput} type="email" placeholder="Email Address" onChange={e => setAuthData({ ...authData, email: e.target.value })} required /></div>
            <div style={styles.inputGroup}><Lock size={18} color={THEME.primary} /><input style={styles.modernInput} type="password" placeholder="Password" onChange={e => setAuthData({ ...authData, password: e.target.value })} required /></div>
            <button type="submit" style={styles.primaryBtn}>{authMode === 'login' ? 'Enter Dashboard' : 'Join Now'}</button>
          </form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={styles.toggleAuth}>
            {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <div style={styles.navLeft}>Anandmaya</div>
        <div style={styles.navRight}>
          <a href="#more" style={styles.navLink}>See More</a>
          <a href="#contact" style={styles.navLink}>Contact</a>
          <button onClick={() => { localStorage.removeItem('user'); setUser(null); }} style={styles.logoutBtn}><LogOut size={16} /> Logout</button>
        </div>
      </nav>

      <div style={styles.contentWrapper}>
        <div style={styles.greeting}>Pranam, {user.name}</div>
        <header style={styles.header}>
          <h1 style={styles.mainTitle}>📿 Naam Jaap Counter</h1>
          <p style={styles.subHeader}>Your spiritual chanting companion</p>
        </header>

        <main style={{ ...styles.main, flexDirection: window.innerWidth > 1024 ? 'row' : 'column' }}>

          {/* LEFT SIDE: SESSIONS & FEEDBACK */}
          <section style={{ ...styles.column, flex: 1 }}>
            {!isActive ? (
              <motion.div style={styles.sessionCard}>
                <h2 style={styles.cardHeading}>Start New Session</h2>
                <div style={styles.nameGrid}>
                  {names.map(n => (
                    <button key={n} onClick={() => setDivineName(n)} style={{ ...styles.nameBadge, backgroundColor: divineName === n ? THEME.primary : 'white', color: divineName === n ? 'white' : THEME.textBrown }}>{n}</button>
                  ))}
                </div>
                <button onClick={() => { setCount(0); setIsActive(true); }} style={styles.primaryBtn}><Play size={18} fill="white" /> Start Session</button>
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

            {/* FEEDBACK BOX */}
            <div style={styles.feedbackBox}>
              <div style={styles.feedbackHeader}><MessageSquare size={18} color={THEME.primary} /> <span>Feedback & Support</span></div>
              <div style={styles.feedbackContent}>
                <img src="/anandmaya_logo.png" alt="Logo" style={styles.feedbackLogo} />
                <p style={{ fontSize: '13px', color: THEME.textBrown }}>Tell us how we can improve your spiritual journey.</p>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: STATS & SUMMARY */}
          <section style={{ ...styles.column, flex: 1.3 }}>
            <div style={styles.statsPanel}>
              <h3 style={styles.sectionTitle}><BarChart3 size={18} /> Chanting Statistics</h3>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}><h4>{realStats.totalChants}</h4><p>Total Chants</p></div>
                <div style={styles.statCard}><h4>{realStats.sessions}</h4><p>Total Sessions</p></div>
                <div style={styles.statCard}><h4>{Math.floor(realStats.totalTime / 60)}m</h4><p>Total Time</p></div>
                <div style={styles.statCard}><h4>{Math.round(realStats.avg)}</h4><p>Avg Jaap</p></div>
              </div>
              <div style={styles.rangeBox}>
                {[7, 30, 90, 365].map(r => (
                  <button key={r} onClick={() => setViewRange(r)} style={{ ...styles.rangeBtn, backgroundColor: viewRange === r ? THEME.primary : 'white', color: viewRange === r ? 'white' : THEME.textBrown }}>{r}D</button>
                ))}
              </div>
            </div>

            <div style={{ ...styles.statsPanel, marginTop: '25px' }}>
              <h3 style={styles.sectionTitle}><CalIcon size={18} /> Daily Chanting Summary</h3>
              <div style={styles.summaryContainer}>
                <div style={styles.calendarMini}><Calendar onChange={setSelectedDate} value={selectedDate} maxDate={new Date()} /></div>
                <div style={styles.dayStats}>
                  <div style={styles.dayStatItem}><strong>{dailyStats.totalChants}</strong> <p>Chants</p></div>
                  <div style={styles.dayStatItem}><strong>{dailyStats.sessions}</strong> <p>Sessions</p></div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <button onClick={toggleBackgroundMusic} style={styles.musicToggle}>
        {isAudioEnabled ? <Volume2 color={THEME.primary} /> : <VolumeX color={THEME.primary} />}
      </button>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', backgroundColor: THEME.bg, paddingBottom: '50px' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: 'transparent' },
  navLeft: { fontFamily: THEME.fontHeading, fontSize: '2.2rem', fontWeight: 700, color: THEME.textBrown },
  navRight: { display: 'flex', gap: '25px', alignItems: 'center' },
  navLink: { textDecoration: 'none', color: THEME.textBrown, fontFamily: THEME.fontText, fontWeight: 500, fontSize: '14px' },
  logoutBtn: { backgroundColor: 'transparent', border: `1px solid ${THEME.primary}`, padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontFamily: THEME.fontText, fontWeight: 600, color: THEME.primary, display: 'flex', alignItems: 'center', gap: '5px' },

  contentWrapper: { maxWidth: '1150px', margin: '0 auto', padding: '0 20px' },
  greeting: { fontFamily: THEME.fontText, fontWeight: 500, fontSize: '1.1rem', color: THEME.textBrown, marginBottom: '5px' },
  header: { marginBottom: '40px' },
  mainTitle: { fontFamily: THEME.fontHeading, fontSize: '3.5rem', margin: 0, fontWeight: 700, color: THEME.textBrown },
  subHeader: { fontFamily: THEME.fontText, fontWeight: 500, fontSize: '1rem', color: THEME.textBrown, opacity: 0.6 },

  main: { display: 'flex', gap: '40px', alignItems: 'flex-start' },
  column: { width: '100%' },

  authCard: { backgroundColor: 'white', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '480px', textAlign: 'center', boxShadow: '0 20px 60px rgba(128,64,0,0.08)' },
  authTitle: { fontFamily: THEME.fontHeading, fontSize: '3.2rem', color: THEME.primary, marginBottom: '5px' },
  authForm: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #eee', padding: '4px 15px', borderRadius: '15px', backgroundColor: '#fafafa' },
  modernInput: { border: 'none', backgroundColor: 'transparent', padding: '14px 0', width: '100%', outline: 'none', fontFamily: THEME.fontText, fontSize: '15px' },
  toggleAuth: { marginTop: '25px', color: THEME.primary, cursor: 'pointer', fontWeight: 600, fontFamily: THEME.fontText, fontSize: '14px' },

  sessionCard: { backgroundColor: 'white', padding: '30px', borderRadius: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', maxWidth: '400px', margin: '0 auto 25px auto' },
  cardHeading: { fontFamily: THEME.fontHeading, fontSize: '2rem', color: THEME.primary, marginBottom: '20px' },
  nameGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '25px' },
  nameBadge: { padding: '10px', borderRadius: '12px', border: `1px solid ${THEME.primary}`, cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: THEME.fontText },
  primaryBtn: { width: '100%', padding: '16px', backgroundColor: THEME.primary, color: 'white', border: 'none', borderRadius: '16px', fontWeight: 600, fontFamily: THEME.fontText, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },

  feedbackBox: { backgroundColor: 'white', padding: '25px', borderRadius: '25px', maxWidth: '400px', margin: '0 auto', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' },
  feedbackHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: THEME.primary, marginBottom: '15px', fontFamily: THEME.fontText },
  feedbackContent: { display: 'flex', alignItems: 'center', gap: '15px' },
  feedbackLogo: { width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' },

  statsPanel: { backgroundColor: THEME.statsCardBg, padding: '30px', borderRadius: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' },
  sectionTitle: { fontFamily: THEME.fontHeading, fontSize: '1.8rem', color: THEME.primary, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  rangeBox: { display: 'flex', gap: '10px', marginTop: '20px' },
  rangeBtn: { flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${THEME.primary}`, cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: THEME.fontText },

  summaryContainer: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  calendarMini: { flex: 1, minWidth: '250px', backgroundColor: 'white', padding: '10px', borderRadius: '15px' },
  dayStats: { display: 'flex', flexDirection: 'column', gap: '10px', flex: 0.6 },
  dayStatItem: { backgroundColor: 'white', padding: '15px', borderRadius: '15px', textAlign: 'center' },

  activeZone: { textAlign: 'center', marginBottom: '30px' },
  activeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', color: THEME.primary },
  stopBtn: { padding: '8px 16px', borderRadius: '10px', border: `1px solid ${THEME.primary}`, backgroundColor: 'transparent', color: THEME.primary, cursor: 'pointer', fontWeight: 600 },
  counterCircleWrapper: { position: 'relative', height: '280px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  bigCircle: { width: '230px', height: '230px', borderRadius: '50%', backgroundColor: 'white', border: `8px solid ${THEME.bg}`, boxShadow: '0 15px 40px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  bigCount: { fontSize: '70px', fontWeight: 700, color: THEME.primary },
  label: { fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: THEME.primary, opacity: 0.5 },
  popup: { position: 'absolute', fontSize: '2.5rem', fontWeight: 700, pointerEvents: 'none', fontFamily: THEME.fontHeading, color: THEME.primary },
  timerDisplay: { marginTop: '20px', fontSize: '1.5rem', fontWeight: 600, color: THEME.primary },
  musicToggle: { position: 'fixed', bottom: '30px', right: '30px', backgroundColor: 'white', border: 'none', padding: '15px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 100 }
};

export default App;