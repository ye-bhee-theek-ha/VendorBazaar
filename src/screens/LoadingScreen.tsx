import { View, Text, Image } from "react-native";
import React from "react";
import Svg, { Path } from "react-native-svg";
import Spinner from "../components/spinner";

const Line = ({ ClassName }: { ClassName?: string }) => {
  return (
    <View className={`${ClassName}`}>
      <Svg width={"110%"} height={377} viewBox="0 0 390 377" fill="none">
        <Path
          d="M312.456 592.687C364.931 558.286 355.455 479.673 380.089 421.965C404.157 365.581 469.547 318.446 454.937 258.907C440.29 199.217 357.956 190.337 312.975 148.456C266.765 105.43 249.165 30.7467 189.073 11.3658C125.624 -9.09792 47.9455 3.39626 -2.82572 46.6029C-51.7666 88.2519 -36.4831 166.152 -62.0794 225.099C-87.2964 283.171 -157.045 324.673 -150.936 387.689C-144.778 451.207 -84.3061 494.929 -32.3322 531.958C14.983 565.669 71.3734 576.764 128.588 586.841C190.494 597.745 259.887 627.15 312.456 592.687Z"
          stroke="#333"
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    </View>
  );
};

const LoadingScreen = () => {
  return (
    <View className="w-screen h-screen flex items-center justify-center bg-primary relative">
      <View className="absolute top-0 w-full h-1/2">
        <Line ClassName="absolute top-[80px] left-0 w-full h-full" />
        <Line ClassName="absolute top-[110px] left-0 w-full h-full" />
        <Line ClassName="absolute top-[140px] left-0 w-full h-full" />
        <Line ClassName="absolute top-[170px] left-0 w-full h-full" />
      </View>

      <View className="h-1/2 items-center justify-center">
        <Text className="text-[64px] font-semibold leading-none text-white">
          VENDOR
        </Text>
        <Text className="text-[64px] font-semibold leading-none text-white">
          BAZAAR
        </Text>
      </View>

      <View className=" items-center justify-center">
        <Spinner />
      </View>
    </View>
  );
};

export default LoadingScreen;
