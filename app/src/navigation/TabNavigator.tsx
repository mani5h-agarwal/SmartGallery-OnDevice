import Feather from "@expo/vector-icons/Feather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import AlbumsScreen from "../screens/AlbumsScreen";
import AllImagesScreen from "../screens/AllImagesScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#536AF5",
        tabBarInactiveTintColor: theme === "light" ? "#999" : "#666",
        tabBarStyle: {
          backgroundColor: theme === "light" ? "#fff" : "#000",
          borderTopColor: theme === "light" ? "#e0e0e0" : "#222",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="AllImages"
        component={AllImagesScreen}
        options={{
          title: "All Images",
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Albums"
        component={AlbumsScreen}
        options={{
          title: "Albums",
          tabBarIcon: ({ color, size }) => (
            <Feather name="folder" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
