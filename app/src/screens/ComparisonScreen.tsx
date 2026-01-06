import Feather from "@expo/vector-icons/Feather";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAllEmbeddings,
  isUriIndexed,
  saveEmbedding,
} from "../db/embeddings";
import { getEmbedding } from "../services/embedding";
import resizeForModel from "../services/resize";
import { cosineSimilarity } from "../services/similarity";
import { useIndexing } from "../context/IndexingContext";

type PhotoItem = {
  id: string;
  uri: string;
  score: number;
  isOriginal?: boolean;
};

type NavigationProp = NativeStackNavigationProp<any>;

type Props = {
  navigation: NavigationProp;
  route: {
    params: {
      uri: string;
      id?: string; // Optional photo ID for indexing
      embedding?: number[]; // Optional embedding if from camera capture
    };
  };
};

const { width } = Dimensions.get("window");
const SPACING = 2;
const PHOTO_SIZE = (width - SPACING * 4) / 3;

export default function ComparisonScreen({ navigation, route }: Props) {
  const { uri, id, embedding } = route.params;
  const [similarPhotos, setSimilarPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isIndexing } = useIndexing();

  useEffect(() => {
    async function findSimilarPhotos() {
      try {
        setLoading(true);

        // Auto-index the query image if it's not already indexed
        let queryEmbedding = embedding;
        if (!queryEmbedding) {
          const resized = await resizeForModel(uri);
          queryEmbedding = await getEmbedding(resized);

          // If photo ID is provided and image is not indexed, save it
          if (id && !isUriIndexed(uri)) {
            saveEmbedding(id, uri, queryEmbedding);
          }
        }

        const all = await getAllEmbeddings();

        const ranked = all
          .map((item) => ({
            uri: item.uri,
            score: cosineSimilarity(queryEmbedding, item.embedding),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 30);

        setSimilarPhotos(
          ranked.map((r, idx) => ({
            id: `${idx}`,
            uri: r.uri,
            score: r.score,
            isOriginal: r.uri === uri,
          }))
        );
      } catch (error) {
        console.error("Error finding similar photos:", error);
      } finally {
        setLoading(false);
      }
    }

    findSimilarPhotos();
  }, [uri, id, embedding]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Similar Photos</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#536AF5" />
          <Text style={styles.loadingText}>Finding similar photos...</Text>
        </View>
      )}

      {/* Results */}
      {!loading && similarPhotos.length > 0 && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {similarPhotos.length - 1} matches found
            </Text>
            <View style={styles.matchBadge}>
              <Feather name="percent" size={12} color="#536AF5" />
              <Text style={styles.matchText}>Match</Text>
            </View>
          </View>

          <FlatList
            data={similarPhotos}
            numColumns={3}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: isIndexing ? 150 : 20 }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            windowSize={5}
            initialNumToRender={30}
            renderItem={({ item, index }) => (
              <Pressable
                style={styles.photoWrapper}
                onPress={() => navigation.push("ImageView", { uri: item.uri })}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                {/* Original Badge */}
                {item.isOriginal && (
                  <View style={styles.originalBadge}>
                    <Feather name="search" size={30} color="#ffffff" />
                  </View>
                )}

                {/* Similarity Badge */}
                {!item.isOriginal && (
                  <View style={styles.similarityBadge}>
                    <Text style={styles.similarityText}>
                      {Math.round(item.score * 100)}%
                    </Text>
                  </View>
                )}

                {/* Rank Badge */}
                {!item.isOriginal && (
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index}</Text>
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Empty State */}
      {!loading && similarPhotos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Feather name="image" size={48} color="#333" />
          <Text style={styles.emptyText}>No similar photos found</Text>
          <Text style={styles.emptySubtext}>
            Try uploading more photos to improve results
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#000",
    marginBottom: 8,
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
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  queryImageContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  queryLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  queryImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0a0a0a",
  },
  resultsCount: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(83, 106, 245, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(83, 106, 245, 0.2)",
  },
  matchText: {
    color: "#536AF5",
    fontSize: 11,
    fontWeight: "600",
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
    borderRadius: 4,
  },
  originalBadge: {
    position: "absolute",
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0000003b",
    borderRadius: 4,
  },
  similarityBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(83, 106, 245, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  similarityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  rankBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rankText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  emptySubtext: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
  },
});
