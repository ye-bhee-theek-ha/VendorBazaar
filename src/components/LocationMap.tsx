// src/components/LocationMap.tsx
import React from "react";
import MapView, { Marker, Circle } from "react-native-maps";
import { View, StyleSheet } from "react-native";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  showRadius?: boolean;
  radiusInMeters?: number;
}

export const LocationMap = ({
  latitude,
  longitude,
  title,
  showRadius = false,
  radiusInMeters = 5000,
}: LocationMapProps) => {
  return (
    <View
      style={{
        height: 300,
        marginVertical: 10,
      }}
    >
      <MapView
        style={{
          flex: 1,
        }}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} title={title} />
        {showRadius && (
          <Circle
            center={{ latitude, longitude }}
            radius={radiusInMeters}
            fillColor="rgba(135, 206, 250, 0.2)"
            strokeColor="rgba(135, 206, 250, 0.5)"
          />
        )}
      </MapView>
    </View>
  );
};
