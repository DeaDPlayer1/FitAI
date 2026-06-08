const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.warn('[voiceLogger] EXPO_PUBLIC_GROQ_API_KEY not configured');
}

const WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

function friendlyWhisperError(status: number, bodyMsg: string): string | null {
  if (status === 429) return 'Voice processing is temporarily limited on the free plan. Please wait a moment and try again.';
  if (status === 403) return 'Voice processing quota exceeded for today. Please try typing instead.';
  if (status === 413 || bodyMsg?.toLowerCase().includes('too large') || bodyMsg?.toLowerCase().includes('file size')) return 'The recording is too long. Please try a shorter voice note.';
  if (status >= 500) return 'Voice processing service is temporarily unavailable. Please try again shortly.';
  if (bodyMsg?.toLowerCase().includes('rate limit')) return 'You have reached the voice processing limit. Please wait a moment.';
  if (bodyMsg?.toLowerCase().includes('quota')) return 'Voice processing credits exhausted for today. Please use text input instead.';
  return null;
}

/**
 * Transcribe an audio file using Groq's Whisper model.
 * @param uri The local URI of the recorded audio file.
 */
export async function transcribeAudio(uri: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Voice processing is not available. Please type your meal instead.');
  }

  const formData = new FormData();
  
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const type = match ? `audio/${match[1]}` : 'audio/m4a';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en');

  try {
    const response = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMsg = errorData?.error?.message || '';
      const friendly = friendlyWhisperError(response.status, rawMsg);
      throw new Error(friendly || 'Could not process voice input. Please try typing your meal instead.');
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('[voiceLogger] Whisper error:', error);
    if (error.message?.includes('Network') || error.message?.includes('fetch')) {
      throw new Error('Could not reach voice processing service. Please check your connection and try typing instead.');
    }
    throw error;
  }
}
