import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ComparisonScreen from "./src/screens/ComparisonScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ImageViewScreen from "./src/screens/ImageViewScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen as any}
        options={{ title: "Gallery" }}
      />
      <Stack.Screen
        name="ImageView"
        component={ImageViewScreen as any}
        options={{
          title: "Photo",
        }}
      />
      <Stack.Screen
        name="Comparison"
        component={ComparisonScreen as any}
        options={{
          title: "Similar Photos",
        }}
      />
    </Stack.Navigator>
  );
}
