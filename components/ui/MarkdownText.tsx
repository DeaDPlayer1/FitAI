import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  content: string;
  style?: any;
}

const TEXT_STYLES = StyleSheet.create({
  paragraph: { color: 'white', fontSize: 15, lineHeight: 22, marginVertical: 2 },
  bulletContainer: { flexDirection: 'row', marginVertical: 2 },
  bullet: { color: 'white', marginRight: 8, fontSize: 15, lineHeight: 22 },
  bulletText: { color: 'white', fontSize: 15, lineHeight: 22, flex: 1 },
  orderedContainer: { flexDirection: 'row', marginVertical: 2 },
  orderedNum: { color: 'white', marginRight: 8, fontSize: 15, lineHeight: 22 },
  orderedText: { color: 'white', fontSize: 15, lineHeight: 22, flex: 1 },
  codeBlock: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginVertical: 4 },
  codeText: { fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 20 },
  hr: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 8 },
  inlineCode: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, fontFamily: 'monospace',
    color: 'white', fontSize: 14,
  },
  link: { textDecorationLine: 'underline', color: 'rgba(255,255,255,0.9)' },
  boldItalic: { fontWeight: '700', fontStyle: 'italic' },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  header1: { fontSize: 20, fontWeight: '700', color: 'white', marginVertical: 4 },
  header2: { fontSize: 18, fontWeight: '700', color: 'white', marginVertical: 4 },
  header3: { fontSize: 16, fontWeight: '700', color: 'white', marginVertical: 4 },
});

function renderLine(line: string, lineKey: number) {
  const trimmed = line.trim();

  if (!trimmed) {
    return <View key={lineKey} style={{ height: 8 }} />;
  }

  if (trimmed.startsWith('```')) {
    return null;
  }

  if (/^#{1,3}\s/.test(trimmed)) {
    const level = trimmed.match(/^#+/)![0].length;
    const text = trimmed.replace(/^#+\s*/, '');
    const hStyle = level === 1 ? TEXT_STYLES.header1 : level === 2 ? TEXT_STYLES.header2 : TEXT_STYLES.header3;
    return (
      <Text key={lineKey} style={hStyle}>
        {renderInline(text)}
      </Text>
    );
  }

  if (/^[-•*]\s/.test(trimmed)) {
    const text = trimmed.replace(/^[-•*]\s*/, '');
    return (
      <View key={lineKey} style={TEXT_STYLES.bulletContainer}>
        <Text style={TEXT_STYLES.bullet}>•</Text>
        <Text style={TEXT_STYLES.bulletText}>
          {renderInline(text)}
        </Text>
      </View>
    );
  }

  if (/^\d+\.\s/.test(trimmed)) {
    const match = trimmed.match(/^(\d+)\.\s*/);
    const num = match![1];
    const text = trimmed.replace(/^\d+\.\s*/, '');
    return (
      <View key={lineKey} style={TEXT_STYLES.orderedContainer}>
        <Text style={TEXT_STYLES.orderedNum}>{num}.</Text>
        <Text style={TEXT_STYLES.orderedText}>
          {renderInline(text)}
        </Text>
      </View>
    );
  }

  if (/^---/.test(trimmed)) {
    return <View key={lineKey} style={TEXT_STYLES.hr} />;
  }

  return (
    <Text key={lineKey} style={TEXT_STYLES.paragraph}>
      {renderInline(trimmed)}
    </Text>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const biMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (biMatch) {
      parts.push(<Text key={key++} style={TEXT_STYLES.boldItalic}>{biMatch[1]}</Text>);
      remaining = remaining.slice(biMatch[0].length);
      continue;
    }

    const bMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (bMatch) {
      parts.push(<Text key={key++} style={TEXT_STYLES.bold}>{bMatch[1]}</Text>);
      remaining = remaining.slice(bMatch[0].length);
      continue;
    }

    const iMatch = remaining.match(/^\*(.+?)\*/);
    if (iMatch) {
      parts.push(<Text key={key++} style={TEXT_STYLES.italic}>{iMatch[1]}</Text>);
      remaining = remaining.slice(iMatch[0].length);
      continue;
    }

    const cMatch = remaining.match(/^`(.+?)`/);
    if (cMatch) {
      parts.push(
        <Text key={key++} style={TEXT_STYLES.inlineCode}>
          {cMatch[1]}
        </Text>
      );
      remaining = remaining.slice(cMatch[0].length);
      continue;
    }

    const lMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (lMatch) {
      parts.push(<Text key={key++} style={TEXT_STYLES.link}>{lMatch[1]}</Text>);
      remaining = remaining.slice(lMatch[0].length);
      continue;
    }

    const nextMarker = remaining.search(/[*[`]/);
    if (nextMarker === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else if (nextMarker > 0) {
      parts.push(remaining.slice(0, nextMarker));
      remaining = remaining.slice(nextMarker);
    } else {
      parts.push(remaining);
      remaining = '';
    }
  }

  return parts;
}

function parseMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <View key={`code-${i}`} style={TEXT_STYLES.codeBlock}>
            {codeLines.map((cl, ci) => (
              <Text key={ci} style={TEXT_STYLES.codeText}>{cl}</Text>
            ))}
          </View>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    const rendered = renderLine(line, i);
    if (rendered !== null) {
      elements.push(rendered);
    }
  });

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <View key={`code-end`} style={TEXT_STYLES.codeBlock}>
        {codeLines.map((cl, ci) => (
          <Text key={ci} style={TEXT_STYLES.codeText}>{cl}</Text>
        ))}
      </View>
    );
  }

  return elements;
}

export const MarkdownText = React.memo(function MarkdownText({ content, style }: MarkdownTextProps) {
  const elements = useMemo(() => parseMarkdown(content), [content]);
  return <View style={style}>{elements}</View>;
});
