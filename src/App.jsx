import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import WeChatAutoPlayMusicWithControls from './WeChatAutoPlayMusicWithControls'; 

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
          <div className="App">
      {/* 你可以添加其他内容 */}
      <header className="App-header">
        <h1>我的音乐播放应用</h1>
      </header>
      <main>
        <WeChatAutoPlayMusicWithControls />
      </main>
    </div>
    </>
  )
}

export default App
