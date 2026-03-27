import React, { useState, useEffect, useRef } from 'react';
import { Pizza, PhoneOff, Flame, Clock, Trophy, AlertTriangle, ChefHat, MapPin, Phone, Palette } from 'lucide-react';

const TOTAL_INGREDIENTS = 10;

export default function App() {
  const [gameState, setGameState] = useState('intro'); // intro, closed, playing, gameover
  const [ingredients, setIngredients] = useState(TOTAL_INGREDIENTS);
  const [pizzasServed, setPizzasServed] = useState(0);
  const [theme, setTheme] = useState('american');
  const [showC4Modal, setShowC4Modal] = useState(false);
  
  // Game Phase States: 'pounding', 'topping', 'launching', 'baking', 'served'
  const [phase, setPhase] = useState('pounding');
  const [message, setMessage] = useState('');

  // Mini-game states
  const [poundCount, setPoundCount] = useState(0);
  const [sliderPos, setSliderPos] = useState(0);
  const [sliderDirection, setSliderDirection] = useState(1);
  const sliderRef = useRef(null);
  
  // Shake effect for pounding
  const [isShaking, setIsShaking] = useState(false);

  // Transitions
  const [flyingToppings, setFlyingToppings] = useState(false);
  const [smokePoof, setSmokePoof] = useState(false);

  // Intro logic - simulate her ridiculous schedule
  const attemptToEnter = () => {
    const randomChance = Math.random();
    if (randomChance < 0.3) {
      setGameState('closed');
      setMessage("It's currently one of the 9 months she's closed. Try again.");
    } else if (randomChance < 0.6) {
      setGameState('closed');
      setMessage("It's Tuesday. She's only open 3 days a week. Come back later.");
    } else if (randomChance < 0.8) {
      setGameState('closed');
      setMessage("It's 3:59 PM. She opens at 4:00 PM EXACTLY. Wait.");
    } else {
      setGameState('playing');
      setPhase('pounding');
      setMessage("You caught her on a good day between 4 PM and 8 PM! GET TO WORK!");
    }
  };

  const restartGame = () => {
    setGameState('intro');
    setIngredients(TOTAL_INGREDIENTS);
    setPizzasServed(0);
    setPhase('pounding');
    setPoundCount(0);
  };

  // Mini-game Loop (Slider for Topping and Launching)
  useEffect(() => {
    if (gameState === 'playing' && (phase === 'topping' || phase === 'launching')) {
      const speed = phase === 'topping' ? 3 : 5; // Launching is faster/harder
      
      const interval = setInterval(() => {
        setSliderPos((prev) => {
          let next = prev + (speed * sliderDirection);
          if (next >= 100) {
            setSliderDirection(-1);
            return 100;
          }
          if (next <= 0) {
            setSliderDirection(1);
            return 0;
          }
          return next;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [gameState, phase, sliderDirection]);

  // Phase Actions
  const handlePound = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 100);
    
    if (poundCount + 1 >= 15) {
      setPhase('topping');
      setMessage("Dough subdued! Now, chuck those toppings like a fast ball!");
      setPoundCount(0);
    } else {
      setPoundCount(prev => prev + 1);
    }
  };

  const handleChuck = () => {
    if (sliderPos > 40 && sliderPos < 60) {
      setFlyingToppings(true);
      setMessage("BOOM! Scatter pitch!");
      setTimeout(() => {
        setFlyingToppings(false);
        setPhase('launching');
        setMessage("Perfect scatter pitch! Now, JAVELIN LAUNCH it into the massive oven!");
      }, 2500);
    } else {
      setMessage("Missed the dough! Chick is glaring at you. Try again!");
    }
  };

  const handleLaunch = () => {
    if (sliderPos > 85) { // Needs max power
      setSmokePoof(true);
      setMessage("LAUNCHING...");
      setTimeout(() => {
        setSmokePoof(false);
        setPhase('baking');
        setMessage("BULLSEYE! 15 to 20 minutes later... (or 3 seconds in game time)");
        setTimeout(() => {
          setPhase('served');
          setIngredients(prev => prev - 1);
          setPizzasServed(prev => prev + 1);
          setMessage("WALLAH! The best pizza ever created! Be sure to order with wing sauce (NO WINGS).");
        }, 3000);
      }, 2000);
    } else {
      setMessage("Weak throw! It didn't reach the 4th chamber. Try again!");
    }
  };

  const handleNextPizza = () => {
    if (ingredients <= 1) { // Will be 0 after this update cycle completes
      setGameState('gameover');
      setMessage("Chick ran out of dough. She is unplugging the phone.");
    } else {
      setPhase('pounding');
      setMessage("Next order! Pound that dough like it owes you money!");
    }
  };

  return (
    <div className={`min-h-screen font-sans overflow-hidden flex flex-col pb-10 relative ${theme === 'italian' ? 'bg-slate-900 text-gray-100' : 'bg-orange-50 text-gray-900'}`}>
      {theme === 'italian' && (
        <style>{`
          main .bg-white { background-color: #1e293b !important; color: #f8fafc !important; border-color: #16a34a !important; }
          main .text-gray-900, main .text-gray-800, main .text-gray-700 { color: #f8fafc !important; }
          main .text-gray-600, main .text-gray-500 { color: #cbd5e1 !important; }
          main .bg-blue-50 { background-color: #334155 !important; border-color: #ef4444 !important; }
          main .text-blue-900 { color: #f8fafc !important; }
        `}</style>
      )}

      {/* Action Overlays for Transitions */}
      {flyingToppings && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">
          {[...Array(30)].map((_, i) => {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 800 + 300;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const rot = Math.random() * 720 - 360;
            const toppings = ['🍄', '🧅', '🫑', '🍖', '🥓', '🍅', '🧀'];
            return (
              <div 
                key={i} 
                className="absolute text-5xl md:text-7xl animate-fly-out"
                style={{
                  '--tx': `${x}px`,
                  '--ty': `${y}px`,
                  '--rot': `${rot}deg`,
                  animationDelay: `${Math.random() * 0.2}s`
                }}
              >
                {toppings[i % toppings.length]}
              </div>
            );
          })}
        </div>
      )}

      {smokePoof && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="w-64 h-64 bg-gray-500 rounded-full mix-blend-multiply opacity-80 animate-smoke-poof blur-2xl"></div>
          <div className="absolute w-48 h-48 bg-gray-700 rounded-full mix-blend-multiply opacity-90 animate-smoke-poof blur-xl" style={{animationDelay: '0.1s'}}></div>
          <div className="absolute w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply opacity-60 animate-smoke-poof blur-3xl" style={{animationDelay: '0.2s'}}></div>
        </div>
      )}

      {/* Floating Contacts */}
      <div className="fixed top-24 right-4 flex flex-col gap-4 z-50">
        <a 
          href="tel:+13153937700" 
          onClick={(e) => {
            if(gameState === 'playing') setMessage("Dialing Chick... She probably won't answer.");
          }}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group relative" 
          title="Call Chick"
        >
          <Phone className="w-6 h-6 animate-pulse" />
          <span className="absolute right-full mr-4 bg-black text-white px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Call (315) 393-7700
          </span>
        </a>
        <a 
          href="https://www.google.com/maps/search/?api=1&query=1608+Ford+St,+Ogdensburg,+NY+13669" 
          target="_blank" 
          rel="noreferrer" 
          onClick={(e) => {
            if(gameState === 'playing') setMessage("Mapping GPS Coordinates... 1608 Ford St.");
          }}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center group relative" 
          title="Map Address"
        >
          <MapPin className="w-6 h-6 animate-bounce" />
          <span className="absolute right-full mr-4 bg-black text-white px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            GPS: 1608 Ford St
          </span>
        </a>
      </div>

      {/* Header */}
      <header className={`${theme === 'italian' ? 'bg-green-800 border-b-4 border-red-600' : 'bg-red-700'} text-white p-4 shadow-xl flex justify-between items-center z-10`}>
        <div className="flex items-center gap-2">
          <Pizza className="w-8 h-8 text-yellow-300" />
          <h1 className="text-2xl font-black tracking-wider uppercase drop-shadow-md">Chick's Pizza</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(t => t === 'american' ? 'italian' : 'american')}
            className="bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{theme === 'american' ? '🇺🇸 American' : '🇮🇹 Italian Mode'}</span>
          </button>
          
          {gameState === 'playing' && (
            <div className="hidden sm:flex gap-6 text-sm md:text-base font-bold bg-black/30 px-4 py-2 rounded-full border border-white/20 shadow-inner">
              <span className="flex items-center gap-2 text-green-400">
                <Trophy className="w-5 h-5" /> Served: {pizzasServed}
              </span>
              <span className="flex items-center gap-2 text-yellow-400">
                <ChefHat className="w-5 h-5" /> Dough Left: {ingredients}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 relative">
        
        {/* Background Oven (Always there, looms ominously) */}
        <div className="absolute top-10 right-10 opacity-20 pointer-events-none">
          <div className="w-64 h-64 bg-black rounded-t-full border-8 border-gray-800 flex flex-wrap p-4 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="w-1/2 h-1/2 border-2 border-gray-700 flex items-end justify-center pb-2"><Flame className="text-orange-500 w-8 h-8 animate-pulse" /></div>
            <div className="w-1/2 h-1/2 border-2 border-gray-700 flex items-end justify-center pb-2"><Flame className="text-red-500 w-8 h-8 animate-pulse" /></div>
            <div className="w-1/2 h-1/2 border-2 border-gray-700 flex items-end justify-center pb-2"><Flame className="text-yellow-500 w-8 h-8 animate-pulse" /></div>
            <div className="w-1/2 h-1/2 border-2 border-gray-700 flex items-end justify-center pb-2"><Flame className="text-orange-600 w-8 h-8 animate-pulse" /></div>
            <div className="absolute -bottom-10 left-0 w-full text-center font-bold text-gray-800 text-lg sm:text-xl tracking-widest whitespace-nowrap">THE 4-CHAMBER BEAST</div>
          </div>
        </div>

        {/* --- INTRO SCREEN --- */}
        {gameState === 'intro' && (
          <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-yellow-400 text-center relative z-10 transform hover:scale-105 transition-transform duration-500 mx-2">
            <div className="text-5xl sm:text-6xl mb-4">👵🏼🍕</div>
            <h2 className="text-3xl sm:text-4xl font-black text-red-700 mb-6 uppercase">The Best Pizza Game Ever!</h2>
            <div className="text-left space-y-4 mb-8 text-base sm:text-lg font-medium text-gray-700">
              <p>Welcome to Chick's. The 29-year-old grey-haired legend is in the back.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>She's closed 9 months of the year.</li>
                <li>Open 3 days a week. 4 PM to 8 PM <span className="underline font-bold">ONLY</span>.</li>
                <li>We sell Wing Sauce with Pizza. <span className="text-red-600 font-bold uppercase">NO WINGS ON THE MENU. PIZZA ONLY.</span></li>
                <li>When the dough runs out, the phone gets unplugged.</li>
              </ul>
              <p className="italic text-gray-500 pt-4 text-center text-sm sm:text-base">Don't Hesitate !  Call before the cord gets pulled !</p>
            </div>
            <button 
              onClick={attemptToEnter}
              className="bg-green-600 hover:bg-green-500 text-white font-black text-xl sm:text-2xl py-3 sm:py-4 px-6 sm:px-10 rounded-full shadow-[0_6px_0_rgb(22,101,52)] hover:shadow-[0_2px_0_rgb(22,101,52)] hover:translate-y-1 transition-all w-full sm:w-auto"
            >
              ATTEMPT TO ENTER
            </button>
          </div>
        )}

        {/* --- CLOSED SCREEN --- */}
        {gameState === 'closed' && (
          <div className="max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-red-500 text-center relative z-10 mx-2">
            <Clock className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">LOCKED OUT!</h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8">{message}</p>
            <button 
              onClick={attemptToEnter}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg sm:text-xl py-3 px-6 sm:px-8 rounded-full shadow-[0_4px_0_rgb(30,58,138)] hover:shadow-[0_2px_0_rgb(30,58,138)] hover:translate-y-1 transition-all w-full sm:w-auto"
            >
              Lurk outside & try again
            </button>
          </div>
        )}

        {/* --- GAME OVER SCREEN --- */}
        {gameState === 'gameover' && (
          <div className="max-w-xl bg-black text-white p-6 sm:p-10 rounded-3xl shadow-2xl border-4 border-gray-700 text-center relative z-10 mx-2">
            <PhoneOff className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-red-500 mb-6 animate-bounce" />
            <h2 className="text-3xl sm:text-4xl font-black text-red-500 mb-4 uppercase tracking-widest">Phone Unplugged</h2>
            <p className="text-xl sm:text-2xl mb-2">Chick ran out of ingredients.</p>
            <p className="text-base sm:text-lg text-gray-400 mb-8">Shift is over. Go home.</p>
            
            <div className="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-dashed border-gray-600">
              <h3 className="text-yellow-400 font-bold text-lg sm:text-xl mb-2">Final Score</h3>
              <p className="text-4xl sm:text-5xl font-black">{pizzasServed} <span className="text-base sm:text-lg text-gray-300 block sm:inline mt-2 sm:mt-0">Masterpieces Created</span></p>
            </div>

            <button 
              onClick={restartGame}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-10 rounded-full shadow-[0_4px_0_rgb(161,98,7)] hover:shadow-[0_2px_0_rgb(161,98,7)] hover:translate-y-1 transition-all w-full sm:w-auto"
            >
              Wait 9 Months to Play Again
            </button>
          </div>
        )}

        {/* --- PLAYING SCREEN --- */}
        {gameState === 'playing' && (
          <div className="w-full max-w-3xl bg-white p-6 md:p-10 rounded-3xl shadow-2xl border-4 border-orange-300 relative z-10 flex flex-col items-center">
            
            {/* Chick's Commentary Box */}
            <div className="w-full bg-blue-50 border-l-8 border-blue-500 p-4 mb-8 rounded-r-xl shadow-sm flex items-start gap-4">
              <div className="text-4xl bg-white p-2 rounded-full shadow-sm border border-blue-100">👵🏼</div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1 text-sm uppercase tracking-wide">Chick Yells:</h4>
                <p className="text-xl font-medium text-gray-800 italic">"{message}"</p>
              </div>
            </div>

            {/* Phase 1: Pounding */}
            {phase === 'pounding' && (
              <div className="text-center w-full">
                <h3 className="text-2xl font-black text-orange-700 mb-6 uppercase tracking-wider">Phase 1: Subdue The Dough</h3>
                <div className="w-full bg-gray-200 h-6 rounded-full mb-8 overflow-hidden border-2 border-gray-300">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-75"
                    style={{ width: `${(poundCount / 15) * 100}%` }}
                  ></div>
                </div>
                <button 
                  onClick={handlePound}
                  className={`
                    bg-amber-100 border-8 border-amber-600 rounded-full w-48 h-48 mx-auto flex items-center justify-center
                    text-6xl shadow-xl transition-transform active:scale-90
                    ${isShaking ? 'animate-bounce bg-amber-200' : ''}
                  `}
                >
                  🥟
                </button>
                <p className="mt-6 text-gray-500 font-bold uppercase animate-pulse">Mash button to pound dough like a bad guy!</p>
              </div>
            )}

            {/* Phase 2: Topping */}
            {phase === 'topping' && (
              <div className="text-center w-full">
                <h3 className="text-2xl font-black text-red-600 mb-6 uppercase tracking-wider">Phase 2: Baseball Pitch Toppings</h3>
                
                <div className="relative w-full h-16 bg-gray-200 rounded-full mb-8 border-4 border-gray-300 overflow-hidden">
                  {/* Target Zone */}
                  <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-green-300 border-x-4 border-green-500"></div>
                  {/* Moving Cursor */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-12 bg-red-600 border-2 border-white rounded-md shadow-md z-10"
                    style={{ left: `calc(${sliderPos}% - 16px)` }}
                  ></div>
                </div>

                <button 
                  onClick={handleChuck}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-2xl py-6 px-12 rounded-full shadow-[0_8px_0_rgb(153,27,27)] hover:shadow-[0_4px_0_rgb(153,27,27)] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all w-full max-w-sm"
                >
                  CHUCK TOPPINGS!
                </button>
                <p className="mt-6 text-gray-500 font-bold uppercase">Click when the red marker is in the green zone!</p>
              </div>
            )}

            {/* Phase 3: Launching */}
            {phase === 'launching' && (
              <div className="text-center w-full">
                <h3 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-wider">Phase 3: Javelin Launch</h3>
                
                <div className="flex justify-center items-end h-48 mb-8 gap-4">
                  {/* Power Meter */}
                  <div className="relative w-16 h-full bg-gray-200 rounded-t-xl border-4 border-gray-400 overflow-hidden flex flex-col justify-end">
                    <div className="absolute top-0 w-full h-[15%] bg-green-400 border-b-4 border-green-600 z-10 opacity-50"></div>
                    <div 
                      className="w-full bg-gradient-to-t from-yellow-400 via-orange-500 to-red-600"
                      style={{ height: `${sliderPos}%` }}
                    ></div>
                  </div>
                  
                  {/* Oven Visual */}
                  <div className="w-32 h-40 bg-gray-900 rounded-t-full border-4 border-gray-700 relative overflow-hidden shadow-inner flex items-end justify-center pb-4">
                     <Flame className={`w-16 h-16 ${sliderPos > 85 ? 'text-red-500 scale-125' : 'text-orange-600'} transition-all`} />
                  </div>
                </div>

                <button 
                  onClick={handleLaunch}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-black text-2xl py-6 px-12 rounded-full shadow-[0_8px_0_rgb(31,41,55)] hover:shadow-[0_4px_0_rgb(31,41,55)] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all w-full max-w-sm"
                >
                  JAVELIN THROW!
                </button>
                <p className="mt-6 text-gray-500 font-bold uppercase">Wait for MAX POWER to reach the massive 4-chamber oven!</p>
              </div>
            )}

            {/* Phase 4: Baking */}
            {phase === 'baking' && (
              <div className="text-center w-full py-12">
                <Flame className="w-32 h-32 mx-auto text-orange-500 animate-pulse mb-6" />
                <h3 className="text-4xl font-black text-orange-600 uppercase tracking-widest animate-bounce">BAKING...</h3>
                <p className="mt-4 text-xl text-gray-600 font-medium">15 to 20 minutes later...</p>
              </div>
            )}

            {/* Phase 5: Served */}
            {phase === 'served' && (
              <div className="text-center w-full animate-fadeIn">
                <div className="relative inline-block mb-8">
                  <div className="text-8xl animate-bounce absolute z-20 -top-4 -right-4">✨</div>
                  <div className="text-9xl relative z-10 drop-shadow-2xl">🍕</div>
                  {/* Wing Sauce */}
                  <div className="absolute -bottom-4 -left-8 bg-orange-600 w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-30 group cursor-help">
                    <span className="text-white font-bold text-xs transform -rotate-12">SAUCE</span>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black text-white text-xs p-2 rounded w-32 pointer-events-none transition-opacity">
                      Mandatory wing sauce. NO WINGS.
                    </div>
                  </div>
                </div>
                
                <h3 className="text-4xl font-black text-green-600 mb-2 uppercase tracking-wider">WALLAH!</h3>
                <p className="text-xl text-gray-700 mb-8 font-bold">The absolute best pizza ever created.</p>

                <button 
                  onClick={handleNextPizza}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_rgb(161,98,7)] hover:shadow-[0_2px_0_rgb(161,98,7)] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all"
                >
                  NEXT ORDER
                </button>
              </div>
            )}
            
          </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="text-center p-4 text-xs sm:text-sm text-orange-800 font-medium opacity-80 z-10 mb-16 sm:mb-8 px-4">
        <p>THE BEST Pie you'll ever try. All thanks to Chick.</p>
      </footer>

      {/* C4 Discrete & Romantic Button */}
      <button 
        onClick={() => setShowC4Modal(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] sm:w-auto max-w-max bg-stone-900/60 backdrop-blur-md text-amber-100/70 hover:text-amber-200 font-serif text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] px-4 sm:px-6 py-2 rounded-full border border-stone-500/30 z-50 transition-all duration-1000 hover:shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:border-amber-700/50 flex flex-wrap items-center justify-center gap-2 sm:gap-3 opacity-70 hover:opacity-100 group text-center leading-tight"
      >
        <span className="text-red-700 opacity-60 group-hover:opacity-100 transition-opacity text-sm sm:text-base leading-none">❦</span>
        <span className="mt-0.5 flex-1 whitespace-normal">Developed & Maintained by C4 Technologies</span>
        <span className="text-green-700 opacity-60 group-hover:opacity-100 transition-opacity text-sm sm:text-base leading-none">❦</span>
      </button>

      {/* C4 FIRE MODAL */}
      {showC4Modal && (
        <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center p-4">
          {/* Fire Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-900 via-orange-600 to-transparent opacity-80 animate-pulse"></div>
          <div className="absolute inset-0 flex flex-wrap justify-around items-end overflow-hidden pb-10">
            {[...Array(20)].map((_, i) => (
              <Flame 
                key={i} 
                className="text-yellow-500 animate-bounce absolute bottom-0" 
                style={{ 
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 100 + 50}px`, 
                  height: `${Math.random() * 100 + 50}px`,
                  animationDelay: `${Math.random()}s`,
                  animationDuration: `${Math.random() + 0.5}s`
                }} 
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg">
            <h2 className="text-white text-4xl sm:text-5xl font-black text-center drop-shadow-[0_0_15px_rgba(255,0,0,1)] mb-4 tracking-widest whitespace-nowrap">
              C4 OVERRIDE
            </h2>
            
            {/* Pepperoni Button */}
<button 
  onClick={() => {
    window.location.href = 'https://patrick-lake.vercel.app';
  }}
  className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center p-4 transform hover:scale-110 transition-all relative overflow-hidden group rounded-full shadow-[0_0_80px_rgba(220,38,38,0.6)]"
>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-2xl">
                {/* Meat base */}
                <circle cx="50" cy="50" r="48" fill="#991b1b" stroke="#7f1d1d" strokeWidth="2" />
                <circle cx="50" cy="50" r="46" fill="#b91c1c" />
                {/* Fat marbling / texture highlights */}
                <path d="M 20 30 Q 30 20 40 30 T 60 20 T 80 40" stroke="#fca5a5" strokeWidth="1.5" fill="none" opacity="0.3" />
                <path d="M 15 60 Q 35 70 50 50 T 85 70" stroke="#fca5a5" strokeWidth="1" fill="none" opacity="0.2" />
                <path d="M 40 80 Q 50 90 70 75" stroke="#fca5a5" strokeWidth="2" fill="none" opacity="0.2" />
                
                {/* Spices / Darker meat spots */}
                <circle cx="30" cy="30" r="6" fill="#7f1d1d" opacity="0.8"/>
                <circle cx="70" cy="35" r="5" fill="#7f1d1d" opacity="0.7"/>
                <circle cx="45" cy="70" r="7" fill="#7f1d1d" opacity="0.8"/>
                <circle cx="25" cy="65" r="4" fill="#7f1d1d" opacity="0.6"/>
                <circle cx="80" cy="60" r="6" fill="#7f1d1d" opacity="0.8"/>
                <circle cx="55" cy="20" r="4" fill="#7f1d1d" opacity="0.7"/>
                <circle cx="65" cy="80" r="5" fill="#7f1d1d" opacity="0.6"/>
                <circle cx="15" cy="45" r="3" fill="#7f1d1d" opacity="0.8"/>
                <circle cx="50" cy="45" r="8" fill="#7f1d1d" opacity="0.5"/>
                
                {/* Inner shadow for 3D effect */}
                <circle cx="50" cy="50" r="48" fill="url(#pep-shadow)" opacity="0.4" />
                <defs>
                  <radialGradient id="pep-shadow" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                    <stop offset="70%" stopColor="black" stopOpacity="0" />
                    <stop offset="100%" stopColor="black" stopOpacity="0.6" />
                  </radialGradient>
                </defs>
              </svg>
              
              <span className="text-white font-black text-lg sm:text-xl text-center z-10 uppercase drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-tight tracking-wider px-4 w-full break-words">
                PROCEED:<br/><br/>C4<br/>DEVELOPMENT
              </span>
            </button>

            {/* Mushroom Button */}
            <button 
              onClick={() => setShowC4Modal(false)}
              className="w-48 h-40 sm:w-56 sm:h-48 flex items-center justify-center p-2 transform hover:scale-110 transition-all mt-4 relative overflow-visible drop-shadow-2xl"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
                {/* Stem */}
                <path d="M 40 50 L 40 95 C 40 98 45 100 50 100 C 55 100 60 98 60 95 L 60 50 Z" fill="#eaddcd" stroke="#a89f91" strokeWidth="2" />
                <path d="M 45 50 L 45 95 M 50 50 L 50 95 M 55 50 L 55 95" stroke="#d4c5b3" strokeWidth="1" />
                
                {/* Cap Base */}
                <path d="M 10 50 C 10 20 30 5 50 5 C 70 5 90 20 90 50 Z" fill="#f5ede3" stroke="#8c8275" strokeWidth="2" />
                
                {/* Gills (Underside of cap) */}
                <path d="M 10 50 Q 50 65 90 50 Z" fill="#bcaaa4" stroke="#8c8275" strokeWidth="2" />
                <path d="M 20 52 L 25 56 M 30 54 L 35 59 M 40 55 L 45 61 M 50 56 L 50 62 M 60 55 L 55 61 M 70 54 L 65 59 M 80 52 L 75 56" stroke="#8c8275" strokeWidth="1.5" opacity="0.7" />
                
                {/* Cap Shading */}
                <path d="M 10 50 C 10 20 30 5 50 5 C 70 5 90 20 90 50 Z" fill="url(#mush-shadow)" opacity="0.5" />
                
                <defs>
                  <radialGradient id="mush-shadow" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#8c8275" stopOpacity="0.5" />
                  </radialGradient>
                </defs>
              </svg>

               <span className="text-stone-900 font-black text-base sm:text-lg text-center z-10 uppercase drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] leading-tight absolute top-6 sm:top-8 left-0 right-0 px-4 flex flex-col items-center justify-center w-full">
                <span>ABORT:</span>
                <span className="mt-1">STAY WITH</span>
                <span>CHICK</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Tailwind standard utility classes injected via standard styling for Vercel/Next/CRA. No external CSS needed. */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        @keyframes flyOut {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
          20% { transform: translate(calc(var(--tx) * 0.2), calc(var(--ty) * 0.2)) scale(1.5) rotate(calc(var(--rot) * 0.2)); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot)); opacity: 0; }
        }
        .animate-fly-out {
          animation: flyOut 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes smokePoof {
          0% { transform: scale(0); opacity: 0.8; }
          50% { transform: scale(2); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
        .animate-smoke-poof {
          animation: smokePoof 2.0s ease-out forwards;
        }
      `}} />
    </div>
  );
}
