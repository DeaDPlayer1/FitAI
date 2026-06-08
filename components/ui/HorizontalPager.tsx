/**
 * Tab Pager Dots — For horizontal scroll pagers.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import { theme } from '@/constants/theme';

interface HorizontalPagerProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemWidth: number;
  itemGap?: number;
  snapToInterval?: number;
  onPageChange?: (index: number) => void;
  showDots?: boolean;
  contentContainerStyle?: any;
  keyExtractor?: (item: T, index: number) => string;
}

export function HorizontalPager<T>({
  data,
  renderItem,
  itemWidth,
  itemGap = 16,
  snapToInterval,
  onPageChange,
  showDots = true,
  contentContainerStyle,
  keyExtractor,
}: HorizontalPagerProps<T>) {
  const [active, setActive] = React.useState(0);
  const screenW = Dimensions.get('window').width;
  const sidePadding = (screenW - itemWidth) / 2;
  const snap = snapToInterval ?? itemWidth + itemGap;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / snap);
    if (idx !== active) {
      setActive(idx);
      onPageChange?.(idx);
    }
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          { paddingHorizontal: sidePadding, gap: itemGap },
          contentContainerStyle,
        ]}
      >
        {data.map((item, i) => (
          <View key={keyExtractor?.(item, i) ?? i} style={{ width: itemWidth }}>
            {renderItem(item, i)}
          </View>
        ))}
      </ScrollView>
      {showDots && (
        <View style={styles.dotsRow}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === active ? styles.active : styles.inactive,
              ]}
            />
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  active: {
    width: 20,
    backgroundColor: theme.colors.primary,
  },
  inactive: {
    width: 6,
    backgroundColor: '#D1D5DB',
  },
});

export default HorizontalPager;
