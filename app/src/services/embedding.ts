import { NativeModules } from "react-native";

const { EmbeddingModule } = NativeModules;

export async function getEmbedding(uri: string): Promise<number[]> {
  return await EmbeddingModule.getEmbedding(uri);
}