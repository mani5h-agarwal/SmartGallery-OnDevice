import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface IndexingProgress {
  current: number;
  total: number;
}

interface IndexingContextValue {
  isIndexing: boolean;
  progress: IndexingProgress;
  startIndexing: (total: number) => void;
  updateIndexingProgress: (current: number, total?: number) => void;
  finishIndexing: () => void;
  cancelIndexing: () => void;
  isCancelRequested: () => boolean;
}

const IndexingContext = createContext<IndexingContextValue | undefined>(
  undefined
);

export const IndexingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isIndexing, setIsIndexing] = useState(false);
  const [progress, setProgress] = useState<IndexingProgress>({
    current: 0,
    total: 0,
  });
  const cancelRequestedRef = useRef(false);

  const startIndexing = (total: number) => {
    cancelRequestedRef.current = false;
    setIsIndexing(true);
    setProgress({ current: 0, total });
  };

  const updateIndexingProgress = (current: number, total?: number) => {
    setProgress((prev) => ({
      current,
      total: total ?? prev.total,
    }));
  };

  const finishIndexing = () => {
    cancelRequestedRef.current = false;
    setIsIndexing(false);
    setProgress({ current: 0, total: 0 });
  };

  const cancelIndexing = () => {
    cancelRequestedRef.current = true;
    setIsIndexing(false);
  };

  const isCancelRequested = () => cancelRequestedRef.current;

  const value = useMemo(
    () => ({
      isIndexing,
      progress,
      startIndexing,
      updateIndexingProgress,
      finishIndexing,
      cancelIndexing,
      isCancelRequested,
    }),
    [isIndexing, progress]
  );

  return (
    <IndexingContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {isIndexing && (
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.modal} pointerEvents="box-only">
              <View style={styles.progressRow}>
                <ActivityIndicator size="small" color="#536AF5" />
                <View style={styles.textBlock}>
                  <Text style={styles.title}>Indexing photos...</Text>
                  <Text style={styles.subtitle}>
                    {progress.current} / {progress.total}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelIndexing}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </IndexingContext.Provider>
  );
};

export const useIndexing = () => {
  const context = useContext(IndexingContext);
  if (!context) {
    throw new Error("useIndexing must be used within an IndexingProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 76,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  modal: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  textBlock: {
    flexShrink: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: "#d0d0d0",
    fontSize: 13,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#2f2f2f",
  },
  cancelText: {
    color: "#ffb3b3",
    fontWeight: "600",
    fontSize: 14,
  },
});
