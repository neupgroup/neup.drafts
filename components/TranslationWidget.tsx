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
        <div className="border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#58fcec]">
            Original (EN)
          </span>
          <textarea 
            className="min-h-40 w-full resize-none border border-[#a2c7e5]/20 bg-[#131710] p-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-[#a2c7e5]/35 focus:border-[#58fcec]/70" 
            rows={6}
            value={sourceText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSourceText(e.target.value)} 
          />
        </div>
        
        {/* Right Box: Display */}
        <div className="flex flex-col justify-between border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 p-4">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#58fcec]">
              Target Translation (ES)
            </span>
            <div className="min-h-40 w-full border border-[#a2c7e5]/20 bg-[#131710] p-3 text-sm leading-6 text-[#d8d5e8]">
              {isLoading ? (
                <span className="animate-pulse text-[#a2c7e5]/60">Translating...</span>
              ) : (
                translatedText || <span className="text-[#a2c7e5]/45">Translation will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-300">{error}</p>}

      <button 
        onClick={handleTranslate}
        disabled={isLoading}
        className="h-11 bg-[#58fcec] px-6 text-sm font-black text-[#131710] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Translate to Spanish'}
      </button>
    </div>
  );
}
