import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Square, Trophy, History, Clock, Volume2, VolumeX, BarChart3, User, LogOut, Lock, Mail, Calendar as CalIcon, MessageSquare, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_URL = "http://localhost:5000/api";

const THEME = {
  bg: "#fff5e6",
  navbar: "#ffffff",
  card: "#fffbe6",
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
  const [todayStats, setTodayStats] = useState({ totalChants: 0, sessions: 0 });

  const names = ['Ram', 'Radha', 'Krishna', 'Shiva', 'Durga', 'Hanuman', 'Ganesh', 'Others'];
  const timerRef = useRef(null);
  const audioRef = useRef(new Audio('./audio/bird.mp3'));

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
      const today = moment().format('YYYY-MM-DD');
      const todayRes = await axios.get(`${API_URL}/sessions/daily-stats?date=${today}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTodayStats(todayRes.data);
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

  const Navigation = () => (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>Anandmaya</div>
      <div style={styles.navRight}>
        <a href="#more" style={styles.navLink}>See More</a>
        <a href="#contact" style={styles.navLink}>Contact</a>
        {user && <button onClick={() => { localStorage.removeItem('user'); setUser(null); }} style={styles.logoutBtn}><LogOut size={16} /> Logout</button>}
      </div>
    </nav>
  );

  const Footer = () => (
    <footer style={styles.footer}>
      © 2026 Anandmaya Naam Jaap. All Rights Reserved.
    </footer>
  );

  if (!user) {
    return (
      <div style={styles.appContainer}>
        <Navigation />
        <div style={styles.authWrapper}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.authCard}>
            <h1 style={styles.authTitle}>Login</h1>
            <p style={{ fontFamily: THEME.fontText, opacity: 0.6, marginBottom: '25px', fontWeight: 500 }}>Access your spiritual dashboard</p>
            <form onSubmit={handleAuth} style={styles.authForm}>
              {authMode === 'signup' && <div style={styles.inputGroup}><User size={18} color={THEME.primary} /><input style={styles.modernInput} placeholder="Name" onChange={e => setAuthData({ ...authData, name: e.target.value })} required /></div>}
              <div style={styles.inputGroup}><Mail size={18} color={THEME.primary} /><input style={styles.modernInput} type="email" placeholder="Email Address" onChange={e => setAuthData({ ...authData, email: e.target.value })} required /></div>
              <div style={styles.inputGroup}><Lock size={18} color={THEME.primary} /><input style={styles.modernInput} type="password" placeholder="Password" onChange={e => setAuthData({ ...authData, password: e.target.value })} required /></div>
              <button type="submit" style={styles.primaryBtn}>Enter Dashboard</button>
            </form>
            <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={styles.toggleAuth}>
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </p>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <Navigation />

      <div style={styles.contentWrapper}>
        <div style={styles.greetingRow}>
          <div style={styles.greetingText}>Pranam, {user.name} 𖤓</div>
        </div>

        <header style={styles.header}>
          <h1 style={styles.mainTitle}>Naam Jaap Counter</h1>
          <p style={styles.subHeader}>Your spiritual chanting companion</p>
        </header>

        <main style={styles.dashboardGrid}>
          <section style={styles.gridColumn}>
            {!isActive ? (
              <motion.div style={styles.standardBox}>
                <h2 style={styles.cardHeading}>Start New Session</h2>
                <div style={styles.nameGrid}>
                  {names.map(n => (
                    <button key={n} onClick={() => setDivineName(n)} style={{ ...styles.nameBadge, backgroundColor: divineName === n ? THEME.primary : 'white', color: divineName === n ? 'white' : THEME.textBrown }}>{n}</button>
                  ))}
                </div>
                <button onClick={() => { setCount(0); setIsActive(true); }} style={{ ...styles.primaryBtn, marginTop: 'auto' }}><Play size={18} fill="white" /> Start Session</button>
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

            <div style={styles.standardBox}>
              <h3 style={styles.sectionTitle}><Sun size={18} /> Today's Journey</h3>
              <div style={styles.statsGrid}>
                <div style={styles.whiteStatCard}><h4>{todayStats.totalChants}</h4><p>Chants Today</p></div>
                <div style={styles.whiteStatCard}><h4>{todayStats.sessions}</h4><p>Sessions Today</p></div>
              </div>
            </div>

            <div style={styles.standardBox}>
              <h3 style={{ ...styles.sectionTitle, fontSize: '2rem' }}><MessageSquare size={22} /> Feedback & Support</h3>
              <div style={styles.feedbackContent}>
                <img src="/anandmaya_logo.png" alt="Logo" style={styles.feedbackLogo} />
                <div>
                  <p style={styles.feedbackText}>Tell us how we can improve your spiritual journey.</p>
                  <p style={{ marginTop: '10px', fontFamily: THEME.fontText, fontWeight: 500 }}>
                    Mail to: <a href="mailto:info@anandmaya.com" style={styles.emailLink}>info@anandmaya.com</a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.gridColumn}>
            <div style={styles.standardBox}>
              <h3 style={styles.sectionTitle}><BarChart3 size={18} /> Chanting Statistics</h3>
              <div style={styles.statsGrid}>
                <div style={styles.whiteStatCard}><h4>{realStats.totalChants}</h4><p>Total Chants</p></div>
                <div style={styles.whiteStatCard}><h4>{realStats.sessions}</h4><p>Total Sessions</p></div>
                <div style={styles.whiteStatCard}><h4>{Math.floor(realStats.totalTime / 60)}m</h4><p>Total Time</p></div>
                <div style={styles.whiteStatCard}><h4>{Math.round(realStats.avg)}</h4><p>Avg Jaap</p></div>
              </div>
              <div style={styles.rangeBox}>
                {[7, 30, 90, 365].map(r => (
                  <button key={r} onClick={() => setViewRange(r)} style={{ ...styles.rangeBtn, backgroundColor: viewRange === r ? THEME.primary : 'white', color: viewRange === r ? 'white' : THEME.textBrown }}>
                    {r === 365 ? '1 Year' : `${r} Days`}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...styles.standardBox, marginTop: '40px' }}>
              <h3 style={styles.sectionTitle}><CalIcon size={18} /> Daily Chanting Summary</h3>
              <div style={styles.summaryContainer}>
                <div style={styles.calendarMini}><Calendar onChange={setSelectedDate} value={selectedDate} maxDate={new Date()} /></div>
                <div style={styles.dayStats}>
                  <div style={styles.whiteStatCard}><strong>{dailyStats.totalChants}</strong> <p>Chants</p></div>
                  <div style={styles.whiteStatCard}><strong>{dailyStats.sessions}</strong> <p>Sessions</p></div>
                  <div style={styles.whiteStatCard}><strong>{Math.round(dailyStats.avg || 0)}</strong> <p>Average</p></div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
      <button onClick={toggleBackgroundMusic} style={styles.musicToggle}>
        {isAudioEnabled ? <Volume2 color={THEME.primary} /> : <VolumeX color={THEME.primary} />}
      </button>
    </div>
  );
}

const styles = {
  appContainer: { minHeight: '100vh', backgroundColor: THEME.bg, display: 'flex', flexDirection: 'column' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 40px', backgroundColor: THEME.navbar, borderRadius: '15px', margin: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
  navLeft: { fontFamily: THEME.fontHeading, fontSize: '2.2rem', fontWeight: 700, color: THEME.textBrown },
  navRight: { display: 'flex', gap: '25px', alignItems: 'center' },
  navLink: { textDecoration: 'none', color: THEME.textBrown, fontFamily: THEME.fontText, fontWeight: 500, fontSize: '14px' },
  logoutBtn: { backgroundColor: 'transparent', border: `1px solid ${THEME.primary}`, padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontFamily: THEME.fontText, fontWeight: 600, color: THEME.primary, display: 'flex', alignItems: 'center', gap: '5px' },

  footer: { backgroundColor: THEME.navbar, borderRadius: '15px', padding: '15px', margin: '20px 15px', textAlign: 'center', fontFamily: THEME.fontText, fontSize: '13px', fontWeight: 500, color: THEME.textBrown, boxShadow: '0 -4px 10px rgba(0,0,0,0.02)' },

  authWrapper: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  authCard: { backgroundColor: 'white', padding: '60px', borderRadius: '40px', width: '100%', maxWidth: '520px', textAlign: 'center', boxShadow: '0 20px 60px rgba(128,64,0,0.08)' },
  authTitle: { fontFamily: THEME.fontHeading, fontSize: '4rem', color: THEME.primary, marginBottom: '5px', fontWeight: 700 },
  authForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #eee', padding: '5px 20px', borderRadius: '18px', backgroundColor: '#fafafa' },
  modernInput: { border: 'none', backgroundColor: 'transparent', padding: '15px 0', width: '100%', outline: 'none', fontFamily: THEME.fontText, fontSize: '16px', fontWeight: 500 },
  toggleAuth: { marginTop: '30px', color: THEME.primary, cursor: 'pointer', fontWeight: 600, fontFamily: THEME.fontText, fontSize: '15px' },

  contentWrapper: { maxWidth: '1250px', margin: '0 auto', padding: '0 20px', flex: 1, width: '100%' },

  // GREETING UPDATED: Halfway on the left side, correct font.
  greetingRow: { display: 'flex', justifyContent: 'flex-start', width: '100%' },
  greetingText: { paddingLeft: '80px', fontFamily: THEME.fontText, fontWeight: 500, fontSize: '1.2rem', color: THEME.textBrown, marginBottom: '10px' },

  header: { textAlign: 'center', marginBottom: '50px' },
  mainTitle: { fontFamily: THEME.fontHeading, fontSize: '4.5rem', margin: 0, fontWeight: 700, color: THEME.textBrown },
  subHeader: { fontFamily: THEME.fontText, fontWeight: 500, fontSize: '1.2rem', color: THEME.textBrown, opacity: 0.6 },

  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '40px', alignItems: 'stretch' },
  gridColumn: { display: 'flex', flexDirection: 'column', gap: '35px' },

  standardBox: { backgroundColor: THEME.card, padding: '35px', borderRadius: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', flex: 1 },
  cardHeading: { fontFamily: THEME.fontHeading, fontSize: '2.5rem', color: THEME.primary, marginBottom: '25px', fontWeight: 700 },
  nameGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' },
  nameBadge: { padding: '14px', borderRadius: '14px', border: `1px solid ${THEME.primary}`, cursor: 'pointer', fontWeight: 600, fontSize: '15px', fontFamily: THEME.fontText },
  primaryBtn: { width: '100%', padding: '18px', backgroundColor: THEME.primary, color: 'white', border: 'none', borderRadius: '18px', fontWeight: 600, fontFamily: THEME.fontText, fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },

  feedbackContent: { display: 'flex', alignItems: 'center', gap: '25px', marginTop: '10px' },
  feedbackLogo: { width: '100px', height: '100px', borderRadius: '20px', objectFit: 'cover' },
  feedbackText: { fontSize: '16px', color: THEME.textBrown, fontFamily: THEME.fontText, fontWeight: 500 },
  emailLink: { color: THEME.primary, fontWeight: 600, textDecoration: 'underline' },

  sectionTitle: { fontFamily: THEME.fontHeading, fontSize: '2rem', color: THEME.primary, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', flexGrow: 1 },
  whiteStatCard: { backgroundColor: 'white', padding: '25px', borderRadius: '25px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: THEME.fontText },
  rangeBox: { display: 'flex', gap: '12px', marginTop: '25px' },
  rangeBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${THEME.primary}`, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: THEME.fontText },

  summaryContainer: { display: 'flex', gap: '25px', flexWrap: 'wrap', flexGrow: 1 },
  calendarMini: { flex: 1.2, minWidth: '280px', backgroundColor: 'white', padding: '15px', borderRadius: '20px' },
  dayStats: { display: 'flex', flexDirection: 'column', gap: '15px', flex: 0.8 },

  activeZone: { textAlign: 'center', backgroundColor: THEME.card, padding: '40px', borderRadius: '35px' },
  activeHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', color: THEME.primary },
  stopBtn: { padding: '10px 20px', borderRadius: '12px', border: `1px solid ${THEME.primary}`, backgroundColor: 'transparent', color: THEME.primary, cursor: 'pointer', fontWeight: 600 },
  counterCircleWrapper: { position: 'relative', height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  bigCircle: { width: '260px', height: '260px', borderRadius: '50%', backgroundColor: 'white', border: `10px solid ${THEME.bg}`, boxShadow: '0 20px 50px rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  bigCount: { fontSize: '85px', fontWeight: 700, color: THEME.primary, fontFamily: THEME.fontText },
  label: { fontSize: '13px', fontWeight: 600, letterSpacing: '2px', color: THEME.primary, opacity: 0.5, fontFamily: THEME.fontText },
  popup: { position: 'absolute', fontSize: '3rem', fontWeight: 700, pointerEvents: 'none', fontFamily: THEME.fontHeading, color: THEME.primary },
  timerDisplay: { marginTop: '25px', fontSize: '1.8rem', fontWeight: 600, color: THEME.primary, fontFamily: THEME.fontText },
  musicToggle: { position: 'fixed', bottom: '40px', right: '40px', backgroundColor: 'white', border: 'none', padding: '18px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 5px 20px rgba(0,0,0,0.15)', zIndex: 100 }
};

export default App;