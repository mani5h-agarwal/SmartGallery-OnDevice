import * as MediaLibrary from "expo-media-library";

type GetPhotosOptions = {
  albumId?: string;
  pageSize?: number;
};

// Fetch all photos, paging through the library to avoid hard caps.
async function getPhotos(options: GetPhotosOptions = {}) {
  const { albumId, pageSize = 500 } = options;

  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media permission not granted");
  }

  let allAssets: MediaLibrary.Asset[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      first: pageSize,
      album: albumId,
      sortBy: MediaLibrary.SortBy.creationTime,
      after,
    });

    allAssets = allAssets.concat(page.assets);
    after = page.endCursor ?? undefined;
    hasNextPage = page.hasNextPage;

    // Defensive break if endCursor stops advancing
    if (!hasNextPage || !after) {
      break;
    }
  }

  return allAssets;
}

export default getPhotos;
