import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [mpdData, setMpdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugLog, setDebugLog] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [activeTab, setActiveTab] = useState("stream");
  const playerRef = useRef(null);
  const refreshInterval = 300000; // 5 min

  const log = (msg, type = "info") => {
    setDebugLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const fetchMPD = async () => {
    log("Fetching MPD data...", "info");
    try {
      const res = await fetch("/api/mpd-url");
      const data = await res.json();
      setMpdData(data);
      log("MPD data fetched", "success");
    } catch (err) {
      log("Failed to fetch MPD: " + err.message, "error");
    }
  };

  const initPlayer = async () => {
    if (!window.shaka) { log("Shaka Player not loaded", "error"); return; }
    const video = document.getElementById("videoPlayer");
    const player = new shaka.Player(video);
    playerRef.current = player;

    if (mpdData?.drmKey) {
      const [keyId, keyValue] = mpdData.drmKey.split(":");
      player.configure({ drm: { clearKeys: { [keyId.trim()]: keyValue.trim() } } });
      log("ClearKey DRM configured", "success");
    }

    try {
      await player.load(mpdData?.mpdUrl);
      log("Stream loaded", "success");
      video.play().catch(()=>log("Autoplay prevented","warning"));
    } catch(err) { log("Player load failed: "+err.message,"error"); }
  };

  const refreshStream = async () => { log("Refreshing stream...", "info"); await fetchMPD(); setTimeout(initPlayer, 500); };

  useEffect(() => {
    fetchMPD();
    const interval = setInterval(fetchMPD, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if(mpdData){ initPlayer(); setLoading(false); } }, [mpdData]);

  const toggleDebug = () => setDebugMode(!debugMode);
  const playVideo = () => document.getElementById("videoPlayer")?.play().catch(()=>log("Play failed","warning"));
  const pauseVideo = () => document.getElementById("videoPlayer")?.pause();
  const resetPlayer = () => { playerRef.current?.destroy(); fetchMPD(); };
  const toggleFullscreen = () => {
    const video = document.getElementById("videoPlayer");
    if(!document.fullscreenElement) video.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  // Styles
  const btnStyle = { flex:1, padding:12, borderRadius:12, border:"none", color:"#fff", background:"linear-gradient(90deg,#0af,#06f)", fontWeight:"bold" };
  const tabStyle = (active) => ({ flex:1, padding:10, borderRadius:10, textAlign:"center", background: active?"#0af":"#333", color:"#fff", fontWeight:"bold" });

  return (
    <div style={{ background:"#000", color:"#fff", minHeight:"100vh", padding:12, fontFamily:"sans-serif" }}>
      <h2 style={{textAlign:"center", marginBottom:12}}>AzamSport1 Live</h2>

      {/* Status Dots */}
      <div style={{ display:"flex", justifyContent:"space-around", marginBottom:12 }}>
        {["API","Player","DRM","Stream","Refresh"].map((s)=>
          <div key={s} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:(s==="API"?!!mpdData:true)?"lime":"red",marginBottom:4}}></div>
            <small>{s}</small>
          </div>
        )}
      </div>

      {/* Video */}
      {loading && <p style={{textAlign:"center"}}>Loading player...</p>}
      <video id="videoPlayer" width="100%" controls crossOrigin="anonymous" style={{ borderRadius:12, marginBottom:12 }}></video>

      {/* Buttons */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <button style={btnStyle} onClick={playVideo}>Play</button>
        <button style={btnStyle} onClick={pauseVideo}>Pause</button>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <button style={btnStyle} onClick={refreshStream}>Refresh</button>
        <button style={btnStyle} onClick={resetPlayer}>Reset</button>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <button style={btnStyle} onClick={toggleFullscreen}>Fullscreen</button>
        <button style={btnStyle} onClick={toggleDebug}>{debugMode?"Hide Debug":"Show Debug"}</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
        <div style={tabStyle(activeTab==="stream")} onClick={()=>setActiveTab("stream")}>Stream Info</div>
        <div style={tabStyle(activeTab==="refresh")} onClick={()=>setActiveTab("refresh")}>Refresh</div>
        <div style={tabStyle(activeTab==="technical")} onClick={()=>setActiveTab("technical")}>Technical</div>
      </div>

      {/* Tab Contents */}
      <div style={{ background:"#111", borderRadius:12, padding:12, minHeight:100 }}>
        {activeTab==="stream" && <pre>{JSON.stringify(mpdData,null,2)}</pre>}
        {activeTab==="refresh" && <p>Next Refresh: {new Date(Date.now()+refreshInterval).toLocaleTimeString()}</p>}
        {activeTab==="technical" && (
          <pre>
Channel ID: CH-3974c2cd-9ec4-4d03-82b1-9c993973e487
Slug: AzamSport1
Player Engine: Shaka Player 4.3.7
          </pre>
        )}
      </div>

      {/* Debug */}
      {debugMode && (
        <div style={{ background:"#111", padding:8, borderRadius:12, maxHeight:180, overflowY:"auto", marginTop:8 }}>
          {debugLog.map((l,i)=>(
            <div key={i} style={{ color: l.type==="error"?"red":l.type==="success"?"lime":"#ccc", fontSize:12 }}>
              [{l.time}] {l.msg}
            </div>
          ))}
        </div>
      )}

      <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.7/shaka-player.ui.js"></script>
    </div>
  );
}
