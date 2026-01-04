package com.mani5h.SmartGallery
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import android.graphics.BitmapFactory
import android.graphics.Bitmap

import com.facebook.react.bridge.*

class EmbeddingModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {


    private var interpreter: Interpreter? = null

private fun loadModel(): Interpreter {
  if (interpreter != null) return interpreter!!

  val assetManager = reactApplicationContext.assets
  val inputStream = assetManager.open("mobilenet_v3.tflite")
  val modelBytes = inputStream.readBytes()
  val buffer = ByteBuffer.allocateDirect(modelBytes.size)
  buffer.order(ByteOrder.nativeOrder())
  buffer.put(modelBytes)
  buffer.rewind()

  interpreter = Interpreter(buffer)
  return interpreter!!
}

private fun loadBitmapFromUri(uri: String): Bitmap {
  val inputStream = reactApplicationContext
    .contentResolver
    .openInputStream(android.net.Uri.parse(uri))

  val bitmap = BitmapFactory.decodeStream(inputStream)
  inputStream?.close()
  return Bitmap.createScaledBitmap(bitmap, 224, 224, true)
}
private fun bitmapToInputBuffer(bitmap: Bitmap): ByteBuffer {
  val inputBuffer =
    ByteBuffer.allocateDirect(4 * 224 * 224 * 3)
  inputBuffer.order(ByteOrder.nativeOrder())

  val pixels = IntArray(224 * 224)
  bitmap.getPixels(pixels, 0, 224, 0, 0, 224, 224)

  var pixelIndex = 0
  for (i in 0 until 224) {
    for (j in 0 until 224) {
      val pixel = pixels[pixelIndex++]

      // Normalize to [-1, 1]
      inputBuffer.putFloat(((pixel shr 16 and 0xFF) / 127.5f) - 1f)
      inputBuffer.putFloat(((pixel shr 8 and 0xFF) / 127.5f) - 1f)
      inputBuffer.putFloat(((pixel and 0xFF) / 127.5f) - 1f)
    }
  }

  inputBuffer.rewind()
  return inputBuffer
}
  override fun getName(): String {
    return "EmbeddingModule"
  }

@ReactMethod
fun getEmbedding(imageUri: String, promise: Promise) {
  try {
    val interpreter = loadModel()
    val bitmap = loadBitmapFromUri(imageUri)
    val input = bitmapToInputBuffer(bitmap)

    val outputSize = interpreter.getOutputTensor(0).shape()[1]
    val output =
      Array(1) { FloatArray(outputSize) }

    interpreter.run(input, output)

    val result = Arguments.createArray()
    for (value in output[0]) {
      result.pushDouble(value.toDouble())
    }

    promise.resolve(result)
  } catch (e: Exception) {
    promise.reject("EMBEDDING_ERROR", e)
  }
}
}