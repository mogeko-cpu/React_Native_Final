import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleProp, View, ViewStyle } from "react-native";

// `LinearProgressIndicator` de Flutter: una barra redondeada. Sin `progress`
// es indeterminada (un tramo que va y viene).
export function LinearProgress({
  progress,
  color,
  track,
  height = 8,
  style,
}: {
  progress?: number;
  color: string;
  track: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [slide] = useState(() => new Animated.Value(0));
  const indeterminate = progress == null;
  useEffect(() => {
    if (!indeterminate) return;
    const loop = Animated.loop(Animated.timing(slide, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [indeterminate, slide]);
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }, style]}>
      {indeterminate ? (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "40%",
            borderRadius: height,
            backgroundColor: color,
            left: slide.interpolate({ inputRange: [0, 1], outputRange: ["-40%", "100%"] }),
          }}
        />
      ) : (
        <View style={{ height: "100%", width: `${Math.max(0, Math.min(1, progress)) * 100}%`, borderRadius: height, backgroundColor: color }} />
      )}
    </View>
  );
}
