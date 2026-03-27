import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// CONSTANTS & DATA
// ─────────────────────────────────────────────
const TOPPINGS = [
  { id: 0, emoji: "🧀", name: "Extra Cheese", points: 2 },
  { id: 1, emoji: "🍅", name: "Fresh Sauce",  points: 1 },
  { id: 2, emoji: "🥓", name: "Pepperoni",    points: 3 },
  { id: 3, emoji: "🫑", name: "Peppers",      points: 2 },
  { id: 4, emoji: "🧅", name: "Onion",        points: 1 },
  { id: 5, emoji: "🍄", name: "Mushroom",     points: 2 },
  { id: 6, emoji: "🫒", name: "Olives",       points: 2 },
  { id: 7, emoji: "🥩", name: "Sausage",      points: 3 },
  { id: 8, emoji: "🌶️", name: "Hot Peppers",  points: 4 },
  { id: 9, emoji: "🫐", name: "???",          points: 5 },
];

const REVIEWS = [
  { name: "Dave, Table 4",            text: "I don't know what she puts in this. I don't WANT to know. I just need it in my life every week." },
  { name: "Linda (drove 90 mins)",    text: "I set three alarms. I left work early. I have no regrets and I never will." },
  { name: "Mike, Retired Food Critic",text: "I retired from food criticism after my first bite. There is nothing left to evaluate in this world." },
  { name: "The Mayor",                text: "I offered her a key to the city. She said she had enough keys. Then she unplugged the phone." },
  { name: "Table 7 (Whole Family)",   text: "Our kids now call other pizza 'practice food.' We think this is correct." },
  { name: "Gail from Next Town Over", text: "I cried three separate times. In the parking lot. On the way home. At dinner." },
  { name: "Anonymous",                text: "I've had pizza on four continents. This is not comparable to any of them. It isn't pizza. It's something else." },
  { name: "Chick's Nephew",           text: "She still won't tell us the recipe. We've asked. She just laughs. Then makes more. We've given up." },
];

const SAUCE_QUOTES = [
  "I dipped once and time literally paused. Four minutes staring at the wall.",
  "Wing sauce with NO WINGS. Criminal. Perfect. I'll never recover.",
  "She puts something unknowable in there. Ancient. Correct. Devastating.",
  "Best wing sauce in the county paired with the best pizza in existence. Statistically impossible. Yet here we are.",
  "I asked for extra. She gave me a look. That IS the extra.",
];

const CHICK_QUOTES = {
  title:    ["\"My dough is ready. Are you?\"", "\"You want pizza? Earn it.\"", "\"29 years old and I still make everyone else look like amateurs.\""],
  pound:    ["\"HARDER! That dough is a criminal and you caught it!\"", "\"She's ALREADY better than you and she's only 29.\"", "\"That yeast worked all day rising. Give it what it DESERVES.\"", "\"Run it down! She chases it like it owes her money!\""],
  toppings: ["\"Scatter pitch. No aim. ALL CHICK.\"", "\"She once threw pepperoni at the wall. Landed perfect. Intentional.\"", "\"More! She has zero restraint and that's the secret.\""],
  launch:   ["\"40 feet. Far wall. Chamber 3. She never misses. EVER.\"", "\"Line it up. Grip it. JAVELIN.\"", "\"She's been launching since she was probably like 10. Natural talent.\""],
  bake:     ["\"No talking during the sacred bake time.\"", "\"The oven knows what to do. Chick trained it.\"", "\"15 minutes. She goes and sits in her chair. Silence.\""],
  wingcheck:["\"Wing sauce. NOT WINGS. Eyes forward.\"", "\"She makes this herself. Nobody knows. Not family. Not the feds.\"", "\"Best sauce in town. Pizza only. That's the law here.\""],
  serve:    ["\"WALLAH! There it is!\"", "\"Every pizza she makes is the best pizza. Obviously.\"", "\"She's already thinking about the next one. She never stops.\""],
};

const ACHIEVEMENTS = [
  { id: "first_pizza",    icon: "🍕", label: "First Slice",       desc: "Serve your first pizza",            condition: (s) => s.pizzasServed >= 1 },
  { id: "pound_master",   icon: "👊", label: "Pound Master",      desc: "Land 50 total dough pounds",         condition: (s) => s.totalPounds >= 50 },
  { id: "topping_hoarder",icon: "🧀", label: "Topping Hoarder",   desc: "Use all 10 toppings at once",        condition: (s) => s.maxToppings >= 10 },
  { id: "hot_shot",       icon: "🌶️", label: "Hot Shot",          desc: "Pick Hot Peppers 3 times",           condition: (s) => s.hotPepperCount >= 3 },
  { id: "tip_queen",      icon: "💰", label: "Tip Queen",         desc: "Earn $100 total in tips",            condition: (s) => s.totalTips >= 100 },
  { id: "sauce_believer", icon: "🔥", label: "Sauce Believer",    desc: "Grab wing sauce 5 times",            condition: (s) => s.sauceGrabs >= 5 },
  { id: "speed_demon",    icon: "⚡", label: "Speed Demon",       desc: "Pound dough in under 6 seconds",     condition: (s) => s.fastestPound <= 6 },
  { id: "three_peat",     icon: "🎯", label: "Three-Peat",        desc: "Serve 3 pizzas in one session",      condition: (s) => s.sessionPizzas >= 3 },
  { id: "legend",         icon: "👑", label: "Chick Approved",    desc: "Earn $200 total tips",               condition: (s) => s.totalTips >= 200 },
  { id: "mystery",        icon: "🫐", label: "What IS That?",     desc: "Use the mystery topping",            condition: (s) => s.usedMystery },
];

const POUND_TARGET = 15;
const TOPPING_MIN  = 3;
const PIZZAS_PER_SESSION = 5;
const BAKE_SECONDS = 12;

// ─────────────────────────────────────────────
// PARTICLE SYSTEM
// ─────────────────────────────────────────────
function Particle({ emoji, x, y, id, onDone }) {
  const angle = (Math.random() * 360);
  const dist  = 60 + Math.random() * 80;
  const tx    = Math.cos((angle * Math.PI) / 180) * dist;
  const ty    = Math.sin((angle * Math.PI) / 180) * dist - 60;

  return (
    <div
      key={id}
      style={{
        position: "fixed",
        left: x,
        top: y,
        fontSize: 22 + Math.random() * 14 + "px",
        pointerEvents: "none",
        zIndex: 9999,
        animation: "particleFly 1.2s ease-out forwards",
        "--tx": tx + "px",
        "--ty": ty + "px",
      }}
      onAnimationEnd={onDone}
    >
      {emoji}
    </div>
  );
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",
      background:"linear-gradient(135deg,#c0392b,#7b1a12)",
      border:"3px solid #f1c40f",borderRadius:50,
      padding:"10px 28px",color:"#fdf6e3",
      fontFamily:"'Fredoka One',cursive",fontSize:18,
      zIndex:10000,whiteSpace:"nowrap",
      boxShadow:"0 6px 30px rgba(0,0,0,0.6)",
      animation:"toastIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
    }}>{msg}</div>
  );
}

