'use client';

import { useState, ChangeEvent } from 'react';

export default function TranslationWidget() {
  const [sourceText, setSourceText] = useState<string>('Welcome to our core platform interface.');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleTranslate = async (): Promise<void> => {
    if (!sourceText.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Hits your local Next.js API route
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: sourceText, 
          targetLanguage: 'ES' 
        }),
      });

      if (!res.ok) throw new Error('Translation failed');

      const data = (await res.json()) as { translatedText: string };
      setTranslatedText(data.translatedText); 
    } catch (err) {
      console.error(err);  
      setError('❌ Failed to translate text. Please try again.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {/* Left Box: Input */}
        <div className="p-4 bg-gray-50 rounded border">
          <span className="block text-xs font-bold text-gray-500 mb-1">ORIGINAL (EN)</span>
          <textarea 
            className="w-full border rounded p-2 text-sm text-black" 
            rows={4}
            value={sourceText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSourceText(e.target.value)} 
          />
        </div>
        
        {/* Right Box: Display */}
        <div className="p-4 bg-white rounded border flex flex-col justify-between">
          <div>
            <span className="block text-xs font-bold text-gray-500 mb-1">TARGET TRANSLATION (ES)</span>
            <div className="w-full min-h-20 p-2 bg-gray-50 rounded text-sm text-black border">
              {isLoading ? (
                <span className="text-gray-400 animate-pulse">Translating...</span>
              ) : (
                translatedText || <span className="text-gray-400">Translation will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <button 
        onClick={handleTranslate}
        disabled={isLoading}
        className="mt-4 px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-blue-300 transition text-sm"
      >
        {isLoading ? 'Processing...' : 'Translate to Spanish'}
      </button>
    </div>
  );
}