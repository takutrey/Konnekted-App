import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  ImageBackground,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const SplashScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  const slides = [
    {
      id: 0,
      title: "Discover\nNearby\nEvents",
      image: require("../assets/splash-screen1.jpeg"),
      showLogo: true,
    },
    {
      id: 1,
      title: "Swipe. Tap. Party.",
      subtitle:
        "Scroll through epic events happening near you and find your next obsession.",
      image: require("../assets/download.jpeg"),
      showLogo: false,
    },
    {
      id: 2,
      title: "Never Miss Out",
      subtitle:
        "From concerts to conferences, marathons to festivals - stay connected to what matters.",
      image: require("../assets/DRC-Marathoners.jpeg"),
      showLogo: false,
    },
    {
      id: 3,
      title: "Set Smart Reminders",
      subtitle:
        "Get notified before events start so you never miss the action.",
      image: require("../assets/splashhh.jpeg"),
      showLogo: false,
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      scrollViewRef.current?.scrollTo({ x: nextSlide * width, animated: true });
      setCurrentSlide(nextSlide);
    } else {
      navigation.replace("Home");
    }
  };

  const handleSkip = () => {
    navigation.replace("Home");
  };

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== currentSlide) {
      setCurrentSlide(slide);
    }
  };

  const currentSlideData = slides[currentSlide];

  // Sparkle positions for decorative stars
  const sparkles = [
    { top: "15%", left: "15%", size: 3, delay: 0 },
    { top: "25%", left: "25%", size: 2, delay: 300 },
    { top: "12%", right: "20%", size: 4, delay: 600 },
    { top: "35%", right: "15%", size: 2, delay: 200 },
    { top: "45%", left: "10%", size: 3, delay: 400 },
    { top: "55%", right: "25%", size: 2, delay: 500 },
    { top: "65%", left: "20%", size: 3, delay: 100 },
    { top: "60%", right: "18%", size: 4, delay: 700 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Horizontal ScrollView for swiping */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <ImageBackground
              source={slide.image}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  "rgba(20, 10, 40, 0.4)",
                  "rgba(20, 10, 40, 0.5)",
                  "rgba(0, 0, 0, 0.7)",
                ]}
                style={styles.gradient}
              >
                {/* Logo and Header Section */}
                <View style={styles.header}>
                  <View style={styles.logoContainer}>
                    <View style={styles.kLogo}>
                      <Image
                        source={require("../assets/logo.png")}
                        style={styles.logoImage}
                      />
                    </View>
                    <Text style={styles.logoText}>Konnekted</Text>
                  </View>
                </View>

                {/* Sparkles/Stars Decoration - Only on first slide */}
                {slide.showLogo &&
                  sparkles.map((sparkle, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.sparkle,
                        {
                          top: sparkle.top,
                          left: sparkle.left,
                          right: sparkle.right,
                          width: sparkle.size,
                          height: sparkle.size,
                          opacity: fadeAnim,
                        },
                      ]}
                    />
                  ))}

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                  {/* Main Title */}
                  <View style={styles.titleContainer}>
                    <Text style={styles.mainTitle}>{slide.title}</Text>
                    {slide.subtitle && (
                      <Text style={styles.subtitle}>{slide.subtitle}</Text>
                    )}
                  </View>

                  {/* Bottom Section - Only show controls on current slide */}
                  {currentSlide === index && (
                    <View style={styles.bottomSection}>
                      {/* Pagination Dots */}
                      <View style={styles.pagination}>
                        {slides.map((_, dotIndex) => (
                          <View
                            key={dotIndex}
                            style={[
                              styles.dot,
                              currentSlide === dotIndex && styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>

                      {/* Get Started Button */}
                      <TouchableOpacity
                        style={styles.button}
                        onPress={handleNext}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={["#8B5CF6", "#7C3AED"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.buttonText}>
                            {currentSlide === slides.length - 1
                              ? "Get Started"
                              : "Continue"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Skip/Sign In Link */}
                      {currentSlide < slides.length - 1 && (
                        <TouchableOpacity
                          style={styles.skipContainer}
                          onPress={handleSkip}
                        >
                          <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </Animated.View>
              </LinearGradient>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    height: height,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kLogo: {
    width: 32,
    height: 32,
    position: "relative",
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  logoText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sparkle: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 50,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 40,
  },
  mainTitle: {
    color: "white",
    fontSize: 58,
    fontWeight: "900",
    lineHeight: 64,
    letterSpacing: -1,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 20,
    fontWeight: "400",
  },
  bottomSection: {
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  activeDot: {
    width: 24,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  button: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  skipContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default SplashScreen;