// ─────────────────────────────────────────────
// ACHIEVEMENT POPUP
// ─────────────────────────────────────────────
function AchievementPopup({ ach, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position:"fixed",bottom:30,right:20,
      background:"linear-gradient(135deg,#1a0d05,#2a1808)",
      border:"3px solid #f1c40f",borderRadius:16,
      padding:"14px 20px",maxWidth:260,
      zIndex:10001,
      animation:"slideInRight 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
      boxShadow:"0 8px 30px rgba(0,0,0,0.7)",
    }}>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:13,color:"#e67e22",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>🏆 Achievement Unlocked!</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:36}}>{ach.icon}</span>
        <div>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:"#f1c40f"}}>{ach.label}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:12,color:"#fdf6e3"}}>{ach.desc}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────
function Confetti() {
  const items = Array.from({length:30},(_,i)=>i);
  const emojis = ["🍕","⭐","🎉","🔥","💛","✨","💫","🏆"];
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9998}}>
      {items.map(i => (
        <div key={i} style={{
          position:"absolute",
          left: Math.random()*100+"vw",
          top: -40,
          fontSize: 16+Math.random()*20+"px",
          animation:`confettiFall ${2+Math.random()*2}s ${Math.random()*0.8}s linear forwards`,
        }}>{emojis[Math.floor(Math.random()*emojis.length)]}</div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────

// TITLE SCREEN
function TitleScreen({ onPlay, stats }) {
  const [quote, setQuote] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setQuote(q => (q+1) % CHICK_QUOTES.title.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(ellipse at 30% 40%, #7b1a12 0%, #1a0a05 60%, #000 100%)",
      padding:"20px",textAlign:"center",position:"relative",overflow:"hidden",
    }}>
      {/* Fire bg */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:200,background:"linear-gradient(to top,#c0392b66,#e67e2233,transparent)",animation:"flicker 2s ease-in-out infinite alternate",pointerEvents:"none"}}/>
      
      {/* Logo */}
      <div style={{position:"relative",zIndex:2,animation:"fadeInDown 0.8s ease forwards"}}>
        <div style={{fontFamily:"'Permanent Marker',cursive",fontSize:"clamp(64px,14vw,130px)",color:"#f1c40f",textShadow:"0 0 10px #f1c40f,0 0 30px #e67e22,0 0 60px #c0392b,4px 4px 0 #7b1a12",lineHeight:0.85,animation:"neonPulse 3s ease-in-out infinite"}}>CHICK'S</div>
        <div style={{fontSize:"clamp(50px,10vw,90px)",animation:"spin 8s linear infinite",display:"inline-block",filter:"drop-shadow(0 0 20px #f1c40f88)"}}>🍕</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(18px,4vw,34px)",color:"#fdf6e3",textShadow:"2px 2px 4px #000",marginBottom:6}}>The Best Pizza Game Ever</div>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"clamp(13px,2.5vw,20px)",color:"#e67e22",maxWidth:580,lineHeight:1.5,margin:"0 auto 10px"}}>
          A <strong style={{color:"#f1c40f"}}>29-year-old young lady</strong> singlehandedly serves the most devastatingly delicious pizza ever created by human hands.
          Nobody knows how. Everyone is trying to find out.
        </div>
      </div>

      {/* Quote bubble */}
      <div style={{background:"linear-gradient(135deg,#2a1005,#1a0805)",border:"2px solid #e67e22",borderRadius:14,padding:"12px 20px",maxWidth:500,margin:"10px auto",position:"relative",zIndex:2,minHeight:54,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:36,flexShrink:0,animation:"chickBounce 2s ease-in-out infinite"}}>👩</span>
        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(12px,2vw,15px)",color:"#fdf6e3",fontStyle:"italic",fontWeight:700,transition:"all 0.3s"}}>{CHICK_QUOTES.title[quote]}</div>
      </div>

      {/* Warning box */}
      <div style={{background:"linear-gradient(135deg,#2a1005,#1a0805)",border:"3px solid #f1c40f",borderRadius:14,padding:"14px 22px",maxWidth:560,margin:"10px auto",position:"relative",zIndex:2}}>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(14px,2.5vw,20px)",color:"#f1c40f",marginBottom:8}}>⚠️ OFFICIAL CHICK'S HOURS ⚠️</div>
        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(11px,1.8vw,14px)",color:"#fdf6e3",lineHeight:1.7,fontWeight:700}}>
          🗓️ Open <strong>3 days a week</strong> &nbsp;•&nbsp; 🕓 <strong>4–7 PM ONLY</strong> &nbsp;•&nbsp; 📅 <strong>3 months per year</strong><br/>
          📞 Dough gone = phone unplugged. Don't even try it.<br/>
          🔥 Wing sauce with pizza <strong>ONLY</strong>. No wings. Eyes forward. Don't ask.<br/>
          She pounds that dough like it's a bad guy she caught and ran down for sport.
          She javelin-launches the pizza into a massive 4-chamber black oven. <strong style={{color:"#f1c40f"}}>WALLAH.</strong>
        </div>
      </div>

      {/* Lifetime stats */}
      {stats.totalTips > 0 && (
        <div style={{display:"flex",gap:20,margin:"8px 0",position:"relative",zIndex:2}}>
          {[["💰","$"+stats.totalTips,"Lifetime Tips"],["🍕",stats.totalPizzas,"Total Served"],["🏆",stats.unlocked,"Achievements"]].map(([icon,val,lbl])=>(
            <div key={lbl} style={{textAlign:"center"}}>
              <div style={{fontSize:22}}>{icon}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#f1c40f"}}>{val}</div>
              <div style={{fontFamily:"'Boogaloo',cursive",fontSize:11,color:"#e67e22",textTransform:"uppercase",letterSpacing:1}}>{lbl}</div>
            </div>
          ))}
        </div>
      )}

      <button onClick={onPlay} style={{
        fontFamily:"'Fredoka One',cursive",fontSize:"clamp(22px,4vw,34px)",
        background:"linear-gradient(135deg,#c0392b,#7b1a12)",color:"#fdf6e3",
        border:"4px solid #f1c40f",padding:"16px 52px",borderRadius:60,cursor:"pointer",
        position:"relative",zIndex:2,
        boxShadow:"0 8px 0 #4a0f0a,0 12px 30px rgba(0,0,0,0.5)",
        transition:"all 0.1s",textShadow:"2px 2px 4px rgba(0,0,0,0.5)",
        animation:"btnPulse 2s ease-in-out infinite",
        marginTop:8,
      }}
      onMouseDown={e=>{ e.currentTarget.style.transform="translateY(8px)"; e.currentTarget.style.boxShadow="none"; }}
      onMouseUp={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 8px 0 #4a0f0a,0 12px 30px rgba(0,0,0,0.5)"; }}
      >🎮 STEP INTO CHICK'S KITCHEN</button>

      <div style={{fontFamily:"'Boogaloo',cursive",fontSize:12,color:"#444",marginTop:12,position:"relative",zIndex:2}}>No wings on the menu. Stop looking. 🦅</div>
    </div>
  );
}

// POUND STAGE
function PoundStage({ onComplete, onQuote }) {
  const [count, setCount]       = useState(0);
  const [shaking, setShaking]   = useState(false);
  const [startTime]             = useState(Date.now());
  const btnRef = useRef(null);

  const pound = useCallback(() => {
    if (count >= POUND_TARGET) return;
    const next = count + 1;
    setCount(next);
    setShaking(true);
    setTimeout(() => setShaking(false), 300);
    if (next % 5 === 0) onQuote('pound');
    if (next >= POUND_TARGET) {
      const elapsed = (Date.now() - startTime) / 1000;
      setTimeout(() => onComplete({ fastestPound: elapsed, totalPounds: next }), 600);
    }
  }, [count, startTime, onComplete, onQuote]);

  const pct = Math.min(100, (count / POUND_TARGET) * 100);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:"100%"}}>
      <div style={{
        fontSize:"clamp(80px,16vw,120px)",
        display:"inline-block",
        animation: shaking ? "bigShake 0.3s ease-in-out" : "chickBounce 3s ease-in-out infinite",
        filter:"drop-shadow(0 10px 20px rgba(0,0,0,0.5))",
        transition:"transform 0.1s",
        transform: shaking ? `scale(${0.85+Math.random()*0.2}) rotate(${(Math.random()-0.5)*15}deg)` : "scale(1)",
      }}>🫓</div>

      {/* Progress */}
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontFamily:"'Boogaloo',cursive",fontSize:14,color:"#e67e22"}}>POUNDS DELIVERED</span>
          <span style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#f1c40f"}}>{count}/{POUND_TARGET}</span>
        </div>
        <div style={{background:"#1a0805",border:"2px solid #5d3a1a",borderRadius:20,height:20,overflow:"hidden"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#f1c40f,#e67e22)",borderRadius:20,width:pct+"%",transition:"width 0.15s ease",boxShadow:"0 0 10px #e67e2288"}}/>
        </div>
      </div>

      <button ref={btnRef} onClick={pound} disabled={count>=POUND_TARGET} style={{
        fontFamily:"'Fredoka One',cursive",fontSize:"clamp(18px,4vw,26px)",
        background:"linear-gradient(135deg,#e67e22,#c0392b)",color:"white",
        border:"3px solid #f1c40f",padding:"16px 40px",borderRadius:50,cursor:"pointer",
        boxShadow:"0 6px 0 #7b1a12,0 8px 20px rgba(0,0,0,0.4)",
        transition:"all 0.08s",textShadow:"2px 2px 0 rgba(0,0,0,0.4)",
        width:"100%",maxWidth:360,userSelect:"none",
        opacity: count>=POUND_TARGET ? 0.5 : 1,
      }}
      onMouseDown={e=>{e.currentTarget.style.transform="translateY(6px)";e.currentTarget.style.boxShadow="none";}}
      onMouseUp={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 0 #7b1a12,0 8px 20px rgba(0,0,0,0.4)";}}
      onTouchStart={e=>{e.currentTarget.style.transform="translateY(6px)";e.currentTarget.style.boxShadow="none";}}
      onTouchEnd={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 0 #7b1a12,0 8px 20px rgba(0,0,0,0.4)"; pound();}}
      >
        {count>=POUND_TARGET ? "✅ DOUGH SUBMITTED" : "👊 POUND IT LIKE IT'S A CRIMINAL"}
      </button>

      {count > 0 && count < POUND_TARGET && (
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:14,color:"#888",fontStyle:"italic"}}>
          {count < 5 ? "She's warming up..." : count < 10 ? "Getting REAL now..." : "Almost there — FINISH IT!"}
        </div>
      )}
    </div>
  );
}

