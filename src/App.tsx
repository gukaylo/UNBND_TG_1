import { useState, useEffect, useRef } from 'react'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ChatLoading from './components/ChatLoading';
import { initTelegramWebApp } from './telegram-init';
import './App.css';

// Add OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText: (text: string) => void
          onClick: (callback: () => void) => void
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive: boolean) => void
          hideProgress: () => void
          setParams: (params: {
            text?: string
            color?: string
            text_color?: string
            is_active?: boolean
            is_visible?: boolean
          }) => void
        }
        BackButton: {
          isVisible: boolean
          onClick: (callback: () => void) => void
          show: () => void
          hide: () => void
        }
        themeParams: {
          bg_color: string
          text_color: string
          hint_color: string
          link_color: string
          button_color: string
          button_text_color: string
          secondary_bg_color: string
        }
        colorScheme: 'light' | 'dark'
      }
    }
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TestQuestion {
  question: string
  field: string
  options?: Record<string, string>
}

interface Question {
  text: string;
  options: string[];
}

interface TestResults {
  lifeSatisfaction: number;
  priorityArea: string;
  stressLevel: string;
}

const baseTestQuestions: Question[] = [
  {
    text: "How would you rate your current mental well-being?",
    options: [
      "Excellent - I feel great!",
      "Good - I'm doing well overall",
      "Fair - I have some concerns",
      "Poor - I'm struggling",
      "Very poor - I need help"
    ]
  },
  {
    text: "Which area of your life needs the most attention?",
    options: [
      "Career & Work",
      "Relationships",
      "Health & Wellness",
      "Personal Growth",
      "Life Purpose"
    ]
  },
  {
    text: "How would you describe your current mindset?",
    options: [
      "Growth-oriented",
      "Fixed but willing to change",
      "Somewhat resistant",
      "Very resistant",
      "Unsure"
    ]
  },
  {
    text: "What's your energy level like?",
    options: [
      "High energy all day",
      "Good energy with some dips",
      "Moderate energy levels",
      "Low energy most days",
      "Very low energy"
    ]
  },
  {
    text: "What's your biggest internal blocker?",
    options: [
      "Fear of failure",
      "Perfectionism",
      "Lack of motivation",
      "Self-doubt",
      "Procrastination"
    ]
  }
];

// Add restart function
export const restartApp = () => {
  try {
    // Clear any existing state
    localStorage.clear();
    
    // Re-initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Reset WebApp state
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.enableClosingConfirmation();
      
      // Reset theme colors
      const theme = window.Telegram.WebApp.themeParams;
      const root = document.documentElement;
      
      root.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#ffffff');
      root.style.setProperty('--tg-theme-text-color', theme.text_color || '#000000');
      root.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#999999');
      root.style.setProperty('--tg-theme-link-color', theme.link_color || '#2481cc');
      root.style.setProperty('--tg-theme-button-color', theme.button_color || '#2481cc');
      root.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#ffffff');
      root.style.setProperty('--tg-theme-secondary-bg-color', theme.secondary_bg_color || '#f1f1f1');
      
      // Force a redraw
      window.dispatchEvent(new Event('resize'));
      const bottomNav = document.querySelector('.bottom-nav');
      if (bottomNav) {
        bottomNav.classList.add('force-redraw');
        setTimeout(() => bottomNav.classList.remove('force-redraw'), 100);
      }
      
      // Reload the page to ensure a fresh start
      window.location.reload();
    }
  } catch (error) {
    console.error('Error restarting app:', error);
  }
};

