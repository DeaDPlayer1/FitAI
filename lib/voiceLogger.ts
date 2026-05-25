const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY!;
if (!GROQ_API_KEY) throw new Error('EXPO_PUBLIC_GROQ_API_KEY is not configured');

const WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * Transcribe an audio file using Groq's Whisper model.
 * @param uri The local URI of the recorded audio file.
 */
export async function transcribeAudio(uri: string): Promise<string> {
  const formData = new FormData();
  
  // Create the file object for the form data
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const type = match ? `audio/${match[1]}` : 'audio/m4a';

  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);
  
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en'); // You can set this to 'hi' for Hindi support

  try {
    const response = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Transcription failed');
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('Whisper Error:', error);
    throw new Error('Failed to process voice. Try typing instead.');
  }
}