// TOPPINGS STAGE
function ToppingStage({ onComplete, onQuote }) {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    onQuote('toppings');
  };

  const canThrow = selected.size >= TOPPING_MIN;
  const toppingPoints = Array.from(selected).reduce((acc,id)=>acc+TOPPINGS[id].points,0);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,width:"100%"}}>
      <div style={{fontSize:"clamp(60px,12vw,90px)",animation:"wobble 2s ease-in-out infinite"}}>🍕</div>

      <div style={{fontFamily:"'Boogaloo',cursive",fontSize:"clamp(13px,2.5vw,17px)",color:"#e67e22",textAlign:"center"}}>
        Pick <strong style={{color:"#f1c40f"}}>{TOPPING_MIN}+ toppings</strong> — scatter pitch 'em like a wild baseball player
        {selected.size>0 && <span style={{color:"#f1c40f"}}> ({selected.size} selected • +{toppingPoints}pts)</span>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,width:"100%",maxWidth:380}}>
        {TOPPINGS.map(t => (
          <button key={t.id} onClick={()=>toggle(t.id)} style={{
            fontSize:"clamp(24px,5vw,32px)",padding:"10px 4px",
            background: selected.has(t.id) ? "linear-gradient(135deg,#5d3a1a,#7b4a20)" : "linear-gradient(135deg,#2a1005,#3d1a08)",
            border: selected.has(t.id) ? "3px solid #f1c40f" : "3px solid #5d3a1a",
            borderRadius:12,cursor:"pointer",transition:"all 0.12s",
            textAlign:"center",userSelect:"none",
            boxShadow: selected.has(t.id) ? "0 0 14px #f1c40f55" : "none",
            transform: selected.has(t.id) ? "scale(1.08)" : "scale(1)",
          }}
          onMouseEnter={e=>{if(!selected.has(t.id))e.currentTarget.style.borderColor="#e67e22";}}
          onMouseLeave={e=>{if(!selected.has(t.id))e.currentTarget.style.borderColor="#5d3a1a";}}
          >{t.emoji}</button>
        ))}
      </div>

      <button disabled={!canThrow} onClick={()=>onComplete({selectedToppings:selected,toppingPoints})} style={{
        fontFamily:"'Fredoka One',cursive",fontSize:"clamp(18px,4vw,24px)",
        background: canThrow ? "linear-gradient(135deg,#e74c3c,#c0392b)" : "#2a1005",
        color: canThrow ? "white" : "#555",
        border:"3px solid "+(canThrow?"#f1c40f":"#333"),
        padding:"14px 36px",borderRadius:50,cursor:canThrow?"pointer":"not-allowed",
        boxShadow: canThrow?"0 6px 0 #7b1a12,0 8px 20px rgba(0,0,0,0.4)":"none",
        transition:"all 0.15s",width:"100%",maxWidth:360,
        textShadow: canThrow?"2px 2px 0 rgba(0,0,0,0.4)":"none",
      }}>
        {canThrow ? "⚾ CHUCK 'EM ON — SCATTER PITCH!" : `Need ${TOPPING_MIN-selected.size} more topping${TOPPING_MIN-selected.size!==1?"s":""}`}
      </button>
    </div>
  );
}

