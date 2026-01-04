import * as MediaLibrary from "expo-media-library";

async function getPhotos(limit = 500) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media permission not granted");
  }

  const photos = await MediaLibrary.getAssetsAsync({
    mediaType: MediaLibrary.MediaType.photo,
    first: limit,
    sortBy: MediaLibrary.SortBy.creationTime,
  });

  return photos.assets;
}

export default getPhotos;