import * as ImageManipulator from "expo-image-manipulator";

export default async function resizeForModel(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 224, height: 224 } }],
    {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return result.uri;
}