// LAUNCH STAGE
function LaunchStage({ onComplete, onQuote }) {
  const [launched, setLaunched] = useState(false);

  const launch = () => {
    setLaunched(true);
    onQuote('launch');
    setTimeout(onComplete, 1200);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,width:"100%"}}>
      <div style={{
        fontSize:"clamp(70px,14vw,110px)",
        animation: launched ? "launchArc 1.2s ease-in forwards" : "wobble 2s ease-in-out infinite",
        display:"inline-block",
      }}>🍕</div>

      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(14px,3vw,20px)",color:"#fdf6e3",textAlign:"center",lineHeight:1.5,maxWidth:360}}>
        {launched ? "🚀 IN THE AIR!!! She hit Chamber 3 from 40 feet. AGAIN." : "Line it up. Grip it. JAVELIN this beauty into the big black oven across the kitchen."}
      </div>

      {!launched && (
        <button onClick={launch} style={{
          fontFamily:"'Fredoka One',cursive",fontSize:"clamp(18px,4vw,26px)",
          background:"linear-gradient(135deg,#1a1a1a,#333)",color:"#f1c40f",
          border:"3px solid #e67e22",padding:"16px 40px",borderRadius:50,cursor:"pointer",
          boxShadow:"0 6px 0 #000,0 8px 20px rgba(0,0,0,0.6)",
          transition:"all 0.1s",width:"100%",maxWidth:360,
          textShadow:"1px 1px 0 rgba(0,0,0,0.8)",
        }}
        onMouseDown={e=>{e.currentTarget.style.transform="translateY(6px)";e.currentTarget.style.boxShadow="none";}}
        onMouseUp={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 0 #000,0 8px 20px rgba(0,0,0,0.6)";}}
        >🏋️ JAVELIN LAUNCH INTO THE OVEN!</button>
      )}
    </div>
  );
}

// BAKE STAGE
function BakeStage({ onComplete, onQuote }) {
  const [secs, setSecs] = useState(BAKE_SECONDS);

  useEffect(() => {
    onQuote('bake');
    const interval = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { clearInterval(interval); setTimeout(onComplete, 500); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onComplete, onQuote]);

  const pct = ((BAKE_SECONDS - secs) / BAKE_SECONDS) * 100;
  const heat = secs < 4 ? "#f1c40f" : secs < 8 ? "#e67e22" : "#c0392b";

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:"100%"}}>
      {/* Oven */}
      <div style={{background:"linear-gradient(135deg,#111,#1a1a1a)",border:"4px solid #333",borderRadius:20,padding:20,width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{width:130,height:90,background:`radial-gradient(ellipse,#ff8c00,#cc2200,#550000)`,borderRadius:14,margin:"0 auto 12px",border:"4px solid #555",position:"relative",overflow:"hidden",animation:"ovenGlow 1.5s ease-in-out infinite alternate",boxShadow:`0 0 ${20+pct/2}px rgba(255,100,0,0.7)`}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:56,animation:"ovenSpin 3s linear infinite",filter:"brightness(1.4)"}}>🍕</div>
        </div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(32px,7vw,52px)",color:heat,textShadow:`0 0 20px ${heat}`,transition:"color 0.5s"}}>{secs}s</div>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:13,color:"#666",textTransform:"uppercase",letterSpacing:2}}>Chamber 3 is working</div>
        <div style={{background:"#1a0805",border:"2px solid #333",borderRadius:20,height:12,overflow:"hidden",marginTop:10}}>
          <div style={{height:"100%",background:`linear-gradient(90deg,#c0392b,${heat})`,borderRadius:20,width:pct+"%",transition:"width 1s ease"}}/>
        </div>
      </div>

      <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(12px,2vw,15px)",color:"#888",fontStyle:"italic",textAlign:"center"}}>
        She goes and sits in her chair. Nobody speaks. Reverence only.
      </div>
    </div>
  );
}

// WING SAUCE STAGE
function WingSauceStage({ onComplete, onQuote }) {
  const [grabbed, setGrabbed] = useState(false);

  const grab = () => {
    setGrabbed(true);
    onQuote('wingcheck');
    setTimeout(onComplete, 800);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:"100%"}}>
      <div style={{fontSize:"clamp(70px,14vw,100px)",animation:"wobble 1.5s ease-in-out infinite"}}>🔥</div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(15px,3vw,22px)",color:"#fdf6e3",textAlign:"center",maxWidth:360,lineHeight:1.5}}>
        Best wing sauce in town. Pairs with pizza <strong style={{color:"#f1c40f"}}>ONLY</strong>.<br/>
        <span style={{fontFamily:"'Boogaloo',cursive",fontSize:"clamp(12px,2vw,16px)",color:"#e67e22"}}>No wings on the menu. There never were. Don't.</span>
      </div>

      <div style={{background:"linear-gradient(135deg,#2a1005,#1a0805)",border:"2px solid #e67e22",borderRadius:12,padding:"10px 18px",maxWidth:340,textAlign:"center"}}>
        <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(11px,2vw,14px)",color:"#fdf6e3",fontStyle:"italic"}}>
          She makes this herself. Her family has asked. The county health inspector has asked. The feds have asked. Nobody knows.
        </div>
      </div>

      <button onClick={grab} disabled={grabbed} style={{
        fontFamily:"'Fredoka One',cursive",fontSize:"clamp(18px,4vw,24px)",
        background: grabbed ? "#1a0805" : "linear-gradient(135deg,#c0392b,#7b1a12)",
        color: grabbed ? "#555" : "white",
        border:"3px solid "+(grabbed?"#333":"#e67e22"),
        padding:"14px 36px",borderRadius:50,cursor:grabbed?"not-allowed":"pointer",
        boxShadow: grabbed ? "none" : "0 6px 0 #4a0f0a,0 8px 20px rgba(0,0,0,0.4)",
        transition:"all 0.1s",width:"100%",maxWidth:360,
        textShadow: grabbed?"none":"2px 2px 0 rgba(0,0,0,0.4)",
      }}>
        {grabbed ? "✅ SAUCE SECURED" : "🔥 GRAB THE WING SAUCE"}
      </button>
    </div>
  );
}

