import { useState, useEffect, useRef } from 'react'
import { WebApp } from '@grammyjs/web-app'
import './App.css';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        enableClosingConfirmation: () => void
        setBackgroundColor: (color: string) => void
        colorScheme: string
        themeParams: any
      }
    }
  }
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TestQuestion {
  question: string
  field: string
  options?: Record<string, string>
}

// Base test questions
const baseTest: TestQuestion[] = [
  {
    question: "On a scale of 1-10, how satisfied are you with your life right now?",
    field: "lifeSatisfaction"
  },
  {
    question: "Which area of your life needs the most attention?\na) Health\nb) Relationships\nc) Career/Money\nd) Confidence/Mindset\ne) Focus/Discipline",
    field: "priorityArea",
    options: {
      "a": "health",
      "b": "relationships",
      "c": "career",
      "d": "confidence",
      "e": "focus"
    }
  },
  {
    question: "How would you describe your current mindset?\na) Stuck\nb) Don't know what I want\nc) Making progress\nd) Lost/overwhelmed",
    field: "currentMindset",
    options: {
      "a": "stuck",
      "b": "unsure",
      "c": "progress",
      "d": "lost"
    }
  },
  {
    question: "What's your energy level like?\na) Low\nb) Scattered\nc) Productive\nd) High/focused",
    field: "energyLevel",
    options: {
      "a": "low",
      "b": "scattered",
      "c": "productive",
      "d": "high"
    }
  },
  {
    question: "What's your biggest internal blocker?\na) Fear/doubt\nb) Procrastination\nc) Overthinking\nd) Lack of clarity\ne) Emotional overwhelm",
    field: "internalBlocker",
    options: {
      "a": "fear",
      "b": "procrastination",
      "c": "overthinking",
      "d": "clarity",
      "e": "emotional"
    }
  },
  {
    question: "How do you follow through with habits?\na) Plan but don't act\nb) Start but don't finish\nc) Only when motivated\nd) Consistent",
    field: "followThroughHabits",
    options: {
      "a": "planner",
      "b": "starter",
      "c": "motivated",
      "d": "consistent"
    }
  },
  {
    question: "What support style works best for you?\na) Push me\nb) Encourage me\nc) Ask questions\nd) Give structure",
    field: "preferredSupportStyle",
    options: {
      "a": "push",
      "b": "encourage",
      "c": "questions",
      "d": "structure"
    }
  },
  {
    question: "How do you make decisions?\na) Logic\nb) Emotion\nc) Overthink\nd) Gut",
    field: "decisionStyle",
    options: {
      "a": "logic",
      "b": "emotions",
      "c": "overthink",
      "d": "gut"
    }
  },
  {
    question: "What's your self-talk like when you fail?\na) Hard on self\nb) Shut down\nc) Problem-solve\nd) Bounce back",
    field: "selfTalkInFailure",
    options: {
      "a": "critical",
      "b": "shutdown",
      "c": "solver",
      "d": "resilient"
    }
  },
  {
    question: "How ready are you for change?\na) Small shifts\nb) Bold moves\nc) Habit upgrades\nd) Deep mindset",
    field: "changeReadiness",
    options: {
      "a": "small",
      "b": "bold",
      "c": "habits",
      "d": "deep"
    }
  }
];

interface AppProps {
  isTelegramWebApp?: boolean;
}

