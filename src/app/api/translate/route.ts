import { NextResponse } from 'next/server';

// Local database fallback for when you don't have corporate API keys
const MOCK_DICTIONARY: Record<string, string> = {
  "Welcome to our core platform interface.": "Bienvenido a la interfaz de nuestra plataforma principal.",
  "Hello world": "Hola mundo"
};

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();
    const apiKey = process.env.TRANSLATION_API_KEY;

    // --- BRANCH A: ENVIRONMENT WITHOUT API KEY (Your current setup) ---
    if (!apiKey) {
      // Simulate network latency so your frontend spinner behaves realistically
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      const mockTranslation = MOCK_DICTIONARY[text.trim()] || `[MOCK ES] ${text} (Traducido)`;
      
      console.log(`⚠️ Serving mock translation for: "${text}"`);
      return NextResponse.json({ translatedText: mockTranslation });
    }

    // --- BRANCH B: ENVIRONMENT WITH CORPORATE API KEY (Production setup) ---
    console.log("🚀 Real API key detected! Forwarding request to external service...");
    
    const response = await fetch('https://api.external-translator.com/v1/translate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, target: targetLanguage })
    });

    if (!response.ok) throw new Error('External translation vendor failed.');
    
    const data = await response.json();
    return NextResponse.json({ translatedText: data.translatedText });

  } catch (error) {
    console.error("API Error:", error);
    
    return NextResponse.json(
      { error: 'Translation processing failed' }, 
      { status: 500 }
    );
  }
}