// SERVE STAGE
function ServeStage({ onComplete, onQuote, toppingPoints }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:"100%"}}>
      <div style={{fontSize:"clamp(80px,16vw,120px)",animation:"serveWobble 1s ease-in-out infinite",filter:"drop-shadow(0 0 30px #f1c40f88)"}}>🍕</div>
      <div style={{fontFamily:"'Permanent Marker',cursive",fontSize:"clamp(32px,7vw,60px)",color:"#f1c40f",textShadow:"0 0 20px #e67e22,3px 3px 0 #7b1a12",animation:"neonPulse 2s ease-in-out infinite"}}>
        WALLAH!!!
      </div>
      <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(14px,2.5vw,18px)",color:"#fdf6e3",textAlign:"center",maxWidth:380,lineHeight:1.6}}>
        The greatest pizza ever created by human hands is ready.<br/>
        <span style={{color:"#e67e22"}}>Topping bonus: +{toppingPoints} pts</span>
      </div>
      <button onClick={()=>{onQuote('serve');onComplete();}} style={{
        fontFamily:"'Fredoka One',cursive",fontSize:"clamp(20px,4vw,28px)",
        background:"linear-gradient(135deg,#27ae60,#1e8449)",color:"white",
        border:"4px solid #f1c40f",padding:"16px 44px",borderRadius:60,cursor:"pointer",
        boxShadow:"0 6px 0 #1a6b38,0 10px 30px rgba(39,174,96,0.4)",
        transition:"all 0.1s",width:"100%",maxWidth:380,
        textShadow:"2px 2px 0 rgba(0,0,0,0.4)",
        animation:"serveGlow 1.5s ease-in-out infinite",
      }}
      onMouseDown={e=>{e.currentTarget.style.transform="translateY(6px)";e.currentTarget.style.boxShadow="none";}}
      onMouseUp={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 0 #1a6b38,0 10px 30px rgba(39,174,96,0.4)";}}
      >🍕 SERVE THE MASTERPIECE!</button>
    </div>
  );
}

// RESULT SCREEN
function ResultScreen({ tip, pizzasServed, doughLeft, onMore, onTitle, sessionStats }) {
  const review = REVIEWS[Math.floor(Math.random()*REVIEWS.length)];
  const sauce  = SAUCE_QUOTES[Math.floor(Math.random()*SAUCE_QUOTES.length)];
  const stars  = sessionStats.toppingPoints >= 15 ? "⭐⭐⭐⭐⭐" : sessionStats.toppingPoints >= 8 ? "⭐⭐⭐⭐" : "⭐⭐⭐";

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 50% 30%,#5d1a0a 0%,#1a0805 70%,#000 100%)",padding:20,textAlign:"center"}}>
      <Confetti/>
      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:520}}>
        <div style={{fontFamily:"'Permanent Marker',cursive",fontSize:"clamp(42px,10vw,80px)",color:"#f1c40f",textShadow:"0 0 20px #e67e22,3px 3px 0 #7b1a12",animation:"resultPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards"}}>🍕 WALLAH! 🍕</div>
        <div style={{fontSize:28,margin:"6px 0",filter:"drop-shadow(0 0 8px #f1c40f)"}}>{stars}</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(20px,5vw,36px)",color:"#f1c40f",textShadow:"0 0 15px #f1c40f"}}>+${tip} tip earned!</div>

        <Card style={{marginTop:14}}>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#e67e22",marginBottom:6}}>{review.name}</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(12px,2vw,15px)",color:"#fdf6e3",fontStyle:"italic",lineHeight:1.6}}>{review.text}</div>
        </Card>

        <Card style={{borderColor:"#e67e22",marginTop:10}}>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#e67e22",marginBottom:6}}>🔥 Wing Sauce Report</div>
          <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(12px,2vw,15px)",color:"#fdf6e3",fontStyle:"italic",lineHeight:1.6}}>"{sauce}"</div>
        </Card>

        <div style={{display:"flex",gap:10,marginTop:14}}>
          {doughLeft > 0 ? (
            <button onClick={onMore} style={{...btnStyle("linear-gradient(135deg,#27ae60,#1e8449)","#f1c40f"),flex:1}}>
              🍕 Next Pizza ({doughLeft} dough left)
            </button>
          ) : (
            <button onClick={onMore} style={{...btnStyle("linear-gradient(135deg,#2a1005,#1a0805)","#555"),flex:1,cursor:"not-allowed",color:"#555"}}>
              📵 Dough Gone
            </button>
          )}
          <button onClick={onTitle} style={{...btnStyle("linear-gradient(135deg,#1a1a2e,#050510)","#5dade2"),flex:1}}>
            🏠 Chick's Kitchen
          </button>
        </div>
      </div>
    </div>
  );
}

// PHONE SCREEN
function PhoneScreen({ score, pizzasServed, onTitle }) {
  const days = [3,7,14,21,28,47,60][Math.floor(Math.random()*7)];
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at 50% 50%,#1a1a2e 0%,#050510 100%)",padding:20,textAlign:"center"}}>
      <div style={{fontSize:90,animation:"phoneshake 0.4s ease-in-out 3"}}>📵</div>
      <div style={{fontFamily:"'Permanent Marker',cursive",fontSize:"clamp(32px,7vw,62px)",color:"#f1c40f",textShadow:"3px 3px 0 #7b1a12",margin:"10px 0"}}>She Unplugged The Phone.</div>
      <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(13px,2.5vw,17px)",color:"#fdf6e3",maxWidth:500,lineHeight:1.8,margin:"10px auto"}}>
        That's it. The dough is gone. She looked at the clock, looked at the oven, looked at you —
        and walked over and unplugged the phone from the wall.<br/><br/>
        Come back in <strong style={{color:"#f1c40f"}}>{days} days</strong> when she opens again.<br/><br/>
        <strong style={{color:"#f1c40f",fontSize:"clamp(15px,3vw,20px)"}}>Pizzas served: {pizzasServed} &nbsp;|&nbsp; Tips: ${score}</strong>
      </div>
      <div style={{background:"linear-gradient(135deg,#c0392b,#e67e22)",border:"3px solid #f1c40f",borderRadius:50,padding:"8px 24px",fontFamily:"'Fredoka One',cursive",fontSize:15,color:"white",margin:"12px 0",animation:"badgePulse 2s ease-in-out infinite"}}>
        🔥 Hope you got the wing sauce while you could 🔥
      </div>
      <button onClick={onTitle} style={{...btnStyle("linear-gradient(135deg,#c0392b,#7b1a12)","#f1c40f"),fontSize:"clamp(17px,3.5vw,24px)",padding:"14px 40px",marginTop:10}}>
        🎮 Beg Chick For One More Round
      </button>
    </div>
  );
}

