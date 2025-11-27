import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EventsScreen from "./screens/EventsScreen";
import SplashScreen from "./screens/SplashScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    // Check if this is the first time the app is launched
    AsyncStorage.getItem("hasLaunched").then((value) => {
      if (value === null) {
        // First launch
        setIsFirstLaunch(true);
        AsyncStorage.setItem("hasLaunched", "true");
      } else {
        // Not first launch
        setIsFirstLaunch(false);
      }
    });
  }, []);

  // Show loading while checking first launch status
  if (isFirstLaunch === null) {
    return null; // Or you could return a simple loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isFirstLaunch ? "Splash" : "Home"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={EventsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
