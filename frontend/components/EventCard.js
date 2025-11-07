import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ImageView from "react-native-image-viewing";
import * as Notifications from "expo-notifications";

const { width } = Dimensions.get("window");

const EventCard = ({ title, date, location, image, link }) => {
  const [visible, setVisible] = useState(false);

  const images = [
    {
      uri:
        image ||
        "https://img.freepik.com/premium-vector/upcoming-events-speech-bubble-banner-with-upcoming-events-text-glassmorphism-style-business-marketing-advertising-vector-isolated-background-eps-10_399089-2079.jpg",
    },
  ];

  return (
    <View style={styles.card}>
      {/* Image with gradient overlay */}
      <TouchableOpacity onPress={() => setVisible(true)} activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageGradient}
          />
        </View>
      </TouchableOpacity>

      {/* Image viewer modal */}
      <ImageView
        images={images}
        imageIndex={0}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        backgroundColor="rgba(0,0,0,0.9)"
      />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.dateTimeContainer}>
            <MaterialIcons name="date-range" size={16} color="#8E6C88" />
            <Text style={styles.subText}>{date}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#8E6C88" />
          <Text style={styles.addressText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL(link)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#8E6C88", "#6B4D7A"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{"LEARN MORE"}</Text>
            <MaterialIcons
              name={"arrow-forward"}
              size={18}
              color={"white"}
              style={styles.buttonIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#6B4D7A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  imageContainer: {
    height: 200,
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D2D2D",
    marginBottom: 8,
    fontFamily: "sans-serif-medium",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  subText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    fontFamily: "sans-serif",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    flex: 1,
    fontFamily: "sans-serif",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#6B4D7A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.5,
    fontFamily: "sans-serif-medium",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default EventCard;
