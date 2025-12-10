package expo.modules.kotlin.devtools

import okhttp3.Interceptor
import okhttp3.Response

/**
 * Stub implementation of ExpoNetworkInspectOkHttpAppInterceptor
 * for compatibility with expo-dev-client 2.x on Expo SDK 48
 */
class ExpoNetworkInspectOkHttpAppInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    return chain.proceed(chain.request())
  }
}
