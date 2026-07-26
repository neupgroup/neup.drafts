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
      setError('Failed to translate text. Please try again.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Box: Input */}
        <div className="border border-slate-200 bg-slate-50 p-4">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-blue-600">
            Original (EN)
          </span>
          <textarea 
            className="min-h-40 w-full resize-none border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500" 
            rows={6}
            value={sourceText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSourceText(e.target.value)} 
          />
        </div>
        
        {/* Right Box: Display */}
        <div className="flex flex-col justify-between border border-slate-200 bg-slate-50 p-4">
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-blue-600">
              Target Translation (ES)
            </span>
            <div className="min-h-40 w-full border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-700">
              {isLoading ? (
                <span className="animate-pulse text-slate-500">Translating...</span>
              ) : (
                translatedText || <span className="text-slate-400">Translation will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button 
        onClick={handleTranslate}
        disabled={isLoading}
        className="h-11 bg-blue-600 px-6 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Translate to Spanish'}
      </button>
    </div>
  );
}
