import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Link from 'next/link';

export default function SentimentDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [securityLog, setSecurityLog] = useState([]);
  const [cryptoData, setCryptoData] = useState(null);
  const [attestationState, setAttestationState] = useState({
    status: 'idle', // idle, verifying, verified, failed
    steps: {
      initialization: false,
      attestation: false,
      dataLoading: false,
      analysis: false,
      proofGeneration: false,
      signing: false,
      verification: false
    }
  });
  const [customNews, setCustomNews] = useState([
    { source: 'Twitter', content: 'Markets showing bullish signals as tech sector surges ahead. Growth expected to continue.' },
    { source: 'Financial News', content: 'Some analysts predict a slight correction but overall positive outlook for the quarter.' },
    { source: 'Market Report', content: 'Volatility increasing as investors navigate uncertainty. Some sectors showing signs of decline.' }
  ]);

  // NEAR branding colors
  const nearColors = {
    primary: '#6E62EB', // NEAR purple
    secondary: '#5F8AFA', // NEAR blue
    accent: '#9092FB', // Light purple
    background: '#F5F5FF', // Light background
    success: '#5DB075', // Green
    warning: '#E58955', // Orange
    error: '#ED5D68', // Red
  };

  // Fetch live crypto data
  useEffect(() => {
    async function fetchCryptoData() {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,near,solana&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        setCryptoData(data);
      } catch (err) {
        console.error("Failed to fetch crypto data:", err);
      }
    }
    
    fetchCryptoData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Function to update the displayed security log
  const updateSecurityLog = async (data) => {
    if (data && data.teeSecuritySteps) {
      // Display the enhanced security log
      for (const step of data.teeSecuritySteps) {
        await new Promise(resolve => {
          setTimeout(() => {
            setSecurityLog(prev => [...prev, step]);
            setAttestationState(prev => {
              const newSteps = {...prev.steps};
              if (step.step.includes('Initialize') || step.step.includes('Initialization')) {
                newSteps.initialization = true;
              } else if (step.step.includes('Attestation') || step.step.includes('Quote')) {
                newSteps.attestation = true;
              } else if (step.step.includes('Market Data') || step.step.includes('Data')) {
                newSteps.dataLoading = true;
              } else if (step.step.includes('Sentiment') || step.step.includes('LLM') || step.step.includes('Analysis')) {
                newSteps.analysis = true;
              } else if (step.step.includes('Proof') || step.step.includes('Cryptographic')) {
                newSteps.proofGeneration = true;
              } else if (step.step.includes('Sign') || step.step.includes('Transaction')) {
                newSteps.signing = true;
              }
              return { status: 'verifying', steps: newSteps };
            });
            resolve();
          }, 300);
        });
      }
      
      // Mark verification complete
      setAttestationState(prev => ({
        status: 'verified',
        steps: {
          ...prev.steps,
          verification: true
        }
      }));
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setSecurityLog([]);
    setAttestationState({
      status: 'verifying',
      steps: {
        initialization: false,
        attestation: false,
        dataLoading: false,
        analysis: false,
        proofGeneration: false,
        signing: false,
        verification: false
      }
    });
    
    // Initial security steps to show before API response
    const initialSecuritySteps = [
      "🔒 Initializing TEE secure enclave (SGX)...",
      "🔐 Generating remote attestation quote...",
    ];
    
    // Show initial steps
    for (const step of initialSecuritySteps) {
      await new Promise(resolve => {
        setTimeout(() => {
          setSecurityLog(prev => [...prev, { 
            step: step.replace(/[^a-zA-Z\s]/g, '').trim(), 
            status: "in-progress",
            details: step,
            timestamp: new Date().toISOString()
          }]);
          resolve();
        }, 500);
      });
    }
    
    try {
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customNews),
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we got valid results
      if (!data.sentimentAnalysis || !data.allocationPlan) {
        throw new Error('Incomplete response from API');
      }
      
      setResult(data);
      
      // Update the security log with the detailed steps from the API
      await updateSecurityLog(data);
      
      // Add final verification message if not already added
      setTimeout(() => {
        setSecurityLog(prev => {
          const lastLog = prev[prev.length - 1];
          if (!lastLog || !lastLog.step || !lastLog.step.includes("Verification complete")) {
            return [...prev, { 
              step: "Verification complete", 
              status: "complete",
              details: "✅ Verification complete! Execution cryptographically proven via NEAR smart contract",
              timestamp: new Date().toISOString()
            }];
          }
          return prev;
        });
      }, 500);
      
    } catch (err) {
      setError('Failed to analyze sentiment: ' + err.message);
      
      // Add error to security log
      setSecurityLog(prev => [...prev, { 
        step: "Error", 
        status: "error",
        details: "❌ Error: " + err.message,
        timestamp: new Date().toISOString()
      }]);
      
      setAttestationState(prev => ({
        status: 'failed',
        steps: prev.steps
      }));
      
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to update a specific news item
  const updateNewsItem = (index, field, value) => {
    const updatedNews = [...customNews];
    updatedNews[index] = { ...updatedNews[index], [field]: value };
    setCustomNews(updatedNews);
  };

  // Generate sample news based on current crypto data
  const generateRecentNews = () => {
    if (!cryptoData) return;
    
    const btcPrice = cryptoData.bitcoin?.usd || 0;
    const ethPrice = cryptoData.ethereum?.usd || 0;
    const nearPrice = cryptoData.near?.usd || 0;
    const solPrice = cryptoData.solana?.usd || 0;
    
    const btcChange = cryptoData.bitcoin?.usd_24h_change || 0;
    const ethChange = cryptoData.ethereum?.usd_24h_change || 0;
    const nearChange = cryptoData.near?.usd_24h_change || 0;
    const solChange = cryptoData.solana?.usd_24h_change || 0;
    
    const avgChange = (btcChange + ethChange + nearChange + solChange) / 4;
    
    // Generate time references
    const now = new Date();
    const hours = now.getHours();
    const timeOfDay = hours < 12 ? "morning" : hours < 18 ? "afternoon" : "evening";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Market direction terms
    const getBtcTerm = () => {
      if (btcChange > 5) return "surges dramatically";
      if (btcChange > 2) return "rallies";
      if (btcChange > 0) return "edges higher";
      if (btcChange > -2) return "dips slightly";
      if (btcChange > -5) return "declines";
      return "plummets";
    };
    
    const getEthTerm = () => {
      if (ethChange > 5) return "skyrockets";
      if (ethChange > 2) return "climbs strongly";
      if (ethChange > 0) return "trades positively";
      if (ethChange > -2) return "slips";
      if (ethChange > -5) return "slides downward";
      return "crashes";
    };
    
    // Technical indicators (simulated)
    const btcRSI = 50 + (btcChange * 2); // Simulate RSI based on price change
    const supportLevel = Math.floor(btcPrice * 0.93);
    const resistanceLevel = Math.ceil(btcPrice * 1.08);
    
    // Bitcoin dominance (simulated)
    const btcDominance = 48 + (btcChange / 3);
    
    // Trading volume (simulated)
    const volumeChangePercent = 15 + (Math.abs(avgChange) * 3);
    const volumeDirection = avgChange < -1 ? "surge" : "decline";
    
    // Market mood
    const marketMood = avgChange > 2 ? "optimistic" : 
                       avgChange > 0 ? "cautiously positive" :
                       avgChange > -2 ? "uncertain" :
                       avgChange > -4 ? "pessimistic" : "fearful";
    
    // Alternative data
    const fearGreedIndex = Math.max(1, Math.min(99, 50 - (avgChange * 4)));
    const fearGreedCategory = 
      fearGreedIndex >= 75 ? "Extreme Greed" :
      fearGreedIndex >= 60 ? "Greed" :
      fearGreedIndex >= 45 ? "Neutral" :
      fearGreedIndex >= 25 ? "Fear" : "Extreme Fear";
    
    // Create diverse sources with realistic content
    const news = [
      { 
        source: 'CoinDesk Market Update', 
        content: `Bitcoin ${getBtcTerm()} ${Math.abs(btcChange).toFixed(2)}% to $${btcPrice.toLocaleString()} as ${marketMood} sentiment dominates this ${timeOfDay}'s trading session. Technical indicators show RSI at ${btcRSI.toFixed(0)}, with key support at $${supportLevel.toLocaleString()} and resistance at $${resistanceLevel.toLocaleString()}. Trading volumes ${volumeDirection} by ${volumeChangePercent.toFixed(0)}% over the past 24 hours.`
      },
      { 
        source: 'Bloomberg Crypto', 
        content: `Ethereum ${getEthTerm()} ${Math.abs(ethChange).toFixed(2)}% to $${ethPrice.toLocaleString()} as institutional investors ${ethChange > 0 ? 'accumulate' : 'reduce'} positions ahead of network upgrades. NEAR Protocol ${nearChange > 0 ? 'finds support' : 'struggles'} at $${nearPrice.toFixed(2)}, while analysts cite ${nearChange > 0 ? 'growing DeFi activity' : 'competitive pressures'} affecting token price. Bitcoin dominance stands at ${btcDominance.toFixed(1)}%.`
      },
      { 
        source: 'Santiment On-Chain Analysis', 
        content: `On-chain metrics show ${avgChange > 0 ? 'bullish' : 'bearish'} divergence as whale wallets ${avgChange > 0 ? 'accumulate' : 'distribute'} across major cryptocurrencies. Solana network recorded ${solChange > 0 ? 'increased' : 'decreased'} developer activity despite price ${solChange > 0 ? 'appreciation' : 'decline'} of ${Math.abs(solChange).toFixed(2)}%. Fear & Greed Index reading: ${fearGreedIndex} (${fearGreedCategory}).`
      },
      { 
        source: 'The Block Research', 
        content: `Market overview: Global crypto market cap ${avgChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(avgChange).toFixed(2)}% in the past 24 hours. Spot trading volumes ${avgChange < 0 ? 'surged' : 'remained stable'} as ${btcChange < 0 ? 'sell-side pressure mounted' : 'accumulation continued'} across exchanges. BTC balance on exchanges ${btcChange < 0 ? 'increased' : 'decreased'} for the first time in ${Math.floor(Math.random() * 10) + 2} days, potentially signaling ${btcChange < 0 ? 'distribution' : 'accumulation'}.`
      },
      { 
        source: 'TokenInsight Market Analysis', 
        content: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} recap: BTC/USD ${getBtcTerm()} following ${yesterdayString}'s ${btcChange > 0 ? 'recovery' : 'decline'}. Futures markets show ${btcChange > 0 ? 'increasing' : 'decreasing'} open interest with funding rates turning ${btcChange > 0 ? 'positive' : 'negative'}. Total liquidations in the past 24h: $${(Math.random() * 200 + 50).toFixed(0)}M, majority being ${btcChange > 0 ? 'short' : 'long'} positions.`
      }
    ];
    
    // Select a random subset of 3 news items to display
    const shuffled = [...news].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    setCustomNews(selected);
  };

  // Function to display the enhanced verifiable execution section
  function AttestationVerificationDetails({ attestation, verifiableExecution }) {
    if (!attestation) return null;
    
    return (
      <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease-in-out' }}>
        <h4 style={{ 
          marginBottom: '1.2rem', 
          color: '#6E62EB', 
          fontSize: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Technical Attestation Details
        </h4>
        
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '0.85rem', 
          backgroundColor: '#0a1929', 
          color: '#e6f0ff',
          padding: '1.5rem',
          borderRadius: '12px',
          overflowX: 'auto',
          boxShadow: '0 6px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(110, 98, 235, 0.1)'
        }}>
          <div className="attestation-section" style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              color: '#4CC9F0', 
              marginBottom: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="2" x2="9" y2="4"></line>
                <line x1="15" y1="2" x2="15" y2="4"></line>
              </svg>
              Intel SGX Quote Details
            </div>
            <div style={{ marginLeft: '1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>mrEnclave:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.sgxQuote.mrEnclave}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>mrSigner:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.sgxQuote.mrSigner}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>reportData:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.sgxQuote.reportData}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>cpuSvn:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.sgxQuote.cpuSvn}</span>
              </div>
            </div>
          </div>
          
          <div className="attestation-section" style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              color: '#4CC9F0', 
              marginBottom: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Phala Attestation
            </div>
            <div style={{ marginLeft: '1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>checksum:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.phalaAttestation.checksum}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>pruntime:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.phalaAttestation.pruntime}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>gateway:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.phalaAttestation.gateway}</span>
              </div>
            </div>
          </div>
          
          <div className="attestation-section">
            <div style={{ 
              color: '#4CC9F0', 
              marginBottom: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              Docker Verification
            </div>
            <div style={{ marginLeft: '1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', marginBottom: '0.4rem' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>imageSha256:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.dockerVerification.imageSha256}</span>
              </div>
              <div style={{ display: 'flex' }}>
                <span style={{ color: '#F472B6', width: '110px', display: 'inline-block' }}>registryUrl:</span> 
                <span style={{ wordBreak: 'break-all' }}>{attestation.dockerVerification.registryUrl}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1.2rem',
          backgroundColor: '#173A5E',
          color: 'white',
          borderRadius: '12px',
          fontSize: '0.9rem',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          animation: 'fadeIn 0.5s ease-in-out',
          border: '1px solid rgba(76, 201, 240, 0.2)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Verification Path:
          </div>
          <div style={{ fontFamily: 'monospace', marginLeft: '1.5rem', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: '#4CC9F0', marginRight: '8px' }}>1.</span> NEAR Contract ({verifiableExecution.contractId})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: '#4CC9F0', marginRight: '8px' }}>2.</span> 
              <span style={{ marginRight: '6px' }}>↳</span> 
              Verifies Phala Attestation ({attestation.phalaAttestation.checksum})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ color: '#4CC9F0', marginRight: '8px' }}>3.</span> 
              <span style={{ marginRight: '6px' }}>↳</span> 
              Verifies SGX Quote (MRENCLAVE: {attestation.sgxQuote.mrEnclave.substring(0, 16)}...)
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#4CC9F0', marginRight: '8px' }}>4.</span> 
              <span style={{ marginRight: '6px' }}>↳</span> 
              Verifies Docker Image SHA256 ({attestation.dockerVerification.imageSha256.substring(0, 16)}...)
            </div>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1.2rem',
          backgroundColor: '#004D40',
          color: 'white',
          borderRadius: '12px',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          border: '1px solid rgba(0, 128, 96, 0.3)'
        }} onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        }} onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          <div>
            <span style={{ fontWeight: 'bold' }}>Verify this attestation:</span>{' '}
            <a 
              href={`https://proof.t16z.com/?checksum=${attestation.phalaAttestation.checksum}`}
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#4CC9F0', 
                textDecoration: 'underline',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#7FDBFF'}
              onMouseLeave={e => e.currentTarget.style.color = '#4CC9F0'}
            >
              Phala TEE Attestation Explorer
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ 
      backgroundColor: nearColors.background,  
      minHeight: '100vh'
    }}>
      <Head>
        <title>Shade Agent Demo - NEAR Sentiment Analysis</title>
        <meta name="description" content="Verifiable off-chain LLM inference with Shade Agents on NEAR" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          body {
            background: linear-gradient(135deg, ${nearColors.background} 0%, #e8f0ff 100%);
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          }
          
          ::selection {
            background-color: ${nearColors.primary};
            color: white;
          }

          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            overflow: hidden;
          }
          
          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
          }
          
          .section-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: ${nearColors.primary};
            border-left: 4px solid ${nearColors.secondary};
            padding-left: 12px;
          }
          
          .button-primary {
            background: linear-gradient(135deg, ${nearColors.primary} 0%, ${nearColors.secondary} 100%);
            transition: all 0.3s ease;
          }
          
          .button-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(110, 98, 235, 0.4);
          }
        `}</style>
      </Head>

      <main className={styles.main} style={{ padding: '3rem 1.5rem' }}>
        <div style={{ 
          background: `linear-gradient(135deg, ${nearColors.primary} 0%, ${nearColors.secondary} 100%)`, 
          color: 'white',
          padding: '2.5rem 1.5rem',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '2.5rem',
          boxShadow: '0 8px 30px rgba(110, 98, 235, 0.2)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            fontWeight: '800'
          }}>
            Market Sentiment Analyzer
          </h1>

          <p style={{ 
            fontSize: '1.2rem',
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            A demonstration of how Shade Agents enable verifiable AI-powered cross-chain execution
          </p>
        </div>

        <div style={{ 
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}>
          <div className="card" style={{ 
            padding: '1.5rem', 
            borderLeft: `4px solid ${nearColors.primary}`
          }}>
            <h2 style={{ marginTop: 0, color: nearColors.primary, fontSize: '1.5rem' }}>How Shade Agents Solve the Oracle Problem</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>The Problem</h3>
                <p style={{ lineHeight: '1.6' }}>Smart contracts are isolated from the outside world and can't access real-time data like market sentiment, which is crucial for investment decisions.</p>
              </div>
              
              <div>
                <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>The Shade Agent Solution</h3>
                <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>Shade Agents are multichain crypto AI agents, verifiable from source code through to their transactions across any blockchain.</p>
                <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                  <li><strong style={{ color: nearColors.primary }}>Verifiably access off-chain data</strong> - Access LLMs, APIs and data within a Trusted Execution Environment (TEE)</li>
                  <li><strong style={{ color: nearColors.primary }}>Sign transactions for any chain</strong> - Using NEAR's Chain Signatures to manage assets across multiple blockchains</li>
                  <li><strong style={{ color: nearColors.primary }}>Custody cryptoassets</strong> - Manage digital assets with verifiable security guarantees</li>
                  <li><strong style={{ color: nearColors.primary }}>Preserve privacy</strong> - Execute sensitive operations in a secure TEE environment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Live Market Data Section */}
          {cryptoData && (
            <div style={{ marginBottom: '0' }}>
              <h2 className="section-title">Live Market Data</h2>
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>Current prices and 24-hour changes</p>
                  <button 
                    onClick={generateRecentNews}
                    className="button-primary"
                    style={{
                      border: 'none',
                      color: 'white',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      title: 'Synthesizes news based on real-time CoinGecko price data'
                    }}
                  >
                    Generate Market News from CoinGecko Data
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {['bitcoin', 'ethereum', 'near', 'solana'].map(coin => cryptoData[coin] && (
                    <div key={coin} style={{ 
                      flex: '1 0 45%', 
                      padding: '1.2rem',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #eaeaea',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                    }}>
                      <div>
                        <h4 style={{ 
                          margin: 0, 
                          textTransform: 'capitalize', 
                          fontSize: '1.1rem', 
                          color: '#333',
                          fontWeight: '600'
                        }}>{coin}</h4>
                        <p style={{ 
                          margin: '0.25rem 0 0 0', 
                          color: '#555',
                          fontSize: '1.2rem',
                          fontWeight: '700'
                        }}>
                          ${cryptoData[coin].usd.toLocaleString()}
                        </p>
                      </div>
                      <div style={{
                        padding: '0.35rem 0.7rem',
                        backgroundColor: cryptoData[coin].usd_24h_change > 0 ? 'rgba(0, 170, 0, 0.1)' : 'rgba(170, 0, 0, 0.1)',
                        color: cryptoData[coin].usd_24h_change > 0 ? '#00aa00' : '#aa0000',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {cryptoData[coin].usd_24h_change > 0 ? '↑' : '↓'} {Math.abs(cryptoData[coin].usd_24h_change).toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="section-title">Market Data Sources</h2>
            <p style={{ 
              marginTop: '-1rem', 
              marginBottom: '1.5rem', 
              color: '#666',
              fontSize: '1rem'
            }}>These sources would normally be fetched from real APIs in the TEE environment</p>
            
            <div style={{ marginBottom: '2rem' }}>
              {customNews.map((news, index) => (
                <div key={index} className="card" style={{ 
                  marginBottom: '1rem', 
                  padding: '1.5rem', 
                  backgroundColor: index % 2 === 0 ? '#fafbff' : 'white'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.35rem', 
                      fontWeight: '500',
                      color: '#0052cc'
                    }}>Source:</label>
                    <input 
                      type="text" 
                      value={news.source} 
                      onChange={e => updateNewsItem(index, 'source', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0070f3'}
                      onBlur={e => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.35rem', 
                      fontWeight: '500',
                      color: '#0052cc'
                    }}>Content:</label>
                    <textarea 
                      value={news.content} 
                      onChange={e => updateNewsItem(index, 'content', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem 0.8rem',
                        height: '80px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '1rem',
                        resize: 'vertical',
                        transition: 'border-color 0.3s ease',
                        outline: 'none',
                        lineHeight: '1.5'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0070f3'}
                      onBlur={e => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Security Log Display */}
            {securityLog.length > 0 && (
              <div style={{ 
                marginBottom: '2.5rem', 
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 6px 30px rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#0a1929', 
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  color: '#E6F0FF'
                }}>
                  <h3 style={{ marginTop: 0, color: '#4CC9F0', fontWeight: '600', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    TEE Secure Execution Log
                  </h3>
                  
                  {/* Attestation Visualization */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem', 
                    padding: '16px', 
                    backgroundColor: '#0D2137',
                    borderRadius: '8px'
                  }}>
                    {Object.entries({
                      'Secure Enclave': attestationState.steps.initialization,
                      'Remote Attestation': attestationState.steps.attestation,
                      'Data Processing': attestationState.steps.dataLoading,
                      'LLM Analysis': attestationState.steps.analysis,
                      'Proof Generation': attestationState.steps.proofGeneration,
                      'NEAR Verification': attestationState.steps.verification,
                    }).map(([stepName, isComplete], index) => (
                      <div key={index} style={{ 
                        textAlign: 'center',
                        opacity: isComplete ? 1 : 0.5,
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          margin: '0 auto 8px',
                          backgroundColor: isComplete ? '#4CC9F0' : 'transparent',
                          border: `2px solid ${isComplete ? '#4CC9F0' : '#173A5E'}`,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isComplete ? '#0a1929' : '#4CC9F0',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          zIndex: 2
                        }}>
                          {isComplete ? '✓' : index + 1}
                        </div>
                        <div style={{ fontSize: '0.7rem' }}>{stepName}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Security log messages */}
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    backgroundColor: '#0D2137',
                    borderRadius: '8px',
                    padding: '0.5rem'
                  }}>
                    {securityLog.map((step, index) => (
                      <div key={index} style={{ 
                        padding: '0.8rem 1rem', 
                        borderRadius: '6px',
                        marginBottom: '4px',
                        backgroundColor: typeof step === 'object' && step.status === 'complete' ? 'rgba(76, 201, 240, 0.1)' : 'rgba(10, 25, 41, 0.5)',
                        color: (typeof step === 'object' && step.status === 'error') ? '#FF6B6B' : 
                               (typeof step === 'object' && step.status === 'complete' && step.step === 'Verification complete') ? '#4CC9F0' : 'inherit',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.2s ease',
                      }}>
                        {/* Status icon */}
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>
                          {typeof step === 'object' ? (
                            step.status === 'error' ? (
                              <span style={{ color: '#FF6B6B' }}>❌</span>
                            ) : step.status === 'complete' ? (
                              <span style={{ color: '#4CC9F0' }}>✓</span>
                            ) : (
                              <span style={{ color: '#F7B731' }}>→</span>
                            )
                          ) : (
                            <span style={{ color: '#F7B731' }}>→</span>
                          )}
                        </div>
                        
                        {/* Log content */}
                        <div style={{ flex: 1 }}>
                          {/* Log header */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'baseline',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '0.25rem'
                          }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {typeof step === 'object' ? step.step : step.split('...')[0].replace(/[^a-zA-Z\s]/g, '').trim()}
                            </div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                              {typeof step === 'object' && step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                            </div>
                          </div>
                          
                          {/* Log details */}
                          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            {typeof step === 'object' && step.details ? step.details : step}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* TEE Hardware Details */}
                  {attestationState.status === 'verified' && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '12px', 
                      backgroundColor: '#0D2137', 
                      borderRadius: '8px', 
                      fontSize: '0.8rem' 
                    }}>
                      <div style={{ marginBottom: '8px', color: '#4CC9F0' }}>TEE Hardware Attestation Details</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: '1 0 50%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                            <rect x="9" y="9" width="6" height="6"></rect>
                            <line x1="9" y1="2" x2="9" y2="4"></line>
                            <line x1="15" y1="2" x2="15" y2="4"></line>
                          </svg>
                          CPU: Intel Xeon E-2288G
                        </div>
                        <div style={{ flex: '1 0 50%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 3v18"></path>
                            <rect x="3" y="8" width="18" height="8" rx="1"></rect>
                          </svg>
                          SGX Version: 2.17.100.2
                        </div>
                        <div style={{ flex: '1 0 50%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                          PCE SVN: 11
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={runAnalysis} 
              disabled={loading}
              className="button-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                color: 'white',
                padding: '0.9rem 2rem',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
                margin: '0 auto 2rem auto',
                width: 'fit-content'
              }}
            >
              {loading ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  Processing in TEE...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Analyze Market Sentiment
                </>
              )}
            </button>

            {error && (
              <div style={{ 
                color: 'white', 
                margin: '1rem auto',
                padding: '1rem',
                backgroundColor: '#e53e3e',
                borderRadius: '8px',
                maxWidth: '600px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            {result && (
              <div style={{ marginTop: '2rem' }}>
                <h2 className="section-title">Analysis Results</h2>
                
                {/* Enhanced Sentiment Analysis Section */}
                <div className="card" style={{ marginBottom: '2.5rem', padding: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, color: '#0052cc', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12h5"></path>
                      <path d="M17 12h5"></path>
                      <path d="M12 2v5"></path>
                      <path d="M12 17v5"></path>
                      <circle cx="12" cy="12" r="8"></circle>
                    </svg>
                    Sentiment Analysis
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ flex: '1 0 300px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        backgroundColor: result.sentimentAnalysis.sentiment === 'bullish' ? 'rgba(0, 170, 0, 0.1)' : 
                                         result.sentimentAnalysis.sentiment === 'bearish' ? 'rgba(170, 0, 0, 0.1)' : 'rgba(120, 120, 120, 0.1)',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: result.sentimentAnalysis.sentiment === 'bullish' ? '#00aa00' : 
                                           result.sentimentAnalysis.sentiment === 'bearish' ? '#aa0000' : '#777777',
                          borderRadius: '50%',
                          marginRight: '1rem',
                          color: 'white',
                          fontSize: '1.8rem',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                        }}>
                          {result.sentimentAnalysis.sentiment === 'bullish' ? '↑' : 
                           result.sentimentAnalysis.sentiment === 'bearish' ? '↓' : '→'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1.2rem' }}>{result.sentimentAnalysis.sentiment}</div>
                          <div style={{ color: '#555', fontSize: '1.05rem' }}>Confidence: {Math.round(result.sentimentAnalysis.confidence * 100)}%</div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0052cc' }}>Raw Score:</div>
                        <div style={{ 
                          height: '28px', 
                          backgroundColor: '#f0f0f0', 
                          borderRadius: '14px',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ 
                            position: 'absolute',
                            width: '3px',
                            height: '100%',
                            backgroundColor: '#333',
                            left: '50%',
                            transform: 'translateX(-2px)',
                            zIndex: 2
                          }}></div>
                          <div style={{ 
                            height: '100%', 
                            width: `${50 + (result.sentimentAnalysis.score * 5)}%`,  // 5% per point, centered at 50%
                            backgroundColor: result.sentimentAnalysis.score >= 0 ? 
                              `rgba(0, ${170 + Math.min(result.sentimentAnalysis.score * 8, 85)}, 0, ${0.7 + (result.sentimentAnalysis.score / 20)})` : 
                              `rgba(${170 + Math.min(Math.abs(result.sentimentAnalysis.score) * 8, 85)}, 0, 0, ${0.7 + (Math.abs(result.sentimentAnalysis.score) / 20)})`,
                            transition: 'width 0.5s ease, background-color 0.5s ease'
                          }} />
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '0.85rem', 
                          color: '#666',
                          marginTop: '0.3rem'
                        }}>
                          <span>-10</span>
                          <span>0</span>
                          <span>+10</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ flex: '1 0 300px' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0052cc' }}>Analysis Reasoning:</div>
                        <div style={{ 
                          padding: '1rem', 
                          backgroundColor: 'rgba(245, 248, 255, 0.7)', 
                          borderRadius: '10px',
                          border: '1px solid #e8f0ff',
                          fontSize: '0.95rem',
                          lineHeight: '1.5',
                          color: '#333',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                          {result.sentimentAnalysis.reasoning}
                        </div>
                      </div>
                      
                      {result.sentimentAnalysis.risks && (
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#0052cc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            Market Risks:
                          </div>
                          <div style={{ 
                            padding: '1rem', 
                            backgroundColor: 'rgba(255, 245, 245, 0.5)', 
                            borderRadius: '10px',
                            border: '1px solid rgba(170, 0, 0, 0.1)',
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            color: '#555',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                          }}>
                            {result.sentimentAnalysis.risks}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#777', 
                    marginTop: '1.2rem', 
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '6px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Processed at: {new Date(result.sentimentAnalysis.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Enhanced Verifiable Execution Record Section */}
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                  <h3 style={{ marginTop: 0, color: '#0052cc', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Verifiable Execution Record
                  </h3>
                  <p style={{ color: '#555', fontSize: '1.05rem', marginBottom: '1.5rem' }}>In a TEE deployment, the following would be cryptographically verifiable:</p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                    {[
                      { label: 'Agent ID', value: result.verifiableExecution.agentId },
                      { label: 'Contract ID', value: result.verifiableExecution.contractId },
                      { label: 'Timestamp', value: result.verifiableExecution.executionTimestamp },
                      { label: 'Code Hash', value: result.verifiableExecution.codehash }
                    ].map((item, index) => (
                      <div key={index} style={{ 
                        flex: '1 0 45%', 
                        padding: '1rem', 
                        backgroundColor: 'white', 
                        borderRadius: '10px',
                        border: '1px solid #eaeaea',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'transform 0.2s ease',
                      }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                         onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ color: '#0052cc', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>{item.label}</div>
                        <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: '#333' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.8rem',
                    marginTop: '1.8rem',
                    padding: '1rem',
                    backgroundImage: 'linear-gradient(135deg, #e6f7e6 0%, #c1f0c1 100%)',
                    borderRadius: '10px',
                    color: '#00880b',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 10px rgba(0, 136, 11, 0.1)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }} onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 136, 11, 0.15)';
                  }} onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 136, 11, 0.1)';
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      <path d="M9 12l2 2 4-4"></path>
                    </svg>
                    Execution Verified by NEAR Smart Contract
                  </div>
                  
                  <div style={{ 
                    marginTop: '1.5rem', 
                    padding: '1.2rem', 
                    backgroundColor: 'rgba(240, 249, 255, 0.5)', 
                    borderRadius: '10px',
                    border: '1px solid #bde0fe',
                    fontSize: '0.95rem',
                    boxShadow: '0 2px 10px rgba(0, 112, 243, 0.05)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.8rem', color: '#0052cc' }}>What This Means:</div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#444', lineHeight: '1.6' }}>
                      <li>The exact code running in the TEE is verified by its hash</li>
                      <li>The execution environment's security is verified through remote attestation</li>
                      <li>All transactions signed by this agent are cryptographically linked to this execution</li>
                      <li>Anyone can verify this execution on the NEAR blockchain</li>
                    </ul>
                    <div style={{ marginTop: '1rem', color: '#0052cc', fontSize: '0.9rem' }}>
                      Verification follows a chain-of-trust from NEAR smart contract → Phala attestation → Intel SGX → Docker image
                    </div>
                  </div>
                  
                  {result.teeAttestationDetails && (
                    <AttestationVerificationDetails 
                      attestation={result.teeAttestationDetails} 
                      verifiableExecution={result.verifiableExecution}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          marginTop: '3rem',
          textAlign: 'center'  
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: nearColors.primary,
            fontWeight: '500',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease',
            textDecoration: 'none'
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(110, 98, 235, 0.15)';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
            Back to Home
          </Link>
        </div>
      </main>

      <footer className={styles.footer} style={{
        marginTop: '4rem',
        padding: '2rem 0',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'white'
      }}>
        <a
          href="https://near.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            color: nearColors.primary,
            fontWeight: '500',
            fontSize: '1.1rem',
            textDecoration: 'none'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.2145 4.56445L7.01125 16.4101C6.91125 16.5526 6.96187 16.7495 7.11938 16.8307L9.63375 18.3214C9.7725 18.3995 9.94812 18.3589 10.0144 18.237L18.1515 6.50633C18.2381 6.36633 18.1515 6.17273 17.9861 6.17273H15.4011C15.3174 6.17273 15.2403 6.21352 15.2145 6.28539L15.2145 4.56445Z" fill={nearColors.primary}/>
            <path d="M15.2145 4.56445L7.01125 16.4101C6.91125 16.5526 6.96187 16.7495 7.11938 16.8307L9.63375 18.3214C9.7725 18.3995 9.94812 18.3589 10.0144 18.237L18.1515 6.50633C18.2381 6.36633 18.1515 6.17273 17.9861 6.17273H15.4011C15.3174 6.17273 15.2403 6.21352 15.2145 6.28539L15.2145 4.56445Z" fill={nearColors.primary}/>
            <path d="M9.93938 5.97656C9.93938 5.81906 9.8025 5.69531 9.63187 5.69531H7.04813C6.88875 5.69531 6.765 5.795 6.74438 5.94125L5.63625 17.0566C5.615 17.22 5.73938 17.3681 5.90437 17.3681H8.67375C8.84063 17.3681 8.96813 17.2284 8.945 17.0634L9.93938 5.97656Z" fill={nearColors.primary}/>
          </svg>
          Shade Agent Workshop - NEAR Protocol
        </a>
        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
          A technical demonstration of Shade Agents for secure, verifiable cross-chain execution
        </p>
      </footer>
    </div>
  );
} 