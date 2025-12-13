'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function VotingPage() {
  const [currentPage, setCurrentPage] = useState('pin');
  const [pin, setPin] = useState(['', '', '', '']);  // 4 digits instead of 6
  const [house, setHouse] = useState('');
  const [candidates, setCandidates] = useState(null);
  const [ballot, setBallot] = useState({});
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [positionOrder, setPositionOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch candidates on mount
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/candidates');
      const data = await response.json();
      setCandidates(data.candidates);
      setPositionOrder(data.positionOrder);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    }
  };

  const handlePinInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {  // Changed from 5 to 3
      document.getElementById(`pin-${index + 2}`)?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      document.getElementById(`pin-${index}`)?.focus();
    }
  };

  const verifyPin = async () => {
    const pinValue = pin.join('');
    if (pinValue.length !== 4) {  // Changed from 6 to 4
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
        setPin(['', '', '', '', '', '']);
        document.getElementById('pin-1')?.focus();
      }
    } catch (err) {
      setError('Failed to validate PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSelection = (candidateId, preference) => {
    const positionId = positionOrder[currentPositionIndex];
    const currentSelection = ballot[positionId] || {};

    if (positionId === 'campusAffairsSecretary') {
      // Single choice
      setBallot({
        ...ballot,
        [positionId]: { choice: candidateId }
      });
    } else {
      // Preference voting
      if (preference === 1) {
        setBallot({
          ...ballot,
          [positionId]: { ...currentSelection, pref1: candidateId }
        });
      } else {
        setBallot({
          ...ballot,
          [positionId]: { ...currentSelection, pref2: candidateId }
        });
      }
    }
  };

  const submitVote = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pin.join(''),
          ballot,
          house
        })
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

  return (
    <>
      {/* Film grain overlay */}
      <div className="grain-overlay"></div>

      {/* Site Header */}
      <header className="site-header">
        <div className="site-logo">
          <Image
            src="/assets/logo/logosst.png"
            alt="SST Logo"
            width={40}
            height={40}
            id="header-logo"
            style={{ display: currentPage === 'pin' || currentPage === 'thankyou' ? 'none' : 'block' }}
          />
        </div>
        <Link href="/admin" className="btn-admin-link">
          <span>🔐</span>
          Admin
        </Link>
      </header>

      {/* App Container */}
      <div className="app-container">
        {/* PIN Entry Page */}
        {currentPage === 'pin' && (
          <section className="page active">
            <div className="page-content centered">
              <div className="logo-section">
                <Image
                  src="/assets/logo/logosst.png"
                  alt="SST Logo"
                  width={150}
                  height={150}
                  className="logo-image"
                />
                <h1 className="main-title">
                  Student<br />Election <span className="accent">2026</span>
                </h1>
              </div>

              <div className="pin-container">
                <label htmlFor="pin-1" className="pin-label">Enter your 4-digit PIN</label>
                <div className="pin-input-group">
                  {[1, 2, 3, 4].map((num) => (
                    <input
                      key={num}
                      type="text"
                      id={`pin-${num}`}
                      className="pin-digit"
                      maxLength="1"
                      inputMode="numeric"
                      pattern="[0-9]"
                      autoComplete="off"
                      value={pin[num - 1]}
                      onChange={(e) => handlePinInput(num - 1, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(num - 1, e)}
                    />
                  ))}
                </div>
                <p className="error-message">{error}</p>
                <button
                  className="btn btn-primary"
                  disabled={pin.join('').length !== 4 || loading}
                  onClick={verifyPin}
                >
                  Continue
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Instructions Page */}
        {currentPage === 'instructions' && (
          <section className="page active">
            <div className="page-content centered">
              <h2 className="section-title">How to Vote</h2>

              <div className="instructions-list">
                <div className="instruction-item">
                  <div className="instruction-number">1</div>
                  <div className="instruction-text">
                    <strong>Preference Voting</strong>
                    <p>Most positions require two choices. First click = Preference 1 (2 points), second click = Preference 2 (1 point).</p>
                  </div>
                </div>

                <div className="instruction-item">
                  <div className="instruction-number">2</div>
                  <div className="instruction-text">
                    <strong>Single Choice</strong>
                    <p>Campus Affairs Secretary requires only one selection (1 point).</p>
                  </div>
                </div>

                <div className="instruction-item">
                  <div className="instruction-number">3</div>
                  <div className="instruction-text">
                    <strong>NOTA Option</strong>
                    <p>&quot;None of the Above&quot; is available for every position and counts like a regular candidate.</p>
                  </div>
                </div>

                <div className="instruction-item">
                  <div className="instruction-number">4</div>
                  <div className="instruction-text">
                    <strong>Review & Submit</strong>
                    <p>Review all your selections before final submission. You cannot change your vote after submission.</p>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={() => setCurrentPage('house-selection')}
              >
                Start Voting
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </section>
        )}

        {/* House Selection Page */}
        {currentPage === 'house-selection' && (
          <section className="page active">
            <div className="page-content centered">
              <h2 className="section-title">Select Your House</h2>
              <p className="house-selection-subtitle">You can only vote for house captain positions of your own house</p>

              <div className="house-selection-grid">
                {['leo', 'phoenix', 'tusker', 'kong'].map((h) => (
                  <button
                    key={h}
                    className={`house-card house-${h} ${house === h ? 'selected' : ''}`}
                    onClick={() => setHouse(h)}
                  >
                    <div className="house-icon">
                      <Image
                        src={`/assets/logo/houselogo/${h === 'phoenix' ? 'pheonix' : h}.webp`}
                        alt={h}
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="house-name">{h.charAt(0).toUpperCase() + h.slice(1)}</div>
                  </button>
                ))}
              </div>

              <button
                className="btn btn-primary"
                disabled={!house}
                onClick={() => setCurrentPage('voting')}
              >
                Next
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </section>
        )}

        {/* Thank You Page */}
        {currentPage === 'thankyou' && (
          <section className="page active">
            <div className="page-content centered">
              <Image
                src="/assets/logo/logosst.png"
                alt="SST Logo"
                width={150}
                height={150}
                className="logo-image"
                style={{ marginBottom: '2rem' }}
              />

              <div className="success-animation">
                <div className="checkmark-circle">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle-svg" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                </div>
              </div>

              <h2 className="thankyou-title">Vote Submitted!</h2>
              <p className="thankyou-message">Thank you for participating in the SST Student Election 2026.</p>

              <button
                className="btn btn-secondary btn-large"
                onClick={() => {
                  setCurrentPage('pin');
                  setPin(['', '', '', '']);  // Changed from 6 to 4
                  setHouse('');
                  setBallot({});
                  setCurrentPositionIndex(0);
                }}
              >
                Cast Another Vote
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* Site Footer */}
      <footer className="site-footer">
        Made with <span className="heart">❤️</span> by Tirth Shah
      </footer>
    </>
  );
}
