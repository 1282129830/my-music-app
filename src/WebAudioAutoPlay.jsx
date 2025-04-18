import React, { useState, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

// 你的音乐文件 URL
const MUSIC_URL = 'https://qnaudio.hunliji.com/ChAKC113VYqAWi6cAB1ajzpYzyw.64.aac.mp3';

function WebAudioAutoPlay() {
  const [soundInstance, setSoundInstance] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('等待初始化...');

  // 播放音乐
  const playMusic = useCallback(() => {
    if (soundInstance && !isPlaying) {
      console.log('尝试通过 Web Audio 播放音乐...');
      setStatusMessage('尝试播放...');
      soundInstance.play();
      setIsPlaying(true);
      setStatusMessage('音乐正在播放');
    }
  }, [soundInstance, isPlaying]);

  // 暂停音乐
  const pauseMusic = useCallback(() => {
    if (soundInstance && isPlaying) {
      console.log('暂停音乐...');
      soundInstance.pause();
      setIsPlaying(false);
      setStatusMessage('音乐已暂停');
    }
  }, [soundInstance, isPlaying]);

  // 切换播放/暂停
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  }, [isPlaying, playMusic, pauseMusic]);

  // 自动播放的核心函数 - 通过微信桥接
  const autoPlayByWechat = useCallback((sound) => {
    const playByBridge = () => {
      console.log('通过WeixinJSBridge尝试播放');
      sound.play();
      setIsPlaying(true);
      setStatusMessage('音乐正在播放(WeixinJSBridge)');
    };
    
    if (window.WeixinJSBridge) {
      window.WeixinJSBridge.invoke('getNetworkType', {}, playByBridge);
    } else {
      document.addEventListener('WeixinJSBridgeReady', () => {
        window.WeixinJSBridge.invoke('getNetworkType', {}, playByBridge);
      }, false);
      
      // 使用用户交互来触发自动播放（作为备份方案）
      const handleUserInteraction = () => {
        sound.play();
        setIsPlaying(true);
        setStatusMessage('音乐正在播放(用户交互)');
        // 播放后移除事件监听
        ['touchstart', 'touchend', 'click'].forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      };

      // 监听用户交互事件
      ['touchstart', 'touchend', 'click'].forEach(event => {
        document.addEventListener(event, handleUserInteraction, { once: true });
      });
    }
  }, []);

  // 初始化Howl和触发自动播放
  useEffect(() => {
    console.log('初始化Web Audio...');
    setStatusMessage('初始化Web Audio中...');

    // 强制触发播放的辅助函数
    const forceAutoPlay = () => {
      if (document.hidden === false) {
        // 页面可见时尝试播放
        const emptySound = new Howl({
          src: ['data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjMyLjEwNAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAABAAADQgD///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAkDRdJCQAAAAAAAAAAAAAAAD/+xDEAAAKAGkNAAAIxIXnP2IAMpMVJqm7GUIAMYQhCEIAAMZcDmmf/wgh//JCEIQv/8IMQhdC/wgyF0IQhC53/0IQhdC6x1zv///6FFFFFAAAgQIECBAgQQAAAAgQIECBAggAKgoKCgoKCggAAAAoKCgoKCggAECBAgQIECAAAAAQIECBAgQIAAAWBYFgWBYFgAAAAWBYFgWBYFgAOOOOOOOOOMAAAAAY444444444AKqqqqqqqqqqgAAAAqqqqqqqqqoAAgQIECBAgQAAAAIECBAgQIEAAHHHHHHHHGMAAAABxxxxxxxxxxxgAwwwwwwwwwgAAAABhhhhhhhhgAwwwwwwwwwgAAAABhhhhhhhhgAgQIECBAgQAAAAIECBAgQIEAAOOOOOOOOOMAAAAAY444444444AGmGGGGGGGGAAAAAMMMMMMMMMIA44YYYYYYYYAAAAAxxxxxxxxxxxgAgQIECBAgQAAAAIECBAgQIEAAEBAQEBAQEBAAAAAQEBAQEBAQEA'],
          format: 'mp3',
          html5: true,
          volume: 0.01,
          // 播放一个空白音频激活音频上下文
          onplay: function() {
            this.volume(0); // 降低音量到0
            setTimeout(() => {
              this.unload(); // 播放后立即卸载
            }, 100);
          }
        }).play();
      }
    };

    // 尝试多种方法触发自动播放
    forceAutoPlay();
    
    // 创建实际的音乐Howl实例
    const sound = new Howl({
      src: [MUSIC_URL],
      autoplay: false, // 不要使用自动播放属性，我们会手动控制
      loop: true,
      preload: true,
      html5: true, // 使用HTML5 Audio作为回退
      volume: 1.0,
      onload: () => {
        console.log('音频加载完成');
        setStatusMessage('音频已加载，准备就绪');
        setSoundInstance(sound);
        
        // 检查是否在微信环境中
        const isWeChat = /micromessenger/i.test(navigator.userAgent);
        
        if (isWeChat) {
          console.log('检测到微信环境，尝试通过微信接口自动播放');
          setStatusMessage('检测到微信环境，尝试自动播放...');
          autoPlayByWechat(sound);
          
          // 尝试额外的触发方法
          setTimeout(() => {
            if (!isPlaying) {
              console.log('尝试延迟触发播放...');
              sound.play();
            }
          }, 1000);
        } else {
          console.log('非微信环境，需要用户交互触发播放');
          setStatusMessage('非微信环境，请点击播放按钮');
        }
      },
      onplay: () => {
        console.log('开始播放');
        setIsPlaying(true);
        setStatusMessage('音乐正在播放');
      },
      onpause: () => {
        console.log('音乐暂停');
        setIsPlaying(false);
        setStatusMessage('音乐已暂停');
      },
      onend: () => {
        console.log('音乐播放完毕');
        setIsPlaying(false);
        setStatusMessage('播放结束');
      },
      onloaderror: (id, err) => {
        console.error('加载音频失败:', err);
        setStatusMessage(`加载音频失败: ${err}`);
      },
      onplayerror: (id, err) => {
        console.error('播放音频失败:', err);
        setStatusMessage(`播放音频失败: ${err}`);
        
        // 尝试恢复播放
        sound.once('unlock', function() {
          sound.play();
        });
      }
    });

    // 页面可见性变化时处理
    const handleVisibilityChange = () => {
      if (document.hidden === false && soundInstance && !isPlaying) {
        // 页面变为可见时，如果音乐不在播放，尝试播放
        console.log('页面变为可见，尝试恢复播放');
        setTimeout(() => soundInstance.play(), 200);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 组件卸载时的清理
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (sound) {
        console.log('组件卸载，清理音频资源');
        sound.unload(); // 释放资源
      }
    };
  }, [autoPlayByWechat, isPlaying]);

  return (
    <div>
      <h2>Web Audio 自动播放实现 (兼容Android和iOS)</h2>
      <p>状态: {statusMessage}</p>
      <button onClick={togglePlay} disabled={!soundInstance}>
        {isPlaying ? '暂停' : '播放'}
      </button>
    </div>
  );
}

export default WebAudioAutoPlay;