const createSystemPrompt = (answers: Record<string, any>) => {
  const wellbeing = answers["How would you rate your current mental well-being?"] || "Unknown";
  const priorityArea = answers["Which area of your life needs the most attention?"] || "Unknown";
  const mindset = answers["How would you describe your current mindset?"] || "Unknown";
  const energy = answers["What's your energy level like?"] || "Unknown";
  const blocker = answers["What's your biggest internal blocker?"] || "Unknown";

  return `You are an empathetic and professional AI Life Coach. Your role is to help users improve their lives through supportive conversation, practical advice, and gentle guidance.

Current User Profile:
- Mental Well-being: ${wellbeing}
- Priority Area: ${priorityArea}
- Current Mindset: ${mindset}
- Energy Level: ${energy}
- Main Blocker: ${blocker}

INITIAL GREETING:
I understand that you're currently feeling ${wellbeing.toLowerCase()}, and you'd like to focus on ${priorityArea.toLowerCase()}. I'm here to support you and help you overcome any challenges, especially regarding ${blocker.toLowerCase()}. How would you like to begin our conversation?

Guidelines:
1. Be empathetic and understanding
2. Focus on practical, actionable advice
3. Encourage self-reflection
4. Maintain professional boundaries
5. Prioritize user's well-being and safety`;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'coach' | 'dashboard' | 'tests' | 'profile'>('coach')
  const [currentStep, setCurrentStep] = useState<'welcome' | 'assessment' | 'chat'>('welcome')
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: "How would you rate your current mental well-being?",
    options: [
      "Excellent - I feel great!",
      "Good - I'm doing well overall",
      "Fair - I have some concerns",
      "Poor - I'm struggling",
      "Very poor - I need help"
    ]
  })
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [sliderValue, setSliderValue] = useState(5);
  const [showAIChat, setShowAIChat] = useState(true);
  const [testInProgress, setTestInProgress] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Telegram WebApp
        const initialized = initTelegramWebApp();
        
        if (!initialized) {
          console.error('Failed to initialize Telegram WebApp');
          // Set fallback colors
          document.documentElement.style.setProperty('--tg-theme-bg-color', '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-text-color', '#000000');
          document.documentElement.style.setProperty('--tg-theme-hint-color', '#999999');
          document.documentElement.style.setProperty('--tg-theme-link-color', '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-color', '#2481cc');
          document.documentElement.style.setProperty('--tg-theme-button-text-color', '#ffffff');
          document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', '#f1f1f1');
        }
        
        // Force immediate layout update
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
        });
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };

    initApp();
    
    // Cleanup function
    return () => {
      document.body.classList.remove('telegram-webapp');
    };
  }, []);

  // Handle Telegram MainButton
  useEffect(() => {
    const mainButton = window.Telegram?.WebApp?.MainButton;
    if (!mainButton) return;

    if (currentStep === 'welcome') {
      mainButton.setText('Start Assessment');
      mainButton.onClick(() => {
        setCurrentStep('assessment');
        mainButton.hide();
      });
      mainButton.show();
    } else {
      mainButton.hide();
    }

    return () => {
      mainButton.hide();
    };
  }, [currentStep]);

  // Handle Telegram BackButton
  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    if (currentStep === 'assessment' || currentStep === 'chat') {
      backButton.onClick(() => {
        setCurrentStep('welcome');
        backButton.hide();
      });
      backButton.show();
    } else {
      backButton.hide();
    }

    return () => {
      backButton.hide();
    };
  }, [currentStep]);

  // Handle answer selection with MainButton
  useEffect(() => {
    const mainButton = window.Telegram?.WebApp?.MainButton;
    if (!mainButton) return;

    if (currentStep === 'assessment' && selectedAnswer !== null) {
      mainButton.setText('Continue');
      mainButton.onClick(() => handleAnswer(selectedAnswer));
      mainButton.show();
    } else if (currentStep === 'assessment') {
      mainButton.hide();
    }
  }, [currentStep, selectedAnswer]);

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isLoading) return;

    try {
      // Notify Telegram that we're processing
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
      }

      const userMessage: Message = { role: 'user', content: message.trim() };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: createSystemPrompt(answers)
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            userMessage
          ],
          temperature: 0.8,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      
      // Force scroll to bottom after message is added
      setTimeout(() => {
        scrollToBottom();
      }, 100);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer: number) => {
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.text]: currentQuestion.options[answer]
    }));

    const currentIndex = baseTestQuestions.findIndex(q => q.text === currentQuestion.text);
    if (currentIndex < baseTestQuestions.length - 1) {
      setCurrentQuestion(baseTestQuestions[currentIndex + 1]);
    } else {
      // When test is complete, start chat with personalized greeting
      setTestInProgress(false);
      setCurrentStep('chat');
      const greeting = createSystemPrompt(answers).split('INITIAL GREETING:\n')[1].split('\n\n')[0];
      setMessages([{ role: 'assistant', content: greeting }]);
    }
    setSelectedAnswer(null);
  };

  const handleStartTest = () => {
    setTestInProgress(true);
    setShowAIChat(false);
    setCurrentStep('assessment');
    setCurrentQuestion(baseTestQuestions[0]);
  };

  const handleStartChat = () => {
    console.log('Starting chat...');
    try {
      // Notify Telegram that we're starting a chat
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand();
      }
      
      setCurrentStep('chat');
      const initialMessage: Message = {
        role: 'assistant',
        content: "Hi! I'm your AI Coach. I'm here to help you on your journey. What would you like to talk about?"
      };
      setMessages([initialMessage]);
      console.log('Chat started, messages:', [initialMessage]);
      
      // Force a re-render of the chat view
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const renderQuestion = () => {
    return (
      <div className="question">
        <h2>{currentQuestion.text}</h2>
        <div className="options">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`option ${selectedAnswer === index ? 'selected' : ''}`}
              onClick={() => handleAnswer(index)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInputArea = () => (
    <div className="input-area">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <main className="main-content">
          {activeTab === 'coach' && (
            <div className="chat-container">
              {currentStep === 'welcome' && (
                <div className="welcome-screen">
                  <h1>Welcome to AI Coach</h1>
                  <p>Let's start by understanding where you are in your journey.</p>
                  <div className="welcome-buttons">
                    <button 
                      className="welcome-button" 
                      onClick={() => {
                        console.log('Assessment button clicked');
                        setCurrentStep('assessment');
                      }}
                    >
                      Take Assessment
                    </button>
                    <button 
                      className="welcome-button" 
                      onClick={() => {
                        console.log('Chat button clicked');
                        handleStartChat();
                      }}
                    >
                      Start Chatting
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'assessment' && (
                <div className="assessment">
                  {renderQuestion()}
                </div>
              )}

              {currentStep === 'chat' && (
                <div className="chat-view">
                  <div className="messages">
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={index}
                        content={message.content}
                        role={message.role}
                        timestamp={new Date().toLocaleTimeString()}
                      />
                    ))}
                    {isLoading && <ChatLoading />}
                  </div>
                  <ChatInput
                    onSend={handleSubmit}
                    disabled={isLoading}
                    placeholder="Type your message..."
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="dashboard-container">
              <h1>Dashboard</h1>
              <div className="grid">
                <div className="dashboard-card">
                  <h3>Progress</h3>
                  <p>Track your coaching journey</p>
                </div>
                <div className="dashboard-card">
                  <h3>Goals</h3>
                  <p>Your active goals</p>
                </div>
                <div className="dashboard-card">
                  <h3>Insights</h3>
                  <p>AI-powered insights</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="tests-container">
              <h1>Tests</h1>
              <div className="test-list">
                <div className="test-card">
                  <h3>Personality Assessment</h3>
                  <p>Understand your personality traits</p>
                  <button className="primary-button">Start Test</button>
                </div>
                <div className="test-card">
                  <h3>Mental Well-being Check</h3>
                  <p>Quick mental health assessment</p>
                  <button className="primary-button">Start Test</button>
                </div>
                <div className="test-card">
                  <h3>Goal Setting Analysis</h3>
                  <p>Analyze your goal-setting approach</p>
                  <button className="primary-button">Start Test</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-container">
              <h1>Profile</h1>
              <div className="profile-section">
                <h3>Personal Information</h3>
                <p>Manage your profile details and preferences</p>
              </div>
              <div className="profile-section">
                <h3>Progress History</h3>
                <p>View your coaching journey and achievements</p>
              </div>
              <div className="profile-section">
                <h3>Settings</h3>
                <p>Customize your coaching experience</p>
              </div>
            </div>
          )}
        </main>

        <nav className="bottom-nav">
          <a
            href="#"
            className={`nav-item ${activeTab === 'coach' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('coach');
            }}
          >
            <i className="fas fa-comments"></i>
            <span>Coach</span>
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
          >
            <i className="fas fa-chart-line"></i>
            <span>Dashboard</span>
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('tests');
            }}
          >
            <i className="fas fa-clipboard-list"></i>
            <span>Tests</span>
          </a>
          <a
            href="#"
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('profile');
            }}
          >
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </a>
        </nav>
      </div>
    </ThemeProvider>
  )
}

export default App
