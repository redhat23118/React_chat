import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, Send, Key, Database, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Progress } from './components/ui/progress';

const generateChevronInvoices = (numInvoices = 20000) => {
  const vendors = ['Halliburton', 'Schlumberger', 'Baker Hughes', 'Weatherford', 'National Oilwell Varco', 
                   'TechnipFMC', 'Transocean', 'Saipem', 'Fluor', 'Aker Solutions'];
  const serviceCategories = ['Drilling', 'Well Completion', 'Seismic Survey', 'Equipment Rental', 'Maintenance', 
                             'Pipeline Services', 'Environmental Services', 'Refinery Services', 'Offshore Services', 'Safety Training'];
  const states = ['Texas', 'Louisiana', 'California', 'Alaska', 'New Mexico', 'Oklahoma', 'Colorado', 'Wyoming', 'North Dakota', 'Pennsylvania'];
  
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2024, 6, 12);

  return Array.from({ length: numInvoices }, (_, i) => {
    const invoiceDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const dueDate = new Date(invoiceDate.getTime() + (Math.floor(Math.random() * 30) + 15) * 24 * 60 * 60 * 1000);
    
    return {
      InvoiceID: `CHV-${invoiceDate.getFullYear()}-${(i + 1).toString().padStart(6, '0')}`,
      VendorName: vendors[Math.floor(Math.random() * vendors.length)],
      ServiceCategory: serviceCategories[Math.floor(Math.random() * serviceCategories.length)],
      InvoiceAmount: Math.floor(Math.random() * 9950000 + 50000) / 100,
      InvoiceDate: invoiceDate.toISOString().split('T')[0],
      DueDate: dueDate.toISOString().split('T')[0],
      InvoiceStatus: Math.random() > 0.1 ? 'Paid' : 'Pending',
      State: states[Math.floor(Math.random() * states.length)],
      WellName: `Well-${Math.floor(Math.random() * 1000) + 1}`
    };
  });
};

const ChevronInvoiceAnalysisChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setIsApiKeySet(true);
    }
  };

  const handleLoadData = async () => {
    setLoadingProgress(0);
    const totalInvoices = 20000;
    const batchSize = 1000;
    let loadedInvoices = [];

    for (let i = 0; i < totalInvoices; i += batchSize) {
      const batch = generateChevronInvoices(Math.min(batchSize, totalInvoices - i));
      loadedInvoices = [...loadedInvoices, ...batch];
      setLoadingProgress(((i + batch.length) / totalInvoices) * 100);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setInvoices(loadedInvoices);
    setLoadingProgress(100);
  };

  const generateSuggestedQuestions = async () => {
    if (messages.length === 0) return;

    const context = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: "You are an AI assistant helping to generate follow-up questions for a conversation about Chevron's invoice data. Based on the conversation history, suggest 2-3 relevant questions that would help explore the data further. Provide only the questions, separated by newlines." },
            { role: "user", content: `Based on this conversation, suggest 2-3 follow-up questions:\n\n${context}` }
          ],
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get suggested questions');
      }

      const data = await response.json();
      const suggestedQuestionsText = data.choices[0].message.content;
      setSuggestedQuestions(suggestedQuestionsText.split('\n').filter(q => q.trim() !== ''));
    } catch (err) {
      console.error('Error generating suggested questions:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isApiKeySet || invoices.length === 0) return;

    setIsLoading(true);
    setError('');
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');

    try {
      const relevantInvoices = invoices.sort(() => 0.5 - Math.random()).slice(0, 100);
      const context = relevantInvoices.map(inv => 
        `Invoice ${inv.InvoiceID}: Vendor: ${inv.VendorName}, Service: ${inv.ServiceCategory}, Amount: $${inv.InvoiceAmount}, Date: ${inv.InvoiceDate}, Due: ${inv.DueDate}, Status: ${inv.InvoiceStatus}, State: ${inv.State}, Well: ${inv.WellName}`
      ).join('\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            { role: "system", content: `You are an AI assistant specializing in Chevron's invoice data analysis for USA operations. Your responses should be concise, direct, and focused on answering the user's question based on the provided invoice data. The invoices span from January 2024 to July 2024. You have access to 20,000 Chevron invoices in total. Here's a sample of 100 for context:\n\n${context}` },
            ...messages,
            userMessage
          ],
          max_tokens: 1000,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        const parsedLines = lines
          .map(line => line.replace(/^data: /, "").trim())
          .filter(line => line !== "" && line !== "[DONE]")
          .map(line => JSON.parse(line));

        for (const parsedLine of parsedLines) {
          const { choices } = parsedLine;
          const { delta } = choices[0];
          const { content } = delta;
          if (content) {
            assistantResponse += content;
            setMessages(prev => [
              ...prev.slice(0, -1),
              { ...prev[prev.length - 1], content: assistantResponse }
            ]);
          }
        }
      }

      await generateSuggestedQuestions();
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setSuggestedQuestions([]);
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Chevron Invoice Analysis Chatbot</h1>
      
      {!isApiKeySet ? (
        <form onSubmit={handleApiKeySubmit} className="mb-4 flex">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API Key"
            className="flex-grow mr-2"
          />
          <Button type="submit">
            <Key className="mr-2 h-4 w-4" /> Set API Key
          </Button>
        </form>
      ) : (
        <>
          <div className="mb-4 flex items-center">
            <Button onClick={handleLoadData} disabled={loadingProgress > 0 && loadingProgress < 100}>
              <Database className="mr-2 h-4 w-4" /> Load 20,000 Chevron Invoices
            </Button>
            {loadingProgress > 0 && (
              <Progress value={loadingProgress} className="ml-4 flex-grow" />
            )}
          </div>

          <div className="flex-grow bg-white rounded-lg shadow-md p-4 mb-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {suggestedQuestions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Suggested Questions:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button key={index} variant="outline" onClick={() => setInput(question)}>
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex mb-4">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Chevron's USA invoice data..."
              className="flex-grow mr-2"
            />
            <Button type="submit" disabled={isLoading || invoices.length === 0}>
              {isLoading ? 'Analyzing...' : <Send className="h-4 w-4" />}
            </Button>
          </form>

          <Button variant="outline" onClick={handleClearConversation}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear Conversation
          </Button>
        </>
      )}

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')).render(<ChevronInvoiceAnalysisChatbot />);
