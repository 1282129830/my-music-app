import React, { useEffect, useRef, useState, useCallback } from 'react';

// 你的音乐文件 URL
const MUSIC_URL = 'https://qnaudio.hunliji.com/ChAKC113VYqAWi6cAB1ajzpYzyw.64.aac.mp3'; // <--- 请替换成你的音乐文件地址

function WeChatAutoPlayMusicWithControls() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('等待初始化...');
  const [canPlayThrough, setCanPlayThrough] = useState(false); // 音频是否已加载足够播放

  // --- 播放逻辑 ---
  const playMusic = useCallback(() => {
    if (audioRef.current) {
      console.log('尝试播放音乐...');
      setStatusMessage('尝试播放...');
      audioRef.current.play()
        .then(() => {
          console.log('音乐播放成功！');
          setIsPlaying(true);
          setStatusMessage('音乐正在播放');
        })
        .catch((error) => {
          console.error('音乐播放失败:', error);
          setIsPlaying(false); // 确保状态正确
          setStatusMessage(`播放失败: ${error.name} - ${error.message}. 可能需要用户交互。`);
          // 可以在这里提示用户手动点击播放按钮
        });
    } else {
        console.warn('Audio 元素引用无效');
        setStatusMessage('播放器未准备好');
    }
  }, []); // useCallback 避免不必要的函数重建

  // --- 暂停逻辑 ---
  const pauseMusic = useCallback(() => {
    if (audioRef.current && isPlaying) {
      console.log('尝试暂停音乐...');
      audioRef.current.pause();
      setIsPlaying(false);
      setStatusMessage('音乐已暂停');
    }
  }, [isPlaying]); // 依赖 isPlaying

  // --- 切换播放/暂停 ---
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic(); // 手动触发播放
    }
  }, [isPlaying, playMusic, pauseMusic]);

  useEffect(() => {
    const audioElement = audioRef.current; // 在 effect 内部获取引用

    // --- WeixinJSBridgeReady 监听逻辑 ---
    const handleBridgeReady = () => {
        console.log('WeixinJSBridgeReady 事件触发！');
        setStatusMessage('WeixinJSBridge 已就绪，尝试自动播放...');
        // 确保音频已加载或至少可以开始播放
        if (audioElement && (audioElement.readyState >= 2 || canPlayThrough)) { // readyState 2 (HAVE_CURRENT_DATA) 或更高
             playMusic();
        } else {
            console.log('音频尚未加载足够数据，等待 canplaythrough 事件');
            setStatusMessage('音频加载中，稍后自动播放...');
            // 如果 BridgeReady 时音频还没好，依赖 canplaythrough 事件来触发
        }
    };

    // --- 音频事件监听 ---
    const handleCanPlayThrough = () => {
        console.log('音频事件: canplaythrough');
        setCanPlayThrough(true);
        setStatusMessage('音频已加载，准备就绪');
        // 如果 WeixinJSBridge 已经 ready，但之前因为音频没加载好而没播放，现在尝试播放
        // (注意：这可能与 handleBridgeReady 竞争，但 playMusic 内部有防止重复播放的逻辑)
        if (typeof WeixinJSBridge !== 'undefined' && !isPlaying) {
             console.log('音频加载完成，且 Bridge 已就绪，尝试播放');
             playMusic();
        }
    };

    const handleAudioPlay = () => {
        console.log('音频事件: play');
        setIsPlaying(true);
        // setStatusMessage('音乐正在播放'); // playMusic 中已设置
    };

    const handleAudioPause = () => {
        console.log('音频事件: pause');
        setIsPlaying(false);
        // setStatusMessage('音乐已暂停'); // pauseMusic 中已设置
    };

    const handleAudioEnded = () => {
        console.log('音频事件: ended');
        setIsPlaying(false);
        setStatusMessage('播放结束');
        // 可选：自动重播
        // audioRef.current.currentTime = 0;
        // playMusic();
    };

    const handleAudioError = (e) => {
        console.error('音频错误:', e);
        setIsPlaying(false);
        setStatusMessage(`音频错误: ${e.target.error?.message || '未知错误'}`);
    };

    // 添加音频事件监听器
    if (audioElement) {
        audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
        audioElement.addEventListener('play', handleAudioPlay);
        audioElement.addEventListener('pause', handleAudioPause);
        audioElement.addEventListener('ended', handleAudioEnded);
        audioElement.addEventListener('error', handleAudioError);
        console.log('已添加音频事件监听器');
    }

    // --- 环境检测与 Bridge 监听 ---
    const isWeChat = /micromessenger/i.test(navigator.userAgent);
    let bridgeReadyListenerAttached = false;

    if (isWeChat) {
        console.log('检测到微信环境。');
        setStatusMessage('在微信环境中，等待 Bridge Ready...');

        if (typeof WeixinJSBridge === 'undefined') {
            console.log('WeixinJSBridge 未定义，添加监听器。');
            document.addEventListener('WeixinJSBridgeReady', handleBridgeReady, false);
            bridgeReadyListenerAttached = true;
        } else {
            console.log('WeixinJSBridge 已定义，直接调用。');
            handleBridgeReady(); // 直接尝试处理
        }
    } else {
        console.log('非微信环境，自动播放通常受限。');
        setStatusMessage('非微信环境，请手动播放。');
        // 非微信环境，依赖 canplaythrough 后用户手动点击
        // 如果你想尝试非微信环境自动播放（大概率失败）：
        // if (audioElement) {
        //     audioElement.addEventListener('canplaythrough', playMusic, { once: true });
        // }
    }

    // --- 清理函数 ---
    return () => {
      console.log('组件卸载，执行清理...');
      // 移除 Bridge 监听器
      if (bridgeReadyListenerAttached) {
          document.removeEventListener('WeixinJSBridgeReady', handleBridgeReady, false);
          console.log('已移除 WeixinJSBridgeReady 监听器。');
      }
      // 移除音频事件监听器
      if (audioElement) {
          audioElement.removeEventListener('canplaythrough', handleCanPlayThrough);
          audioElement.removeEventListener('play', handleAudioPlay);
          audioElement.removeEventListener('pause', handleAudioPause);
          audioElement.removeEventListener('ended', handleAudioEnded);
          audioElement.removeEventListener('error', handleAudioError);
          console.log('已移除音频事件监听器。');
          // 停止播放并释放资源（可选，取决于需求）
          // audioElement.pause();
          // audioElement.src = ''; // 有助于浏览器回收资源
      }
    };
    // 依赖项：确保 effect 在 playMusic/pauseMusic 更新时重新运行（如果它们改变了）
    // 注意：useCallback 使得 playMusic/pauseMusic 引用稳定，除非它们的依赖项改变
  }, [playMusic, pauseMusic, isPlaying, canPlayThrough]); // 添加 isPlaying 和 canPlayThrough 作为依赖项可能需要，取决于具体逻辑交互


  return (
    <div>
      <h2>微信内自动播放音乐 Demo</h2>
      <audio
        ref={audioRef}
        src={MUSIC_URL}
        preload="auto" // 预加载音频
        // controls // 可以添加浏览器原生控件用于调试，最终可隐藏
        style={{ display: 'none' }} // 通常背景音乐播放器是隐藏的
      >
        你的浏览器不支持 Audio 标签。
      </audio>

      <p>状态: {statusMessage}</p>

      <button onClick={togglePlay} disabled={!canPlayThrough}>
        {isPlaying ? '暂停' : '播放'}
      </button>
      {/* 可以添加更多控件，如音量、进度条等 */}
    </div>
  );
}

export default WeChatAutoPlayMusicWithControls;