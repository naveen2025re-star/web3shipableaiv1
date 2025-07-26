import React from 'react';
import Header from './components/Header';
import ChatHistory from './components/ChatHistory';
import CodeInput from './components/CodeInput';
import { useAudit } from './hooks/useAudit';

function App() {
  const { messages, isLoading, performAudit } = useAudit();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        <ChatHistory messages={messages} />
        <CodeInput onSubmit={performAudit} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;