function App({ isTelegramWebApp: initialIsTelegramWebApp = false }: AppProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'coach' | 'dashboard' | 'tests' | 'profile'>('coach')
  const [currentStep, setCurrentStep] = useState<'initial' | 'test' | 'chat'>('initial')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isReady, setIsReady] = useState(false)
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(initialIsTelegramWebApp)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize Telegram Web App
  useEffect(() => {
    const initTelegramWebApp = () => {
      if (window.Telegram?.WebApp) {
        try {
          // Initialize the Web App
          window.Telegram.WebApp.ready();
          
          // Get Telegram theme colors and parameters
          const colorScheme = window.Telegram.WebApp.colorScheme;
          const themeParams = window.Telegram.WebApp.themeParams;
          
          // Set the background color based on Telegram's theme
          const bgColor = colorScheme === 'dark' ? '#1C1C1E' : '#ffffff';
          window.Telegram.WebApp.setBackgroundColor(bgColor);
          
          // Update CSS variables based on Telegram theme
          document.documentElement.style.setProperty('--tg-theme-bg-color', bgColor);
          document.documentElement.style.setProperty('--tg-theme-text-color', colorScheme === 'dark' ? '#ffffff' : '#000000');
          document.documentElement.style.setProperty('--tg-theme-hint-color', colorScheme === 'dark' ? '#8e8e93' : '#8e8e93');
          document.documentElement.style.setProperty('--tg-theme-link-color', themeParams?.link_color || '#0A84FF');
          document.documentElement.style.setProperty('--tg-theme-button-color', themeParams?.button_color || '#0A84FF');
          document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams?.button_text_color || '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0');
          
          // Expand the Web App to full height
          window.Telegram.WebApp.expand();
          
          // Enable closing confirmation if needed
          window.Telegram.WebApp.enableClosingConfirmation();
          
          // Add a class to the body to indicate Telegram Web App
          document.body.classList.add('telegram-webapp');
          
          setIsTelegramWebApp(true);
          console.log('Telegram Web App initialized successfully');
        } catch (error) {
          console.error('Error initializing Telegram Web App:', error);
          setIsTelegramWebApp(false);
        }
      } else {
        console.log('Telegram Web App not available');
        setIsTelegramWebApp(false);
      }
      
      setIsReady(true);
    };

    // Add event listener for when the Telegram Web App script is loaded
    if (document.readyState === 'complete') {
      initTelegramWebApp();
    } else {
      window.addEventListener('load', initTelegramWebApp);
      return () => window.removeEventListener('load', initTelegramWebApp);
    }
  }, []);

  // Add a second useEffect to handle Telegram theme changes
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const handleThemeChange = () => {
        const colorScheme = window.Telegram.WebApp.colorScheme
        const themeParams = window.Telegram.WebApp.themeParams
        
        // Update background color
        const bgColor = colorScheme === 'dark' ? '#1C1C1E' : '#ffffff'
        window.Telegram.WebApp.setBackgroundColor(bgColor)
        
        // Update CSS variables
        document.documentElement.style.setProperty('--tg-theme-bg-color', bgColor)
        document.documentElement.style.setProperty('--tg-theme-text-color', colorScheme === 'dark' ? '#ffffff' : '#000000')
        document.documentElement.style.setProperty('--tg-theme-hint-color', colorScheme === 'dark' ? '#8e8e93' : '#8e8e93')
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams?.link_color || '#0A84FF')
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams?.button_color || '#0A84FF')
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams?.button_text_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0')
      }
      
      // Listen for theme changes
      window.Telegram.WebApp.onEvent('themeChanged', handleThemeChange)
      
      return () => {
        // Clean up event listener
        window.Telegram.WebApp.offEvent('themeChanged', handleThemeChange)
      }
    }
  }, [])

  if (!isReady) {
    return (
      <div className="loading-screen">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    if (currentStep === 'test') {
      handleTestAnswer(userMessage.content)
    } else {
      try {
        const response = await fetch('https://unbd.onrender.com/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: createSystemPrompt(answers)
              },
              ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              { role: "user", content: userMessage.content }
            ]
          }),
        })

        if (!response.ok) {
          throw new Error('Network response was not ok')
        }

        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      } catch (error) {
        console.error('Error:', error)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleTestAnswer = (answer: string) => {
    const newAnswers = { ...answers }
    const currentQ = baseTest[currentQuestion]
    
    if (currentQ.options) {
      const option = answer.toLowerCase().trim()
      if (option in currentQ.options) {
        newAnswers[currentQ.field] = currentQ.options[option as keyof typeof currentQ.options]
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Please select a valid option (a, b, c, d, or e).' 
        }])
        setIsLoading(false)
        return
      }
    } else {
      newAnswers[currentQ.field] = answer
    }
    
    setAnswers(newAnswers)

    if (currentQuestion < baseTest.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: baseTest[currentQuestion + 1].question 
      }])
    } else {
      setCurrentStep('chat')
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Great! I now have a better understanding of your needs. Let's start our conversation!" 
      }])
    }
    setIsLoading(false)
  }

  const handleStartTest = () => {
    setCurrentStep('test')
    setCurrentQuestion(0)
    setAnswers({})
    setMessages([{ role: 'assistant', content: baseTest[0].question }])
  }

  const handleStartChat = () => {
    setCurrentStep('chat')
    setMessages([{ role: 'assistant', content: "Let's chat! What's on your mind?" }])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className={`app ${isTelegramWebApp ? 'telegram-webapp' : 'dev-environment'}`}>
      <div className="content-area">
        {activeTab === 'coach' ? (
          <div className="h-full">
            {currentStep === 'initial' ? (
              <div className="welcome-screen">
                <div className="rating-card">
                  <div className="rating-info">
                    <div className="avatar">AI</div>
                    <div className="rating-details">
                      <h4>Your Coach</h4>
                      <div className="rating-points">Ready to help</div>
                    </div>
                  </div>
                </div>
                <h1>Welcome to UnbndAICoach! 🚀</h1>
                <p>I'm here to help you achieve your goals and transform your life through personalized coaching.</p>
                <button
                  onClick={handleStartTest}
                  className="primary-button"
                >
                  Take a quick assessment
                </button>
                <button
                  onClick={handleStartChat}
                  className="primary-button"
                  style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                >
                  Start chatting right away
                </button>
              </div>
            ) : (
              <>
                <div className="messages-container">
                  {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                      {message.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="message assistant">
                      <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="input-area">
                  <form onSubmit={handleSubmit} className="input-form">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={currentStep === 'test' ? "Type your answer..." : "Type your message..."}
                      className="input-field"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="send-button"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'dashboard' ? (
          <div>
            <div className="rating-card">
              <div className="rating-info">
                <div className="avatar">👤</div>
                <div className="rating-details">
                  <h4>Your Progress</h4>
                  <div className="rating-points">44,347 Points</div>
                </div>
              </div>
              <div className="rating-rank">#20,777</div>
            </div>
            <div className="grid">
              <div className="card">
                <h3>Mood Tracking</h3>
                <p>Track your daily mood and emotions</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl">😊</span>
                  <button className="primary-button" style={{ margin: 0, width: 'auto', padding: '0.5rem 1rem' }}>
                    Log Mood
                  </button>
                </div>
              </div>
              <div className="card">
                <h3>Goals</h3>
                <p>Your active goals and progress</p>
                <div className="h-2 bg-tg-theme-button/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-tg-theme-button rounded-full"></div>
                </div>
              </div>
              <div className="card">
                <h3>Insights</h3>
                <p>Weekly performance analysis</p>
                <div className="flex gap-1 mt-2">
                  {['Focus', 'Energy', 'Growth'].map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-tg-theme-button/10 text-tg-theme-button rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Streaks</h3>
                <p>Consistency tracking</p>
                <div className="flex justify-between items-end h-8 mt-2">
                  {[0.3, 0.5, 0.4, 0.6, 0.8, 0.7, 0.9].map((height, i) => (
                    <div
                      key={i}
                      className="w-3 bg-tg-theme-button rounded-t"
                      style={{ height: `${height * 100}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'tests' ? (
          <div>
            <div className="rating-card">
              <div className="rating-info">
                <div className="avatar">📝</div>
                <div className="rating-details">
                  <h4>Assessment Center</h4>
                  <div className="rating-points">2 tests available</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3>Life Assessment</h3>
                <p>10-question assessment to understand your current state</p>
                <button 
                  onClick={handleStartTest}
                  className="primary-button"
                >
                  Start Assessment
                </button>
              </div>
              <div className="card">
                <h3>Personality Profile</h3>
                <p>Discover your personality type and strengths</p>
                <button 
                  className="primary-button"
                  style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="rating-card">
              <div className="rating-info">
                <div className="avatar">👤</div>
                <div className="rating-details">
                  <h4>Your Profile</h4>
                  <div className="rating-points">Premium Member</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="card">
                <h3>Assessment Results</h3>
                <div className="space-y-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span>Life Satisfaction</span>
                    <div className="w-32 h-2 bg-tg-theme-button/20 rounded-full overflow-hidden">
                      <div className="h-full w-3/5 bg-tg-theme-button rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Energy Level</span>
                    <div className="w-32 h-2 bg-tg-theme-button/20 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-tg-theme-button rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Goal Progress</span>
                    <div className="w-32 h-2 bg-tg-theme-button/20 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-tg-theme-button rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-tg-theme-hint/10">
                    <span>Language</span>
                    <span className="text-tg-theme-hint">English</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-tg-theme-hint/10">
                    <span>Coaching Style</span>
                    <span className="text-tg-theme-hint">Direct</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Notifications</span>
                    <span className="text-tg-theme-hint">On</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <button
            className={`tab-button ${activeTab === 'coach' ? 'active' : ''}`}
            onClick={() => setActiveTab('coach')}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-label">Coach</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-label">Dashboard</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <span className="tab-icon">📝</span>
            <span className="tab-label">Tests</span>
          </button>
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-label">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function createSystemPrompt(answers: Record<string, any>) {
  return `Use tools from behavioral psychology, CBT, coaching, and habit science — but deliver them fast, sharp, and based on the user's vibe.

Every message should feel like a breakthrough — something the user wants to take action on immediately.

**Your style adapts fully to the user.**

LANGUAGE ADAPTATION:
- If user speaks English: dynamically blend personas such as:
  - Tony Robbins (power, drive)
  - Mel Robbins (clarity, habits)
  - Dr. Julie Smith (psychological depth)
  - Jay Shetty (spiritual insight)
  - James Clear (habit design)
  - Brené Brown (vulnerability and courage)
  - David Goggins (mental toughness)
  - Marie Forleo (creative encouragement)
  - Naval Ravikant (wisdom and calm logic)
  - Tim Ferriss (optimization and experimentation)

- If user speaks Russian: adapt to styles of:
  - Petr Osipov (bold action and mindset)
  - Rostislav Gandapas (executive clarity)
  - Yulia Rubleva (emotional intelligence)
  - Tatiana Menshikh (deep coaching)
  - Ekaterina Sivanova (supportive structure)
  - Igor Nezovibatko (provocative breakthroughs)
  - Alexey Sitnikov (psycho-strategic influence)
  - Irina Khakamada (freedom, clarity)
  - Marina Melia (executive empathy)
  - Alexander Palienko (energy and transformation)

TONE ADAPTATION:
- Feel their energy: if they're direct — be clear and efficient. If emotional — be warm and grounded. If unsure — be calm, bold, and supportive.

PERSONALIZATION ENGINE:
Based on the user's test results: ${JSON.stringify(answers, null, 2)}

COACHING PRINCIPLES:
- Speak in short, vivid, emotionally engaging sentences
- Give one key insight or action per message
- Use micro-commitments like "Try this for 30 seconds"
- Invite depth: "Want to go deeper?"
- Offer support: "Want me to hold you to this?"
- Default to impact, not fluff

Your mission: transform the user's state and momentum — in under 30 seconds.`
}

export default App
