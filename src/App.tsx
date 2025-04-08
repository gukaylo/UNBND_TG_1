import { useState, useEffect, useRef } from 'react'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ChatLoading from './components/ChatLoading';
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

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'coach' | 'profile'>('coach')
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

  // Enhanced Telegram initialization
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
        window.Telegram.WebApp.enableClosingConfirmation();

        // Set background color
        window.Telegram.WebApp.setBackgroundColor(theme.bg_color || '#ffffff');
      }
    } catch (error) {
      console.error('Error initializing Telegram Web App:', error);
    }
  }, []);

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
                  <p>Let's start your journey to better mental health</p>
                  <div className="welcome-buttons">
                    <button 
                      className="welcome-button" 
                      onClick={() => {
                        console.log('Assessment button clicked');
                        setCurrentStep('assessment');
                      }}
                    >
                      Take the base test
                    </button>
                    <button 
                      className="welcome-button" 
                      onClick={() => {
                        console.log('Chat button clicked');
                        handleStartChat();
                      }}
                    >
                      Start chatting right away
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

          {activeTab === 'profile' && (
            <div className="profile-container">
              <h1>Profile</h1>
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

function createSystemPrompt(answers: Record<string, any>) {
  // Create a default profile with empty values
  const profile = {
    lifeSatisfaction: "unknown",
    priorityArea: "unknown",
    mindset: "unknown",
    energyLevel: "unknown",
    internalBlocker: "unknown"
  };

  // Update profile with any provided answers
  if (Object.keys(answers).length > 0) {
    Object.entries(answers).forEach(([question, answer]) => {
      if (question.includes("mental well-being")) {
        profile.lifeSatisfaction = answer;
      } else if (question.includes("needs the most attention")) {
        profile.priorityArea = answer;
      } else if (question.includes("current mindset")) {
        profile.mindset = answer;
      } else if (question.includes("energy level")) {
        profile.energyLevel = answer;
      } else if (question.includes("internal blocker")) {
        profile.internalBlocker = answer;
      }
    });
  }

  let personalizedGreeting = "Hi! I'm your AI Coach. I'm here to help you on your journey. ";

  // Add context based on available information
  if (profile.lifeSatisfaction !== "unknown") {
    personalizedGreeting += `I see you're feeling ${profile.lifeSatisfaction.toLowerCase()}. `;
  }
  if (profile.priorityArea !== "unknown") {
    personalizedGreeting += `Let's focus on improving your ${profile.priorityArea.toLowerCase()}. `;
  }

  return `You are an empathetic AI coach focused on helping people improve their lives.

PERSONALIZATION PROFILE:
- Life Satisfaction: ${profile.lifeSatisfaction}
- Priority Area: ${profile.priorityArea}
- Current Mindset: ${profile.mindset}
- Energy Level: ${profile.energyLevel}
- Internal Blocker: ${profile.internalBlocker}

INITIAL GREETING:
${personalizedGreeting}

COACHING PRINCIPLES:
1. Be empathetic and supportive
2. Focus on actionable steps
3. Encourage positive change
4. Provide clear guidance
5. Maintain a hopeful outlook

Your mission: Help the user achieve their goals while being supportive and practical.`;
}

export default App
