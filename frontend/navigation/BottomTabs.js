import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import BillboardListScreen from "../screens/BillboardListScreen";
import CaptureBillboardNav from "./CaptureBillboardNav";
import Notifications from "../screens/Notifications";
import { FontAwesome } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import SpaceOffers from "../screens/SpaceOffers";

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const { user } = useSelector((state) => state.auth);
  const role = user?.role;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ size, color, focused }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home";
              break;
            case "Billboards":
              iconName = focused ? "list-alt" : "list";
              break;
            case "Capture":
              iconName = "camera";
              break;
            case "Notifications":
              iconName = focused ? "bell" : "bell-o";
              break;
            case "Offers":
              iconName = focused ? "gift" : "gift";
              break;
            case "Profile":
              iconName = focused ? "user" : "user-o";
              break;
            default:
              iconName = "question";
          }

          return (
            <FontAwesome
              name={iconName}
              size={size}
              color={color}
              style={focused ? { transform: [{ rotate: "15deg" }] } : {}}
            />
          );
        },
        tabBarActiveTintColor: "#007aff",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: "Home",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold" },
        }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="Billboards"
        options={{
          title: "Billboards List",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold" },
        }}
        component={BillboardListScreen}
      />
      <Tab.Screen
        name="Capture"
        options={{
          title: "Capture Billboard",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold" },
        }}
        component={CaptureBillboardNav}
      />
      {role === "INSTALLER" && (
        <Tab.Screen
          name="Offers"
          options={{
            title: "Offers",
            headerTitleAlign: "center",
            headerTitleStyle: { fontWeight: "bold" },
          }}
          component={SpaceOffers}
        />
      )}
      <Tab.Screen
        name="Notifications"
        options={{
          title: "Notifications",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold" },
        }}
        component={Notifications}
      />

      <Tab.Screen
        name="Profile"
        options={{
          title: "Profile",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold" },
        }}
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
