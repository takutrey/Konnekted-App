import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  ActivityIndicator,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import EventCard from "../components/EventCard";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import io from "socket.io-client";

dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.extend(customParseFormat);

const baseUrl = "https://0e38c029e913.ngrok-free.app/events";
const socket = io(baseUrl);
const CACHE_DURATION_MINUTES = 60;

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollViewRef = useRef(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const parseDate = (rawDate) => {
    if (!rawDate) return null;

    const formats = [
      "DD/MM/YYYY - HH:mm",
      "DD/MM/YYYY",
      "ddd, D MMM",
      "DD-DD MMM",
      "DD MMM",
    ];

    for (const format of formats) {
      const parsed = dayjs(rawDate, format, true);
      if (parsed.isValid()) {
        if (format.includes("MMM") && !format.includes("YYYY")) {
          return parsed.year(dayjs().year());
        }
        return parsed;
      }
    }

    const fallback = dayjs(rawDate);
    return fallback.isValid() ? fallback : null;
  };

  // Filter events based on search criteria
  const filterEvents = (eventsToFilter) => {
    let filtered = eventsToFilter;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
      );
    }

    // Price filters
    if (minPrice || maxPrice) {
      filtered = filtered.filter((event) => {
        const price = parseFloat(event.price) || 0;
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;
        return price >= min && price <= max;
      });
    }

    return filtered;
  };

  // Apply filters whenever search criteria or events change
  useEffect(() => {
    const filtered = filterEvents(events);
    setFilteredEvents(filtered);
  }, [events, searchQuery, minPrice, maxPrice]);

  const clearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to socket");
    });

    socket.on("new-events", (events) => {
      console.log("New events received", events);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const cache = await AsyncStorage.getItem("eventsCache");
      const cacheTimestamp = await AsyncStorage.getItem("eventsCacheTime");
      const now = dayjs();

      if (cache && cacheTimestamp) {
        const then = dayjs(cacheTimestamp);
        const diff = now.diff(then, "minute");

        if (diff < CACHE_DURATION_MINUTES) {
          const cachedEvents = JSON.parse(cache);
          setEvents(cachedEvents);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        if (cache) {
          setEvents(JSON.parse(cache));
          setLoading(false);
          setRefreshing(false);
          return;
        } else {
          throw new Error("No internet and no cached data available");
        }
      }

      const responses = await Promise.all([
        axios.get(`${baseUrl}/allevents`),
        axios.get(`${baseUrl}/hype-nation`),
        axios.get(`${baseUrl}/tentimes`),
        axios.get(`${baseUrl}/predict-hq`),
        axios.get(`${baseUrl}/chamines`),
        axios.get(`${baseUrl}/conference-alerts`),
        axios.get(`${baseUrl}/ticket-box`),
        axios.get(`${baseUrl}/agric-zim`),
        axios.get(`${baseUrl}/events-eye`),
        axios.get(`${baseUrl}/motorsports`),
      ]);

      const combinedEvents = responses.flatMap(
        (response) => response.data || []
      );

      const uniqueEventsMap = new Map();

      combinedEvents.forEach((event) => {
        if (!event.title || event.title.trim() === "") {
          return;
        }

        const key = `${event.title}-${event.rawDate || event.date}-${
          event.link
        }`;

        const rawDateValue = event.rawDate || event.date;
        const eventDate = parseDate(rawDateValue);

        if (!uniqueEventsMap.has(key) && eventDate && eventDate.isAfter(now)) {
          uniqueEventsMap.set(key, {
            ...event,
            parsedDate: eventDate,
            formattedDate: eventDate.format("ddd, D MMM"),
          });
        }
      });

      const upcomingEvents = Array.from(uniqueEventsMap.values()).sort(
        (a, b) => {
          if (!a.parsedDate && !b.parsedDate) return 0;
          if (!a.parsedDate) return 1;
          if (!b.parsedDate) return -1;
          return a.parsedDate.valueOf() - b.parsedDate.valueOf();
        }
      );

      console.log(`Processed ${upcomingEvents.length} upcoming events`);

      await AsyncStorage.setItem("eventsCache", JSON.stringify(upcomingEvents));
      await AsyncStorage.setItem("eventsCacheTime", now.toISOString());

      setEvents(upcomingEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const clearOldCache = async () => {
      const timestamp = await AsyncStorage.getItem("eventsCacheTime");
      if (timestamp) {
        const diff = dayjs().diff(dayjs(timestamp), "minute");
        if (diff > 1440) {
          await AsyncStorage.removeItem("eventsCache");
          await AsyncStorage.removeItem("eventsCacheTime");
        }
      }
    };
    clearOldCache();
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8E6C88" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;
  const hasActiveFilters = searchQuery.trim() || minPrice || maxPrice;

  return (
    <View style={{ flex: 1 }}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.searchToggle}
          onPress={() => setShowSearch(!showSearch)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showSearch ? "close" : "search"}
            size={24}
            color="#8E6C88"
          />
          <Text style={styles.searchToggleText}>
            {showSearch ? "Close" : "Search Events"}
          </Text>
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Filters */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#8E6C88" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.priceFilterContainer}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min price"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.priceSeparator}>-</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max price"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      )}

      {/* Results Info */}
      {hasActiveFilters && (
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""} found
            {searchQuery.trim() && ` for "${searchQuery}"`}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8E6C88"]}
            tintColor="#8E6C88"
          />
        }
        onScroll={(event) => {
          const offSetY = event.nativeEvent.contentOffset.y;
          setShowScrollTop(offSetY > 200);
        }}
        scrollEventThrottle={16}
      >
        {displayEvents.length > 0 ? (
          displayEvents.map((event, index) => (
            <View key={index} style={styles.cardContainer}>
              <EventCard
                title={event.title}
                date={event.formattedDate || event.date}
                location={event.location}
                image={
                  event.image ||
                  "https://img.freepik.com/premium-vector/upcoming-events-speech-bubble-banner-with-upcoming-events-text-glassmorphism-style-business-marketing-advertising-vector-isolated-background-eps-10_399089-2079.jpg"
                }
                link={event.link}
              />
            </View>
          ))
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.noEventsText}>
              {hasActiveFilters
                ? "No events match your search criteria"
                : "No upcoming events found"}
            </Text>
          </View>
        )}
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          onPress={() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
          activeOpacity={0.8}
        >
          <AntDesign name="arrowup" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#FAF9FC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    paddingHorizontal: 20,
    fontFamily: "sans-serif-medium",
  },
  noEventsText: {
    color: "#8E6C88",
    fontSize: 16,
    fontFamily: "sans-serif-medium",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#8E6C88",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#6B4D7A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "sans-serif-medium",
    letterSpacing: 0.5,
  },
  cardContainer: {
    marginBottom: 20,
    shadowColor: "#6B4D7A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  scrollTopButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#8E6C88",
    padding: 14,
    borderRadius: 28,
    minWidth: 56,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  // Search styles
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAF9FC",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  searchToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  searchToggleText: {
    fontSize: 16,
    color: "#8E6C88",
    fontFamily: "sans-serif-medium",
    marginLeft: 8,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#8E6C88",
    borderRadius: 16,
  },
  clearFiltersText: {
    color: "white",
    fontSize: 14,
    fontFamily: "sans-serif-medium",
  },
  searchContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: "#333",
  },
  priceFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 18,
    color: "#8E6C88",
    fontWeight: "bold",
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F0F0F0",
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "sans-serif",
  },
});

export default EventsScreen;