// ACHIEVEMENTS SCREEN
function AchievementsScreen({ unlockedIds, onBack }) {
  return (
    <div style={{minHeight:"100vh",background:"#0a0602",padding:20}}>
      <div style={{maxWidth:560,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onBack} style={{fontFamily:"'Fredoka One',cursive",fontSize:16,background:"#1a0805",color:"#e67e22",border:"2px solid #5d3a1a",borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>← Back</button>
          <div style={{fontFamily:"'Permanent Marker',cursive",fontSize:"clamp(24px,6vw,40px)",color:"#f1c40f",textShadow:"2px 2px 0 #7b1a12"}}>🏆 Achievements</div>
        </div>
        <div style={{display:"grid",gap:10}}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = unlockedIds.has(a.id);
            return (
              <div key={a.id} style={{background:unlocked?"linear-gradient(135deg,#2a1505,#1a0d03)":"linear-gradient(135deg,#111,#0a0a0a)",border:`2px solid ${unlocked?"#f1c40f":"#222"}`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,opacity:unlocked?1:0.5,transition:"all 0.3s"}}>
                <span style={{fontSize:36,filter:unlocked?"none":"grayscale(1)"}}>{a.icon}</span>
                <div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:18,color:unlocked?"#f1c40f":"#444"}}>{a.label}</div>
                  <div style={{fontFamily:"'Nunito',sans-serif",fontSize:13,color:unlocked?"#fdf6e3":"#333"}}>{a.desc}</div>
                </div>
                {unlocked && <div style={{marginLeft:"auto",fontSize:22}}>✅</div>}
              </div>
            );
          })}
        </div>
        <div style={{fontFamily:"'Boogaloo',cursive",fontSize:14,color:"#444",textAlign:"center",marginTop:16}}>{unlockedIds.size}/{ACHIEVEMENTS.length} unlocked</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function Card({ children, style={} }) {
  return (
    <div style={{background:"linear-gradient(135deg,#2a1005,#1a0805)",border:"3px solid #f1c40f",borderRadius:18,padding:"16px 20px",...style}}>
      {children}
    </div>
  );
}

function btnStyle(bg, borderColor) {
  return {
    fontFamily:"'Fredoka One',cursive",fontSize:"clamp(15px,3vw,20px)",
    background:bg,color:"#fdf6e3",border:`3px solid ${borderColor}`,
    padding:"13px 24px",borderRadius:50,cursor:"pointer",
    boxShadow:"0 5px 0 rgba(0,0,0,0.5),0 8px 20px rgba(0,0,0,0.4)",
    transition:"all 0.1s",textShadow:"1px 1px 0 rgba(0,0,0,0.4)",
    textAlign:"center",
  };
}

