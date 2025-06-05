// components/Spinner.tsx
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PulsingDotProps {
  cx: number;
  cy: number;
  r: number;
  color: string;
  animationDelay: number; // in seconds
}

const PulsingDot: React.FC<PulsingDotProps> = ({
  cx,
  cy,
  r,
  color,
  animationDelay,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulseAnimationSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 480, // 0.48s (40% of 1.2s)
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Safer for SVG component props
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 480,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 480, // (0.96s - 0.48s) (40% to 80% of 1.2s)
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 480,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(240), // (1.2s - 0.96s) (80% to 100% of 1.2s - hold)
    ]);

    let loopedAnimation: Animated.CompositeAnimation | null = null;

    const startTimer = setTimeout(() => {
      loopedAnimation = Animated.loop(pulseAnimationSequence);
      loopedAnimation.start();
    }, animationDelay * 1000);

    return () => {
      clearTimeout(startTimer);
      loopedAnimation?.stop();
    };
  }, [animationDelay, scaleAnim, opacityAnim]);

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      opacity={opacityAnim}
      scale={scaleAnim} // Apply scale transform
      originX={cx} // Set transform origin to the center of the circle
      originY={cy} // Set transform origin to the center of the circle
    />
  );
};

interface SpinnerProps {
  size?: number;
  dotSize?: number;
  color?: string;
  style?: ViewStyle; // Replaces web's className for outer View style
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 60,
  dotSize = 10,
  color = "#ffffff", // Default color white, good for dark backgrounds
  style,
}) => {
  const center = size / 2;
  // Radius for dot placement, -2 for a little padding from the edge
  const radius = size / 2 - dotSize / 2 - 2;

  const dotData = [
    { angle: 0, delay: 0 }, // Dot 1: 0 degrees
    { angle: (2 * Math.PI) / 3, delay: 0.2 }, // Dot 2: 120 degrees
    { angle: (4 * Math.PI) / 3, delay: 0.4 }, // Dot 3: 240 degrees
  ];

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dotData.map((dot, i) => (
          <PulsingDot
            key={i}
            cx={center + radius * Math.cos(dot.angle)}
            cy={center + radius * Math.sin(dot.angle)}
            r={dotSize / 2}
            color={color}
            animationDelay={dot.delay}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Spinner;
