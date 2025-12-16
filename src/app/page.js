'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function VotingPage() {
  // Page state
  const [currentPage, setCurrentPage] = useState('pin');

  // Voting PIN
  const [pin, setPin] = useState(['', '', '', '']);
  const [house, setHouse] = useState('');

  // Candidates and voting
  const [candidates, setCandidates] = useState(null);
  const [ballot, setBallot] = useState({});
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);

  // Position order
  const positionOrder = [
    'malePresident',
    'femalePresident',
    'campusAffairsSecretary',
    'sportsSecretary',
    'culturalSecretary',
    'academicSecretary',
    'houseCaptain'
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // House colors
  const houseColors = {
    leo: '#ffd700',
    phoenix: '#ef4444',
    tusker: '#22c55e',
    kong: '#3b82f6'
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      setCandidates(data.candidates);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // PIN handling
  const handlePinInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      document.getElementById(`pin-${index + 2}`)?.focus();
    }
  };

  const verifyPin = async () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/pin/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue })
      });
      const data = await response.json();
      if (data.valid) {
        setCurrentPage('instructions');
      } else {
        setError(data.error || 'Invalid PIN');
        setPin(['', '', '', '']);
      }
    } catch (err) {
      setError('Failed to validate PIN');
    } finally {
      setLoading(false);
    }
  };

  // Get current position candidates
  const getCurrentPositionCandidates = () => {
    if (!candidates) return [];
    const positionId = positionOrder[currentPositionIndex];
    if (positionId === 'houseCaptain') {
      return candidates[`${house}Captain`] || [];
    }
    return candidates[positionId] || [];
  };

  // Get position title
  const getPositionTitle = (positionId) => {
    const titles = {
      malePresident: 'Male President',
      femalePresident: 'Female President',
      campusAffairsSecretary: 'Campus Affairs Secretary',
      sportsSecretary: 'Sports Secretary',
      culturalSecretary: 'Cultural Secretary',
      academicSecretary: 'Academic Secretary',
      houseCaptain: `${house.charAt(0).toUpperCase() + house.slice(1)} House Captain`
    };
    return titles[positionId] || positionId;
  };

  const isSingleChoice = (positionId) => positionId === 'campusAffairsSecretary';

  // Click-based preference selection
  const handleCandidateClick = (candidateId) => {
    const positionId = positionOrder[currentPositionIndex];
    const currentSelection = ballot[positionId] || {};
    const isNota = candidateId.startsWith('nota_');

    if (isSingleChoice(positionId)) {
      if (currentSelection.choice === candidateId) {
        setBallot({ ...ballot, [positionId]: {} });
      } else {
        setBallot({ ...ballot, [positionId]: { choice: candidateId } });
      }
    } else {
      // NOTA cannot be first preference
      if (isNota && !currentSelection.pref1) {
        setError('NOTA cannot be your first preference. Please select a candidate first.');
        return;
      }

      if (currentSelection.pref1 === candidateId) {
        setBallot({ ...ballot, [positionId]: {} });
      } else if (currentSelection.pref2 === candidateId) {
        setBallot({ ...ballot, [positionId]: { pref1: currentSelection.pref1 } });
      } else if (!currentSelection.pref1) {
        setBallot({ ...ballot, [positionId]: { pref1: candidateId } });
        setError(''); // Clear any previous error
      } else if (!currentSelection.pref2) {
        setBallot({ ...ballot, [positionId]: { ...currentSelection, pref2: candidateId } });
        setError(''); // Clear any previous error
      } else {
        setBallot({ ...ballot, [positionId]: { ...currentSelection, pref2: candidateId } });
      }
    }
  };

  // Check if current position selection is complete
  const isSelectionComplete = () => {
    const positionId = positionOrder[currentPositionIndex];
    const selection = ballot[positionId];

    if (isSingleChoice(positionId)) {
      // Campus Affairs Secretary - just needs a choice
      return !!selection?.choice;
    } else {
      // All other positions need both preferences
      return !!(selection?.pref1 && selection?.pref2);
    }
  };

  const goToNextPosition = () => {
    if (!isSelectionComplete()) {
      const positionId = positionOrder[currentPositionIndex];
      if (isSingleChoice(positionId)) {
        setError('Please select a candidate before proceeding.');
      } else {
        setError('Please select both 1st and 2nd preference before proceeding.');
      }
      return;
    }
    setError(''); // Clear error
    if (currentPositionIndex < positionOrder.length - 1) {
      setCurrentPositionIndex(currentPositionIndex + 1);
    } else {
      setCurrentPage('review');
    }
  };

  const goToPreviousPosition = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(currentPositionIndex - 1);
    }
  };

  const submitVote = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.join(''), ballot, house })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentPage('thankyou');
      } else {
        setError(data.error || 'Failed to submit vote');
      }
    } catch (err) {
      setError('Failed to submit vote');
    } finally {
      setLoading(false);
    }
  };

  const resetForNewVote = () => {
    setCurrentPage('pin');
    setPin(['', '', '', '']);
    setHouse('');
    setBallot({});
    setCurrentPositionIndex(0);
    setError('');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          {/* <Image src="/assets/logo/logosst.png" alt="SST" width={50} height={40} /> */}
          {/* <span className="logo-text">SCALER</span> */}
        </div>
        <Link href="/admin" className="admin-btn">
          🔐 Admin
        </Link>
      </header>

      {/* PIN Entry Page */}
      {currentPage === 'pin' && (
        <main className="main-content">
          <div className="pin-page">
            <Image src="/assets/logo/logosst.png" alt="SST" width={80} height={80} className="center-logo" />
            <h1 className="main-title">
              Student<br />
              Election <span className="gradient-text">2026</span>
            </h1>
            <p className="subtitle">Enter your 4-digit PIN</p>

            <div className="pin-container">
              {[1, 2, 3, 4].map((num) => (
                <input
                  key={num}
                  type="text"
                  id={`pin-${num}`}
                  maxLength="1"
                  inputMode="numeric"
                  className="pin-input"
                  value={pin[num - 1]}
                  onChange={(e) => handlePinInput(num - 1, e.target.value)}
                />
              ))}
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              className="btn-primary"
              disabled={pin.join('').length !== 4 || loading}
              onClick={verifyPin}
            >
              {loading ? 'Verifying...' : 'Continue'} →
            </button>
          </div>
        </main>
      )}

      {/* Instructions Page */}
      {currentPage === 'instructions' && (
        <main className="main-content">
          <div className="instructions-page">
            <h1 className="page-title">How to Vote</h1>

            <div className="instructions-list">
              {[
                { num: 1, title: 'Preference Voting', desc: 'Most positions require two choices. First click = Preference 1 (2 points), second click = Preference 2 (1 point).' },
                { num: 2, title: 'Single Choice', desc: 'Campus Affairs Secretary requires only one selection (1 point).' },
                { num: 3, title: 'NOTA Option', desc: '"None of the Above" is available for every position and counts like a regular candidate.' },
                { num: 4, title: 'Review & Submit', desc: 'Review all your selections before final submission. You cannot change your vote after submission.' }
              ].map((item) => (
                <div key={item.num} className="instruction-card">
                  <span className="instruction-num">{item.num}</span>
                  <div className="instruction-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={() => setCurrentPage('house-selection')}>
              Start Voting →
            </button>
          </div>
        </main>
      )}

      {/* House Selection Page */}
      {currentPage === 'house-selection' && (
        <main className="main-content">
          <div className="house-page">
            <h1 className="page-title">Select Your House</h1>
            <p className="subtitle">You can only vote for house captain positions of your own house</p>

            <div className="house-grid">
              {['leo', 'phoenix', 'tusker', 'kong'].map((h) => (
                <button
                  key={h}
                  className={`house-card ${house === h ? 'selected' : ''}`}
                  onClick={() => setHouse(h)}
                  style={{ '--house-color': houseColors[h] }}
                >
                  <div className="house-logo">
                    <Image
                      src={`/assets/logo/houselogo/${h === 'phoenix' ? 'pheonix' : h}.webp`}
                      alt={h}
                      width={80}
                      height={80}
                    />
                  </div>
                  <span className="house-name" style={{ color: houseColors[h] }}>
                    {h.charAt(0).toUpperCase() + h.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              disabled={!house}
              onClick={() => setCurrentPage('voting')}
            >
              Next →
            </button>
          </div>
        </main>
      )}

      {/* Voting Page */}
      {currentPage === 'voting' && (
        <main className="main-content voting-main">
          <div className="voting-page">
            {/* Progress indicator */}
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentPositionIndex + 1) / positionOrder.length) * 100}%` }}
              />
            </div>
            <p className="progress-text">{currentPositionIndex + 1} of {positionOrder.length}</p>

            {/* Position Title */}
            <h2
              className="position-title"
              style={{
                color: positionOrder[currentPositionIndex] === 'houseCaptain'
                  ? houseColors[house]
                  : '#ffffff'
              }}
            >
              {getPositionTitle(positionOrder[currentPositionIndex])}
            </h2>

            <p className="voting-hint">
              {isSingleChoice(positionOrder[currentPositionIndex])
                ? 'Select one candidate'
                : 'Tap once for 1st preference, tap another for 2nd preference'}
            </p>

            {/* Candidate Grid */}
            <div className="candidate-grid">
              {getCurrentPositionCandidates().map((candidate) => {
                const positionId = positionOrder[currentPositionIndex];
                const selection = ballot[positionId] || {};
                const isPref1 = selection.pref1 === candidate.id;
                const isPref2 = selection.pref2 === candidate.id;
                const isSelected = selection.choice === candidate.id;
                const isNota = candidate.name?.toLowerCase().includes('nota');

                return (
                  <button
                    key={candidate.id}
                    className={`candidate-card ${isPref1 ? 'pref1' : ''} ${isPref2 ? 'pref2' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCandidateClick(candidate.id)}
                  >
                    {(isPref1 || isPref2) && (
                      <span className={`pref-badge ${isPref1 ? 'p1' : 'p2'}`}>
                        {isPref1 ? '1' : '2'}
                      </span>
                    )}

                    <div className={`candidate-avatar ${isNota ? 'nota' : ''}`}>
                      {isNota ? (
                        <span className="nota-x">✕</span>
                      ) : candidate.photo ? (
                        <Image
                          src={`/assets/candidates/${candidate.photo}`}
                          alt={candidate.name}
                          width={80}
                          height={80}
                          style={{ objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        <span className="initials">{getInitials(candidate.name)}</span>
                      )}
                    </div>

                    <p className="candidate-name">{candidate.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Error message */}
            {error && <p className="error-text" style={{ textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

            {/* Selection status hint */}
            {!isSingleChoice(positionOrder[currentPositionIndex]) && (
              <p style={{
                textAlign: 'center',
                color: isSelectionComplete() ? '#00ff88' : '#a0a0a0',
                fontSize: '0.85rem',
                marginBottom: '15px'
              }}>
                {isSelectionComplete()
                  ? '✓ Both preferences selected'
                  : `Select ${ballot[positionOrder[currentPositionIndex]]?.pref1 ? '2nd preference' : 'both preferences'}`
                }
              </p>
            )}

            {/* Navigation */}
            <div className="nav-buttons">
              <button
                className="btn-secondary"
                onClick={goToPreviousPosition}
                disabled={currentPositionIndex === 0}
                style={{ padding: '14px 32px', fontSize: '1rem' }}
              >
                ← Back
              </button>
              <button
                className="btn-primary"
                onClick={goToNextPosition}
                style={{ opacity: isSelectionComplete() ? 1 : 0.6, padding: '14px 32px', fontSize: '1rem' }}
              >
                {currentPositionIndex === positionOrder.length - 1 ? 'Review' : 'Next'} →
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Review Page */}
      {currentPage === 'review' && (
        <main className="main-content">
          <div className="review-page">
            <h1 className="page-title">Review Your Votes</h1>
            <p className="subtitle">Confirm your selections before submitting</p>

            <div className="review-list">
              {positionOrder.map((positionId) => {
                const selection = ballot[positionId];
                if (!selection || Object.keys(selection).length === 0) return null;

                const actualPositionId = positionId === 'houseCaptain' ? `${house}Captain` : positionId;
                const positionCandidates = candidates?.[actualPositionId] || [];

                const getName = (id) => positionCandidates.find(c => c.id === id)?.name || id;

                return (
                  <div
                    key={positionId}
                    className="review-item"
                    style={{ borderLeftColor: positionId === 'houseCaptain' ? houseColors[house] : '#333' }}
                  >
                    <span className="review-position">{getPositionTitle(positionId)}</span>
                    <div className="review-votes">
                      {selection.choice && <span className="vote-item">✓ {getName(selection.choice)}</span>}
                      {selection.pref1 && <span className="vote-item pref1">1st: {getName(selection.pref1)}</span>}
                      {selection.pref2 && <span className="vote-item pref2">2nd: {getName(selection.pref2)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="nav-buttons">
              <button className="btn-secondary" onClick={() => setCurrentPage('voting')}>
                ← Edit
              </button>
              <button className="btn-success" onClick={submitVote} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Vote'} ✓
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Thank You Page */}
      {currentPage === 'thankyou' && (
        <main className="main-content">
          <div className="thankyou-page">
            <div className="success-icon">✓</div>
            <h1 className="page-title">Vote Submitted!</h1>
            <p className="subtitle">Thank you for participating in SST Election 2026</p>
            <button className="btn-secondary" onClick={resetForNewVote}>
              Cast Another Vote
            </button>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="footer">
        Made with <span className="heart">❤</span> by Tirth Shah
      </footer>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background: #0d0d0d;
          color: #fff;
          font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(13, 13, 13, 0.9);
          backdrop-filter: blur(10px);
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-text {
          font-weight: 600;
          font-size: 1.1rem;
          color: #fff;
        }
        
        .admin-btn {
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s;
        }
        
        .admin-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        
        .main-content {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 60px;
        }
        
        .voting-main {
          align-items: flex-start;
          padding-top: 80px;
        }
        
        /* PIN Page */
        .pin-page {
          text-align: center;
          max-width: 400px;
        }
        
        .center-logo {
          margin-bottom: 24px;
        }
        
        .main-title {
          font-size: 3rem;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
          color: #888;
          margin-bottom: 32px;
        }
        
        .pin-container {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .pin-input {
          width: 56px;
          height: 64px;
          font-size: 1.5rem;
          text-align: center;
          background: #1a1a1a;
          border: 2px solid #2a2a2a;
          border-radius: 12px;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .pin-input:focus {
          border-color: #0d9488;
        }
        
        .error-text {
          color: #ef4444;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }
        
        .btn-primary {
          padding: 10px 28px;
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          color: #000;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(13, 148, 136, 0.4);
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(13, 148, 136, 0.5);
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          padding: 10px 28px;
          background: linear-gradient(135deg, #444, #555);
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 15px rgba(100, 100, 100, 0.3);
        }
        
        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(100, 100, 100, 0.4);
        }
        
        .btn-secondary:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        .btn-success {
          padding: 14px 32px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
        }
        
        /* Instructions Page */
        .instructions-page, .house-page, .voting-page, .review-page, .thankyou-page {
          width: 100%;
          max-width: 600px;
          text-align: center;
        }
        
        .page-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .instructions-list {
          text-align: left;
          margin: 32px 0;
        }
        
        .instruction-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          background: #141414;
          border: 1px solid #222;
          border-radius: 12px;
          margin-bottom: 12px;
        }
        
        .instruction-num {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #a855f7, #06b6d4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          color: #fff;
          flex-shrink: 0;
        }
        
        .instruction-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .instruction-content p {
          font-size: 0.85rem;
          color: #888;
          margin: 0;
          line-height: 1.5;
        }
        
        /* House Selection */
        .house-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 32px 0;
        }
        
        .house-card {
          padding: 32px 24px;
          background: #141414;
          border: 2px solid var(--house-color);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .house-card:hover {
          background: rgba(255, 255, 255, 0.02);
          transform: translateY(-4px);
        }
        
        .house-card.selected {
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 30px var(--house-color);
          transform: scale(1.05);
          border-width: 3px;
        }
        
        .house-logo {
          width: 80px;
          height: 80px;
        }
        
        .house-name {
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        /* Voting Page */
        .voting-page {
          max-width: 900px;
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          background: #222;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0d9488, #14b8a6);
          transition: width 0.3s;
        }
        
        .progress-text {
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }
        
        .position-title {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .voting-hint {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 32px;
        }
        
        .candidate-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .candidate-card {
          width: 160px;
          padding: 24px 16px;
          background: #141414;
          border: 2px solid #222;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          position: relative;
        }
        
        .candidate-card:hover {
          border-color: #444;
          transform: translateY(-4px);
        }
        
        .candidate-card.pref1 {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
        }
        
        .candidate-card.pref2 {
          border-color: #a855f7;
          background: rgba(168, 85, 247, 0.08);
        }
        
        .candidate-card.selected {
          border-color: #0d9488;
          background: rgba(13, 148, 136, 0.08);
        }
        
        .pref-badge {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        
        .pref-badge.p1 {
          background: #22c55e;
        }
        
        .pref-badge.p2 {
          background: #a855f7;
        }
        
        .candidate-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 16px;
          background: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .candidate-avatar.nota {
          background: #1a1a1a;
        }
        
        .nota-x {
          font-size: 2rem;
          color: #666;
        }
        
        .initials {
          font-size: 1.5rem;
          font-weight: 600;
          color: #666;
        }
        
        .candidate-name {
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0;
          line-height: 1.3;
          color: #fff;
        }
        
        .nav-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        
        .nav-buttons .btn-secondary,
        .nav-buttons .btn-primary {
          padding: 10px 28px;
          font-size: 0.95rem;
          min-width: 120px;
          height: auto;
        }
        
        /* Review Page */
        .review-list {
          text-align: left;
          margin: 24px 0;
        }
        
        .review-item {
          padding: 16px 20px;
          background: #141414;
          border-radius: 12px;
          border-left: 3px solid #333;
          margin-bottom: 12px;
        }
        
        .review-position {
          font-size: 0.75rem;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 8px;
        }
        
        .review-votes {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .vote-item {
          font-size: 0.95rem;
        }
        
        .vote-item.pref1 { color: #22c55e; }
        .vote-item.pref2 { color: #a855f7; }
        
        /* Thank You */
        .thankyou-page {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          color: #fff;
          margin-bottom: 24px;
        }
        
        /* Footer */
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px;
          text-align: center;
          color: #555;
          font-size: 0.85rem;
          background: linear-gradient(to top, #0d0d0d, transparent);
        }
        
        .heart {
          color: #ef4444;
        }
        
        @media (max-width: 600px) {
          .main-title { font-size: 2.25rem; }
          .house-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
          .house-card { padding: 24px 16px; }
          .house-logo { width: 60px; height: 60px; }
          .candidate-card { width: 140px; padding: 20px 12px; }
          .candidate-avatar { width: 64px; height: 64px; }
        }
      `}</style>
    </div>
  );
}
