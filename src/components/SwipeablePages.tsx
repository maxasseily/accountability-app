import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SwipeablePagesProps {
  children: React.ReactNode[];
}

export default function SwipeablePages({ children }: SwipeablePagesProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const currentPage = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Prevent swiping beyond boundaries
        const newValue = -(currentPage.current * SCREEN_WIDTH) + gestureState.dx;
        const maxScroll = -(children.length - 1) * SCREEN_WIDTH;

        if (newValue <= 0 && newValue >= maxScroll) {
          scrollX.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = SCREEN_WIDTH * 0.3;

        // Determine which page to snap to
        if (gestureState.dx < -threshold && currentPage.current < children.length - 1) {
          // Swipe left - go to next page
          currentPage.current += 1;
        } else if (gestureState.dx > threshold && currentPage.current > 0) {
          // Swipe right - go to previous page
          currentPage.current -= 1;
        }

        // Animate to the target page
        Animated.spring(scrollX, {
          toValue: -(currentPage.current * SCREEN_WIDTH),
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pagesContainer,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children.map((child, index) => (
          <View key={index} style={styles.page}>
            {child}
          </View>
        ))}
      </Animated.View>

      {/* Page Indicators */}
      <View style={styles.indicatorContainer}>
        {children.map((_, index) => {
          const inputRange = [
            -(index + 1) * SCREEN_WIDTH,
            -index * SCREEN_WIDTH,
            -(index - 1) * SCREEN_WIDTH,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagesContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
