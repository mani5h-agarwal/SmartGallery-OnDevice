import Feather from "@expo/vector-icons/Feather";
import { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type AppHeaderProps = {
  title: string;
  colorTheme: "light" | "dark" | string;
  onToggleTheme: () => void;
  onCameraPress?: () => void;
};

const AppHeader = ({
  title,
  colorTheme,
  onToggleTheme,
  onCameraPress,
}: AppHeaderProps) => {
  const rotation = useRef(new Animated.Value(0)).current;

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleToggleTheme = () => {
    Animated.timing(rotation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      rotation.setValue(0);
    });

    onToggleTheme();
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          { color: colorTheme === "light" ? "#000" : "#fff" },
        ]}
      >
        {title}
      </Text>
      <View style={styles.actions}>
        {onCameraPress && (
          <TouchableOpacity onPress={onCameraPress} style={styles.iconWrapper}>
            <View
              style={[
                styles.iconBorder,
                {
                  backgroundColor: colorTheme === "light" ? "#f0f0f0" : "#333",
                },
              ]}
            >
              <Feather
                name="camera"
                size={18}
                color={colorTheme === "light" ? "#000" : "#fff"}
              />
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleToggleTheme}>
          <Animated.View
            style={[
              styles.iconBorder,
              {
                backgroundColor: colorTheme === "light" ? "#f0f0f0" : "#333",
                transform: [{ rotate: spin }],
              },
            ]}
          >
            {colorTheme === "light" ? (
              <Feather name="sun" size={18} color="#000" />
            ) : (
              <Feather name="moon" size={18} color="#fff" />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconWrapper: {
    marginRight: 0,
  },
  iconBorder: {
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
