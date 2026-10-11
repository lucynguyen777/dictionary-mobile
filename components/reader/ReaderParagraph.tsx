import { memo } from 'react';
import { Text } from 'react-native';
import { isReaderWordToken } from '@/data/readerText';

import { getReaderTextStyle } from '@/components/reader/readerOptions';
import { styles } from '@/components/reader/styles';

type ReaderParagraphProps = {
  activeSentenceIndex: number | null;
  end: number;
  highlightBackground: string;
  highlightText: string;
  isRtl: boolean;
  onTokenPress: (index: number) => void;
  selectionEnd: number | null;
  selectionStart: number | null;
  start: number;
  textColor: string;
  textStyle: ReturnType<typeof getReaderTextStyle>;
  tokenToSentenceMap: number[];
  tokens: string[];
};

// One Text per paragraph with nested pressable spans: far cheaper than a touchable view per word,
// and the text wraps like normal prose.
export const ReaderParagraph = memo(function ReaderParagraph({
  activeSentenceIndex,
  end,
  highlightBackground,
  highlightText,
  isRtl,
  onTokenPress,
  selectionEnd,
  selectionStart,
  start,
  textColor,
  textStyle,
  tokenToSentenceMap,
  tokens,
}: ReaderParagraphProps) {
  const spans = [];
  for (let index = start; index <= end; index += 1) {
    const token = tokens[index];
    // Paragraphs are separate blocks, so the line break that ends one is not drawn.
    if (token === '\n') continue;
    const inSelection = selectionStart !== null && selectionEnd !== null && index >= selectionStart && index <= selectionEnd;
    const isActiveSentence = activeSentenceIndex !== null && tokenToSentenceMap[index] === activeSentenceIndex;
    const highlighted = inSelection
      ? styles.selectedRangeWord
      : isActiveSentence
        ? { backgroundColor: highlightBackground, color: highlightText }
        : null;

    spans.push(
      isReaderWordToken(token) ? (
        <Text key={index} onPress={() => onTokenPress(index)} style={highlighted} suppressHighlighting>
          {token}
        </Text>
      ) : (
        <Text key={index} style={highlighted}>{token}</Text>
      )
    );
  }

  return (
    <Text style={[{ color: textColor }, textStyle, isRtl && { textAlign: 'right', writingDirection: 'rtl' }]}>
      {spans}
    </Text>
  );
});
