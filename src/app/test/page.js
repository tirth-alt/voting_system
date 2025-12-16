'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
    const [envData, setEnvData] = useState(null);
    const [loginTest, setLoginTest] = useState(null);
    const [testEmail, setTestEmail] = useState('admin@college.edu');
    const [testPassword, setTestPassword] = useState('admin123');

    useEffect(() => {
        // Fetch ENV test
        fetch('/api/test-env')
            .then(res => res.json())
            .then(data => setEnvData(data))
            .catch(err => console.error(err));
    }, []);

    const testLogin = async () => {
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, password: testPassword })
            });
            const data = await response.json();
            setLoginTest({ status: response.status, data });
        } catch (err) {
            setLoginTest({ error: err.message });
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
            <h1>🔧 Debug Page</h1>

            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h2>Environment Variables</h2>
                <pre style={{ background: '#000', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(envData, null, 2)}
                </pre>
            </div>

            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <h2>Test Login</h2>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input
                        type="text"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
                    <input
                        type="text"
                        value={testPassword}
                        onChange={(e) => setTestPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '4px' }}
                    />
                </div>
                <button
                    onClick={testLogin}
                    style={{ padding: '10px 20px', background: '#00f0ff', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Test Login
                </button>

                {loginTest && (
                    <pre style={{ background: '#000', padding: '15px', borderRadius: '4px', marginTop: '15px', overflow: 'auto' }}>
                        {JSON.stringify(loginTest, null, 2)}
                    </pre>
                )}
            </div>

            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px' }}>
                <h2>Quick Links</h2>
                <ul>
                    <li><a href="/" style={{ color: '#00f0ff' }}>Voting Page</a></li>
                    <li><a href="/admin" style={{ color: '#00f0ff' }}>Admin Dashboard</a></li>
                    <li><a href="/api/debug-creds" style={{ color: '#00f0ff' }}>Debug Credentials API</a></li>
                    <li><a href="/api/test-env" style={{ color: '#00f0ff' }}>Test ENV API</a></li>
                </ul>
            </div>
        </div>
    );
}
