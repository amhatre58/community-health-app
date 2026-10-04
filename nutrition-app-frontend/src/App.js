// src/App.js
import React, { useState, useEffect } from 'react';
import { GlassWater, Plus, Minus, Utensils, Users, BarChart3, Globe, UserCheck, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

// Translations including localized Meal Types
const translations = {
  en: {
    title: 'HealthyCommunity 🥗',
    welcome: 'Welcome back',
    dailyTracker: 'Daily Calorie Tracker',
    waterIntake: 'Water Intake',
    glasses: 'Glasses',
    addMeal: 'Add Meal (Select Portion)',
    foodJournal: "Today's Food Journal",
    communityBulletin: 'Community Health Bulletin',
    weeklyAnalytics: 'Weekly Calorie Analytics',
    editProfile: 'Update Health Profile',
    logItem: 'Log Item',
    noMeals: 'No meals logged yet today.',
    noAnnouncements: 'No community announcements at this time.',
    carbs: 'Carbs',
    protein: 'Protein',
    fats: 'Fats',
    target: 'Target Kcal',
    logout: 'Logout',
    meals: { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' },
    customOption: '➕ Other / Custom Item',
    customNamePlaceholder: 'Enter Food Name',
    customCalPlaceholder: 'Calories per Portion'
  },
  hi: {
    title: 'स्वास्थ्य समुदाय 🥗',
    welcome: 'स्वागत है',
    dailyTracker: 'दैनिक कैलोरी ट्रैकर',
    waterIntake: 'पानी का सेवन',
    glasses: 'ग्लास',
    addMeal: 'भोजन जोड़ें (मात्रा चुनें)',
    foodJournal: 'आज का भोजन लॉग',
    communityBulletin: 'सामुदायिक स्वास्थ्य समाचार',
    weeklyAnalytics: 'साप्ताहिक कैलोरी विश्लेषण',
    editProfile: 'स्वास्थ्य प्रोफ़ाइल अपडेट करें',
    logItem: 'दर्ज करें',
    noMeals: 'आज अभी तक कोई भोजन लॉग नहीं किया गया है।',
    noAnnouncements: 'इस समय कोई घोषणा उपलब्ध नहीं है।',
    carbs: 'कार्ब्स',
    protein: 'प्रोटीन',
    fats: 'फैट्स',
    target: 'लक्ष्य Kcal',
    logout: 'लॉग आउट',
    meals: { breakfast: 'नाश्ता (Breakfast)', lunch: 'दोपहर का खाना (Lunch)', snacks: 'शाम का नाश्ता (Snacks)', dinner: 'रात का खाना (Dinner)' },
    customOption: '➕ अन्य / कस्टम भोजन जोड़ें',
    customNamePlaceholder: 'भोजन का नाम लिखें',
    customCalPlaceholder: 'प्रति भाग कैलोरी'
  },
  mr: {
    title: 'आरोग्य समुदाय 🥗',
    welcome: 'सुस्वागतम्',
    dailyTracker: 'दैनिक कॅलरी ट्रॅकर',
    waterIntake: 'पाण्याचे प्रमाण',
    glasses: 'पेले',
    addMeal: 'अन्न नोंदवा (प्रमाण निवडा)',
    foodJournal: 'आजची नोंदवलेली जेवणे',
    communityBulletin: 'सामाजिक आरोग्य बातमीपत्र',
    weeklyAnalytics: 'साप्ताहिक कॅलरी विश्लेषण',
    editProfile: 'आरोग्य माहिती अपडेट करा',
    logItem: 'नोंदवा',
    noMeals: 'आज अजून कोणतेही अन्न नोंदवले नाही.',
    noAnnouncements: 'सध्या कोणतीही बातमी उपलब्ध नाही.',
    carbs: 'कार्बोहायड्रेट्स',
    protein: 'प्रथिणे',
    fats: 'स्निग्ध पदार्थ',
    target: 'लक्ष्य Kcal',
    logout: 'बाहेर पडा',
    meals: { breakfast: 'नाश्ता (Breakfast)', lunch: 'दुपारचे जेवण (Lunch)', snacks: 'संध्याकाळचा नाश्ता (Snacks)', dinner: 'रात्रीचे जेवण (Dinner)' },
    customOption: '➕ इतर / नवीन अन्न नोंदवा',
    customNamePlaceholder: 'अन्नाचे नाव टाका',
    customCalPlaceholder: 'प्रति प्रमाण कॅलरीज'
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', age: 21, height: 165, weight: 60 });
  const [authError, setAuthError] = useState('');

  const [lang, setLang] = useState('en');
  const t = translations[lang];

  const [user, setUser] = useState(null);
  const [foods, setFoods] = useState([]);
  const [summary, setSummary] = useState({ logs: [], totals: { calories: 0, carbs: 0, protein: 0, fats: 0 } });
  const [weeklyData, setWeeklyData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [selectedMealType, setSelectedMealType] = useState('Breakfast');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [portionCount, setPortionCount] = useState(1);
  
  // Custom Food States
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', age: '', height: '', weight: '', target_calories: 2000 });

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const fetchData = async () => {
    const authHeader = { 'Authorization': `Bearer ${token}` };

    const userRes = await fetch('http://localhost:5000/api/user', { headers: authHeader });
    if (!userRes.ok) {
      handleLogout();
      return;
    }
    const userData = await userRes.json();
    setUser(userData);
    setProfileForm({ name: userData.name, age: userData.age, height: userData.height, weight: userData.weight, target_calories: userData.target_calories || 2000 });

    const foodRes = await fetch('http://localhost:5000/api/foods');
    const foodData = await foodRes.json();
    setFoods(foodData);
    if (foodData.length > 0) setSelectedFoodId(foodData[0].id);

    const today = new Date().toISOString().split('T')[0];
    const summaryRes = await fetch(`http://localhost:5000/api/meals/summary?date=${today}`, { headers: authHeader });
    const summaryData = await summaryRes.json();
    setSummary(summaryData);

    const analyticsRes = await fetch('http://localhost:5000/api/meals/weekly-analytics', { headers: authHeader });
    const analyticsData = await analyticsRes.json();
    setWeeklyData(analyticsData);

    const announcementsRes = await fetch('http://localhost:5000/api/announcements');
    const announcementsData = await announcementsRes.json();
    setAnnouncements(announcementsData);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

    const res = await fetch(`http://localhost:5000${endpoint}`, {
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
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const handleWaterChange = async (change) => {
    const res = await fetch('http://localhost:5000/api/user/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ change }),
    });
    const data = await res.json();
    setUser((prev) => ({ ...prev, water_intake: data.water_intake }));
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!selectedFoodId) return;

    const res = await fetch('http://localhost:5000/api/meals/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        meal_type: selectedMealType,
        food_id: selectedFoodId === 'custom' ? 'custom' : parseInt(selectedFoodId),
        custom_name: customName,
        custom_calories: customCalories,
        portion_count: parseInt(portionCount),
      }),
    });

    if (res.ok) {
      setCustomName('');
      setCustomCalories('');
      await fetchData();
    }
  };

  // Auth Screen (With Visible Field Labels)
  if (!token || !user) {
    return (
      <div className="auth-container">
        <div className="card auth-card">
          <h2>HealthyCommunity 🥗</h2>
          <p>{isRegistering ? 'Create your Health Account' : 'Login to your Account'}</p>
          
          {authError && <div className="error-msg">{authError}</div>}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {isRegistering && (
              <div className="form-group">
                <label>Full Name:</label>
                <input type="text" placeholder="e.g. Anushka Mhatre" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} required />
              </div>
            )}

            <div className="form-group">
              <label>Email Address:</label>
              <input type="email" placeholder="e.g. user@gmail.com" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input type="password" placeholder="••••••••" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
            </div>
            
            {isRegistering && (
              <div className="grid-2">
                <div className="form-group">
                  <label>Height (cm):</label>
                  <input type="number" placeholder="165" value={authForm.height} onChange={(e) => setAuthForm({ ...authForm, height: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Weight (kg):</label>
                  <input type="number" placeholder="60" value={authForm.weight} onChange={(e) => setAuthForm({ ...authForm, weight: e.target.value })} required />
                </div>
              </div>
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
      <header className="header">
        <div>
          <h2>{t.title}</h2>
          <p>{t.welcome}, {user.name}</p>
        </div>
        <div className="header-actions">
          <div className="lang-picker">
            <Globe size={16} />
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>
          <button className="profile-btn" onClick={() => setShowProfileModal(!showProfileModal)}>
            <UserCheck size={16} /> BMI: {user.bmi}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} /> {t.logout}
          </button>
        </div>
      </header>

      <div className="card-grid">
        <div className="card">
          <h3>{t.dailyTracker}</h3>
          <div className="calorie-display">
            <span className="calorie-num">{summary.totals.calories}</span>
            <span className="calorie-denom"> / {user.target_calories || 2000} {t.target}</span>
          </div>
          <div className="macro-bar">
            <span>{t.carbs}: {summary.totals.carbs}g</span>
            <span>{t.protein}: {summary.totals.protein}g</span>
            <span>{t.fats}: {summary.totals.fats}g</span>
          </div>
        </div>

        <div className="card">
          <h3>{t.waterIntake}</h3>
          <div className="water-control">
            <GlassWater size={36} color="#3b82f6" />
            <span className="water-count">{user.water_intake} {t.glasses}</span>
            <div className="btn-group">
              <button onClick={() => handleWaterChange(-1)}><Minus size={16} /></button>
              <button onClick={() => handleWaterChange(1)}><Plus size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="card log-card">
        <h3><Utensils size={18} /> {t.addMeal}</h3>
        <form onSubmit={handleLogMeal} className="log-form">
          
          {/* Localized Meal Type Selector */}
          <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)}>
            <option value="Breakfast">{t.meals.breakfast}</option>
            <option value="Lunch">{t.meals.lunch}</option>
            <option value="Snacks">{t.meals.snacks}</option>
            <option value="Dinner">{t.meals.dinner}</option>
          </select>

          {/* Multilingual Food Dropdown with Custom Option */}
          <select value={selectedFoodId} onChange={(e) => setSelectedFoodId(e.target.value)}>
            {foods.map((food) => {
              const displayName = 
                lang === 'hi' ? food.name_hi :
                lang === 'mr' ? food.name_mr :
                food.name;

              return (
                <option key={food.id} value={food.id}>
                  {displayName} ({food.portion_type})
                </option>
              );
            })}
            <option value="custom">{t.customOption}</option>
          </select>

          {/* Conditional Input Fields for Custom Food */}
          {selectedFoodId === 'custom' && (
            <div className="grid-2">
              <input 
                type="text" 
                placeholder={t.customNamePlaceholder} 
                value={customName} 
                onChange={(e) => setCustomName(e.target.value)} 
                required 
              />
              <input 
                type="number" 
                placeholder={t.customCalPlaceholder} 
                value={customCalories} 
                onChange={(e) => setCustomCalories(e.target.value)} 
                required 
              />
            </div>
          )}

          <select value={portionCount} onChange={(e) => setPortionCount(e.target.value)}>
            <option value="1">1 Serving / Portion</option>
            <option value="2">2 Servings / Portions</option>
            <option value="3">3 Servings / Portions</option>
            <option value="4">4 Servings / Portions</option>
          </select>

          <button type="submit" className="submit-btn">{t.logItem}</button>
        </form>
      </div>

      <div className="card">
        <h3><BarChart3 size={18} /> {t.weeklyAnalytics}</h3>
        <div style={{ width: '100%', height: 180, marginTop: '10px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>{t.foodJournal}</h3>
        {summary.logs.length === 0 ? (
          <p className="empty-text">{t.noMeals}</p>
        ) : (
          <ul className="meal-list">
            {summary.logs.map((log) => (
              <li key={log.id} className="meal-item">
                <div>
                  <strong>[{log.meal_type}]</strong> {log.food_name} x {log.portion_count}
                </div>
                <div className="meal-stats">
                  <span>{log.total_calories} kcal</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card community-card">
        <h3><Users size={18} /> {t.communityBulletin}</h3>
        {announcements.length === 0 ? (
          <p className="empty-text">{t.noAnnouncements}</p>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="announcement" style={{ marginBottom: '8px' }}>
              <strong>📢 {item.title}:</strong> {item.description}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;