// src/App.js
import React, { useState, useEffect } from 'react';
import { 
  GlassWater, Plus, Minus, Utensils, Users, BarChart3, 
  Globe, LogOut, Flame, Send, Home, User, Lightbulb 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

// Automatically handles Ngrok URL or local port 5000
const API_BASE_URL = window.location.hostname.includes('onrender.com')
  ? ''
  : 'http://localhost:5000';
const translations = {
  en: {
    title: 'HealthyCommunity 🥗',
    welcome: 'Welcome',
    dailyTracker: 'Daily Calorie Goal',
    waterIntake: 'Water Tracker',
    glasses: 'Glasses',
    addMeal: 'Log Your Meal',
    foodJournal: "Today's Logged Meals",
    communityBulletin: 'Community Bulletin',
    weeklyAnalytics: 'Weekly Calorie Graph',
    editProfile: 'My Profile & Targets',
    logItem: 'Save Meal Log',
    noMeals: 'No meals logged today yet.',
    noAnnouncements: 'No community updates.',
    carbs: 'Carbs',
    protein: 'Protein',
    fats: 'Fats',
    target: 'Target Kcal',
    logout: 'Logout',
    streak: 'Day Streak',
    meals: { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' },
    customOption: '➕ Custom / Home Cooked Food',
    postAnnouncement: 'Post Announcement',
    announcementTitle: 'Title',
    announcementDesc: 'Description',
    saveProfile: 'Save Changes'
  },
  hi: {
    title: 'स्वास्थ्य समुदाय 🥗',
    welcome: 'स्वागत है',
    dailyTracker: 'दैनिक कैलोरी लक्ष्य',
    waterIntake: 'पानी का सेवन',
    glasses: 'ग्लास',
    addMeal: 'भोजन जोड़ें',
    foodJournal: 'आज का भोजन',
    communityBulletin: 'सामुदायिक समाचार',
    weeklyAnalytics: 'साप्ताहिक आलेख',
    editProfile: 'मेरी प्रोफाइल',
    logItem: 'दर्ज करें',
    noMeals: 'आज कोई भोजन दर्ज नहीं है।',
    noAnnouncements: 'कोई अपडेट नहीं।',
    carbs: 'कार्ब्स',
    protein: 'प्रोटीन',
    fats: 'फैट्स',
    target: 'लक्ष्य Kcal',
    logout: 'लॉग आउट',
    streak: 'दिनों की स्ट्रिक',
    meals: { breakfast: 'नाश्ता', lunch: 'दोपहर का खाना', snacks: 'शाम का नाश्ता', dinner: 'रात का खाना' },
    customOption: '➕ अन्य / नया भोजन',
    postAnnouncement: 'घोषणा पोस्ट करें',
    announcementTitle: 'शीर्षक',
    announcementDesc: 'विवरण',
    saveProfile: 'अपडेट करें'
  },
  mr: {
    title: 'आरोग्य समुदाय 🥗',
    welcome: 'सुस्वागतम्',
    dailyTracker: 'दैनिक कॅलरी ध्येय',
    waterIntake: 'पाण्याचे प्रमाण',
    glasses: 'पेले',
    addMeal: 'अन्न नोंदवा',
    foodJournal: 'आजची जेवणे',
    communityBulletin: 'सामाजिक बातम्या',
    weeklyAnalytics: 'साप्ताहिक आलेख',
    editProfile: 'माझी माहिती',
    logItem: 'नोंदवा',
    noMeals: 'आज अजून नोंद केली नाही.',
    noAnnouncements: 'सध्या बातमी नाही.',
    carbs: 'कार्बोहायड्रेट्स',
    protein: 'प्रथिणे',
    fats: 'स्निग्ध',
    target: 'लक्ष्य Kcal',
    logout: 'बाहेर पडा',
    streak: 'दिवसांची स्ट्रिक',
    meals: { breakfast: 'नाश्ता', lunch: 'जेवण', snacks: 'खाऊ', dinner: 'रात्रीचे जेवण' },
    customOption: '➕ इतर / नवीन अन्न',
    postAnnouncement: 'बातमी प्रसिद्ध करा',
    announcementTitle: 'शीर्षक',
    announcementDesc: 'माहिती',
    saveProfile: 'जतन करा'
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // Tabs: 'home', 'add', 'community', 'profile'

  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', age: '', height: '', weight: '' });
  const [authError, setAuthError] = useState('');

  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [user, setUser] = useState(null);
  const [foods, setFoods] = useState([]);
  const [summary, setSummary] = useState({ logs: [], totals: { calories: 0, carbs: 0, protein: 0, fats: 0 } });
  const [weeklyData, setWeeklyData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Meal Form States
  const [selectedMealType, setSelectedMealType] = useState('Breakfast');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [portionCount, setPortionCount] = useState(1);

  // Smart Estimator States (Fix for Issue #1)
  const [customName, setCustomName] = useState('');
  const [estimationMode, setEstimationMode] = useState('guided'); 
  const [portionCategory, setPortionCategory] = useState('150'); 
  const [mealRichness, setMealRichness] = useState('1.0'); 
  const [manualCalories, setManualCalories] = useState('');

  // Profile Form
  const [profileForm, setProfileForm] = useState({ name: '', age: '', height: '', weight: '', target_calories: 2000 });

  // Community Post Form
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '' });

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };

      const userRes = await fetch(`${API_BASE_URL}/api/user`, { headers: authHeader });
      if (!userRes.ok) return handleLogout();
      const userData = await userRes.json();

      const streakRes = await fetch(`${API_BASE_URL}/api/user/streak`, { headers: authHeader });
      const streakData = await streakRes.json();

      setUser({ ...userData, streak: streakData.streak || 0 });
      setProfileForm({ 
        name: userData.name || '', 
        age: userData.age || '', 
        height: userData.height || '', 
        weight: userData.weight || '', 
        target_calories: userData.target_calories || 2000 
      });

      const foodRes = await fetch(`${API_BASE_URL}/api/foods`);
      const foodData = await foodRes.json();
      setFoods(foodData);
      if (foodData.length > 0) setSelectedFoodId(foodData[0].id);

      const today = new Date().toISOString().split('T')[0];
      const summaryRes = await fetch(`${API_BASE_URL}/api/meals/summary?date=${today}`, { headers: authHeader });
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      const analyticsRes = await fetch(`${API_BASE_URL}/api/meals/weekly-analytics`, { headers: authHeader });
      const analyticsData = await analyticsRes.json();
      setWeeklyData(analyticsData);

      const announcementsRes = await fetch(`${API_BASE_URL}/api/announcements`);
      const announcementsData = await announcementsRes.json();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Connection failed. Make sure backend is running.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        alert('Profile Updated Successfully!');
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleWaterChange = async (change) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ change }),
      });
      const data = await res.json();
      setUser((prev) => ({ ...prev, water_intake: data.water_intake }));
    } catch (error) {
      console.error('Error updating water intake:', error);
    }
  };

  // Smart Estimator Calculation Logic
  const calculateEstimatedCalories = () => {
    if (estimationMode === 'manual') return parseInt(manualCalories) || 0;
    const base = parseFloat(portionCategory);
    const multiplier = parseFloat(mealRichness);
    return Math.round(base * multiplier);
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!selectedFoodId) return;

    let finalCalories = 0;
    if (selectedFoodId === 'custom') {
      finalCalories = calculateEstimatedCalories();
      if (!customName || !finalCalories) {
        alert('Please specify the food name and portion estimate.');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/meals/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          meal_type: selectedMealType,
          food_id: selectedFoodId === 'custom' ? 'custom' : parseInt(selectedFoodId),
          custom_name: customName,
          custom_calories: finalCalories,
          portion_count: parseInt(portionCount),
          carbs: Math.round(finalCalories * 0.12),
          protein: Math.round(finalCalories * 0.03),
          fats: Math.round(finalCalories * 0.04)
        }),
      });

      if (res.ok) {
        setCustomName('');
        setManualCalories('');
        setActiveTab('home'); // Automatically return to Home Dashboard
        await fetchData();
      }
    } catch (error) {
      console.error('Error logging meal:', error);
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.description) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/announcements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (res.ok) {
        setNewAnnouncement({ title: '', description: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error posting announcement:', error);
    }
  };

  if (!token || !user) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <h2>{t.title}</h2>
          <p>{isRegistering ? 'Create Account' : 'Sign In'}</p>
          
          {authError && <div className="error-msg">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isRegistering && (
              <div className="form-group">
                <label>Name:</label>
                <input type="text" placeholder="e.g. Anushka Mhatre" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
              </div>
            )}

            <div className="form-group">
              <label>Email:</label>
              <input type="email" placeholder="e.g. user@gmail.com" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input type="password" placeholder="••••••••" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
            </div>
            
            {isRegistering && (
              <>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Age:</label>
                    <input type="number" placeholder="21" value={authForm.age} onChange={(e) => setAuthForm({ ...authForm, age: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Height (cm):</label>
                    <input type="number" placeholder="165" value={authForm.height} onChange={(e) => setAuthForm({ ...authForm, height: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Weight (kg):</label>
                  <input type="number" placeholder="60" value={authForm.weight} onChange={(e) => setAuthForm({ ...authForm, weight: e.target.value })} required />
                </div>
              </>
            )}

            <button type="submit" className="submit-btn">{isRegistering ? 'Register' : 'Login'}</button>
          </form>

          <button className="toggle-auth-btn" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="header">
        <div>
          <h2>{t.title}</h2>
          <p>{t.welcome}, {user.name.split(' ')[0]} 👋</p>
        </div>
        <div className="header-actions">
          <div className="streak-badge">
            <Flame size={12} color="#f97316" /> {user.streak}d
          </div>
          <div className="lang-picker">
            <Globe size={14} style={{ color: 'white' }} />
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
            </select>
          </div>
        </div>
      </header>

      {/* TAB 1: HOME DASHBOARD */}
      {activeTab === 'home' && (
        <>
          <div className="card">
            <h3>{t.dailyTracker}</h3>
            <div className="calorie-display">
              <span className="calorie-num">{summary.totals.calories}</span>
              <span className="calorie-denom">/ {user.target_calories || 2000} kcal</span>
            </div>
            <div className="macro-bar">
              <div>{t.carbs}<br/><strong>{summary.totals.carbs}g</strong></div>
              <div>{t.protein}<br/><strong>{summary.totals.protein}g</strong></div>
              <div>{t.fats}<br/><strong>{summary.totals.fats}g</strong></div>
            </div>
          </div>

          <div className="card">
            <h3>{t.waterIntake}</h3>
            <div className="water-control">
              <div className="water-left">
                <GlassWater size={28} color="#0284c7" />
                <span className="water-count">{user.water_intake} {t.glasses}</span>
              </div>
              <div className="btn-group">
                <button onClick={() => handleWaterChange(-1)}><Minus size={14} /></button>
                <button onClick={() => handleWaterChange(1)}><Plus size={14} /></button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3><Utensils size={16} /> {t.foodJournal}</h3>
            {summary.logs.length === 0 ? (
              <p className="empty-text">{t.noMeals}</p>
            ) : (
              <ul className="meal-list">
                {summary.logs.map((log) => (
                  <li key={log.id} className="meal-item">
                    <div>
                      <span className="meal-tag">{log.meal_type}</span>
                      <strong>{log.food_name}</strong> (x{log.portion_count})
                    </div>
                    <span className="meal-stats">{log.total_calories} kcal</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* TAB 2: ADD FOOD (With Portion-Based Estimator) */}
      {activeTab === 'add' && (
        <div className="card">
          <h3><Utensils size={16} /> {t.addMeal}</h3>
          <form onSubmit={handleLogMeal} className="log-form">
            <div className="form-group">
              <label>Meal Type:</label>
              <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)}>
                <option value="Breakfast">{t.meals.breakfast}</option>
                <option value="Lunch">{t.meals.lunch}</option>
                <option value="Snacks">{t.meals.snacks}</option>
                <option value="Dinner">{t.meals.dinner}</option>
              </select>
            </div>

            <div className="form-group">
              <label>Select Food Item:</label>
              <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)}>
                {foods.map((food) => {
                  const displayName = 
                    lang === 'hi' ? food.name_hi :
                    lang === 'mr' ? food.name_mr :
                    food.name;
                  return (
                    <option key={food.id} value={food.id}>
                      {displayName} ({food.calories} kcal)
                    </option>
                  );
                })}
                <option value="custom">{t.customOption}</option>
              </select>
            </div>

            {selectedFoodId === 'custom' && (
              <div className="estimation-box">
                <p><Lightbulb size={12} /> <strong>Smart Portion Estimator:</strong> Don't know exact calories? Select options below.</p>
                
                <div className="form-group">
                  <label>Food Item Name:</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Paratha, Poha, Misal" 
                    value={customName} 
                    onChange={(e) => setCustomName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Calculation Method:</label>
                  <select value={estimationMode} onChange={(e) => setEstimationMode(e.target.value)}>
                    <option value="guided">Guided Estimation (Portion Size & Oil)</option>
                    <option value="manual">Exact Entry (Manual Calories)</option>
                  </select>
                </div>

                {estimationMode === 'guided' ? (
                  <div className="grid-2">
                    <div className="form-group">
                      <label>Portion Size:</label>
                      <select value={portionCategory} onChange={(e) => setPortionCategory(e.target.value)}>
                        <option value="80">Small Cup / 1 Piece (~80 kcal)</option>
                        <option value="150">Medium Bowl (~150 kcal)</option>
                        <option value="250">Large Plate (~250 kcal)</option>
                        <option value="350">Heavy Full Meal (~350 kcal)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Oil / Butter Level:</label>
                      <select value={mealRichness} onChange={(e) => setMealRichness(e.target.value)}>
                        <option value="0.9">Steamed / Low Oil (0.9x)</option>
                        <option value="1.0">Standard Home Cooked (1.0x)</option>
                        <option value="1.3">Fried / Butter / Gravy (1.3x)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Calories (kcal):</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 250" 
                      value={manualCalories} 
                      onChange={(e) => setManualCalories(e.target.value)} 
                      required 
                    />
                  </div>
                )}

                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', textAlign: 'right' }}>
                  Estimated Calories: ~{calculateEstimatedCalories()} kcal
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Number of Servings:</label>
              <select value={portionCount} onChange={(e) => setPortionCount(e.target.value)}>
                <option value="1">1 Serving</option>
                <option value="2">2 Servings</option>
                <option value="3">3 Servings</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">{t.logItem}</button>
          </form>
        </div>
      )}

      {/* TAB 3: COMMUNITY TAB */}
      {activeTab === 'community' && (
        <div className="card">
          <h3><Users size={16} /> {t.communityBulletin}</h3>
          
          <form onSubmit={handlePostAnnouncement} className="log-form" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <input 
                type="text" 
                placeholder={t.announcementTitle} 
                value={newAnnouncement.title} 
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                required 
              />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                placeholder={t.announcementDesc} 
                value={newAnnouncement.description} 
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })} 
                required 
              />
            </div>
            <button type="submit" className="submit-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Send size={14} /> {t.postAnnouncement}
            </button>
          </form>

          {announcements.length === 0 ? (
            <p className="empty-text">{t.noAnnouncements}</p>
          ) : (
            announcements.map((item) => (
              <div key={item.id} className="announcement-card">
                <strong>📢 {item.title}</strong>
                <p>{item.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: PROFILE & ANALYTICS TAB */}
      {activeTab === 'profile' && (
        <>
          <div className="card">
            <h3><User size={16} /> {t.editProfile}</h3>
            <form onSubmit={handleUpdateProfile} className="log-form">
              <div className="form-group">
                <label>Name:</label>
                <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Age:</label>
                  <input type="number" value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Target Kcal:</label>
                  <input type="number" value={profileForm.target_calories} onChange={(e) => setProfileForm({ ...profileForm, target_calories: e.target.value })} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Height (cm):</label>
                  <input type="number" value={profileForm.height} onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Weight (kg):</label>
                  <input type="number" value={profileForm.weight} onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })} required />
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '10px', fontSize: '13px', textAlign: 'center' }}>
                BMI: <strong>{user.bmi}</strong>
              </div>

              <button type="submit" className="submit-btn">{t.saveProfile}</button>
            </form>
          </div>

          <div className="card">
            <h3><BarChart3 size={16} /> {t.weeklyAnalytics}</h3>
            <div style={{ width: '100%', height: 160, marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
            <LogOut size={14} /> {t.logout}
          </button>
        </>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="tab-navigation">
        <button className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={18} />
          <span>Home</span>
        </button>
        <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
          <Utensils size={18} />
          <span>Add Food</span>
        </button>
        <button className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`} onClick={() => setActiveTab('community')}>
          <Users size={18} />
          <span>Community</span>
        </button>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={18} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

export default App;