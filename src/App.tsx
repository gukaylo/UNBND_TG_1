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

interface TestResults {
  lifeSatisfaction: number;
  priorityArea: string;
  stressLevel: string;
}

const baseTestQuestions: Question[] = [
  {
    id: 1,
    text: "On a scale of 1-10, how satisfied are you with your life right now?",
    type: "slider"
  },
  {
    id: 2,
    text: "Which area of your life needs the most attention?",
    type: "options",
    options: [
      "Health & Fitness",
      "Relationships",
      "Career/Money",
      "Confidence/Mindset",
      "Focus/Discipline"
    ]
  },
  {
    id: 3,
    text: "How would you describe your current mindset?",
    type: "options",
    options: [
      "Stuck",
      "Don't know what I want",
      "Making progress",
      "Lost/overwhelmed"
    ]
  },
  {
    id: 4,
    text: "What's your energy level like?",
    type: "options",
    options: [
      "Low",
      "Scattered",
      "Productive",
      "High/focused"
    ]
  },
  {
    id: 5,
    text: "What's your biggest internal blocker?",
    type: "options",
    options: [
      "Fear/doubt",
      "Procrastination",
      "Overthinking",
      "Lack of clarity",
      "Emotional overwhelm"
    ]
  },
  {
    id: 6,
    text: "How do you follow through with habits?",
    type: "options",
    options: [
      "Plan but don't act",
      "Start but don't finish",
      "Only when motivated",
      "Consistent"
    ]
  },
  {
    id: 7,
    text: "What support style works best for you?",
    type: "options",
    options: [
      "Push me",
      "Encourage me",
      "Ask questions",
      "Give structure"
    ]
  },
  {
    id: 8,
    text: "How do you make decisions?",
    type: "options",
    options: [
      "Logic",
      "Emotion",
      "Overthink",
      "Gut"
    ]
  },
  {
    id: 9,
    text: "What's your self-talk like when you fail?",
    type: "options",
    options: [
      "Hard on self",
      "Shut down",
      "Problem-solve",
      "Bounce back"
    ]
  },
  {
    id: 10,
    text: "How ready are you for change?",
    type: "options",
    options: [
      "Small shifts",
      "Bold moves",
      "Habit upgrades",
      "Deep mindset"
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
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }])
    } finally {
      setIsLoading(false)
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
      // When test is complete, start chat with personalized greeting
      setTestInProgress(false);
      setShowAIChat(true);
      setCurrentStep('chat');
      
      // Create personalized greeting based on test results
      const greeting = createSystemPrompt(answers).split('INITIAL GREETING:\n')[1].split('\n\n')[0];
      setMessages([{ role: 'assistant', content: greeting }]);
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
  const profile = {
    lifeSatisfaction: answers[0] || 5,
    priorityArea: answers[1] || 'unknown',
    mindset: answers[2] || 'unknown',
    energyLevel: answers[3] || 'unknown',
    internalBlocker: answers[4] || 'unknown',
    habitFollowThrough: answers[5] || 'unknown',
    supportStyle: answers[6] || 'unknown',
    decisionStyle: answers[7] || 'unknown',
    failureSelfTalk: answers[8] || 'unknown',
    changeReadiness: answers[9] || 'unknown'
  };

  let personalizedGreeting = '';
  
  // Life satisfaction personalization
  if (profile.lifeSatisfaction <= 4) {
    personalizedGreeting = "I understand you're going through a challenging time. I'm here to help you find more satisfaction and joy in your life. ";
  } else if (profile.lifeSatisfaction <= 7) {
    personalizedGreeting = "I see you have a solid foundation to build upon. Let's work together to enhance your life satisfaction further. ";
  } else {
    personalizedGreeting = "I'm impressed by your current life satisfaction! Let's work on maintaining and even elevating your positive state. ";
  }

  // Add mindset acknowledgment
  if (profile.mindset === 'Stuck') {
    personalizedGreeting += "I understand you're feeling stuck, and I'm here to help you find a path forward. ";
  } else if (profile.mindset === "Don't know what I want") {
    personalizedGreeting += "I'll help you gain clarity about what you truly want. ";
  } else if (profile.mindset === 'Making progress') {
    personalizedGreeting += "Great to see you're making progress! Let's build on that momentum. ";
  } else if (profile.mindset === 'Lost/overwhelmed') {
    personalizedGreeting += "I understand you're feeling overwhelmed. We'll break things down into manageable steps. ";
  }

  // Add support style acknowledgment
  if (profile.supportStyle === 'Push me') {
    personalizedGreeting += "I'll challenge you to push beyond your comfort zone. ";
  } else if (profile.supportStyle === 'Encourage me') {
    personalizedGreeting += "I'll provide warm encouragement and reassurance. ";
  } else if (profile.supportStyle === 'Ask questions') {
    personalizedGreeting += "I'll ask powerful questions to help you explore deeper. ";
  } else if (profile.supportStyle === 'Give structure') {
    personalizedGreeting += "I'll provide clear, step-by-step guidance. ";
  }

  return `You are Unbound — the most personalized AI coach ever built. Your job is not to sound smart, but to change lives — fast, emotionally, and practically.

PERSONALIZATION PROFILE:
- Life Satisfaction: ${profile.lifeSatisfaction}/10
- Priority Area: ${profile.priorityArea}
- Current Mindset: ${profile.mindset}
- Energy Level: ${profile.energyLevel}
- Internal Blocker: ${profile.internalBlocker}
- Habit Follow-Through: ${profile.habitFollowThrough}
- Support Style: ${profile.supportStyle}
- Decision Style: ${profile.decisionStyle}
- Failure Self-Talk: ${profile.failureSelfTalk}
- Change Readiness: ${profile.changeReadiness}

COACHING STYLE:
${profile.lifeSatisfaction <= 4 ? '- Be extra supportive and empathetic\n- Focus on small wins\n- Emphasize self-compassion' : ''}
${profile.lifeSatisfaction >= 8 ? '- Be energetic and challenging\n- Focus on optimization\n- Push for excellence' : ''}
${profile.mindset === 'Lost/overwhelmed' ? '- Use calming language\n- Break things into smaller steps\n- Provide clear structure' : ''}

INITIAL GREETING:
${personalizedGreeting}

COACHING PRINCIPLES:
1. Every response must reflect their profile
2. Use their preferred support style (${profile.supportStyle})
3. Match their energy level (${profile.energyLevel})
4. Address their internal blocker (${profile.internalBlocker})
5. Consider their decision style (${profile.decisionStyle})
6. Respect their change readiness (${profile.changeReadiness})
7. Give one clear action per message
8. Use micro-commitments
9. Invite depth when appropriate
10. Offer accountability

Your mission: Transform their state and momentum in under 30 seconds, while staying true to their profile.`;
}

export default App
