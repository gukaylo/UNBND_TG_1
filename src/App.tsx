import { useState, useEffect, useRef } from 'react'
import './App.css';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        enableClosingConfirmation: () => void
        setBackgroundColor: (color: string) => void
        backgroundColor: string
        headerColor: string
        themeParams: {
          bg_color: string
          text_color: string
          hint_color: string
          link_color: string
          button_color: string
          button_text_color: string
          secondary_bg_color: string
        }
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

interface Question {
  id: number;
  text: string;
  type: 'slider' | 'options';
  options?: string[];
}

const baseTestQuestions: Question[] = [
  {
    id: 1,
    text: "On a scale of 1-10, how satisfied are you with your life right now?",
    type: "slider"
  },
  {
    id: 2,
    text: "What area of your life would you like to improve the most?",
    type: "options",
    options: [
      "Career & Professional Growth",
      "Health & Fitness",
      "Relationships & Social Life",
      "Personal Development",
      "Financial Wellbeing"
    ]
  },
  {
    id: 3,
    text: "How often do you feel stressed or overwhelmed?",
    type: "options",
    options: [
      "Rarely or never",
      "Sometimes",
      "Often",
      "Most of the time",
      "Almost always"
    ]
  }
];

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'coach' | 'dashboard' | 'tests' | 'profile'>('coach')
  const [currentStep, setCurrentStep] = useState<'initial' | 'test' | 'chat'>('initial')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sliderValue, setSliderValue] = useState(5);
  const [showAIChat, setShowAIChat] = useState(true);
  const [testInProgress, setTestInProgress] = useState(false);

  // Simple Telegram initialization
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        // Set theme colors
        const theme = window.Telegram.WebApp.themeParams;
        const root = document.documentElement;
        
        root.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
        root.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
        root.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#999999');
        root.style.setProperty('--tg-theme-link-color', theme.link_color || '#2481cc');
        root.style.setProperty('--tg-theme-button-color', theme.button_color || '#2481cc');
        root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
        root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#f1f1f1');

        // Basic Telegram WebApp setup
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (error) {
      console.error('Error initializing Telegram Web App:', error);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    if (currentStep === 'test') {
      handleAnswer(sliderValue)
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

  const handleAnswer = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));

    if (currentQuestion < baseTestQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setTestInProgress(false);
      setShowAIChat(true);
      setCurrentStep('chat');
    }
  };

  const handleStartTest = () => {
    setTestInProgress(true);
    setShowAIChat(false);
    setCurrentStep('test');
    setCurrentQuestion(0);
  };

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

  const renderQuestion = () => {
    const question = baseTestQuestions[currentQuestion];
    if (!question) return null;

    switch (question.type) {
      case 'slider':
        return (
          <div className="question-container">
            <h2>{question.text}</h2>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                className="slider"
              />
              <div className="slider-value">{sliderValue}</div>
              <button 
                className="primary-button"
                onClick={() => handleAnswer(sliderValue)}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 'options':
        return (
          <div className="question-container">
            <h2>{question.text}</h2>
            <div className="options-container">
              {question.options?.map((option, index) => (
                <button
                  key={index}
                  className="option-button"
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <div className="content-area">
        {activeTab === 'coach' ? (
          <div className="chat-container">
            {currentStep === 'initial' ? (
              <div className="welcome-screen">
                <h1>Welcome to UnbndAICoach</h1>
                <p>Let's start by understanding where you are in your journey</p>
                <div className="button-container">
                  <button
                    onClick={handleStartTest}
                    className="primary-button"
                  >
                    Take the base test
                  </button>
                  {showAIChat && (
                    <button
                      onClick={() => setCurrentStep('chat')}
                      className="primary-button"
                    >
                      Start chatting right away
                    </button>
                  )}
                </div>
              </div>
            ) : currentStep === 'test' ? (
              renderQuestion()
            ) : (
              <div className="messages-container">
                <div className="messages" ref={messagesEndRef}>
                  {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
                <div className="input-area">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                  <button onClick={handleSubmit} disabled={isLoading}>
                    Send
                  </button>
                </div>
              </div>
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
