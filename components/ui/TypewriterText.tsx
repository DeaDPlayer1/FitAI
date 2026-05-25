import React, { useState, useEffect } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  style?: StyleProp<TextStyle>;
  onComplete?: () => void;
}

export const TypewriterText = ({ text, speed = 15, style, onComplete }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => text.slice(0, index + 1));
      index++;
      
      if (index >= text.length) {
        clearInterval(intervalId);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text]);

  return <Text style={style}>{displayedText}</Text>;
};
