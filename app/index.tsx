import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { IndexingProvider } from "./src/context/IndexingContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import TabNavigator from "./src/navigation/TabNavigator";
import AllImagesScreen from "./src/screens/AllImagesScreen";
import ComparisonScreen from "./src/screens/ComparisonScreen";
import ImageViewScreen from "./src/screens/ImageViewScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <IndexingProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="Home"
            component={TabNavigator}
            options={{ title: "Gallery" }}
          />
          <Stack.Screen
            name="AlbumPhotos"
            component={AllImagesScreen as any}
            options={{
              title: "Album",
            }}
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
      </IndexingProvider>
    </ThemeProvider>
  );
}
