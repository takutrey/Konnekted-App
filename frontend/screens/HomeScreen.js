import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import EventCard from "../components/EventCard";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const featuredEvents = [
    {
      title: "AfroTech Harare",
      date: "Aug 5",
      location: "Zim Expo Center",
      image: "https://via.placeholder.com/600x300.png?text=AfroTech",
      link: "https://example.com/event/afrotech",
    },
    {
      title: "Music Festival",
      date: "Aug 12",
      location: "Harare Gardens",
      image: "https://via.placeholder.com/600x300.png?text=Music+Fest",
      link: "https://example.com/event/music-fest",
    },
    {
      title: "Food Expo",
      date: "Aug 20",
      location: "Harare International Conference Center",
      image: "https://via.placeholder.com/600x300.png?text=Food+Expo",
      link: "https://example.com/event/food-expo",
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
          }}
          style={styles.bannerImage}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Discover Local Events</Text>
          <Text style={styles.bannerText}>
            Find the best events happening in your city
          </Text>
        </View>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {["All", "Music", "Art", "Food", "Sports", "Business"].map(
            (category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryPill}
                activeOpacity={0.7}
              >
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Featured Events Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => navigation.navigate("Events")}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#8E6C88" />
          </TouchableOpacity>
        </View>

        {featuredEvents.map((event, index) => (
          <View key={index} style={styles.featuredCardContainer}>
            <EventCard {...event} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FAF9FC",
    paddingBottom: 40,
  },
  bannerContainer: {
    height: 280,
    width: "100%",
    position: "relative",
    marginBottom: 24,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  bannerContent: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
  bannerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6,
    fontFamily: "sans-serif-medium",
  },
  bannerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 22,
    fontFamily: "sans-serif",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2D2D",
    letterSpacing: 0.5,
    fontFamily: "sans-serif-medium",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    color: "#8E6C88",
    fontSize: 14,
    marginRight: 5,
    fontFamily: "sans-serif-medium",
    fontWeight: "500",
  },
  categoriesContainer: {
    paddingVertical: 12,
  },
  categoryPill: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#6B4D7A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryText: {
    color: "#6B4D7A",
    fontWeight: "500",
    fontSize: 14,
    fontFamily: "sans-serif-medium",
  },
  featuredCardContainer: {
    marginBottom: 20,
    shadowColor: "#6B4D7A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
});

export default HomeScreen;
