import { NextResponse } from 'next/server';

// 1. ADD THIS INTERFACE HERE SO TYPESCRIPT KNOWS WHAT IT IS
export interface VendorTranslationResponse {
  translatedText?: string;
  translated_text?: string;
  translations?: Array<{
    text: string;
    detected_source?: string;
  }>;
}

// Local database fallback for when you don't have corporate API keys
const MOCK_DICTIONARY: Record<string, string> = {
  "Welcome to our core platform interface.": "Bienvenido a la interfaz de nuestra plataforma principal.",
  "Hello world": "Hola mundo"
};

export async function POST(request: Request) {
  try {
    // ADD VALIDATION HERE (Safely parse body and validate fields)
    const body = await request.json().catch(() => ({}));
    const { text, targetLanguage } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text field is required' }, { status: 400 });
    }

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
    
    // Cast the response to our explicit, flexible type
    const data = (await response.json()) as VendorTranslationResponse;

    // Defensively map the response using type-safe fallback properties
    const extractedTranslation = 
      data.translatedText || 
      data.translated_text || 
      data.translations?.[0]?.text || 
      null;

    // Handle structural format mismatch cleanly
    if (!extractedTranslation) {
      console.error("❌ Vendor response format mismatch. Received payload:", JSON.stringify(data));
      return NextResponse.json(
        { error: 'External service returned an invalid data format.' }, 
        { status: 502 }
      );
    }

    // Safely deliver the verified contract format to the client widget
    return NextResponse.json({ translatedText: extractedTranslation });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: 'Translation processing failed' }, 
      { status: 500 }
    );
  }
}