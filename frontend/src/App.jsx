import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = 'http://localhost:5000/api';

// Initial Seed Data for immediate offline rendering
const INITIAL_LISTINGS = [
  {
    id: 1,
    donor_name: "Grand Vista Hotel & Banquet",
    title: "Buffet Surplus: Herb Roasted Chicken & Steamed Vegetables",
    description: "Cooked today at 12:30 PM for corporate luncheon. Kept strictly above 65°C, then blast chilled to 4°C in sealed gastronorm containers.",
    food_type: "COOKED_MEALS",
    dietary_type: "NON_VEGETARIAN",
    quantity_kg: 24.5,
    estimated_servings: 65,
    storage_condition: "REFRIGERATED",
    packaging_type: "SEALED_CONTAINERS",
    predicted_safe_hours: 5.5,
    freshness_score: 9.4,
    rescue_priority: "CRITICAL",
    pickup_address: "450 Luxury Avenue (Loading Bay 2)",
    pickup_city: "Metropolis",
    status: "AVAILABLE",
    expires_at: new Date(Date.now() + 4 * 3600000).toISOString()
  },
  {
    id: 2,
    donor_name: "Crust & Crumb Artisan Bakery",
    title: "Artisan Sourdough Batards & Croissant Assortment",
    description: "Baked fresh this morning at 5:00 AM. Unsold surplus from our flagship store counter. Packaged safely in food-grade bakery boxes.",
    food_type: "BAKERY",
    dietary_type: "VEGETARIAN",
    quantity_kg: 18.0,
    estimated_servings: 50,
    storage_condition: "AMBIENT",
    packaging_type: "BOXES",
    predicted_safe_hours: 22.0,
    freshness_score: 9.8,
    rescue_priority: "MEDIUM",
    pickup_address: "88 Sourdough Street (Side Door)",
    pickup_city: "Metropolis",
    status: "AVAILABLE",
    expires_at: new Date(Date.now() + 20 * 3600000).toISOString()
  },
  {
    id: 3,
    donor_name: "Harvest Fresh Supermarket",
    title: "Organic Spinach, Crisp Apples & Bell Peppers",
    description: "Surplus seasonal produce slightly off cosmetic retail standards but perfectly wholesome and fresh.",
    food_type: "RAW_PRODUCE",
    dietary_type: "VEGAN",
    quantity_kg: 55.0,
    estimated_servings: 140,
    storage_condition: "REFRIGERATED",
    packaging_type: "TRAYS",
    predicted_safe_hours: 46.0,
    freshness_score: 8.9,
    rescue_priority: "NORMAL",
    pickup_address: "1240 Market Plaza (Service Bay C)",
    pickup_city: "Metropolis",
    status: "AVAILABLE",
    expires_at: new Date(Date.now() + 48 * 3600000).toISOString()
  },
  {
    id: 4,
    donor_name: "Grand Vista Hotel & Banquet",
    title: "Vegetable Biryani with Cucumber Raita & Naan",
    description: "Prepared for evening banquet. Sealed in insulated gastronorm food pans.",
    food_type: "COOKED_MEALS",
    dietary_type: "VEGETARIAN",
    quantity_kg: 30.0,
    estimated_servings: 85,
    storage_condition: "REFRIGERATED",
    packaging_type: "SEALED_CONTAINERS",
    predicted_safe_hours: 4.2,
    freshness_score: 9.1,
    rescue_priority: "HIGH",
    pickup_address: "450 Luxury Avenue",
    pickup_city: "Metropolis",
    status: "CLAIMED",
    expires_at: new Date(Date.now() + 3 * 3600000).toISOString()
  }
];

