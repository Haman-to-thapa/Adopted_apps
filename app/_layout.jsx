import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get error", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("SecureStore save error", error);
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    outfit: require("./../assets/Outfit-Regular.ttf"),
    "outfit-medium": require("./../assets/Outfit-Medium.ttf"),
    "outfit-bold": require("./../assets/Outfit-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
    >
      <Stack screenOptions={{ headerShown: false }} >
        <Stack.Screen name="index"
          options={{
            headerShown: false
          }} />
        <Stack.Screen name="(tabs)"
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen name="login/index"
          options={{
            headerShown: false
          }}
        />

      </Stack>
    </ClerkProvider>
  );
}