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

  // Refs for C4 modal focus management
  const c4TriggerRef = useRef(null);
  const c4CloseRef = useRef(null);

  // Close C4 modal on Escape; move focus in when opening, restore when closing
  useEffect(() => {
    if (!showC4Modal) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowC4Modal(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    // Defer focus until the modal content is mounted
    const focusTimer = window.setTimeout(() => {
      c4CloseRef.current?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', handleKey);
      window.clearTimeout(focusTimer);
      c4TriggerRef.current?.focus();
    };
  }, [showC4Modal]);

  // Intro logic - simulate her ridiculous schedule
  const attemptToEnter = () => {
    const randomChance = Math.random();
    if (randomChance < 0.3) {
      setGameState('closed');
      setMessage("It's currently one of the 9 months she's closed. Try again.");
    } else if (randomChance < 0.6) {
      setGameState('closed');
      setMessage("It's Tuesday. She's only open 4 days a week. Come back later.");
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
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden="true">
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
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden="true">
          <div className="w-64 h-64 bg-gray-500 rounded-full mix-blend-multiply opacity-80 animate-smoke-poof blur-2xl"></div>
          <div className="absolute w-48 h-48 bg-gray-700 rounded-full mix-blend-multiply opacity-90 animate-smoke-poof blur-xl" style={{animationDelay: '0.1s'}}></div>
          <div className="absolute w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply opacity-60 animate-smoke-poof blur-3xl" style={{animationDelay: '0.2s'}}></div>
        </div>
      )}

      {/* Floating Contacts */}
      <nav aria-label="Contact Chick's Pizza" className="fixed top-24 right-4 flex flex-col gap-4 z-50">
        <a
          href="tel:+13153937700"
          onClick={(e) => {
            if(gameState === 'playing') setMessage("Dialing Chick... She probably won't answer.");
          }}
          className="bg-green-700 text-white p-3 rounded-full shadow-lg hover:scale-110 focus-visible:scale-110 transition-transform flex items-center justify-center group relative min-w-[44px] min-h-[44px]"
          aria-label="Call Chick's Pizza at (315) 393-7700"
        >
          <Phone className="w-6 h-6 animate-pulse" aria-hidden="true" />
          <span className="absolute right-full mr-4 bg-black text-white px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg" aria-hidden="true">
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
          className="bg-blue-700 text-white p-3 rounded-full shadow-lg hover:scale-110 focus-visible:scale-110 transition-transform flex items-center justify-center group relative min-w-[44px] min-h-[44px]"
          aria-label="Directions to 1608 Ford St, Ogdensburg, NY (opens in a new tab)"
        >
          <MapPin className="w-6 h-6 animate-bounce" aria-hidden="true" />
          <span className="absolute right-full mr-4 bg-black text-white px-3 py-1 rounded text-sm font-bold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg" aria-hidden="true">
            GPS: 1608 Ford St
          </span>
        </a>
      </nav>

      {/* Header */}
      <header className={`${theme === 'italian' ? 'bg-green-800 border-b-4 border-red-600' : 'bg-red-700'} text-white p-4 shadow-xl flex justify-between items-center z-10`}>
        <div className="flex items-center gap-2">
          <Pizza className="w-8 h-8 text-yellow-300" aria-hidden="true" />
          <h1 className="text-2xl font-black tracking-wider uppercase drop-shadow-md">Chick's Pizza</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTheme(t => t === 'american' ? 'italian' : 'american')}
            aria-pressed={theme === 'italian'}
            aria-label={`Switch to ${theme === 'american' ? 'Italian' : 'American'} theme`}
            className="bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors min-h-[32px]"
          >
            <Palette className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline" aria-hidden="true">{theme === 'american' ? '🇺🇸 American' : '🇮🇹 Italian Mode'}</span>
          </button>

          {gameState === 'playing' && (
            <div
              className="hidden sm:flex gap-6 text-sm md:text-base font-bold bg-black/40 px-4 py-2 rounded-full border border-white/20 shadow-inner"
              role="status"
              aria-label={`Pizzas served ${pizzasServed}. Dough remaining ${ingredients}.`}
            >
              <span className="flex items-center gap-2 text-green-300" aria-hidden="true">
                <Trophy className="w-5 h-5" /> Served: {pizzasServed}
              </span>
              <span className="flex items-center gap-2 text-yellow-200" aria-hidden="true">
                <ChefHat className="w-5 h-5" /> Dough Left: {ingredients}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className="flex-grow flex items-center justify-center p-4 relative focus:outline-none">

        {/* Background Oven (Always there, looms ominously) */}
        <div className="absolute top-10 right-10 opacity-20 pointer-events-none" aria-hidden="true">
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
            <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true">👵🏼🍕</div>
            <h2 className="text-3xl sm:text-4xl font-black text-red-700 mb-6 uppercase">The Best Pizza Game Ever!</h2>
            <div className="text-left space-y-4 mb-8 text-base sm:text-lg font-medium text-gray-700">
              <p>Welcome to Chick's. The 29-year-old grey-haired legend is in the back.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>She's closed 9 months of the year.</li>
                <li>Open 4 days a week. 4 PM to 8 PM <span className="underline font-bold">ONLY</span>.</li>
                <li>We sell Wing Sauce with Pizza. <span className="text-red-600 font-bold uppercase">NO WINGS ON THE MENU. PIZZA ONLY.</span></li>
                <li>When the dough runs out, the phone gets unplugged.</li>
              </ul>
              <p className="italic text-gray-500 pt-4 text-center text-sm sm:text-base">Don't Hesitate !  Call before the cord gets pulled !</p>
            </div>
            <button
              type="button"
              onClick={attemptToEnter}
              className="bg-green-700 hover:bg-green-600 text-white font-black text-xl sm:text-2xl py-3 sm:py-4 px-6 sm:px-10 rounded-full shadow-[0_6px_0_rgb(22,101,52)] hover:shadow-[0_2px_0_rgb(22,101,52)] hover:translate-y-1 transition-all w-full sm:w-auto"
            >
              ATTEMPT TO ENTER
            </button>
          </div>
        )}

        {/* --- CLOSED SCREEN --- */}
        {gameState === 'closed' && (
          <div className="max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border-4 border-red-600 text-center relative z-10 mx-2">
            <Clock className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-red-600 mb-4" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">LOCKED OUT!</h2>
            <p className="text-lg sm:text-xl text-gray-800 mb-8" role="status" aria-live="polite">{message}</p>
            <button
              type="button"
              onClick={attemptToEnter}
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-lg sm:text-xl py-3 px-6 sm:px-8 rounded-full shadow-[0_4px_0_rgb(30,58,138)] hover:shadow-[0_2px_0_rgb(30,58,138)] hover:translate-y-1 transition-all w-full sm:w-auto"
            >
              Lurk outside & try again
            </button>
          </div>
        )}

        {/* --- GAME OVER SCREEN --- */}
        {gameState === 'gameover' && (
          <div className="max-w-xl bg-black text-white p-6 sm:p-10 rounded-3xl shadow-2xl border-4 border-gray-700 text-center relative z-10 mx-2">
            <PhoneOff className="w-20 h-20 sm:w-24 sm:h-24 mx-auto text-red-500 mb-6 animate-bounce" aria-hidden="true" />
            <h2 className="text-3xl sm:text-4xl font-black text-red-400 mb-4 uppercase tracking-widest">Phone Unplugged</h2>
            <p className="text-xl sm:text-2xl mb-2">Chick ran out of ingredients.</p>
            <p className="text-base sm:text-lg text-gray-300 mb-8">Shift is over. Go home.</p>

            <div className="bg-gray-800 rounded-xl p-6 mb-8 border-2 border-dashed border-gray-600" role="status" aria-label={`Final score: ${pizzasServed} masterpieces created`}>
              <h3 className="text-yellow-300 font-bold text-lg sm:text-xl mb-2">Final Score</h3>
              <p className="text-4xl sm:text-5xl font-black">{pizzasServed} <span className="text-base sm:text-lg text-gray-200 block sm:inline mt-2 sm:mt-0">Masterpieces Created</span></p>
            </div>

            <button
              type="button"
              onClick={restartGame}
              className="bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg sm:text-xl py-3 sm:py-4 px-6 sm:px-10 rounded-full shadow-[0_4px_0_rgb(161,98,7)] hover:shadow-[0_2px_0_rgb(161,98,7)] hover:translate-y-1 transition-all w-full sm:w-auto"
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
              <div className="text-4xl bg-white p-2 rounded-full shadow-sm border border-blue-100" aria-hidden="true">👵🏼</div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1 text-sm uppercase tracking-wide" id="chick-commentary-label">Chick Yells:</h4>
                <p
                  className="text-xl font-medium text-gray-900 italic"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-labelledby="chick-commentary-label"
                >"{message}"</p>
              </div>
            </div>

            {/* Phase 1: Pounding */}
            {phase === 'pounding' && (
              <div className="text-center w-full">
                <h3 className="text-2xl font-black text-orange-700 mb-6 uppercase tracking-wider">Phase 1: Subdue The Dough</h3>
                <div
                  className="w-full bg-gray-200 h-6 rounded-full mb-8 overflow-hidden border-2 border-gray-300"
                  role="progressbar"
                  aria-label="Dough pounding progress"
                  aria-valuemin={0}
                  aria-valuemax={15}
                  aria-valuenow={poundCount}
                  aria-valuetext={`${poundCount} of 15 pounds`}
                >
                  <div
                    className="h-full bg-orange-600 transition-all duration-75"
                    style={{ width: `${(poundCount / 15) * 100}%` }}
                  ></div>
                </div>
                <button
                  type="button"
                  onClick={handlePound}
                  aria-label={`Pound the dough. ${poundCount} of 15 pounds complete.`}
                  className={`
                    bg-amber-100 border-8 border-amber-600 rounded-full w-48 h-48 mx-auto flex items-center justify-center
                    text-6xl shadow-xl transition-transform active:scale-90
                    ${isShaking ? 'animate-bounce bg-amber-200' : ''}
                  `}
                >
                  <span aria-hidden="true">🥟</span>
                </button>
                <p className="mt-6 text-gray-700 font-bold uppercase animate-pulse">Mash button to pound dough like a bad guy!</p>
              </div>
            )}

            {/* Phase 2: Topping */}
            {phase === 'topping' && (
              <div className="text-center w-full">
                <h3 className="text-2xl font-black text-red-700 mb-6 uppercase tracking-wider">Phase 2: Baseball Pitch Toppings</h3>

                <div
                  className="relative w-full h-16 bg-gray-200 rounded-full mb-8 border-4 border-gray-300 overflow-hidden"
                  role="progressbar"
                  aria-label="Topping aim. Press the chuck button when marker is in the 40 to 60 percent zone."
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(sliderPos)}
                  aria-valuetext={sliderPos > 40 && sliderPos < 60 ? 'Marker in target zone' : 'Marker outside target zone'}
                >
                  {/* Target Zone */}
                  <div className="absolute top-0 bottom-0 left-[40%] right-[40%] bg-green-300 border-x-4 border-green-600" aria-hidden="true"></div>
                  {/* Moving Cursor */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-12 bg-red-600 border-2 border-white rounded-md shadow-md z-10"
                    style={{ left: `calc(${sliderPos}% - 16px)` }}
                    aria-hidden="true"
                  ></div>
                </div>

                <button
                  type="button"
                  onClick={handleChuck}
                  className="bg-red-700 hover:bg-red-600 text-white font-black text-2xl py-6 px-12 rounded-full shadow-[0_8px_0_rgb(127,29,29)] hover:shadow-[0_4px_0_rgb(127,29,29)] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all w-full max-w-sm"
                >
                  CHUCK TOPPINGS!
                </button>
                <p className="mt-6 text-gray-700 font-bold uppercase">Click when the red marker is in the green zone!</p>
              </div>
            )}

            {/* Phase 3: Launching */}
            {phase === 'launching' && (
              <div className="text-center w-full">
                <h3 className="text-2xl font-black text-gray-800 mb-6 uppercase tracking-wider">Phase 3: Javelin Launch</h3>

                <div className="flex justify-center items-end h-48 mb-8 gap-4">
                  {/* Power Meter */}
                  <div
                    className="relative w-16 h-full bg-gray-200 rounded-t-xl border-4 border-gray-400 overflow-hidden flex flex-col justify-end"
                    role="progressbar"
                    aria-label="Launch power. Fire the javelin above 85 percent."
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(sliderPos)}
                    aria-valuetext={sliderPos > 85 ? 'Max power — launch now' : 'Power building'}
                  >
                    <div className="absolute top-0 w-full h-[15%] bg-green-400 border-b-4 border-green-600 z-10 opacity-50" aria-hidden="true"></div>
                    <div
                      className="w-full bg-gradient-to-t from-yellow-400 via-orange-500 to-red-600"
                      style={{ height: `${sliderPos}%` }}
                      aria-hidden="true"
                    ></div>
                  </div>

                  {/* Oven Visual */}
                  <div className="w-32 h-40 bg-gray-900 rounded-t-full border-4 border-gray-700 relative overflow-hidden shadow-inner flex items-end justify-center pb-4" aria-hidden="true">
                     <Flame className={`w-16 h-16 ${sliderPos > 85 ? 'text-red-500 scale-125' : 'text-orange-600'} transition-all`} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLaunch}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-black text-2xl py-6 px-12 rounded-full shadow-[0_8px_0_rgb(31,41,55)] hover:shadow-[0_4px_0_rgb(31,41,55)] hover:translate-y-1 active:translate-y-2 active:shadow-none transition-all w-full max-w-sm"
                >
                  JAVELIN THROW!
                </button>
                <p className="mt-6 text-gray-700 font-bold uppercase">Wait for MAX POWER to reach the massive 4-chamber oven!</p>
              </div>
            )}

            {/* Phase 4: Baking */}
            {phase === 'baking' && (
              <div className="text-center w-full py-12">
                <Flame className="w-32 h-32 mx-auto text-orange-600 animate-pulse mb-6" aria-hidden="true" />
                <h3 className="text-4xl font-black text-orange-700 uppercase tracking-widest animate-bounce">BAKING...</h3>
                <p className="mt-4 text-xl text-gray-700 font-medium">15 to 20 minutes later...</p>
              </div>
            )}

            {/* Phase 5: Served */}
            {phase === 'served' && (
              <div className="text-center w-full animate-fadeIn">
                <div className="relative inline-block mb-8">
                  <div className="text-6xl animate-bounce absolute z-20 -top-4 -right-4" aria-hidden="true">✨</div>
                  {/* Chick's round pie, tavern-cut into squares, viewed from above */}
                  <svg
                    viewBox="0 0 140 140"
                    className="w-56 h-56 sm:w-64 sm:h-64 relative z-10 drop-shadow-2xl"
                    role="img"
                    aria-label="Chick's round pizza cut into squares, topped with pepperoni, crumbled sausage, mushrooms, green peppers, onions, and black olives over cheese and deep red sauce, with a bubbly floury char-spotted crust and orange wing sauce drizzle"
                  >
                    <defs>
                      <clipPath id="cheeseArea">
                        <circle cx="70" cy="70" r="50" />
                      </clipPath>
                    </defs>

                    {/* Wing-sauce splatter on the pizza paper around the pie */}
                    <circle cx="16" cy="22" r="1.5" fill="#ea580c" opacity="0.5" />
                    <circle cx="126" cy="18" r="2" fill="#ea580c" opacity="0.55" />
                    <circle cx="132" cy="62" r="1.3" fill="#ea580c" opacity="0.5" />
                    <circle cx="123" cy="120" r="1.8" fill="#ea580c" opacity="0.55" />
                    <circle cx="70" cy="136" r="1.2" fill="#ea580c" opacity="0.5" />
                    <circle cx="12" cy="115" r="1.6" fill="#ea580c" opacity="0.55" />
                    <ellipse cx="8" cy="78" rx="1.3" ry="0.8" fill="#ea580c" opacity="0.5" />
                    <circle cx="38" cy="6" r="1" fill="#fb923c" opacity="0.5" />
                    <circle cx="110" cy="134" r="1" fill="#fb923c" opacity="0.5" />

                    {/* Crust outer base */}
                    <circle cx="70" cy="70" r="60" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
                    <circle cx="70" cy="70" r="60" fill="#fbbf24" opacity="0.25" />

                    {/* Deep red sauce ring */}
                    <circle cx="70" cy="70" r="55" fill="#7f1d1d" />
                    <circle cx="70" cy="70" r="55" fill="#450a0a" opacity="0.2" />

                    {/* Cheese layer */}
                    <circle cx="70" cy="70" r="50" fill="#fde68a" stroke="#f59e0b" strokeWidth="0.4" />

                    {/* Everything on the cheese, clipped to the inner circle */}
                    <g clipPath="url(#cheeseArea)">
                      {/* Red sauce peeking through cheese */}
                      <ellipse cx="50" cy="42" rx="5" ry="3" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="90" cy="55" rx="6" ry="4" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="60" cy="80" rx="5" ry="3" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="100" cy="90" rx="4" ry="3" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="45" cy="95" rx="5" ry="3" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="80" cy="105" rx="4" ry="2.5" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="105" cy="50" rx="4" ry="2.5" fill="#b91c1c" opacity="0.32" />
                      <ellipse cx="35" cy="65" rx="4" ry="2.5" fill="#b91c1c" opacity="0.32" />

                      {/* Wing-sauce drizzle */}
                      <path d="M 22 50 C 50 45 90 55 118 48" stroke="#ea580c" strokeWidth="1.8" fill="none" opacity="0.85" strokeLinecap="round" />
                      <path d="M 22 75 C 52 80 88 70 118 78" stroke="#ea580c" strokeWidth="1.8" fill="none" opacity="0.85" strokeLinecap="round" />
                      <path d="M 25 100 C 50 95 90 105 115 98" stroke="#ea580c" strokeWidth="1.6" fill="none" opacity="0.8" strokeLinecap="round" />

                      {/* Square-cut grid — thin dark-red lines where the knife separated the cheese */}
                      <g stroke="#7f1d1d" strokeWidth="1" opacity="0.55" strokeLinecap="round">
                        <line x1="40" y1="0" x2="40" y2="140" />
                        <line x1="70" y1="0" x2="70" y2="140" />
                        <line x1="100" y1="0" x2="100" y2="140" />
                        <line x1="0" y1="40" x2="140" y2="40" />
                        <line x1="0" y1="70" x2="140" y2="70" />
                        <line x1="0" y1="100" x2="140" y2="100" />
                      </g>

                      {/* Pepperoni */}
                      <circle cx="45" cy="48" r="3.8" fill="#991b1b" />
                      <circle cx="88" cy="42" r="4.2" fill="#991b1b" />
                      <circle cx="95" cy="82" r="4" fill="#991b1b" />
                      <circle cx="50" cy="100" r="3.8" fill="#991b1b" />
                      <circle cx="72" cy="58" r="3.5" fill="#991b1b" />
                      <circle cx="33" cy="75" r="3.4" fill="#991b1b" />
                      <circle cx="110" cy="70" r="3.2" fill="#991b1b" />
                      <circle cx="80" cy="95" r="3.3" fill="#991b1b" />

                      {/* Crumbled sausage */}
                      <g fill="#78350f">
                        <ellipse cx="58" cy="36" rx="2.2" ry="1.5" />
                        <ellipse cx="61" cy="38" rx="1.7" ry="1.1" />
                        <ellipse cx="64" cy="35" rx="1.6" ry="1.1" />
                        <ellipse cx="83" cy="60" rx="2.2" ry="1.5" />
                        <ellipse cx="80" cy="62" rx="1.5" ry="1" />
                        <ellipse cx="68" cy="85" rx="2.2" ry="1.5" />
                        <ellipse cx="65" cy="87" rx="1.5" ry="1" />
                        <ellipse cx="42" cy="85" rx="2" ry="1.3" />
                        <ellipse cx="45" cy="87" rx="1.6" ry="1" />
                        <ellipse cx="100" cy="105" rx="2" ry="1.3" />
                        <ellipse cx="103" cy="107" rx="1.5" ry="0.9" />
                        <ellipse cx="115" cy="55" rx="1.8" ry="1.1" />
                        <ellipse cx="117" cy="58" rx="1.3" ry="0.9" />
                      </g>
                      <g fill="#92400e">
                        <ellipse cx="62" cy="37" rx="1.2" ry="0.8" />
                        <ellipse cx="85" cy="61" rx="1.2" ry="0.8" />
                        <ellipse cx="69" cy="86" rx="1.2" ry="0.8" />
                        <ellipse cx="44" cy="86" rx="1" ry="0.7" />
                      </g>

                      {/* Mushroom slices */}
                      <g fill="#d6bea1" stroke="#8b6f52" strokeWidth="0.4">
                        <path d="M 48 62 C 50 58 56 58 58 63 C 58 67 52 68 48 66 C 46 64 46 63 48 62 Z" />
                        <path d="M 75 48 C 77 44 83 44 85 49 C 85 53 79 54 75 52 C 73 50 73 49 75 48 Z" />
                        <path d="M 100 72 C 102 68 108 68 110 73 C 110 77 104 78 100 76 C 98 74 98 73 100 72 Z" />
                        <path d="M 42 100 C 44 96 50 96 52 101 C 52 105 46 106 42 104 C 40 102 40 101 42 100 Z" />
                        <path d="M 82 76 C 84 72 90 72 92 77 C 92 81 86 82 82 80 C 80 78 80 77 82 76 Z" />
                        <path d="M 60 108 C 62 104 68 104 70 109 C 70 113 64 114 60 112 C 58 110 58 109 60 108 Z" />
                        <path d="M 110 95 C 112 91 118 91 120 96 C 120 100 114 101 110 99 C 108 97 108 96 110 95 Z" />
                      </g>

                      {/* Green peppers */}
                      <g fill="#15803d" stroke="#166534" strokeWidth="0.4">
                        <path d="M 55 68 q 5 -2 10 1 q -2 3 -6 3 q -4 -1 -4 -4 z" />
                        <path d="M 88 100 q 5 -2 9 1 q -2 3 -5 3 q -3 -1 -4 -4 z" />
                        <path d="M 105 55 q 4 -2 8 1 q -2 3 -5 3 q -3 -1 -3 -4 z" />
                        <path d="M 38 82 q 4 -2 8 1 q -2 3 -5 3 q -3 -1 -3 -4 z" fill="#16a34a" />
                        <path d="M 60 112 q 4 -2 7 0 q -1 2 -3 3 q -3 0 -4 -3 z" />
                        <path d="M 95 62 q 4 -2 7 0 q -1 2 -3 3 q -3 0 -4 -3 z" />
                      </g>

                      {/* Black olive slices */}
                      <circle cx="50" cy="60" r="2.3" fill="#171717" />
                      <circle cx="50" cy="60" r="0.9" fill="#fde68a" />
                      <circle cx="90" cy="78" r="2.5" fill="#171717" />
                      <circle cx="90" cy="78" r="1" fill="#fde68a" />
                      <circle cx="73" cy="108" r="2.3" fill="#171717" />
                      <circle cx="73" cy="108" r="0.9" fill="#fde68a" />
                      <circle cx="105" cy="62" r="2.3" fill="#171717" />
                      <circle cx="105" cy="62" r="0.9" fill="#fde68a" />
                      <circle cx="36" cy="55" r="2" fill="#171717" />
                      <circle cx="36" cy="55" r="0.8" fill="#fde68a" />

                      {/* Onion slivers */}
                      <g fill="#f8fafc" opacity="0.9" stroke="#94a3b8" strokeWidth="0.4">
                        <path d="M 55 78 q 4 -1 7 1 q -1 2 -4 2 q -2 -1 -3 -3 z" />
                        <path d="M 85 92 q 4 -1 7 1 q -1 2 -4 2 q -2 -1 -3 -3 z" />
                        <path d="M 68 45 q 4 -1 7 1 q -1 2 -4 2 q -2 -1 -3 -3 z" />
                        <path d="M 42 70 q 4 -1 7 1 q -1 2 -4 2 q -2 -1 -3 -3 z" />
                      </g>
                    </g>

                    {/* Cornicione detail — char, bubbles, flour on the outer ring */}
                    <ellipse cx="70" cy="14" rx="2.8" ry="1.3" fill="#0c0a09" opacity="0.75" />
                    <ellipse cx="113" cy="30" rx="2.5" ry="1.2" fill="#0c0a09" opacity="0.7" transform="rotate(-40 113 30)" />
                    <ellipse cx="125" cy="70" rx="1.3" ry="2.8" fill="#0c0a09" opacity="0.72" />
                    <ellipse cx="113" cy="110" rx="2.5" ry="1.2" fill="#0c0a09" opacity="0.7" transform="rotate(40 113 110)" />
                    <ellipse cx="70" cy="126" rx="2.8" ry="1.3" fill="#0c0a09" opacity="0.72" />
                    <ellipse cx="28" cy="110" rx="2.5" ry="1.2" fill="#0c0a09" opacity="0.7" transform="rotate(-40 28 110)" />
                    <ellipse cx="15" cy="70" rx="1.3" ry="2.8" fill="#0c0a09" opacity="0.75" />
                    <ellipse cx="28" cy="30" rx="2.5" ry="1.2" fill="#0c0a09" opacity="0.7" transform="rotate(40 28 30)" />

                    <circle cx="50" cy="15" r="1.3" fill="#fde68a" opacity="0.7" />
                    <circle cx="95" cy="18" r="1.2" fill="#fde68a" opacity="0.65" />
                    <circle cx="122" cy="50" r="1.1" fill="#fed7aa" opacity="0.65" />
                    <circle cx="123" cy="92" r="1.3" fill="#fde68a" opacity="0.7" />
                    <circle cx="95" cy="122" r="1.2" fill="#fde68a" opacity="0.65" />
                    <circle cx="45" cy="124" r="1.2" fill="#fed7aa" opacity="0.6" />
                    <circle cx="16" cy="92" r="1.2" fill="#fde68a" opacity="0.7" />
                    <circle cx="18" cy="48" r="1.1" fill="#fed7aa" opacity="0.6" />
                    <circle cx="40" cy="18" r="0.9" fill="#fde68a" opacity="0.65" />

                    <circle cx="60" cy="13" r="0.6" fill="#fef9c3" opacity="0.9" />
                    <circle cx="80" cy="14" r="0.7" fill="#fef9c3" opacity="0.9" />
                    <circle cx="103" cy="22" r="0.5" fill="#fef9c3" opacity="0.85" />
                    <circle cx="119" cy="40" r="0.6" fill="#fef9c3" opacity="0.9" />
                    <circle cx="126" cy="60" r="0.5" fill="#fef9c3" opacity="0.85" />
                    <circle cx="121" cy="84" r="0.7" fill="#fef9c3" opacity="0.9" />
                    <circle cx="108" cy="104" r="0.5" fill="#fef9c3" opacity="0.85" />
                    <circle cx="88" cy="121" r="0.6" fill="#fef9c3" opacity="0.9" />
                    <circle cx="60" cy="128" r="0.5" fill="#fef9c3" opacity="0.85" />
                    <circle cx="40" cy="121" r="0.7" fill="#fef9c3" opacity="0.9" />
                    <circle cx="22" cy="104" r="0.5" fill="#fef9c3" opacity="0.85" />
                    <circle cx="13" cy="82" r="0.6" fill="#fef9c3" opacity="0.9" />
                    <circle cx="14" cy="60" r="0.7" fill="#fef9c3" opacity="0.9" />
                    <circle cx="22" cy="38" r="0.5" fill="#fef9c3" opacity="0.85" />
                    <circle cx="38" cy="20" r="0.6" fill="#fef9c3" opacity="0.9" />

                    {/* Final dark rim stroke */}
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#7c2d12" strokeWidth="0.8" />
                  </svg>
                  {/* Wing Sauce */}
                  <div
                    className="absolute -bottom-4 -left-8 bg-orange-700 w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-30 group cursor-help"
                    tabIndex={0}
                    role="note"
                    aria-label="Mandatory wing sauce. No wings on the menu."
                  >
                    <span className="text-white font-bold text-xs transform -rotate-12" aria-hidden="true">SAUCE</span>
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 bottom-full mb-2 bg-black text-white text-xs p-2 rounded w-32 pointer-events-none transition-opacity" aria-hidden="true">
                      Mandatory wing sauce. NO WINGS.
                    </div>
                  </div>
                </div>

                <h3 className="text-4xl font-black text-green-700 mb-2 uppercase tracking-wider">WALLAH!</h3>
                <p className="text-xl text-gray-800 mb-8 font-bold">The absolute best pizza ever created — cut square, the way Chick does it.</p>

                <button
                  type="button"
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
        type="button"
        ref={c4TriggerRef}
        onClick={() => setShowC4Modal(true)}
        aria-haspopup="dialog"
        aria-expanded={showC4Modal}
        aria-controls="c4-dialog"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95vw] sm:w-auto max-w-max bg-stone-900/70 backdrop-blur-md text-amber-100 hover:text-amber-100 font-serif text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.2em] px-4 sm:px-6 py-2 rounded-full border border-stone-500/50 z-50 transition-all duration-1000 hover:shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:border-amber-700/70 flex flex-wrap items-center justify-center gap-2 sm:gap-3 group text-center leading-tight min-h-[32px]"
      >
        <span className="text-red-400 group-hover:text-red-300 transition-colors text-sm sm:text-base leading-none" aria-hidden="true">❦</span>
        <span className="mt-0.5 flex-1 whitespace-normal">Developed &amp; Maintained by C4 Technologies</span>
        <span className="text-green-400 group-hover:text-green-300 transition-colors text-sm sm:text-base leading-none" aria-hidden="true">❦</span>
      </button>

      {/* C4 FIRE MODAL */}
      {showC4Modal && (
        <div
          id="c4-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="c4-dialog-title"
          className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center p-4"
        >
          {/* Fire Background Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-900 via-orange-600 to-transparent opacity-80 animate-pulse" aria-hidden="true"></div>
          <div className="absolute inset-0 flex flex-wrap justify-around items-end overflow-hidden pb-10" aria-hidden="true">
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
            <h2 id="c4-dialog-title" className="text-white text-4xl sm:text-5xl font-black text-center drop-shadow-[0_0_15px_rgba(255,0,0,1)] mb-4 tracking-widest whitespace-nowrap">
              C4 OVERRIDE
            </h2>
            
            {/* Pepperoni Button */}
<button
  type="button"
  onClick={() => {
    window.location.href = 'https://c4technologies.pages.dev';
  }}
  aria-label="Proceed to C4 Development (leaves Chick's Pizza)"
  className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center p-4 transform hover:scale-110 transition-all relative overflow-hidden group rounded-full shadow-[0_0_80px_rgba(220,38,38,0.6)]"
>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-2xl" aria-hidden="true">
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
              type="button"
              ref={c4CloseRef}
              onClick={() => setShowC4Modal(false)}
              aria-label="Abort — close dialog and stay with Chick's Pizza"
              className="w-48 h-40 sm:w-56 sm:h-48 flex items-center justify-center p-2 transform hover:scale-110 transition-all mt-4 relative overflow-visible drop-shadow-2xl"
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
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
