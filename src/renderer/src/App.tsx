import { useEffect, useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

const IDLE_THRESHOLD = 10

function App(): React.JSX.Element {
  const [idleTime, setIdleTime] = useState<number>(0)
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  useEffect(() => {
    window.api.onIdleTime((time) => setIdleTime(time))
    return () => window.api.removeIdleTimeListener()
  }, [])

  const isIdle = idleTime >= IDLE_THRESHOLD

  return (
    <>


      {/* Idle Time Card */}
      <div
        style={{
          margin: '20px auto',
          padding: '20px 32px',
          borderRadius: '16px',
          background: isIdle
            ? 'linear-gradient(135deg, #2d1b69 0%, #11998e 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: `2px solid ${isIdle ? '#11998e' : '#0f3460'}`,
          boxShadow: isIdle
            ? '0 0 24px rgba(17,153,142,0.4)'
            : '0 0 16px rgba(15,52,96,0.4)',
          maxWidth: '320px',
          transition: 'all 0.5s ease',
          textAlign: 'center' as const
        }}
      >
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            color: isIdle ? '#a0e9df' : '#7a8ba0',
            marginBottom: '8px',
            fontWeight: 600
          }}
        >
          System Idle Time
        </div>

        <div
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: isIdle ? '#11998e' : '#e0e8f0',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            transition: 'color 0.4s ease'
          }}
        >
          {idleTime}
          <span style={{ fontSize: '20px', marginLeft: '6px', opacity: 0.7 }}>s</span>
        </div>

        <div
          style={{
            marginTop: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: isIdle ? 'rgba(17,153,142,0.2)' : 'rgba(99,200,120,0.15)',
            fontSize: '13px',
            fontWeight: 600,
            color: isIdle ? '#11998e' : '#63c878',
            transition: 'all 0.4s ease'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isIdle ? '#11998e' : '#63c878',
              display: 'inline-block',
              boxShadow: isIdle ? '0 0 6px #11998e' : '0 0 6px #63c878',
              animation: 'pulse 1.5s infinite'
            }}
          />
          {isIdle ? 'User is Idle' : 'User is Active'}
        </div>
      </div>


    </>
  )
}

export default App

