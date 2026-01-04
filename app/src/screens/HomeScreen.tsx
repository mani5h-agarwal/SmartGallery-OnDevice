import Feather from "@expo/vector-icons/Feather";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getIndexedPhotoIds, initDB, saveEmbedding } from "../db/embeddings";
import { getEmbedding } from "../services/embedding";
import getPhotos from "../services/media";
import resizeForModel from "../services/resize";

type NavigationProp = NativeStackNavigationProp<any>;

type Props = {
  navigation: NavigationProp;
};

type PhotoItem = {
  id: string;
  uri: string;
  indexed?: boolean;
  selected?: boolean;
};

// Header Component
const Header = ({ colorTheme, onToggleTheme, onCameraPress }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  const rotateIcon = () => {
    Animated.timing(rotation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      rotation.setValue(0);
    });
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handlePress = () => {
    rotateIcon();
    onToggleTheme();
  };

  return (
    <View style={styles.header}>
      <Text
        style={[
          styles.heading,
          { color: colorTheme === "light" ? "#000" : "#fff" },
        ]}
      >
        SmartGallery
      </Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity onPress={onCameraPress} style={styles.cameraButton}>
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
        <TouchableOpacity onPress={handlePress}>
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

// Selection Header Component
const SelectionHeader = ({
  colorTheme,
  selectedCount,
  selectAll,
  onCancel,
  onToggleSelectAll,
  onUpload,
}) => {
  return (
    <View style={styles.selectionHeader}>
      <TouchableOpacity onPress={onCancel} style={styles.button}>
        <Feather
          name="x"
          size={22}
          color={colorTheme === "light" ? "#000" : "#fff"}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleSelectAll} style={styles.button}>
        <Feather
          name={selectAll ? "check-square" : "square"}
          size={22}
          color={colorTheme === "light" ? "#000" : "#fff"}
        />
      </TouchableOpacity>
      <Text
        style={[
          styles.selectionCount,
          { color: colorTheme === "light" ? "#000" : "#fff" },
        ]}
      >
        {selectedCount} selected
      </Text>
      <TouchableOpacity
        onPress={onUpload}
        style={styles.button}
        disabled={selectedCount === 0}
      >
        <Feather
          name="upload"
          size={22}
          color={
            selectedCount > 0
              ? colorTheme === "light"
                ? "#000"
                : "#fff"
              : "#888"
          }
        />
      </TouchableOpacity>
    </View>
  );
};

// Upload Progress Component
const UploadProgress = ({
  isUploading,
  uploadedCount,
  totalToUpload,
  uploadProgress,
  colorTheme,
}) => {
  if (isUploading) {
    return (
      <View style={styles.uploadProgressContainer}>
        <View style={styles.progressTextRow}>
          <Text
            style={{
              color: colorTheme === "light" ? "#444" : "#ccc",
              fontWeight: "500",
            }}
          >
            Indexing {uploadedCount} of {totalToUpload}
          </Text>
          <ActivityIndicator size="small" color="#536AF5" />
        </View>
        <View
          style={[
            styles.progressBarContainer,
            { backgroundColor: colorTheme === "light" ? "#e0e0e0" : "#333" },
          ]}
        >
          <View
            style={[styles.progressBar, { width: `${uploadProgress * 100}%` }]}
          />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.instructionContainer}>
      <Text
        style={{
          color: colorTheme === "light" ? "#666" : "#999",
          fontSize: 12,
          // textAlign: "center",
        }}
      >
        Long press on any photo to select it for upload
      </Text>
    </View>
  );
};

export default function HomeScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [indexProgress, setIndexProgress] = useState({ current: 0, total: 0 });
  const [colorTheme, setColorTheme] = useState("light");
  const [selectAll, setSelectAll] = useState(false);
  const [processingCamera, setProcessingCamera] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initDB();
  }, []);

  useEffect(() => {
    async function loadPhotos() {
      try {
        const assets = await getPhotos(2000);
        const indexedIds = getIndexedPhotoIds();
        setPhotos(
          assets.map((a) => ({
            id: a.id,
            uri: a.uri,
            indexed: indexedIds.has(a.id),
            selected: false,
          }))
        );
      } catch (error) {
        console.error(error);
      }
    }
    loadPhotos();
  }, []);

  useEffect(() => {
    if (photos.filter((p) => p.selected).length === 0) {
      setSelectionMode(false);
    }
  }, [photos]);

  function toggleSelection(photoId: string) {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, selected: !p.selected } : p))
    );
  }

  const toggleSelectAllHandler = () => {
    const unindexedPhotos = photos.filter((p) => !p.indexed);

    if (photos.filter((p) => p.selected).length === unindexedPhotos.length) {
      setPhotos((prev) => prev.map((p) => ({ ...p, selected: false })));
      setSelectAll(false);
    } else {
      setPhotos((prev) =>
        prev.map((p) => (p.indexed ? p : { ...p, selected: true }))
      );
      setSelectAll(true);
    }
  };

  const cancelSelection = () => {
    setPhotos((prev) => prev.map((p) => ({ ...p, selected: false })));
    setSelectAll(false);
    setSelectionMode(false);
  };

  async function indexPhotos(photosToIndex: PhotoItem[]) {
    if (photosToIndex.length === 0) return;

    setIndexing(true);
    setIndexProgress({ current: 0, total: photosToIndex.length });

    for (let i = 0; i < photosToIndex.length; i++) {
      const photo = photosToIndex[i];
      try {
        const resizedDataUri = await resizeForModel(photo.uri);
        const embedding = await getEmbedding(resizedDataUri);
        saveEmbedding(photo.id, photo.uri, embedding);

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, indexed: true, selected: false } : p
          )
        );
        setIndexProgress({ current: i + 1, total: photosToIndex.length });
      } catch (err) {
        console.warn("Indexing failed:", photo.uri, err);
      }
    }

    setIndexing(false);
    setSelectionMode(false);
    setPhotos((prev) => prev.map((p) => ({ ...p, selected: false })));
  }

  function uploadSelectedPhotos() {
    const selected = photos.filter((p) => p.selected && !p.indexed);
    cancelSelection();
    indexPhotos(selected);
  }

  function onImagePress(photo: PhotoItem) {
    if (selectionMode) {
      if (!photo.indexed) {
        toggleSelection(photo.id);
      }
    } else {
      navigation.navigate("ImageView", { uri: photo.uri });
    }
  }

  function onLongPress(photo: PhotoItem) {
    if (!photo.indexed && !selectionMode) {
      setSelectionMode(true);
      toggleSelection(photo.id);
    }
  }

  const toggleTheme = () => {
    setColorTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const assets = await getPhotos(2000);
      const indexedIds = getIndexedPhotoIds();
      setPhotos(
        assets.map((a) => ({
          id: a.id,
          uri: a.uri,
          indexed: indexedIds.has(a.id),
          selected: false,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
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
          // Save image to gallery
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

          // Create embedding for the saved image
          const resizedDataUri = await resizeForModel(savedUri);
          const embedding = await getEmbedding(resizedDataUri);

          // Save embedding to database
          saveEmbedding(asset.id, savedUri, embedding);

          setProcessingCamera(false);

          // Navigate to Comparison with the saved image URI (no embedding needed)
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

  const selectedCount = photos.filter((p) => p.selected).length;
  const uploadProgress =
    indexProgress.total > 0 ? indexProgress.current / indexProgress.total : 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colorTheme === "light" ? "#fff" : "#000" },
      ]}
    >
      <StatusBar
        backgroundColor={colorTheme === "light" ? "#fff" : "#000"}
        barStyle={colorTheme === "light" ? "dark-content" : "light-content"}
      />

      <View style={styles.headerContainer}>
        {selectionMode ? (
          <SelectionHeader
            colorTheme={colorTheme}
            selectedCount={selectedCount}
            selectAll={selectAll}
            onCancel={cancelSelection}
            onToggleSelectAll={toggleSelectAllHandler}
            onUpload={uploadSelectedPhotos}
          />
        ) : (
          <Header
            colorTheme={colorTheme}
            onToggleTheme={toggleTheme}
            onCameraPress={handleCameraPress}
          />
        )}
      </View>

      <UploadProgress
        isUploading={indexing}
        uploadedCount={indexProgress.current}
        totalToUpload={indexProgress.total}
        uploadProgress={uploadProgress}
        colorTheme={colorTheme}
      />

      {photos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#536AF5" />
        </View>
      ) : (
        <View style={styles.galleryContainer}>
          <FlatList
            data={photos}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onImagePress(item)}
                onLongPress={() => onLongPress(item)}
                style={styles.photoWrapper}
              >
                {({ pressed }) => (
                  <>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.photo}
                      resizeMode="cover"
                    />

                    {pressed && <View style={styles.pressedOverlay} />}

                    {item.indexed && (
                      <View style={styles.uploadedBadge}>
                        <Feather name="check" size={12} color="#fff" />
                      </View>
                    )}

                    {selectionMode && !item.indexed && (
                      <View
                        style={[
                          styles.selectionCircle,
                          item.selected && styles.selectionCircleSelected,
                        ]}
                      >
                        {item.selected && (
                          <Feather name="check" size={12} color="#fff" />
                        )}
                      </View>
                    )}

                    {selectionMode && item.indexed && (
                      <View style={styles.disabledOverlay} />
                    )}
                  </>
                )}
              </Pressable>
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colorTheme === "light" ? "#536AF5" : "#536AF5"}
                colors={["#536AF5"]}
              />
            }
          />
        </View>
      )}

      {/* Camera Processing Overlay */}
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

const { width } = Dimensions.get("window");
const SPACING = 2;
const PHOTO_SIZE = (width - SPACING * 4) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cameraButton: {
    marginRight: 0,
  },
  iconBorder: {
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  button: {
    padding: 8,
    borderRadius: 20,
  },
  selectionCount: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 10,
  },
  uploadProgressContainer: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    height: 32,
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#536AF5",
  },
  instructionContainer: {
    // alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    paddingHorizontal: 15,
    height: 32,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryContainer: {
    flex: 1,
    alignItems: "center",
  },
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: SPACING,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
  },
  uploadedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(76, 175, 80, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCircle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCircleSelected: {
    backgroundColor: "#536AF5",
    borderColor: "#536AF5",
  },
  pressedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  disabledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
