import { Image, StyleSheet, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from './../../constants/Colors';
import React, { useCallback, useEffect } from "react";
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth, useAuth } from '@clerk/clerk-expo';
import { useRouter } from "expo-router";

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  useWarmUpBrowser();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const { startOAuthFlow } = useOAuth({
    strategy: "oauth_google"
  });

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)/home');
    }
  }, [isSignedIn, router]);

  const handleGetStarted = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)/home', { scheme: 'myapp' })
      });

      if (createdSessionId) {
        setActive({ session: createdSessionId });
        router.replace('/(tabs)/home');
      } else {
        console.warn('OAuth flow completed but no session was created');
      }
    } catch (error) {
      console.error('OAuth error', error);
    }
  }, [startOAuthFlow, router]);

  if (isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroContainer}>
        <Image
          source={require("../../assets/images/login.png")}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>PetPals</Text>
          <Text style={styles.heroSubtitle}>Your Pet Marketplace</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.valueSection}>
          <Text style={styles.mainTitle}>
            Buy, Sell, or Adopt{'\n'}Pets Near You
          </Text>

          <Text style={styles.subtitle}>
            Connect with pet lovers in your community
          </Text>

          <View style={styles.highlights}>
            <View style={styles.highlightRow}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>💰</Text>
                <Text style={styles.highlightText}>Buy/Sell Safely</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>📍</Text>
                <Text style={styles.highlightText}>Local Pets</Text>
              </View>
            </View>
            <View style={styles.highlightRow}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>✅</Text>
                <Text style={styles.highlightText}>Verified Users</Text>
              </View>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightIcon}>💬</Text>
                <Text style={styles.highlightText}>Direct Chat</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Sign in with Google</Text>
            <Text style={styles.primaryButtonSubtext}>Get started now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE || "#FFFFFF",
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  heroTitle: {
    fontSize: 42,
    fontFamily: "outfit-bold",
    color: Colors.WHITE || "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    fontFamily: "outfit-medium",
    color: Colors.WHITE || "#FFFFFF",
    opacity: 0.95,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  valueSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: "outfit-bold",
    color: Colors.DARK || "#1A1A1A",
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "outfit",
    color: Colors.GRAY || "#666666",
    textAlign: 'center',
    marginBottom: 25,
  },
  highlights: {
    width: '100%',
    marginTop: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  highlightIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 13,
    fontFamily: "outfit-medium",
    color: Colors.DARK || "#333333",
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 14,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: "outfit-bold",
    color: Colors.WHITE || "#FFFFFF",
    marginBottom: 3,
  },
  primaryButtonSubtext: {
    fontSize: 13,
    fontFamily: "outfit",
    color: "rgba(255, 255, 255, 0.9)",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});