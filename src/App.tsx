import { useEffect, useState } from 'react';
import { useWebApp } from '@vkruglikov/react-telegram-web-app';
import './App.css';

// Base test questions
const baseTest = [
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
  // ... add all other questions
];

function App() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'initial' | 'test' | 'chat'>('initial');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const webApp = useWebApp();

  useEffect(() => {
    // Initialize Telegram Web App
    webApp.ready();
    webApp.expand();

    // Set theme
    document.body.style.backgroundColor = webApp.backgroundColor;
    document.body.style.color = webApp.textColor;
  }, [webApp]);

  const handleStartTest = () => {
    setCurrentStep('test');
    setMessages([{ role: 'assistant', content: baseTest[0].question }]);
  };

  const handleStartChat = () => {
    setCurrentStep('chat');
    setMessages([{ role: 'assistant', content: "Let's chat! What's on your mind?" }]);
  };

  const handleAnswer = async (answer: string) => {
    if (currentStep === 'test') {
      const newAnswers = { ...answers };
      newAnswers[baseTest[currentQuestion].field] = answer;
      setAnswers(newAnswers);

      if (currentQuestion < baseTest.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setMessages([...messages, { role: 'user', content: answer }, { role: 'assistant', content: baseTest[currentQuestion + 1].question }]);
      } else {
        setCurrentStep('chat');
        setMessages([...messages, { role: 'user', content: answer }, { role: 'assistant', content: "Great! I now have a better understanding of your needs. Let's start our conversation!" }]);
      }
    } else {
      setMessages([...messages, { role: 'user', content: answer }]);
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:3001/api/chat', {
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
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: answer }
            ]
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again." }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSend = () => {
    if (currentMessage.trim()) {
      handleAnswer(currentMessage.trim());
      setCurrentMessage('');
    }
  };

  return (
    <div className="app">
      {currentStep === 'initial' ? (
        <div className="welcome">
          <h1>Welcome to UnbndAICoach! 🚀</h1>
          <p>I'm here to help you achieve your goals and transform your life. Would you like to:</p>
          <button onClick={handleStartTest}>Take a quick assessment</button>
          <button onClick={handleStartChat}>Start chatting right away</button>
        </div>
      ) : (
        <>
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                {message.content}
              </div>
            ))}
            {isLoading && <div className="message assistant">...</div>}
          </div>
          <div className="input-area">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </>
      )}
    </div>
  );
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

Your mission: transform the user's state and momentum — in under 30 seconds.`;
}

export default App;
