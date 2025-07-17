// src/components/CustomText.tsx
import React from "react";
import { Text, TextProps } from "react-native";

interface CustomTextProps extends TextProps {
  className?: string;
}

const CustomText: React.FC<CustomTextProps> = ({
  className = "",
  ...props
}) => {
  return (
    <Text
      className={`font-MuseoModerno_Regular text-black ${className}`}
      {...props}
    />
  );
};

export default CustomText;