// ─────────────────────────────────────────────
// STAGE CONFIG
// ─────────────────────────────────────────────
const STAGES = ['pound','toppings','launch','bake','wingcheck','serve'];
const STAGE_LABELS = {
  pound:     {step:1, label:"POUND THE DOUGH",      emoji:"👊"},
  toppings:  {step:2, label:"CHUCK THE TOPPINGS",   emoji:"⚾"},
  launch:    {step:3, label:"JAVELIN LAUNCH",        emoji:"🏋️"},
  bake:      {step:4, label:"THE SACRED BAKE",       emoji:"🔥"},
  wingcheck: {step:5, label:"WING SAUCE PROTOCOL",   emoji:"🔥"},
  serve:     {step:6, label:"WALLAH — SERVE IT!",    emoji:"🍕"},
};

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]       = useState("title"); // title | game | result | phone | achievements
  const [stage, setStage]         = useState("pound");
  const [doughLeft, setDoughLeft] = useState(PIZZAS_PER_SESSION);
  const [sessionPizzas, setSessionPizzas] = useState(0);
  const [lastTip, setLastTip]     = useState(0);
  const [chickQuote, setChickQuote] = useState(CHICK_QUOTES.title[0]);
  const [particles, setParticles] = useState([]);
  const [toasts, setToasts]       = useState([]);
  const [achPopup, setAchPopup]   = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Persistent stats
  const [gameStats, setGameStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chickStats") || "null") || initStats(); }
    catch { return initStats(); }
  });

  const [sessionData, setSessionData] = useState({ toppingPoints:0, selectedToppings:new Set() });

  function initStats() {
    return { totalTips:0, totalPizzas:0, totalPounds:0, hotPepperCount:0, sauceGrabs:0, maxToppings:0, fastestPound:9999, usedMystery:false, unlockedIds:[] };
  }

  // Save stats
  const saveStats = useCallback((s) => {
    setGameStats(s);
    try { localStorage.setItem("chickStats", JSON.stringify({...s, unlockedIds:s.unlockedIds})); } catch {}
  }, []);

  // Check achievements
  const checkAchievements = useCallback((stats) => {
    const unlocked = new Set(stats.unlockedIds);
    ACHIEVEMENTS.forEach(a => {
      if (!unlocked.has(a.id) && a.condition(stats)) {
        unlocked.add(a.id);
        setAchPopup(a);
      }
    });
    return Array.from(unlocked);
  }, []);

  // Particle spawn
  const spawnParticles = useCallback((emojis, count, x, y) => {
    const newP = Array.from({length:count}, (_,i)=>({
      id: Date.now()+i+Math.random(),
      emoji: emojis[Math.floor(Math.random()*emojis.length)],
      x, y,
    }));
    setParticles(p => [...p, ...newP]);
  }, []);

  // Toast
  const addToast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, {id, msg}]);
  }, []);

  // Quote
  const onQuote = useCallback((stageKey) => {
    const quotes = CHICK_QUOTES[stageKey] || CHICK_QUOTES.title;
    setChickQuote(quotes[Math.floor(Math.random()*quotes.length)]);
  }, []);

  // Stage complete handlers
  const handlePoundComplete = useCallback(({fastestPound, totalPounds}) => {
    spawnParticles(["👊","💥","✊","⚡","🫓"],6, window.innerWidth/2, window.innerHeight/2);
    addToast("💪 Dough submitted! She's satisfied.");
    const next = {...gameStats, totalPounds: gameStats.totalPounds + totalPounds, fastestPound: Math.min(gameStats.fastestPound, fastestPound)};
    const ids = checkAchievements(next);
    saveStats({...next, unlockedIds:ids});
    setStage("toppings");
    onQuote("toppings");
  }, [gameStats, spawnParticles, addToast, checkAchievements, saveStats, onQuote]);

  const handleToppingComplete = useCallback(({selectedToppings, toppingPoints}) => {
    spawnParticles(["⚾","🧀","🔥","💫"],5, window.innerWidth/2, window.innerHeight/2);
    addToast("⚾ Scatter pitched! Pure chaos. Pure Chick.");
    const usedHot = selectedToppings.has(8);
    const usedMystery = selectedToppings.has(9);
    const next = {
      ...gameStats,
      hotPepperCount: gameStats.hotPepperCount + (usedHot?1:0),
      maxToppings: Math.max(gameStats.maxToppings, selectedToppings.size),
      usedMystery: gameStats.usedMystery || usedMystery,
    };
    const ids = checkAchievements(next);
    saveStats({...next, unlockedIds:ids});
    setSessionData({toppingPoints, selectedToppings});
    setStage("launch");
    onQuote("launch");
  }, [gameStats, spawnParticles, addToast, checkAchievements, saveStats, onQuote]);

  const handleLaunchComplete = useCallback(() => {
    spawnParticles(["🚀","💨","🍕","⚡"],6, window.innerWidth/2, window.innerHeight/2);
    addToast("🏋️ Chamber 3! Bullseye. Again.");
    setStage("bake");
    onQuote("bake");
  }, [spawnParticles, addToast, onQuote]);

  const handleBakeComplete = useCallback(() => {
    spawnParticles(["✨","🔥","⭐","💛"],6, window.innerWidth/2, window.innerHeight/2);
    addToast("✅ Perfectly baked. No thermometer needed. She just knows.");
    setStage("wingcheck");
    onQuote("wingcheck");
  }, [spawnParticles, addToast, onQuote]);

  const handleSauceComplete = useCallback(() => {
    spawnParticles(["🔥","🌶️","💫"],4, window.innerWidth/2, window.innerHeight/2);
    addToast("🔥 Wing sauce secured. No wings asked for. Good.");
    const next = {...gameStats, sauceGrabs: gameStats.sauceGrabs + 1};
    const ids = checkAchievements(next);
    saveStats({...next, unlockedIds:ids});
    setStage("serve");
    onQuote("serve");
  }, [gameStats, spawnParticles, addToast, checkAchievements, saveStats, onQuote]);

  const handleServeComplete = useCallback(() => {
    const tip = 10 + sessionData.toppingPoints * 2 + Math.floor(Math.random()*15);
    const newPizzas = sessionData.toppingPoints;
    const newDough  = doughLeft - 1;
    const newSession = sessionPizzas + 1;

    setLastTip(tip);
    setDoughLeft(newDough);
    setSessionPizzas(newSession);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
    spawnParticles(["🍕","⭐","💰","🎉","🔥"],10, window.innerWidth/2, window.innerHeight/2);
    addToast(`💰 +$${tip} tip! They're losing their minds out there.`);

    const next = {
      ...gameStats,
      totalTips: gameStats.totalTips + tip,
      totalPizzas: gameStats.totalPizzas + 1,
      sessionPizzas: newSession,
    };
    const ids = checkAchievements(next);
    saveStats({...next, unlockedIds:ids});

    setTimeout(() => setScreen(newDough > 0 ? "result" : "phone"), 1000);
  }, [sessionData, doughLeft, sessionPizzas, gameStats, spawnParticles, addToast, checkAchievements, saveStats]);

  const startGame = () => {
    setDoughLeft(PIZZAS_PER_SESSION);
    setSessionPizzas(0);
    setStage("pound");
    setChickQuote(CHICK_QUOTES.pound[0]);
    setScreen("game");
  };

  const onMorePizza = () => {
    setStage("pound");
    setChickQuote(CHICK_QUOTES.pound[0]);
    setSessionData({toppingPoints:0, selectedToppings:new Set()});
    setScreen("game");
  };

  // ─── GAME SCREEN ───
  const stageInfo = STAGE_LABELS[stage];

  return (
    <>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Fredoka+One&family=Boogaloo&family=Nunito:wght@400;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0602; font-family: 'Nunito', sans-serif; overflow-x: hidden; }
        button { font-family: 'Fredoka One', cursive; }

        @keyframes flicker { 0%{opacity:.6;transform:scaleY(1)} 100%{opacity:1;transform:scaleY(1.1)} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes neonPulse { 0%,100%{text-shadow:0 0 10px #f1c40f,0 0 30px #e67e22,0 0 60px #c0392b,4px 4px 0 #7b1a12} 50%{text-shadow:0 0 5px #f1c40f,0 0 15px #e67e22,0 0 25px #c0392b,4px 4px 0 #7b1a12} }
        @keyframes chickBounce { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(2deg)} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes btnPulse { 0%,100%{box-shadow:0 8px 0 #4a0f0a,0 12px 30px rgba(192,57,43,0.4)} 50%{box-shadow:0 8px 0 #4a0f0a,0 12px 40px rgba(192,57,43,0.8)} }
        @keyframes bigShake { 0%,100%{transform:translate(0,0) rotate(0)} 20%{transform:translate(-8px,-4px) rotate(-3deg)} 40%{transform:translate(8px,4px) rotate(3deg)} 60%{transform:translate(-8px,2px) rotate(-2deg)} 80%{transform:translate(8px,-2px) rotate(2deg)} }
        @keyframes wobble { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes ovenGlow { from{box-shadow:0 0 20px rgba(255,100,0,.6)} to{box-shadow:0 0 40px rgba(255,100,0,.9)} }
        @keyframes ovenSpin { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes serveWobble { 0%,100%{transform:scale(1) rotate(-1deg)} 50%{transform:scale(1.04) rotate(1deg)} }
        @keyframes serveGlow { 0%,100%{box-shadow:0 6px 0 #1a6b38,0 8px 30px rgba(39,174,96,0.4)} 50%{box-shadow:0 6px 0 #1a6b38,0 8px 40px rgba(39,174,96,0.9)} }
        @keyframes resultPop { from{transform:scale(0) rotate(-10deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
        @keyframes launchArc { 0%{transform:translate(0,0) rotate(0) scale(1);opacity:1} 50%{transform:translate(100px,-80px) rotate(180deg) scale(0.8);opacity:0.8} 100%{transform:translate(200px,0) rotate(360deg) scale(0.3);opacity:0} }
        @keyframes particleFly { 0%{transform:translate(0,0) scale(1) rotate(0);opacity:1} 100%{transform:translate(var(--tx),var(--ty)) scale(0) rotate(720deg);opacity:0} }
        @keyframes toastIn { from{transform:translateX(-50%) translateY(-20px) scale(0.8);opacity:0} to{transform:translateX(-50%) translateY(0) scale(1);opacity:1} }
        @keyframes slideInRight { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes confettiFall { 0%{transform:translateY(0) rotate(0);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes phoneshake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(12deg)} }
        @keyframes badgePulse { 0%,100%{box-shadow:0 0 10px rgba(231,76,60,0.3)} 50%{box-shadow:0 0 24px rgba(231,76,60,0.8)} }
        @keyframes progressGlow { 0%,100%{box-shadow:0 0 8px rgba(241,196,15,0.3)} 50%{box-shadow:0 0 20px rgba(241,196,15,0.8)} }
      `}</style>

      {/* Particles */}
      {particles.map(p => (
        <Particle key={p.id} {...p} onDone={()=>setParticles(ps=>ps.filter(x=>x.id!==p.id))}/>
      ))}

      {/* Toasts */}
      {toasts.slice(-1).map(t => (
        <Toast key={t.id} msg={t.msg} onDone={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}/>
      ))}

      {/* Achievement popup */}
      {achPopup && <AchievementPopup ach={achPopup} onDone={()=>setAchPopup(null)}/>}

      {/* Confetti */}
      {showConfetti && <Confetti/>}

      {/* ── TITLE ── */}
      {screen==="title" && (
        <TitleScreen onPlay={startGame} stats={{
          totalTips: gameStats.totalTips,
          totalPizzas: gameStats.totalPizzas,
          unlocked: (gameStats.unlockedIds||[]).length,
        }}/>
      )}

      {/* ── ACHIEVEMENTS ── */}
      {screen==="achievements" && (
        <AchievementsScreen unlockedIds={new Set(gameStats.unlockedIds||[])} onBack={()=>setScreen("title")}/>
      )}

      {/* ── GAME ── */}
      {screen==="game" && (
        <div style={{minHeight:"100vh",background:"#0d0602",display:"flex",flexDirection:"column"}}>
          {/* Top bar */}
          <div style={{background:"linear-gradient(135deg,#1a0805,#0d0602)",borderBottom:"3px solid #2a1005",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              {[["💰","$"+gameStats.totalTips,"Tips"],["🍕",sessionPizzas+"/"+PIZZAS_PER_SESSION,"Session"]].map(([icon,val,lbl])=>(
                <div key={lbl} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Boogaloo',cursive",fontSize:10,color:"#e67e22",textTransform:"uppercase",letterSpacing:1}}>{lbl}</div>
                  <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(16px,4vw,22px)",color:"#f1c40f"}}>{icon} {val}</div>
                </div>
              ))}
            </div>
            {/* Dough bar */}
            <div style={{flex:1,minWidth:100,maxWidth:200}}>
              <div style={{fontFamily:"'Boogaloo',cursive",fontSize:10,color:"#e67e22",textTransform:"uppercase",letterSpacing:1,textAlign:"center",marginBottom:3}}>🫓 Dough</div>
              <div style={{background:"#1a0805",border:"2px solid #5d3a1a",borderRadius:20,height:16,overflow:"hidden"}}>
                <div style={{height:"100%",background:"linear-gradient(90deg,#f1c40f,#e67e22)",borderRadius:20,width:((doughLeft/PIZZAS_PER_SESSION)*100)+"%",transition:"width 0.5s ease",boxShadow:"0 0 8px #e67e2288"}}/>
              </div>
              <div style={{fontFamily:"'Boogaloo',cursive",fontSize:10,color:"#888",textAlign:"center",marginTop:2}}>{doughLeft} left</div>
            </div>
            <button onClick={()=>setScreen("achievements")} style={{fontFamily:"'Fredoka One',cursive",fontSize:13,background:"#1a0805",color:"#f1c40f",border:"2px solid #5d3a1a",borderRadius:8,padding:"6px 12px",cursor:"pointer"}}>🏆 {(gameStats.unlockedIds||[]).length}</button>
          </div>

          {/* Stage progress */}
          <div style={{background:"#0d0602",borderBottom:"1px solid #1a0805",padding:"8px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",maxWidth:600,margin:"0 auto",gap:4}}>
              {STAGES.map((s,i)=>(
                <div key={s} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:"clamp(12px,3vw,18px)",opacity: STAGES.indexOf(stage)>=i ? 1 : 0.25,transition:"opacity 0.4s"}}>{STAGE_LABELS[s].emoji}</div>
                  <div style={{height:4,background: STAGES.indexOf(stage)>=i ? "#f1c40f" : "#1a0805",borderRadius:4,transition:"background 0.4s",marginTop:3}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div style={{flex:1,display:"flex",flexDirection:"column",padding:"14px 16px",maxWidth:600,margin:"0 auto",width:"100%",gap:12}}>
            {/* Stage header */}
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Boogaloo',cursive",fontSize:12,color:"#e67e22",textTransform:"uppercase",letterSpacing:2}}>Step {stageInfo.step} of 6</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:"clamp(18px,4vw,28px)",color:"#fdf6e3",textShadow:"2px 2px 0 #7b1a12"}}>{stageInfo.emoji} {stageInfo.label}</div>
            </div>

            {/* Chick quote */}
            <div style={{background:"linear-gradient(135deg,#1a0805,#0d0602)",border:"2px solid #5d3a1a",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,maxWidth:560,margin:"0 auto",width:"100%"}}>
              <span style={{fontSize:32,flexShrink:0,animation:"chickBounce 2s ease-in-out infinite"}}>👩</span>
              <div style={{fontFamily:"'Nunito',sans-serif",fontSize:"clamp(11px,2vw,14px)",color:"#fdf6e3",fontStyle:"italic",fontWeight:700,lineHeight:1.4}}>{chickQuote}</div>
            </div>

            {/* Wing sauce badge */}
            <div style={{background:"linear-gradient(135deg,#c0392b,#e67e22)",border:"2px solid #f1c40f",borderRadius:50,padding:"6px 18px",fontFamily:"'Fredoka One',cursive",fontSize:"clamp(11px,2vw,14px)",color:"white",textAlign:"center",maxWidth:500,margin:"0 auto",width:"100%",animation:"badgePulse 2s ease-in-out infinite",textShadow:"1px 1px 0 rgba(0,0,0,0.4)"}}>
              🔥 WING SAUCE WITH PIZZA ONLY — NO WINGS — EYES FORWARD 🔥
            </div>

            {/* Stage component */}
            <div style={{background:"linear-gradient(135deg,#1a0805,#0d0602)",border:"2px solid #2a1005",borderRadius:18,padding:"20px 16px",maxWidth:560,margin:"0 auto",width:"100%"}}>
              {stage==="pound"     && <PoundStage     onComplete={handlePoundComplete}  onQuote={onQuote}/>}
              {stage==="toppings"  && <ToppingStage   onComplete={handleToppingComplete} onQuote={onQuote}/>}
              {stage==="launch"    && <LaunchStage    onComplete={handleLaunchComplete}  onQuote={onQuote}/>}
              {stage==="bake"      && <BakeStage      onComplete={handleBakeComplete}    onQuote={onQuote}/>}
              {stage==="wingcheck" && <WingSauceStage onComplete={handleSauceComplete}   onQuote={onQuote}/>}
              {stage==="serve"     && <ServeStage     onComplete={handleServeComplete}   onQuote={onQuote} toppingPoints={sessionData.toppingPoints}/>}
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {screen==="result" && (
        <ResultScreen
          tip={lastTip}
          pizzasServed={sessionPizzas}
          doughLeft={doughLeft}
          onMore={onMorePizza}
          onTitle={()=>setScreen("title")}
          sessionStats={sessionData}
        />
      )}

      {/* ── PHONE ── */}
      {screen==="phone" && (
        <PhoneScreen
          score={gameStats.totalTips}
          pizzasServed={sessionPizzas}
          onTitle={()=>setScreen("title")}
        />
      )}
    </>
  );
}
