import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import WeChatAutoPlayMusicWithControls from './WeChatAutoPlayMusicWithControls'; 
import WebAudioAutoPlay from './WebAudioAutoPlay'; // 导入新组件

function App() {
  const [count, setCount] = useState(0)
  // 默认使用WebAudio方案
  const [implementation, setImplementation] = useState('webAudio');

  return (
    <>
      <div className="App">
        <header className="App-header">
          <h1>我的音乐播放应用</h1>
        </header>
        <main>
          <div className="implementation-selector">
            <button 
              onClick={() => setImplementation('webAudio')} 
              className={implementation === 'webAudio' ? 'active' : ''}
            >
              Web Audio 实现 (推荐)
            </button>
            <button 
              onClick={() => setImplementation('audioElement')} 
              className={implementation === 'audioElement' ? 'active' : ''}
            >
              Audio元素实现
            </button>
          </div>
          
          {/* 优先使用WebAudio实现 */}
          {implementation === 'webAudio' ? (
            <WebAudioAutoPlay />
          ) : (
            <WeChatAutoPlayMusicWithControls />
          )}
          
          <div className="notes">
            <p>
              <strong>兼容性说明:</strong>
            </p>
            <ul>
              <li>Web Audio实现: Android和iOS微信均可自动播放</li>
              <li>Audio元素实现: iOS微信可自动播放，Android微信需要手动点击</li>
            </ul>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