const INITIAL_CLAIMS = [
  {
    id: 1,
    listing_id: 4,
    listing_title: "Vegetable Biryani with Cucumber Raita & Naan",
    shelter_name: "Hope Community Food Pantry",
    volunteer_name: "Alex Rivera (Cargo Bike Courier)",
    status: "IN_TRANSIT",
    distance_km: 3.4,
    temperature_celsius: 3.8,
    requested_at: "35 mins ago",
    notes: "Thermal hot/cold carrier verified with insulated temperature lock."
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [claims, setClaims] = useState(INITIAL_CLAIMS);
  const [backendOnline, setBackendOnline] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Modals state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [claimTargetListing, setClaimTargetListing] = useState(null);

  // New Donation Form
  const [newDonation, setNewDonation] = useState({
    title: '',
    food_type: 'COOKED_MEALS',
    dietary_type: 'VEGETARIAN',
    quantity_kg: 15,
    storage_condition: 'REFRIGERATED',
    packaging_type: 'SEALED_CONTAINERS',
    hours_since_prepared: 1,
    pickup_address: 'Grand Central Plaza, Floor 1',
    description: ''
  });

  // Simulator state
  const [simParams, setSimParams] = useState({
    food_type: 'COOKED_MEALS',
    storage_condition: 'REFRIGERATED',
    ambient_temp_celsius: 4.0,
    packaging_type: 'SEALED_CONTAINERS',
    hours_since_prepared: 2.0
  });

  // Check Backend Connection on mount
  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ONLINE') {
          setBackendOnline(true);
          fetch(`${API_BASE}/donations`)
            .then(res => res.json())
            .then(resData => {
              if (resData.data && resData.data.length > 0) {
                setListings(resData.data);
              }
            }).catch(() => {});
        }
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  // Filtered listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchType = filterType === 'ALL' || item.food_type === filterType;
      const matchPriority = filterPriority === 'ALL' || item.rescue_priority === filterPriority;
      return matchType && matchPriority;
    });
  }, [listings, filterType, filterPriority]);

  // Aggregate Impact Metrics
  const impactSummary = useMemo(() => {
    let totalKg = 127.5;
    let totalMeals = 320;
    listings.forEach(l => {
      totalKg += Number(l.quantity_kg || 0);
      totalMeals += Number(l.estimated_servings || 0);
    });
    const co2Kg = Math.round(totalKg * 2.85);
    const waterLiters = Math.round(totalKg * 1450);

    return {
      totalKg: Math.round(totalKg),
      totalMeals,
      co2Kg,
      waterLiters,
      carKm: Math.round(co2Kg / 0.2),
      showers: Math.round(waterLiters / 65)
    };
  }, [listings]);

  // Client-side AI shelf-life calculation (mirrors Python AI engine)
  const calculateAIShelfLife = (params) => {
    const baseHoursMap = { COOKED_MEALS: 24, BAKERY: 48, RAW_PRODUCE: 96, DAIRY: 36, PACKAGED_GOODS: 720 };
    const base = baseHoursMap[params.food_type] || 24;
    let temp = Number(params.ambient_temp_celsius);
    if (params.storage_condition === 'FROZEN') temp = -18;
    else if (params.storage_condition === 'REFRIGERATED' && !params.ambient_temp_celsius) temp = 4;
    else if (params.storage_condition === 'HOT_HOLDING' && !params.ambient_temp_celsius) temp = 65;

    let decayRate = 1.0;
    if (temp >= 5 && temp <= 60 && (params.food_type === 'COOKED_MEALS' || params.food_type === 'DAIRY')) {
      decayRate = 2.6;
    }
    const pkgBonus = params.packaging_type === 'SEALED_CONTAINERS' ? 1.2 : (params.packaging_type === 'LOOSE_WRAPPED' ? 0.7 : 0.95);
    const totalSafe = (base / decayRate) * pkgBonus;
    const remaining = Math.max(0.1, totalSafe - Number(params.hours_since_prepared));
    const freshness = Math.max(0.5, Math.min(10.0, (remaining / totalSafe) * 10));

    let priority = 'NORMAL';
    if (remaining <= 3.0) priority = 'CRITICAL';
    else if (remaining <= 7.0) priority = 'HIGH';
    else if (remaining <= 18.0) priority = 'MEDIUM';

    return {
      safeHours: remaining.toFixed(1),
      freshness: freshness.toFixed(1),
      priority,
      temp
    };
  };

  const handlePostDonation = async (e) => {
    e.preventDefault();
    const aiRes = calculateAIShelfLife(newDonation);
    const newEntry = {
      id: Date.now(),
      donor_name: "Community Food Partner",
      title: newDonation.title,
      description: newDonation.description || "Fresh surplus prepared for rescue distribution.",
      food_type: newDonation.food_type,
      dietary_type: newDonation.dietary_type,
      quantity_kg: parseFloat(newDonation.quantity_kg),
      estimated_servings: Math.round(parseFloat(newDonation.quantity_kg) / 0.4),
      storage_condition: newDonation.storage_condition,
      packaging_type: newDonation.packaging_type,
      predicted_safe_hours: parseFloat(aiRes.safeHours),
      freshness_score: parseFloat(aiRes.freshness),
      rescue_priority: aiRes.priority,
      pickup_address: newDonation.pickup_address,
      pickup_city: "Metropolis",
      status: "AVAILABLE",
      expires_at: new Date(Date.now() + parseFloat(aiRes.safeHours) * 3600000).toISOString()
    };

    if (backendOnline) {
      try {
        await fetch(`${API_BASE}/donations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEntry)
        });
      } catch (err) {
        console.warn('Backend call failed, saved locally');
      }
    }

    setListings([newEntry, ...listings]);
    setShowDonationModal(false);
    setNewDonation({
      title: '',
      food_type: 'COOKED_MEALS',
      dietary_type: 'VEGETARIAN',
      quantity_kg: 15,
      storage_condition: 'REFRIGERATED',
      packaging_type: 'SEALED_CONTAINERS',
      hours_since_prepared: 1,
      pickup_address: 'Grand Central Plaza, Floor 1',
      description: ''
    });
  };

  const handleClaimDonation = (listing) => {
    setListings(listings.map(l => l.id === listing.id ? { ...l, status: 'CLAIMED' } : l));
    const newClaim = {
      id: Date.now(),
      listing_id: listing.id,
      listing_title: listing.title,
      shelter_name: "Hope Community Food Pantry",
      volunteer_name: "Samantha Green (Cargo Bike Courier)",
      status: "ASSIGNED",
      distance_km: 2.3,
      temperature_celsius: 4.0,
      requested_at: "Just now",
      notes: "Assigned courier for urgent pickup"
    };
    setClaims([newClaim, ...claims]);
    setClaimTargetListing(null);
    setActiveTab('dispatch');
  };

  const handleUpdateClaimStatus = (claimId, newStatus) => {
    setClaims(claims.map(c => c.id === claimId ? { ...c, status: newStatus } : c));
  };

  const currentModalAi = calculateAIShelfLife(newDonation);
  const currentSimAi = calculateAIShelfLife(simParams);

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <a href="#" className="brand" onClick={() => setActiveTab('board')}>
          <div className="brand-icon"><i className="fa-solid fa-leaf"></i></div>
          <span>FoodRescue<span style={{color: 'var(--primary)', fontWeight: 800}}>.ai</span></span>
        </a>

        <div className="nav-links">
          <button className={`nav-tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>
            <i className="fa-solid fa-boxes-stacked"></i> Rescue Board
          </button>
          <button className={`nav-tab ${activeTab === 'dispatch' ? 'active' : ''}`} onClick={() => setActiveTab('dispatch')}>
            <i className="fa-solid fa-truck-fast"></i> Logistics & Dispatch
          </button>
          <button className={`nav-tab ${activeTab === 'ai-simulator' ? 'active' : ''}`} onClick={() => setActiveTab('ai-simulator')}>
            <i className="fa-solid fa-robot"></i> AI Shelf-Life Simulator
          </button>
          <button className={`nav-tab ${activeTab === 'matcher' ? 'active' : ''}`} onClick={() => setActiveTab('matcher')}>
            <i className="fa-solid fa-handshake-angle"></i> Smart NGO Matcher
          </button>
          <button className={`nav-tab ${activeTab === 'impact' ? 'active' : ''}`} onClick={() => setActiveTab('impact')}>
            <i className="fa-solid fa-chart-pie"></i> Impact Analytics
          </button>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '0.9rem'}}>
          <span style={{
            fontSize: '0.78rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '20px',
            fontWeight: 600,
            background: backendOnline ? '#dcfce7' : '#f1f5f9',
            color: backendOnline ? '#166534' : '#64748b',
            border: `1px solid ${backendOnline ? '#bbf7d0' : '#e2e8f0'}`
          }}>
            <i className="fa-solid fa-circle" style={{fontSize: '0.5rem', marginRight: '5px', color: backendOnline ? '#10b981' : '#94a3b8'}}></i>
            {backendOnline ? 'API & MySQL Online' : 'Client Mode'}
          </span>

          <button className="btn-primary" onClick={() => setShowDonationModal(true)}>
            <i className="fa-solid fa-plus"></i> Post Donation
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Environmental Hero Impact Banner */}
        <div className="hero-banner">
          <div className="hero-text">
            <h1>Zero Waste. Maximum Impact.</h1>
            <p>Bridging food donors, cold-chain volunteers, and shelters in real-time powered by predictive AI spoilage kinetics and intelligent routing.</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-val">{impactSummary.totalKg.toLocaleString()} kg</div>
              <div className="hero-stat-lbl">Rescued</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-val">{impactSummary.totalMeals.toLocaleString()}</div>
              <div className="hero-stat-lbl">Meals Served</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-val">{impactSummary.co2Kg.toLocaleString()} kg</div>
              <div className="hero-stat-lbl">CO₂e Diverted</div>
            </div>
            <div className="hero-stat-item">
              <div className="hero-stat-val">{impactSummary.waterLiters.toLocaleString()} L</div>
              <div className="hero-stat-lbl">Water Conserved</div>
            </div>
          </div>
        </div>

        {/* VIEW 1: RESCUE BOARD */}
        {activeTab === 'board' && (
          <div>
            <div className="filter-bar">
              <div className="filter-group">
                <span style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)'}}>Category:</span>
                {['ALL', 'COOKED_MEALS', 'BAKERY', 'RAW_PRODUCE', 'DAIRY'].map(type => (
                  <button
                    key={type}
                    className={`filter-chip ${filterType === type ? 'active' : ''}`}
                    onClick={() => setFilterType(type)}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="filter-group">
                <span style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)'}}>Urgency:</span>
                {['ALL', 'CRITICAL', 'HIGH', 'NORMAL'].map(p => (
                  <button
                    key={p}
                    className={`filter-chip ${filterPriority === p ? 'active' : ''}`}
                    onClick={() => setFilterPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-cards">
              {filteredListings.map(item => (
                <div key={item.id} className="food-card">
                  <div className="food-card-header">
                    <span className={`priority-badge priority-${item.rescue_priority}`}>
                      <i className="fa-solid fa-bolt"></i> {item.rescue_priority} RESCUE
                    </span>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: item.status === 'AVAILABLE' ? 'var(--primary-dark)' : '#b45309',
                      background: item.status === 'AVAILABLE' ? 'var(--primary-light)' : '#fef3c7',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <h3 className="food-card-title">{item.title}</h3>
                  <div className="food-card-donor">
                    <i className="fa-solid fa-store" style={{color: '#94a3b8'}}></i>
                    <span>{item.donor_name}</span>
                  </div>
                  <p className="food-card-desc">{item.description}</p>

                  <div className="shelf-meter">
                    <div className="meter-header">
                      <span><i className="fa-solid fa-stopwatch" style={{marginRight: '4px'}}></i> Safe Window: <strong>{item.predicted_safe_hours}h</strong></span>
                      <span>Freshness: <strong>{item.freshness_score}/10</strong></span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, (item.freshness_score / 10) * 100)}%`,
                          background: item.freshness_score > 7 ? 'var(--primary)' : (item.freshness_score > 4 ? 'var(--accent)' : 'var(--danger)')
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="meta-tags">
                    <span className="tag-pill"><i className="fa-solid fa-weight-hanging"></i> {item.quantity_kg} kg</span>
                    <span className="tag-pill"><i className="fa-solid fa-utensils"></i> ~{item.estimated_servings} servings</span>
                    <span className="tag-pill"><i className="fa-solid fa-snowflake"></i> {item.storage_condition}</span>
                    <span className="tag-pill"><i className="fa-solid fa-box"></i> {item.packaging_type}</span>
                  </div>

                  <div className="food-card-actions">
                    {item.status === 'AVAILABLE' ? (
                      <button className="btn-primary" style={{width: '100%'}} onClick={() => setClaimTargetListing(item)}>
                        <i className="fa-solid fa-hand-holding-heart"></i> Claim for Shelter
                      </button>
                    ) : (
                      <button className="btn-secondary" style={{width: '100%'}} onClick={() => setActiveTab('dispatch')}>
                        <i className="fa-solid fa-location-crosshairs"></i> View Dispatch Status
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: LOGISTICS & DISPATCH */}
        {activeTab === 'dispatch' && (
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <div>
                <h2>Live Cold-Chain Dispatch & Couriers</h2>
                <p style={{color: 'var(--text-muted)'}}>Manage active deliveries, temperature probe logs, and recipient shelter custody verification.</p>
              </div>
            </div>

            <div style={{display: 'grid', gap: '1.2rem'}}>
              {claims.map(claim => (
                <div key={claim.id} style={{background: 'white', padding: '1.8rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <span style={{fontSize: '0.8rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase'}}>Rescue Operation #{claim.id}</span>
                      <h3 style={{fontSize: '1.3rem', margin: '0.2rem 0 0.5rem'}}>{claim.listing_title}</h3>
                      <p style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                        <i className="fa-solid fa-hospital-user"></i> Recipient: <strong>{claim.shelter_name}</strong> &bull;
                        <i className="fa-solid fa-bicycle" style={{marginLeft: '10px'}}></i> Courier: <strong>{claim.volunteer_name}</strong>
                      </p>
                    </div>
                    <span style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '20px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      background: claim.status === 'DELIVERED' ? '#dcfce7' : '#e0f2fe',
                      color: claim.status === 'DELIVERED' ? '#166534' : '#0369a1'
                    }}>
                      {claim.status}
                    </span>
                  </div>

                  {/* Dispatch progress stepper */}
                  <div className="timeline">
                    <div className={`timeline-step ${['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].includes(claim.status) ? 'completed' : 'active'}`}>
                      <div className="timeline-dot"><i className="fa-solid fa-clipboard-check"></i></div>
                      <div style={{fontSize: '0.8rem', fontWeight: 600}}>Claimed & Assigned</div>
                    </div>
                    <div className={`timeline-step ${['IN_TRANSIT', 'DELIVERED'].includes(claim.status) ? (claim.status === 'IN_TRANSIT' ? 'active' : 'completed') : ''}`}>
                      <div className="timeline-dot"><i className="fa-solid fa-van-shuttle"></i></div>
                      <div style={{fontSize: '0.8rem', fontWeight: 600}}>In Transit</div>
                    </div>
                    <div className={`timeline-step ${claim.status === 'DELIVERED' ? 'completed' : ''}`}>
                      <div className="timeline-dot"><i className="fa-solid fa-circle-check"></i></div>
                      <div style={{fontSize: '0.8rem', fontWeight: 600}}>Delivered & Inspected</div>
                    </div>
                  </div>

                  <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                    <div style={{fontSize: '0.85rem'}}>
                      <strong>Food Safety Check:</strong> Cold-Chain Temp <strong>{claim.temperature_celsius}°C</strong> (Target: &lt; 4.0°C) &bull; Distance: {claim.distance_km} km
                    </div>
                    <div style={{display: 'flex', gap: '0.6rem'}}>
                      {claim.status !== 'IN_TRANSIT' && claim.status !== 'DELIVERED' && (
                        <button className="btn-primary" onClick={() => handleUpdateClaimStatus(claim.id, 'IN_TRANSIT')}>
                          <i className="fa-solid fa-person-biking"></i> Start Transit
                        </button>
                      )}
                      {claim.status === 'IN_TRANSIT' && (
                        <button className="btn-primary" onClick={() => handleUpdateClaimStatus(claim.id, 'DELIVERED')}>
                          <i className="fa-solid fa-check"></i> Complete Handover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: AI SHELF-LIFE SIMULATOR */}
        {activeTab === 'ai-simulator' && (
          <div>
            <div style={{marginBottom: '1.5rem'}}>
              <h2>AI Food Shelf-Life & Kinetic Spoilage Simulator</h2>
              <p style={{color: 'var(--text-muted)'}}>Simulates microbiological deterioration curves based on modified Arrhenius temperature kinetics.</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
              <div style={{background: 'white', padding: '1.8rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)'}}>
                <h3 style={{marginBottom: '1.2rem'}}><i className="fa-solid fa-sliders"></i> Environmental Controls</h3>

                <div className="form-group">
                  <label className="form-label">Food Classification</label>
                  <select
                    className="form-select"
                    value={simParams.food_type}
                    onChange={(e) => setSimParams({ ...simParams, food_type: e.target.value })}
                  >
                    <option value="COOKED_MEALS">Cooked Meals / Banquet Surplus</option>
                    <option value="BAKERY">Fresh Bakery & Pastries</option>
                    <option value="RAW_PRODUCE">Raw Fruits & Vegetables</option>
                    <option value="DAIRY">Dairy & Pasteurized Drinks</option>
                    <option value="PACKAGED_GOODS">Packaged Dry Staples</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Storage Atmosphere</label>
                  <select
                    className="form-select"
                    value={simParams.storage_condition}
                    onChange={(e) => setSimParams({ ...simParams, storage_condition: e.target.value })}
                  >
                    <option value="REFRIGERATED">Refrigerated (Cold Chain ~4°C)</option>
                    <option value="AMBIENT">Ambient Room Temperature (~22°C - 35°C)</option>
                    <option value="HOT_HOLDING">Hot Holding (&gt;63°C)</option>
                    <option value="FROZEN">Deep Frozen (-18°C)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ambient Temperature ({simParams.ambient_temp_celsius}°C)</label>
                  <input
                    type="range"
                    min="-5"
                    max="45"
                    step="0.5"
                    value={simParams.ambient_temp_celsius}
                    onChange={(e) => setSimParams({ ...simParams, ambient_temp_celsius: parseFloat(e.target.value) })}
                    style={{width: '100%'}}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b'}}>
                    <span>-5°C (Chilled)</span>
                    <span style={{color: simParams.ambient_temp_celsius > 5 && simParams.ambient_temp_celsius < 60 ? '#ef4444' : '#10b981', fontWeight: 700}}>
                      {simParams.ambient_temp_celsius > 5 && simParams.ambient_temp_celsius < 60 ? '⚠️ Microbial Danger Zone (5-60°C)' : 'Safe Thermal Zone'}
                    </span>
                    <span>45°C (Heat)</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Packaging Protection Barrier</label>
                  <select
                    className="form-select"
                    value={simParams.packaging_type}
                    onChange={(e) => setSimParams({ ...simParams, packaging_type: e.target.value })}
                  >
                    <option value="SEALED_CONTAINERS">Airtight Gastronorm / Sealed Poly (High)</option>
                    <option value="BOXES">Corrugated Craft Box (Medium)</option>
                    <option value="TRAYS">Open Trays (Standard)</option>
                    <option value="LOOSE_WRAPPED">Loose Foil / Paper Wrapped (Low)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hours Elapsed Since Preparation: {simParams.hours_since_prepared} hrs</label>
                  <input
                    type="range"
                    min="0"
                    max="36"
                    step="0.5"
                    value={simParams.hours_since_prepared}
                    onChange={(e) => setSimParams({ ...simParams, hours_since_prepared: parseFloat(e.target.value) })}
                    style={{width: '100%'}}
                  />
                </div>
              </div>

              <div style={{background: 'white', padding: '1.8rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <span className="ai-badge"><i className="fa-solid fa-microchip"></i> AI PREDICTION ENGINE</span>
                  <span className={`priority-badge priority-${currentSimAi.priority}`}>{currentSimAi.priority} PRIORITY</span>
                </div>

                <div style={{textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0'}}>
                  <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase'}}>Estimated Remaining Safe Life</div>
                  <div style={{fontSize: '3.2rem', fontWeight: 800, color: currentSimAi.priority === 'CRITICAL' ? '#ef4444' : '#10b981', lineHeight: 1.1, margin: '0.3rem 0'}}>
                    {currentSimAi.safeHours} <span style={{fontSize: '1.4rem'}}>hours</span>
                  </div>
                  <div style={{fontSize: '0.9rem', color: '#475569'}}>
                    Freshness Index: <strong>{currentSimAi.freshness} / 10.0</strong>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem'}}>
                  <div style={{padding: '0.9rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0'}}>
                    <div style={{fontSize: '0.75rem', color: '#166534', fontWeight: 700}}>DECAY ACCELERATION</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#065f46'}}>
                      {simParams.ambient_temp_celsius > 5 && simParams.ambient_temp_celsius < 60 ? '2.6x Speed' : '1.0x Normal'}
                    </div>
                  </div>
                  <div style={{padding: '0.9rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe'}}>
                    <div style={{fontSize: '0.75rem', color: '#1e40af', fontWeight: 700}}>DISPATCH WINDOW</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a'}}>
                      &lt; {Math.min(currentSimAi.safeHours, 3.5)} hrs
                    </div>
                  </div>
                </div>

                <div style={{padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '0.88rem', color: '#92400e'}}>
                  <i className="fa-solid fa-triangle-exclamation" style={{marginRight: '6px'}}></i>
                  <strong>Operational Recommendation:</strong> {currentSimAi.priority === 'CRITICAL'
                    ? 'Critical microbial window! Immediately dispatch rider with thermal cooling box to prevent bacterial growth.'
                    : 'Condition stable. Normal volunteer routing approved.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SMART NGO MATCHER */}
        {activeTab === 'matcher' && (
          <div>
            <div style={{marginBottom: '1.5rem'}}>
              <h2>Smart NGO & Shelter Matching Engine</h2>
              <p style={{color: 'var(--text-muted)'}}>Calculates geodesic Haversine distance, shelter capacity ratio, and dietary compatibility.</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem'}}>
              <div style={{background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0'}}>
                <h3 style={{fontSize: '1.1rem', marginBottom: '1rem'}}>Select Surplus Donation Batch</h3>
                {listings.slice(0, 3).map(l => (
                  <div key={l.id} style={{padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '0.8rem', cursor: 'pointer'}}>
                    <div style={{fontWeight: 700, fontSize: '0.95rem'}}>{l.title}</div>
                    <div style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.3rem'}}>
                      <i className="fa-solid fa-weight-hanging"></i> {l.quantity_kg} kg &bull; ~{l.estimated_servings} servings
                    </div>
                  </div>
                ))}
              </div>

              <div style={{background: 'white', padding: '1.8rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0'}}>
                <h3 style={{marginBottom: '1rem'}}><i className="fa-solid fa-ranking-star"></i> AI Recommended Recipient Shelters</h3>

                {[
                  { name: "Hope Community Food Pantry", distance: "2.1 km", score: "96.4%", capacity: "120 servings/day", travelTime: "12 mins", match: "High Priority" },
                  { name: "Haven Family Shelter", distance: "3.4 km", score: "91.8%", capacity: "80 servings/day", travelTime: "18 mins", match: "Optimal" },
                  { name: "St. Jude Community Kitchen", distance: "5.8 km", score: "82.5%", capacity: "200 servings/day", travelTime: "25 mins", match: "Alternate" }
                ].map((rec, idx) => (
                  <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: idx === 0 ? '#f0fdf4' : '#ffffff', border: `1px solid ${idx === 0 ? '#86efac' : '#e2e8f0'}`, borderRadius: '10px', marginBottom: '1rem'}}>
                    <div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <span style={{background: idx === 0 ? '#10b981' : '#64748b', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800}}>
                          {idx + 1}
                        </span>
                        <h4 style={{fontSize: '1.05rem', margin: 0}}>{rec.name}</h4>
                        {idx === 0 && <span style={{fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700}}>BEST FIT</span>}
                      </div>
                      <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem'}}>
                        Distance: <strong>{rec.distance}</strong> &bull; Capacity: <strong>{rec.capacity}</strong> &bull; Transit: ~{rec.travelTime}
                      </div>
                    </div>

                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#10b981'}}>{rec.score}</div>
                      <div style={{fontSize: '0.72rem', color: '#64748b', fontWeight: 600}}>AI MATCH INDEX</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: IMPACT ANALYTICS */}
        {activeTab === 'impact' && (
          <div>
            <div style={{marginBottom: '1.5rem'}}>
              <h2>Environmental & Humanitarian Impact Dashboard</h2>
              <p style={{color: 'var(--text-muted)'}}>Quantifying CO2 equivalent diversion, water footprint conservation, and food security contributions.</p>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem'}}>
              <div style={{background: 'white', padding: '1.6rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0'}}>
                <div style={{color: '#059669', fontSize: '2rem', marginBottom: '0.5rem'}}><i className="fa-solid fa-car-tunnel"></i></div>
                <div style={{fontSize: '1.8rem', fontWeight: 800}}>{impactSummary.carKm.toLocaleString()} km</div>
                <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600}}>Passenger Vehicle Travel Emissions Prevented</div>
              </div>

              <div style={{background: 'white', padding: '1.6rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0'}}>
                <div style={{color: '#0284c7', fontSize: '2rem', marginBottom: '0.5rem'}}><i className="fa-solid fa-shower"></i></div>
                <div style={{fontSize: '1.8rem', fontWeight: 800}}>{impactSummary.showers.toLocaleString()}</div>
                <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600}}>Household Showers Equivalent Water Saved</div>
              </div>

              <div style={{background: 'white', padding: '1.6rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0'}}>
                <div style={{color: '#16a34a', fontSize: '2rem', marginBottom: '0.5rem'}}><i className="fa-solid fa-tree"></i></div>
                <div style={{fontSize: '1.8rem', fontWeight: 800}}>{(impactSummary.co2Kg / 22).toFixed(1)}</div>
                <div style={{fontSize: '0.85rem', color: '#64748b', fontWeight: 600}}>Annual Tree Sequestration Equivalents</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POST DONATION MODAL */}
      {showDonationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title"><i className="fa-solid fa-bowl-food" style={{color: 'var(--primary)'}}></i> Post Surplus Food</h2>
              <button className="btn-close" onClick={() => setShowDonationModal(false)}>&times;</button>
            </div>

            <form onSubmit={handlePostDonation}>
              <div className="form-group">
                <label className="form-label">Food Batch Description / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 Portions Grilled Salmon & Quinoa Bowls"
                  className="form-input"
                  value={newDonation.title}
                  onChange={(e) => setNewDonation({ ...newDonation, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Food Category</label>
                  <select
                    className="form-select"
                    value={newDonation.food_type}
                    onChange={(e) => setNewDonation({ ...newDonation, food_type: e.target.value })}
                  >
                    <option value="COOKED_MEALS">Cooked Meals / Buffet</option>
                    <option value="BAKERY">Bakery & Bread</option>
                    <option value="RAW_PRODUCE">Raw Fruits & Vegetables</option>
                    <option value="DAIRY">Dairy & Beverages</option>
                    <option value="PACKAGED_GOODS">Packaged Goods</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Dietary Label</label>
                  <select
                    className="form-select"
                    value={newDonation.dietary_type}
                    onChange={(e) => setNewDonation({ ...newDonation, dietary_type: e.target.value })}
                  >
                    <option value="VEGETARIAN">Vegetarian</option>
                    <option value="VEGAN">100% Vegan</option>
                    <option value="NON_VEGETARIAN">Non-Vegetarian</option>
                    <option value="HALAL">Halal</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Weight (Kilograms)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={newDonation.quantity_kg}
                    onChange={(e) => setNewDonation({ ...newDonation, quantity_kg: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hours Since Cooked/Packed</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-input"
                    value={newDonation.hours_since_prepared}
                    onChange={(e) => setNewDonation({ ...newDonation, hours_since_prepared: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Storage Condition</label>
                  <select
                    className="form-select"
                    value={newDonation.storage_condition}
                    onChange={(e) => setNewDonation({ ...newDonation, storage_condition: e.target.value })}
                  >
                    <option value="REFRIGERATED">Refrigerated (2°C - 5°C)</option>
                    <option value="AMBIENT">Room Temperature (Ambient)</option>
                    <option value="HOT_HOLDING">Hot Holding (&gt;63°C)</option>
                    <option value="FROZEN">Frozen (-18°C)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Packaging Type</label>
                  <select
                    className="form-select"
                    value={newDonation.packaging_type}
                    onChange={(e) => setNewDonation({ ...newDonation, packaging_type: e.target.value })}
                  >
                    <option value="SEALED_CONTAINERS">Sealed Food Pans / Tupperware</option>
                    <option value="BOXES">Food Boxes</option>
                    <option value="TRAYS">Trays / Open Foil</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pickup Location & Instructions</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 450 Luxury Avenue, Loading Bay 2"
                  className="form-input"
                  value={newDonation.pickup_address}
                  onChange={(e) => setNewDonation({ ...newDonation, pickup_address: e.target.value })}
                />
              </div>

              <div className="ai-box">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span className="ai-badge"><i className="fa-solid fa-microchip"></i> LIVE AI ASSESSMENT</span>
                  <span className={`priority-badge priority-${currentModalAi.priority}`}>{currentModalAi.priority} RESCUE</span>
                </div>
                <div style={{fontSize: '0.88rem', color: '#166534', marginTop: '0.4rem'}}>
                  Predicted Safe Life: <strong>{currentModalAi.safeHours} hours</strong> &bull; Initial Freshness Rating: <strong>{currentModalAi.freshness}/10</strong>
                </div>
              </div>

              <div style={{display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '1.5rem'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowDonationModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <i className="fa-solid fa-cloud-arrow-up"></i> Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLAIM CONFIRMATION MODAL */}
      {claimTargetListing && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '480px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Rescue Claim</h3>
              <button className="btn-close" onClick={() => setClaimTargetListing(null)}>&times;</button>
            </div>
            <p style={{marginBottom: '1rem'}}>
              Claim <strong>{claimTargetListing.title}</strong> ({claimTargetListing.quantity_kg} kg) for your shelter?
            </p>
            <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem'}}>
              <div><i className="fa-solid fa-location-dot"></i> Pickup: {claimTargetListing.pickup_address}</div>
              <div style={{marginTop: '0.3rem'}}><i className="fa-solid fa-hourglass-half"></i> Urgency: {claimTargetListing.rescue_priority}</div>
            </div>
            <div style={{display: 'flex', gap: '0.8rem', justifyContent: 'flex-end'}}>
              <button className="btn-secondary" onClick={() => setClaimTargetListing(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleClaimDonation(claimTargetListing)}>
                Confirm & Dispatch Courier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
