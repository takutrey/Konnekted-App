import React from "react";
import AuthNavigator from "./AuthNavigator";
import BottomTabs from "./BottomTabs";
import { useSelector } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./RootNavigation";

const MainNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <BottomTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default MainNavigator;
