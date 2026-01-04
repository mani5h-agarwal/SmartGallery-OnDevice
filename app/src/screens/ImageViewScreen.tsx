import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NavigationProp = NativeStackNavigationProp<any>;

type Props = {
  navigation: NavigationProp;
  route: {
    params: {
      uri: string;
    };
  };
};

const { width, height } = Dimensions.get("window");

export default function ImageViewScreen({ navigation, route }: Props) {
  const { uri } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
      </View>

      {/* Full Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>

      {/* Bottom Action */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.similarBtn}
          onPress={() => navigation.navigate("Comparison", { uri })}
        >
          <Text style={styles.similarText}>Find Similar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#000",
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  backText: {
    color: "#1a73e8",
    fontSize: 24,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: width,
    height: height - 140,
  },
  bottom: {
    padding: 16,
    backgroundColor: "#000",
  },
  similarBtn: {
    paddingVertical: 14,
    backgroundColor: "#536AF5",
    borderRadius: 40,
    alignItems: "center",
  },
  similarText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
});