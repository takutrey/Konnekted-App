import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BillboardCapture from "../screens/CaptureBillboardForms/BillboardCapture";
import Notes from "../screens/CaptureBillboardForms/Notes";
import BillboardType from "../screens/CaptureBillboardForms/BillboardType";
import BillboardInstaller from "../screens/CaptureBillboardForms/BillboardInstaller";
import BillboardDimensions from "../screens/CaptureBillboardForms/BillboardDimensions";
import BillboardAttachments from "../screens/CaptureBillboardForms/BillboardAttachments";
import BillboardSummary from "../screens/CaptureBillboardForms/BillboardSummary";
import BillboardPositionScreen from "../screens/CaptureBillboardForms/BillboardPositionScreen";
import BillboardPeriodLength from "../screens/CaptureBillboardForms/BillboardPeriodLength";
import BillboardInstallDate from "../screens/CaptureBillboardForms/BillboardInstallDate";

const Stack = createNativeStackNavigator();

const CaptureBillboardNav = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="billboardcapture" component={BillboardCapture} />
      <Stack.Screen name="billboardtype" component={BillboardType} />
      <Stack.Screen
        name="billboarddimensions"
        component={BillboardDimensions}
      />
      <Stack.Screen name="billboardinstaller" component={BillboardInstaller} />
      <Stack.Screen name="billboardnotes" component={Notes} />
      <Stack.Screen
        name="billboardattachments"
        component={BillboardAttachments}
      />
      <Stack.Screen name="billboardsummary" component={BillboardSummary} />
      <Stack.Screen
        name="billboardposition"
        component={BillboardPositionScreen}
      />
      <Stack.Screen name="periodlength" component={BillboardPeriodLength} />
      <Stack.Screen
        name="billboardinstalldate"
        component={BillboardInstallDate}
      />
    </Stack.Navigator>
  );
};

export default CaptureBillboardNav;
