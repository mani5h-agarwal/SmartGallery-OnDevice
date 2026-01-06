<div align="left">

# SmartGallery🚀

On-device AI photo search and similarity browsing. Private by design.

</div>

## What It Is

SmartGallery is a privacy-first photo browser that creates compact visual "fingerprints" (embeddings) for your photos entirely on your device. It then uses those vectors to find visually similar images instantly — no cloud uploads, no external services.

## Why It Matters

- Keep your library local while still getting powerful AI features.
- Rediscover moments by visual similarity (colors, layouts, scenes), not just timestamps or albums.
- Compare shots side-by-side to pick the best take.

## Highlights

- Private, offline processing (no network required after install)
- Fast similarity search using cosine similarity over embeddings
- Albums and all-photos views with smooth, large libraries
- One-tap camera capture → find similar images immediately
- Indexing overlay with live progress and cancel
- Light/Dark theme with persisted preference

## Screenshots

<div align="center">
  <table>
	  <tr>
      <td><img src="https://github.com/user-attachments/assets/50690c00-992b-4495-b8e0-26262ee6bb00" width="250" /></td>
      <td><img src="https://github.com/user-attachments/assets/f87df823-1336-4868-9929-7b9233e90917" width="250" /></td>
      <td><img src="https://github.com/user-attachments/assets/289473a5-ffa7-49a9-9626-7047f1e0e34f" width="250" /></td>
	  </tr>
	  <tr>
      <td><img src="https://github.com/user-attachments/assets/4c444338-f6a5-43c3-8596-fb6a1cdc2dbd" width="250" /></td>
      <td><img src="https://github.com/user-attachments/assets/f7793836-b2c5-4e83-9eed-d46285557c3e" width="250" /></td>
    </tr>
  </table>
</div>

## How It Works

1. Media scan and prep

   - Requests photo library permissions and lists assets via `expo-media-library`.
   - Resizes each image to 224×224 using `expo-image-manipulator` to reduce compute and memory.

2. Embedding generation

   - Delegates to a native module `EmbeddingModule.getEmbedding(uri)` to compute a vector for the resized image.
   - The vector length/model is abstracted behind the native module.

3. Local persistence

   - Stores results in SQLite: a single `images` table with `id`, `uri`, `embedding` (JSON stringified array).
   - See [app/src/db/embeddings.ts](app/src/db/embeddings.ts) for schema and helpers.

4. Similarity search

   - For a query image (from library or camera), computes or reuses its embedding.
   - Loads all stored embeddings and ranks by cosine similarity.
   - Displays top results with a percentage-like score. See [app/src/services/similarity.ts](app/src/services/similarity.ts).

5. User experience
   - Long-press to enter selection mode and batch-index unindexed photos with progress and cancel. See [app/src/context/IndexingContext.tsx](app/src/context/IndexingContext.tsx).
   - Tap a photo to view it full screen; “Find Similar” jumps to the comparison grid.
   - Light/Dark theme persisted via AsyncStorage in [app/src/context/ThemeContext.tsx](app/src/context/ThemeContext.tsx).

## Architecture

- Navigation: Bottom tabs in [app/src/navigation/TabNavigator.tsx](app/src/navigation/TabNavigator.tsx)
  - All Photos: [app/src/screens/AllImagesScreen.tsx](app/src/screens/AllImagesScreen.tsx)
  - Albums: [app/src/screens/AlbumsScreen.tsx](app/src/screens/AlbumsScreen.tsx)
  - Image View: [app/src/screens/ImageViewScreen.tsx](app/src/screens/ImageViewScreen.tsx)
  - Comparison: [app/src/screens/ComparisonScreen.tsx](app/src/screens/ComparisonScreen.tsx)
- Context Providers
  - Indexing progress/controls: [app/src/context/IndexingContext.tsx](app/src/context/IndexingContext.tsx)
  - Theme preference: [app/src/context/ThemeContext.tsx](app/src/context/ThemeContext.tsx)
- Data & Services
  - SQLite storage (schema + helpers): [app/src/db/embeddings.ts](app/src/db/embeddings.ts)
  - Media access: [app/src/services/media.ts](app/src/services/media.ts)
  - Image resize: [app/src/services/resize.ts](app/src/services/resize.ts)
  - Embedding bridge: [app/src/services/embedding.ts](app/src/services/embedding.ts)
  - Similarity scoring: [app/src/services/similarity.ts](app/src/services/similarity.ts)

## Data Model

SQLite database `gallery.db`

- Table: `images`
  - `id` (TEXT, primary key) → MediaLibrary asset id
  - `uri` (TEXT) → Asset URI used for display/loading
  - `embedding` (TEXT) → JSON string of number[]

Notes

- Embeddings are stored as JSON for simplicity; this avoids native array types and keeps read/write fast enough on-device.
- Duplicate work is avoided by checking already indexed IDs/URIs.

## Performance Choices

- Resize to 224×224 to keep the embedding step snappy.
- Sequential indexing with cancel to avoid memory spikes and reduce thermal throttling.
- Optimized lists: `FlatList` with sensible `windowSize`, `maxToRenderPerBatch`, and `removeClippedSubviews`.

## UX Details

- Selection mode appears only for unindexed items; indexed images are skipped automatically in “Select All”.
- Camera flow saves the capture to the library, indexes it, then navigates straight to the similar results.
- Subtle badges show the query image and ranked similarity on the grid.
