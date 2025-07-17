import { View, Image } from "react-native";
import React from "react";
import Svg, { Path } from "react-native-svg";
import Spinner from "../components/spinner";
import CustomText from "../components/Text";

const LoadingScreen = () => {
  return (
    <View className="w-screen h-screen flex items-center justify-center bg-primary relative ">
      <Image
        source={require("@/assets/images/loading.png")}
        className="absolute top-0 w-full h-full"
      />
      <View className="h-1/2 items-center mb-12">
        <CustomText className="text-[64px] font-semibold leading-none text-white ">
          SAFE BUY
        </CustomText>
        <CustomText className="text-[64px] font-semibold leading-none text-white ">
          AFRICA
        </CustomText>
      </View>

      <View className=" items-center justify-center h-36">
        <Spinner />
      </View>
    </View>
  );
};

export default LoadingScreen;
