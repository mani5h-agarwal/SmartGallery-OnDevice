import Feather from "@expo/vector-icons/Feather";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { useTheme } from "../context/ThemeContext";
import { initDB, saveEmbedding } from "../db/embeddings";
import { getEmbedding } from "../services/embedding";
import resizeForModel from "../services/resize";
import { useIndexing } from "../context/IndexingContext";

type NavigationProp = NativeStackNavigationProp<any>;

type Props = {
  navigation: NavigationProp;
};

type AlbumItem = {
  id: string;
  title: string;
  assetCount: number;
  coverUri?: string;
};

export default function AlbumsScreen({ navigation }: Props) {
  const { theme: colorTheme, toggleTheme } = useTheme();
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingCamera, setProcessingCamera] = useState(false);
  const { isIndexing } = useIndexing();

  useEffect(() => {
    initDB();
    loadAlbums();
  }, []);

  async function loadAlbums() {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant photo library access to view albums."
        );
        setLoading(false);
        return;
      }

      const albumsData = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      const albumsWithCovers = await Promise.all(
        albumsData.map(async (album) => {
          // Get first photo from album as cover
          const assets = await MediaLibrary.getAssetsAsync({
            album: album.id,
            first: 1,
            mediaType: MediaLibrary.MediaType.photo,
          });

          return {
            id: album.id,
            title: album.title,
            assetCount: album.assetCount,
            coverUri: assets.assets[0]?.uri,
          };
        })
      );

      // Filter out empty albums and albums with no photos, then sort by asset count
      const nonEmptyAlbums = albumsWithCovers
        .filter((album) => album.assetCount > 0 && album.coverUri)
        .sort((a, b) => b.assetCount - a.assetCount);

      setAlbums(nonEmptyAlbums);
    } catch (error) {
      console.error("Error loading albums:", error);
      Alert.alert("Error", "Failed to load albums. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlbums();
    setRefreshing(false);
  };

  const handleCameraPress = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera access to take photos and find similar images."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        setProcessingCamera(true);

        try {
          const { status: mediaStatus } =
            await MediaLibrary.requestPermissionsAsync();
          if (mediaStatus !== "granted") {
            setProcessingCamera(false);
            Alert.alert(
              "Permission Required",
              "Please grant photo library access to save images."
            );
            return;
          }

          const asset = await MediaLibrary.createAssetAsync(imageUri);
          const savedUri = asset.uri;

          const resizedDataUri = await resizeForModel(savedUri);
          const embedding = await getEmbedding(resizedDataUri);

          saveEmbedding(asset.id, savedUri, embedding);

          setProcessingCamera(false);

          navigation.navigate("Comparison", {
            uri: savedUri,
          });
        } catch (embeddingError) {
          setProcessingCamera(false);
          console.error("Error processing image:", embeddingError);
          Alert.alert("Error", "Failed to process image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error launching camera:", error);
      Alert.alert("Error", "Failed to open camera. Please try again.");
    }
  };

  const handleAlbumPress = (album: AlbumItem) => {
    navigation.navigate("AlbumPhotos", {
      albumId: album.id,
      albumTitle: album.title,
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorTheme === "light" ? "#fff" : "#000" },
      ]}
      edges={["top"]}
    >
      <StatusBar
        backgroundColor={colorTheme === "light" ? "#fff" : "#000"}
        barStyle={colorTheme === "light" ? "dark-content" : "light-content"}
      />

      <AppHeader
        title="Albums"
        colorTheme={colorTheme}
        onToggleTheme={toggleTheme}
        onCameraPress={handleCameraPress}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#536AF5" />
        </View>
      ) : (
        <FlatList
          data={albums}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleAlbumPress(item)}
              style={({ pressed }) => [
                styles.albumCard,
                {
                  backgroundColor:
                    colorTheme === "light" ? "#f5f5f5" : "#1a1a1a",
                },
                pressed && styles.albumCardPressed,
              ]}
            >
              <View style={styles.albumCover}>
                {item.coverUri ? (
                  <Image
                    source={{ uri: item.coverUri }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.coverPlaceholder,
                      {
                        backgroundColor:
                          colorTheme === "light" ? "#e0e0e0" : "#333",
                      },
                    ]}
                  >
                    <Feather
                      name="image"
                      size={40}
                      color={colorTheme === "light" ? "#999" : "#666"}
                    />
                  </View>
                )}
              </View>
              <View style={styles.albumInfo}>
                <Text
                  style={[
                    styles.albumTitle,
                    { color: colorTheme === "light" ? "#000" : "#fff" },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.albumCount,
                    { color: colorTheme === "light" ? "#666" : "#999" },
                  ]}
                >
                  {item.assetCount} {item.assetCount === 1 ? "item" : "items"}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={20}
                color={colorTheme === "light" ? "#999" : "#666"}
              />
            </Pressable>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isIndexing ? 80 : 10 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              progressBackgroundColor={
                colorTheme === "light" ? "#ffffff" : "#000000"
              }
              colors={["#536AF5"]}
            />
          }
        />
      )}

      {processingCamera && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingModal}>
            <ActivityIndicator size="large" color="#536AF5" />
            <Text style={styles.processingText}>Processing image...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 15,
  },
  albumCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  albumCardPressed: {
    opacity: 0.7,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  albumInfo: {
    flex: 1,
    gap: 4,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  albumCount: {
    fontSize: 13,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingModal: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    minWidth: 200,
  },
  processingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
