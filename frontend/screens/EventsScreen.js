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
  Animated,
  Platform,
  Modal,
  Alert,
  ImageBackground,
  Dimensions,
  Linking,
  useColorScheme,
} from "react-native";
import EventCard from "../components/EventCard";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import io from "socket.io-client";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";

const { width } = Dimensions.get("window");

dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

const baseUrl = "https://9nfl5wvn-5050.uks1.devtunnels.ms/events";
const socketUrl = "https://9nfl5wvn-5050.uks1.devtunnels.ms";
const remindersBaseUrl =
  "https://9nfl5wvn-5050.uks1.devtunnels.ms/api/reminders";
const CACHE_DURATION_MINUTES = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Enhanced Event Card Component
const EnhancedEventCard = ({
  title,
  date,
  location,
  image,
  link,
  price,
  source,
  onReminderPress,
  hasReminder,
  reminderTime,
  onPress,
  isDarkMode,
}) => {
  const styles = getStyles(isDarkMode);

  const formatDateForDisplay = (dateObj) => {
    if (!dateObj) return "Date TBA";
    if (typeof dateObj === "string") return dateObj;
    if (dateObj && typeof dateObj === "object" && dateObj.display) {
      return dateObj.display;
    }
    if (dateObj && typeof dateObj === "object" && dateObj.startDate) {
      return dateObj.startDate;
    }
    return "Date TBA";
  };

  const getDateParts = (dateObj) => {
    const dateString = formatDateForDisplay(dateObj);

    if (dateString === "Date TBA") {
      return { month: "TBA", day: "", year: "" };
    }

    try {
      let parsedDate;
      const formats = [
        "ddd, DD MMM, YYYY - HH:mm A",
        "ddd, D MMM, YYYY - HH:mm A",
        "DD/MM/YYYY HH:mm",
        "DD/MM/YYYY - HH:mm",
        "DD/MM/YYYY",
        "YYYY-MM-DD",
        "YYYY-MM-DDTHH:mm:ss",
        "ddd, D MMM YYYY",
        "ddd, D MMM",
        "DD MMM YYYY",
        "DD MMM",
        "MMM DD, YYYY",
        "MMMM D, YYYY",
        "D MMM YYYY",
        "D MMM",
      ];

      for (const format of formats) {
        parsedDate = dayjs(dateString.trim(), format, true);
        if (parsedDate.isValid()) break;
      }

      if (!parsedDate || !parsedDate.isValid()) {
        const nativeDate = new Date(dateString);
        if (!isNaN(nativeDate.getTime())) {
          parsedDate = dayjs(nativeDate);
        }
      }

      if (parsedDate && parsedDate.isValid()) {
        return {
          month: parsedDate.format("MMM"),
          day: parsedDate.format("D"),
          year: parsedDate.format("YYYY"),
          fullMonth: parsedDate.format("MMMM"),
        };
      }

      const monthMatch = dateString.match(
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)/i
      );
      const dayMatch = dateString.match(/\b(\d{1,2})\b/);
      const yearMatch = dateString.match(/\b(20\d{2})\b/);

      let month = "TBA";
      let day = "";
      let year = "";

      if (monthMatch) {
        const monthStr = monthMatch[0];
        if (monthStr.length > 3) {
          month = dayjs().month(monthStr).format("MMM");
        } else {
          month = monthStr;
        }
      }

      if (dayMatch) day = dayMatch[1];
      if (yearMatch) year = yearMatch[1];

      return { month, day, year, fullMonth: month };
    } catch (error) {
      console.error("Error parsing date:", error);
    }

    return { month: "TBA", day: "", year: "" };
  };

  const formattedDate = formatDateForDisplay(date);
  const dateParts = getDateParts(date);

  return (
    <TouchableOpacity
      style={styles.enhancedCard}
      activeOpacity={0.95}
      onPress={onPress}
    >
      <ImageBackground
        source={{
          uri:
            image ||
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
        }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.cardGradientOverlay}>
          {/* Date Badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{dateParts.month}</Text>
            <Text style={styles.dateDay}>{dateParts.day}</Text>
            {dateParts.year && (
              <Text style={styles.dateYear}>{dateParts.year}</Text>
            )}
          </View>

          {/* Heart Icon */}
          <TouchableOpacity style={styles.heartButton}>
            <Ionicons name="heart-outline" size={22} color="white" />
          </TouchableOpacity>

          {/* Event Info Container */}
          <View style={styles.eventInfoContainer}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {title}
            </Text>

            {location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={14} color="#FFF" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            )}

            {/* Footer with Price and Reminder */}
            <View style={styles.cardFooter}>
              <View style={styles.footerLeft}>
                {price && (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{price}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.reminderBadge,
                  hasReminder && styles.reminderBadgeActive,
                ]}
                onPress={onReminderPress}
              >
                <Ionicons
                  name={hasReminder ? "notifications" : "notifications-outline"}
                  size={18}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

// Featured Event Card (smaller, for horizontal scroll)
const FeaturedEventCard = ({ title, date, image, onPress, isDarkMode }) => {
  const styles = getStyles(isDarkMode);

  return (
    <TouchableOpacity
      style={styles.featuredCard}
      activeOpacity={0.95}
      onPress={onPress}
    >
      <ImageBackground
        source={{
          uri:
            image ||
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
        }}
        style={styles.featuredCardImage}
        imageStyle={styles.featuredCardImageStyle}
      >
        <View style={styles.featuredCardOverlay}>
          <View style={styles.featuredCardContent}>
            <Text style={styles.featuredTitle} numberOfLines={3}>
              {title}
            </Text>
            <Text style={styles.featuredDate} numberOfLines={1}>
              {date}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const EventsScreen = () => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabError, setTabError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [userReminders, setUserReminders] = useState([]);
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);

  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [showCategories, setShowCategories] = useState(true);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDates, setCustomDates] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // All categories - now showing all tabs
  const allCategories = [
    { id: "all", name: "My feed", icon: "flame" },
    { id: "allevents", name: "All Events", icon: "apps" },
    { id: "tentimes", name: "Ten Times", icon: "musical-notes" },
    { id: "motorsports", name: "Motorsports", icon: "speedometer" },
    { id: "conference-alerts", name: "Conference Alerts", icon: "briefcase" },
    { id: "serpapi-events", name: "Google Events", icon: "balloon" },
    { id: "hype-nation", name: "Hype Nation", icon: "walk" },
    { id: "chamines", name: "Chamines", icon: "ticket" },
    { id: "agric-zim", name: "Agric Zim", icon: "leaf" },
    { id: "events-eye", name: "Events Eye", icon: "eye" },
    { id: "ticket-box", name: "Ticket Box", icon: "card" },
  ];

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("themePreference");
        if (savedTheme) {
          setIsDarkMode(savedTheme === "dark");
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      }
    };
    loadThemePreference();
  }, []);

  // Save theme preference
  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    try {
      await AsyncStorage.setItem(
        "themePreference",
        newDarkMode ? "dark" : "light"
      );
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const styles = getStyles(isDarkMode);

  useEffect(() => {
    const getDeviceId = async () => {
      try {
        let id = await AsyncStorage.getItem("deviceId");
        if (!id) {
          const deviceName = (Device.deviceName || "unknown").replace(/'/g, "");
          const modelName = (Device.modelName || "unknown").replace(/'/g, "");
          const osVersion = Device.osVersion || "unknown";
          id = `${deviceName}-${modelName}-${osVersion}-${Date.now()}`;
          await AsyncStorage.setItem("deviceId", id);
        }
        setDeviceId(id);
        await requestNotificationPermissions();
        await fetchUserReminders(id);
      } catch (error) {
        console.error("Error getting device ID:", error);
      }
    };
    getDeviceId();
  }, []);

  const fetchUserReminders = async (deviceId) => {
    try {
      if (!deviceId) return;
      const cleanDeviceId = deviceId.replace(/'/g, "");
      const response = await axios.get(
        `${remindersBaseUrl}/get-all-reminders/${cleanDeviceId}`
      );
      if (response.data && response.data.reminders) {
        setUserReminders(response.data.reminders);
      }
    } catch (error) {
      console.error("Error fetching reminders from backend:", error);
      const cleanDeviceId = deviceId.replace(/'/g, "");
      const localReminders = await AsyncStorage.getItem(
        `reminders_${cleanDeviceId}`
      );
      if (localReminders) {
        setUserReminders(JSON.parse(localReminders));
      }
    }
  };

  const hasReminder = (eventId) => {
    return userReminders.some(
      (reminder) => reminder.eventId === eventId && reminder.isActive !== false
    );
  };

  const getEventReminder = (eventId) => {
    return userReminders.find(
      (reminder) => reminder.eventId === eventId && reminder.isActive !== false
    );
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable notifications to receive event reminders"
        );
        return false;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("event-reminders", {
          name: "Event Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#8E6C88",
        });
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  };

  const setReminder = async (event, reminderDateTime) => {
    try {
      setSettingReminder(true);
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) return;

      const trigger = {
        type: "date",
        date: reminderDateTime,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${event.title}`,
          body: `${event.location ? `Location: ${event.location}\n` : ""}${
            event.date
          }`,
          data: { eventLink: event.link, eventTitle: event.title },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: "event-reminders",
        },
        trigger,
      });

      const cleanDeviceId = deviceId ? deviceId.replace(/'/g, "") : deviceId;

      const reminderData = {
        deviceId: cleanDeviceId,
        eventId: event.link || event.title,
        eventTitle: event.title,
        reminderDate: reminderDateTime.toISOString(),
        reminderData: {
          notificationId,
          eventDate: event.date,
          eventLink: event.link,
          location: event.location,
          source: event.source,
        },
      };

      try {
        const response = await axios.post(
          `${remindersBaseUrl}/set-reminder`,
          reminderData
        );
        if (response.data.success) {
          await fetchUserReminders(cleanDeviceId);
          Alert.alert(
            "Reminder Set!",
            `You'll be notified on ${dayjs(reminderDateTime).format(
              "MMM D, YYYY [at] h:mm A"
            )}`
          );
          setReminderModalVisible(false);
          return;
        }
      } catch (backendError) {
        console.error(
          "Failed to save reminder to backend, using local storage:",
          backendError
        );

        const reminders = await AsyncStorage.getItem(
          `reminders_${cleanDeviceId}`
        );
        const remindersArray = reminders ? JSON.parse(reminders) : [];
        const localReminder = {
          ...reminderData,
          id: Date.now().toString(),
          notificationId,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        remindersArray.push(localReminder);
        await AsyncStorage.setItem(
          `reminders_${cleanDeviceId}`,
          JSON.stringify(remindersArray)
        );
        setUserReminders(remindersArray);

        Alert.alert(
          "Reminder Set!",
          `You'll be notified on ${dayjs(reminderDateTime).format(
            "MMM D, YYYY [at] h:mm A"
          )}\n(Note: Using local storage)`
        );
        setReminderModalVisible(false);
      }
    } catch (error) {
      console.error("Error setting reminder:", error);
      Alert.alert("Error", "Failed to set reminder. Please try again.");
    } finally {
      setSettingReminder(false);
    }
  };

  const deleteReminder = async (eventId) => {
    try {
      const reminder = getEventReminder(eventId);
      if (!reminder) return;

      if (reminder.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          reminder.notificationId
        );
      }

      if (reminder.id) {
        try {
          await axios.delete(
            `${remindersBaseUrl}/delete-reminder/${reminder.id}`
          );
        } catch (backendError) {
          console.error(
            "Failed to delete reminder from backend:",
            backendError
          );
          const localReminders = await AsyncStorage.getItem(
            `reminders_${deviceId}`
          );
          if (localReminders) {
            const remindersArray = JSON.parse(localReminders);
            const updatedReminders = remindersArray.filter(
              (r) => r.id !== reminder.id
            );
            await AsyncStorage.setItem(
              `reminders_${deviceId}`,
              JSON.stringify(updatedReminders)
            );
            setUserReminders(updatedReminders);
          }
        }
      }

      await fetchUserReminders(deviceId);
      Alert.alert("Reminder Removed", "The reminder has been cancelled.");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      Alert.alert("Error", "Failed to remove reminder. Please try again.");
    }
  };

  const parseDate = (rawDate) => {
    if (!rawDate || typeof rawDate !== "string") return null;

    const now = dayjs();
    const currentYear = now.year();

    // Clean the date string
    const cleanDate = rawDate.trim();

    // Handle "Date TBA" or similar cases
    if (
      cleanDate.toLowerCase().includes("tba") ||
      cleanDate.toLowerCase().includes("tbd") ||
      cleanDate.toLowerCase().includes("to be announced")
    ) {
      return null;
    }

    // Comprehensive date formats to try
    const formats = [
      "ddd, DD MMM, YYYY - HH:mm A",
      "ddd, D MMM, YYYY - HH:mm A",
      "DD/MM/YYYY HH:mm",
      "DD/MM/YYYY - HH:mm",
      "DD/MM/YYYY",
      "YYYY-MM-DD",
      "YYYY-MM-DDTHH:mm:ss",
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
      "ddd, D MMM YYYY",
      "ddd, D MMM",
      "DD MMM YYYY",
      "DD MMM",
      "MMM DD, YYYY",
      "MMMM D, YYYY",
      "D MMM YYYY",
      "D MMM",
      "MMM D, YYYY",
      "MMMM D YYYY",
      "YYYY/MM/DD",
      "DD-MM-YYYY",
      "DD.MM.YYYY",
      "MM/DD/YYYY",
      "MM-DD-YYYY",
    ];

    // Try each format
    for (const format of formats) {
      const parsed = dayjs(cleanDate, format, true);
      if (parsed.isValid()) {
        // If year is missing, add current year and adjust if date is in past
        if (!format.includes("YYYY")) {
          let withYear = parsed.year(currentYear);
          // If the date with current year is in the past, use next year
          if (withYear.isBefore(now, "day")) {
            withYear = withYear.year(currentYear + 1);
          }
          return withYear;
        }
        return parsed;
      }
    }

    // Try parsing as ISO string
    const isoParsed = dayjs(cleanDate);
    if (isoParsed.isValid() && isoParsed.year() > 2000) {
      return isoParsed;
    }

    // Try native Date parsing as last resort
    const nativeDate = new Date(cleanDate);
    if (!isNaN(nativeDate.getTime())) {
      const nativeParsed = dayjs(nativeDate);
      if (nativeParsed.isValid() && nativeParsed.year() > 2000) {
        return nativeParsed;
      }
    }

    return null;
  };

  const getMinDate = () => {
    return new Date();
  };

  const getMaxDate = (event) => {
    if (
      event &&
      event.parsedDate &&
      typeof event.parsedDate.isValid === "function" &&
      event.parsedDate.isValid()
    ) {
      return event.parsedDate.toDate();
    }
    return dayjs().add(1, "year").toDate();
  };

  const generateSelectableDates = () => {
    const minDate = getMinDate();
    const maxDate = selectedEvent
      ? getMaxDate(selectedEvent)
      : dayjs().add(1, "year").toDate();
    const dates = [];

    let currentDate = dayjs(minDate);
    const endDate = dayjs(maxDate);

    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, "day")
    ) {
      dates.push(currentDate.toDate());
      currentDate = currentDate.add(1, "day");
    }

    return dates;
  };

  const filterEvents = (eventsToFilter) => {
    let filtered = eventsToFilter;

    // Filter by category tab
    if (activeTab !== "all") {
      filtered = filtered.filter((event) => event.source === activeTab);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (fromDate || toDate) {
      filtered = filtered.filter((event) => {
        if (!event.parsedDate) return false;

        const eventDate = event.parsedDate;
        const fromDateJs = fromDate ? dayjs(fromDate) : null;
        const toDateJs = toDate ? dayjs(toDate) : null;

        if (fromDateJs && toDateJs) {
          return (
            eventDate.isSameOrAfter(fromDateJs, "day") &&
            eventDate.isSameOrBefore(toDateJs, "day")
          );
        } else if (fromDateJs) {
          return eventDate.isSameOrAfter(fromDateJs, "day");
        } else if (toDateJs) {
          return eventDate.isSameOrBefore(toDateJs, "day");
        }

        return true;
      });
    }

    return filtered;
  };

  useEffect(() => {
    const filtered = filterEvents(events);
    setFilteredEvents(filtered);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [events, searchQuery, fromDate, toDate, activeTab]);

  const clearFilters = () => {
    setSearchQuery("");
    setFromDate(null);
    setToDate(null);
  };

  const handleTabPress = (categoryId) => {
    setActiveTab(categoryId);
    setTabError(null);

    // Immediately fetch events for the selected tab
    if (categoryId === "all") {
      // For "all" tab, fetch all events
      fetchEvents(categoryId, true);
    } else {
      // For specific tabs, fetch only that category
      fetchEvents(categoryId, true);
    }
  };

  const handleEventPress = (event) => {
    if (event.link) {
      let url = event.link;

      if (url.includes("https:??")) {
        url = url.replace("https:??", "https://");
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      Linking.openURL(url).catch((err) => {
        console.error("Error opening URL:", err);
        Alert.alert("Error", "Could not open event link");
      });
    } else {
      Alert.alert(
        "No Link",
        "This event doesn't have a website link available."
      );
    }
  };

  useEffect(() => {
    socketRef.current = io(socketUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      setSocketConnected(true);
    });

    socketRef.current.on("new-events", (newEvents) => {
      setEvents((prevEvents) => {
        const combined = [...prevEvents, ...newEvents];
        const uniqueMap = new Map();
        combined.forEach((e) => {
          const key = e.link || `${e.title}-${e.date}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, e);
          }
        });
        return Array.from(uniqueMap.values());
      });
    });

    socketRef.current.on("disconnect", () => {
      setSocketConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchEvents = async (categoryId = "all", isTabSwitch = false) => {
    try {
      // Set appropriate loading state
      if (isTabSwitch) {
        setTabLoading(true);
        setTabError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      const cache = await AsyncStorage.getItem("eventsCache");
      const cacheTimestamp = await AsyncStorage.getItem("eventsCacheTime");
      const now = dayjs();

      // Check cache only for "all" category and initial load
      if (
        categoryId === "all" &&
        cache &&
        cacheTimestamp &&
        !refreshing &&
        !isTabSwitch
      ) {
        const then = dayjs(cacheTimestamp);
        const diff = now.diff(then, "minute");

        if (diff < CACHE_DURATION_MINUTES) {
          const cachedEvents = JSON.parse(cache);
          if (cachedEvents.length > 0) {
            setEvents(cachedEvents);
            setLoading(false);
            setRefreshing(false);
            setTabLoading(false);
            return;
          }
        }
      }

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        if (cache) {
          const cachedEvents = JSON.parse(cache);
          setEvents(cachedEvents);
        } else {
          throw new Error("No internet and no cached data available");
        }
        setLoading(false);
        setRefreshing(false);
        setTabLoading(false);
        return;
      }

      try {
        let endpoints = [];

        // Determine which endpoints to fetch based on selected category
        if (categoryId === "all") {
          endpoints = [
            `${baseUrl}/allevents`,
            `${baseUrl}/hype-nation`,
            `${baseUrl}/tentimes`,
            `${baseUrl}/chamines`,
            `${baseUrl}/conference-alerts`,
            `${baseUrl}/motorsports`,
            `${baseUrl}/agric-zim`,
            `${baseUrl}/events-eye`,
            `${baseUrl}/ticket-box`,
          ];
        } else {
          endpoints = [`${baseUrl}/${categoryId}`];
        }

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            axios.get(endpoint).catch((err) => {
              console.error(`Error fetching ${endpoint}:`, err.message);
              return { data: [] };
            })
          )
        );

        let combinedEvents = [];

        if (categoryId === "all") {
          combinedEvents = responses.flatMap((response) => response.data || []);
        } else {
          combinedEvents = responses[0].data || [];
        }

        if (combinedEvents.length === 0) {
          const errorMsg = `No events found for ${
            allCategories.find((cat) => cat.id === categoryId)?.name ||
            "this category"
          }`;

          if (isTabSwitch) {
            setTabError(errorMsg);
          } else {
            throw new Error(errorMsg);
          }

          setLoading(false);
          setRefreshing(false);
          setTabLoading(false);
          return;
        }

        const now = dayjs();

        const processedEvents = combinedEvents
          .map((event) => {
            if (!event || !event.title) {
              return null;
            }

            const rawDateValue = event.dateRaw || event.rawDate || event.date;
            const eventDate = parseDate(rawDateValue);

            let formattedDate = event.date || "Date TBA";

            if (eventDate && eventDate.isValid()) {
              formattedDate = eventDate.format("ddd, D MMM YYYY");
            }

            return {
              ...event,
              parsedDate: eventDate,
              formattedDate: formattedDate,
              source: event.source || categoryId,
              // Add a flag for valid dates
              hasValidDate: eventDate && eventDate.isValid(),
              // Store timestamp for consistent sorting
              sortTimestamp:
                eventDate && eventDate.isValid()
                  ? eventDate.valueOf()
                  : Number.MAX_SAFE_INTEGER,
            };
          })
          .filter((event) => event !== null);

        // Filter out past events first (only show future events and events without dates)
        const futureEvents = processedEvents.filter((event) => {
          // Keep events without valid dates
          if (!event.parsedDate || !event.parsedDate.isValid()) {
            return true;
          }
          // Only keep events that are today or in the future
          return event.parsedDate.isSameOrAfter(now, "day");
        });

        // Sort events: valid dates first (ascending), then invalid dates last
        const sortedEvents = futureEvents.sort((a, b) => {
          // Both have valid dates - sort by timestamp (ascending)
          if (a.hasValidDate && b.hasValidDate) {
            return a.sortTimestamp - b.sortTimestamp;
          }

          // Only a has valid date - a comes first
          if (a.hasValidDate && !b.hasValidDate) {
            return -1;
          }

          // Only b has valid date - b comes first
          if (!a.hasValidDate && b.hasValidDate) {
            return 1;
          }

          // Neither has valid date - maintain original order
          return 0;
        });

        // Only cache "all" events
        if (categoryId === "all" && futureEvents.length > 0) {
          await AsyncStorage.setItem(
            "eventsCache",
            JSON.stringify(sortedEvents)
          );
          await AsyncStorage.setItem("eventsCacheTime", now.toISOString());
        }

        setEvents(sortedEvents);
        setTabError(null);
      } catch (apiError) {
        const errorMsg = `Failed to fetch events: ${apiError.message}`;

        if (isTabSwitch) {
          setTabError(errorMsg);
        } else {
          throw new Error(errorMsg);
        }
      }
    } catch (err) {
      const cache = await AsyncStorage.getItem("eventsCache");
      if (cache && categoryId === "all") {
        const cachedEvents = JSON.parse(cache);
        if (cachedEvents.length > 0) {
          setEvents(cachedEvents);
          setError(null);
          setTabError(null);
        } else {
          if (isTabSwitch) {
            setTabError(err.message);
          } else {
            setError(err.message);
          }
        }
      } else {
        if (isTabSwitch) {
          setTabError(err.message);
        } else {
          setError(err.message);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTabLoading(false);
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
    fetchEvents(activeTab);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(activeTab);
    if (deviceId) {
      fetchUserReminders(deviceId);
    }
  };

  const openReminderModal = (event) => {
    setSelectedEvent(event);
    let defaultReminderDate;

    if (
      event.parsedDate &&
      typeof event.parsedDate.isValid === "function" &&
      event.parsedDate.isValid()
    ) {
      defaultReminderDate = event.parsedDate.subtract(1, "day").toDate();
    } else {
      defaultReminderDate = dayjs().add(1, "day").toDate();
    }

    setReminderDate(defaultReminderDate);
    setReminderModalVisible(true);
  };

  const handleReminderAction = (event) => {
    const eventId = event.link || event.title;

    if (hasReminder(eventId)) {
      Alert.alert("Remove Reminder", "Do you want to remove this reminder?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteReminder(eventId),
        },
      ]);
    } else {
      openReminderModal(event);
    }
  };

  const handleScroll = (event) => {
    const offSetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offSetY > 200);

    if (offSetY > 50 && showCategories) {
      setShowCategories(false);
    } else if (offSetY <= 50 && !showCategories) {
      setShowCategories(true);
    }
  };

  if (loading && !refreshing && !tabLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Discovering amazing events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={64} color="#6366F1" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchEvents(activeTab)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.logoButton}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logoImage}
            />
          </TouchableOpacity>

          <View style={styles.locationBadge}>
            <Ionicons name="location" size={16} color="#FF6B9D" />
            <Text style={styles.locationBadgeText}>Zimbabwe</Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={isDarkMode ? "white" : "#333"}
            />
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.themeToggleButton}
              onPress={toggleDarkMode}
            >
              <Ionicons
                name={isDarkMode ? "sunny" : "moon"}
                size={22}
                color={isDarkMode ? "#FFD700" : "#6366F1"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchIconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={24}
                color={isDarkMode ? "white" : "#333"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Find events, locations, categories..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {showSearch && (
          <View style={styles.advancedFilters}>
            <View style={styles.dateFilterContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowFromDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6366F1" />
                <Text style={styles.dateButtonText}>
                  {fromDate ? dayjs(fromDate).format("MMM D") : "From"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.dateSeparator}>→</Text>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowToDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6366F1" />
                <Text style={styles.dateButtonText}>
                  {toDate ? dayjs(toDate).format("MMM D") : "To"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Category Pills Section */}
      {showCategories && (
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === "all"
                ? "Upcoming events"
                : allCategories.find((c) => c.id === activeTab)?.name ||
                  "Events"}
            </Text>
            <Text style={styles.eventsCountText}>
              {displayEvents.length}{" "}
              {displayEvents.length === 1 ? "Event" : "Events"}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {allCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryPill,
                  activeTab === category.id && styles.categoryPillActive,
                ]}
                onPress={() => handleTabPress(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={
                    activeTab === category.id
                      ? "white"
                      : isDarkMode
                      ? "#666"
                      : "#999"
                  }
                />
                <Text
                  style={[
                    styles.categoryText,
                    activeTab === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tab Loading Indicator */}
      {tabLoading && (
        <View style={styles.tabLoadingContainer}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.tabLoadingText}>Loading events...</Text>
        </View>
      )}

      {/* Tab Error Message */}
      {tabError && !tabLoading && (
        <View style={styles.tabErrorContainer}>
          <MaterialIcons name="error-outline" size={32} color="#FF6B6B" />
          <Text style={styles.tabErrorText}>{tabError}</Text>
          <TouchableOpacity
            style={styles.tabRetryButton}
            onPress={() => fetchEvents(activeTab, true)}
          >
            <Text style={styles.tabRetryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Events List with Enhanced Cards */}
      {!tabLoading && !tabError && (
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.eventsScroll}
          contentContainerStyle={styles.eventsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6366F1"]}
              tintColor="#6366F1"
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {displayEvents.length > 0 ? (
            displayEvents.map((event, index) => {
              const eventId = event.link || event.title;
              const hasEventReminder = hasReminder(eventId);
              const reminder = getEventReminder(eventId);

              return (
                <EnhancedEventCard
                  key={index}
                  title={event.title}
                  date={event.formattedDate || event.date}
                  location={event.location}
                  image={event.image}
                  link={event.link}
                  price={event.price}
                  source={event.source}
                  hasReminder={hasEventReminder}
                  reminderTime={reminder?.reminderDate}
                  onReminderPress={() => handleReminderAction(event)}
                  onPress={() => handleEventPress(event)}
                  isDarkMode={isDarkMode}
                />
              );
            })
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialIcons
                name="event-busy"
                size={80}
                color={isDarkMode ? "#E8E8E8" : "#CCCCCC"}
              />
              <Text style={styles.noEventsText}>No events found</Text>
              <Text style={styles.noEventsSubtext}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          )}
        </Animated.ScrollView>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopButton}
          onPress={() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
          activeOpacity={0.8}
        >
          <AntDesign name="up" size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* Reminder Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Reminder</Text>
              <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#666" : "#999"}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalEventTitle}>{selectedEvent?.title}</Text>
            <Text style={styles.modalEventDate}>
              Event Date: {selectedEvent?.formattedDate}
            </Text>

            <View style={styles.reminderDateContainer}>
              <Text style={styles.reminderLabel}>Remind me on:</Text>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  const dates = generateSelectableDates();
                  setCustomDates(dates);
                  setShowCustomDatePicker(true);
                }}
              >
                <Ionicons name="calendar" size={20} color="#6366F1" />
                <Text style={styles.dateTimeText}>
                  {dayjs(reminderDate).format("MMM D, YYYY")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowReminderTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#6366F1" />
                <Text style={styles.dateTimeText}>
                  {dayjs(reminderDate).format("h:mm A")}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.setReminderButton,
                settingReminder && styles.setReminderButtonDisabled,
              ]}
              onPress={() => setReminder(selectedEvent, reminderDate)}
              disabled={settingReminder}
            >
              {settingReminder ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="notifications" size={20} color="white" />
              )}
              <Text style={styles.setReminderButtonText}>
                {settingReminder ? "Setting Reminder..." : "Set Reminder"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      {showCustomDatePicker && (
        <Modal
          visible={showCustomDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCustomDatePicker(false)}
        >
          <View style={styles.customPickerOverlay}>
            <View style={styles.customPickerContent}>
              <View style={styles.customPickerHeader}>
                <Text style={styles.customPickerTitle}>
                  Select Reminder Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCustomDatePicker(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDarkMode ? "#666" : "#999"}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.customPickerSubtitle}>
                {selectedEvent
                  ? `Select a date between today and ${dayjs(
                      getMaxDate(selectedEvent)
                    ).format("MMM D, YYYY")}`
                  : "Select a date within the next year"}
              </Text>

              <ScrollView style={styles.datesScroll}>
                {customDates.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateOption,
                      dayjs(date).isSame(dayjs(reminderDate), "day") &&
                        styles.dateOptionSelected,
                    ]}
                    onPress={() => {
                      const newDate = dayjs(date)
                        .hour(dayjs(reminderDate).hour())
                        .minute(dayjs(reminderDate).minute())
                        .toDate();
                      setReminderDate(newDate);
                      setShowCustomDatePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dateOptionText,
                        dayjs(date).isSame(dayjs(reminderDate), "day") &&
                          styles.dateOptionTextSelected,
                      ]}
                    >
                      {dayjs(date).format("ddd, MMM D, YYYY")}
                    </Text>
                    {dayjs(date).isSame(dayjs(), "day") && (
                      <Text style={styles.todayBadge}>Today</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowFromDatePicker(false);
            if (selectedDate) {
              setFromDate(selectedDate);
            }
          }}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display="default"
          minimumDate={fromDate || new Date()}
          onChange={(event, selectedDate) => {
            setShowToDatePicker(false);
            if (selectedDate) {
              setToDate(selectedDate);
            }
          }}
        />
      )}

      {showReminderDatePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="date"
          display="default"
          minimumDate={getMinDate()}
          maximumDate={
            selectedEvent
              ? getMaxDate(selectedEvent)
              : dayjs().add(1, "year").toDate()
          }
          onChange={(event, selectedDate) => {
            setShowReminderDatePicker(false);
            if (selectedDate) {
              const newDate = dayjs(selectedDate)
                .hour(dayjs(reminderDate).hour())
                .minute(dayjs(reminderDate).minute())
                .toDate();
              setReminderDate(newDate);
            }
          }}
        />
      )}

      {showReminderTimePicker && (
        <DateTimePicker
          value={reminderDate}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowReminderTimePicker(false);
            if (selectedDate) {
              setReminderDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#0A0612" : "#F8F9FA",
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#0A0612" : "#F8F9FA",
    },
    loadingText: {
      marginTop: 16,
      color: isDarkMode ? "#fff" : "#333",
      fontSize: 16,
      fontWeight: "600",
    },
    errorText: {
      color: "#FF6B6B",
      fontSize: 16,
      marginTop: 16,
      marginBottom: 24,
      textAlign: "center",
      paddingHorizontal: 20,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: "#6366F1",
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 12,
      elevation: 4,
    },
    retryButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },

    // Tab Loading/Error States
    tabLoadingContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      gap: 10,
    },
    tabLoadingText: {
      color: isDarkMode ? "#999" : "#666",
      fontSize: 14,
    },
    tabErrorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    tabErrorText: {
      color: isDarkMode ? "#FF8A8A" : "#FF6B6B",
      fontSize: 14,
      marginTop: 12,
      marginBottom: 16,
      textAlign: "center",
      lineHeight: 20,
    },
    tabRetryButton: {
      backgroundColor: "#6366F1",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    tabRetryButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },

    // Modern Header Styles
    modernHeader: {
      backgroundColor: isDarkMode ? "#120d1dff" : "#fff",
      paddingTop: 30,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 8,
      shadowColor: isDarkMode ? "#0A0612" : "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    themeToggleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    locationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.15)" : "#000",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    locationBadgeText: {
      color: "white",
      fontSize: 14,
      fontFamily: "sans-serif-medium",
      fontWeight: "500",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    searchIconButton: {
      padding: 10,
      borderRadius: 20,
      backgroundColor: isDarkMode
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(255, 255, 255, 0.25)",
      justifyContent: "center",
      alignItems: "center",
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "white",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 16,
      gap: 12,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: "#333",
      fontFamily: "sans-serif",
    },
    filterButton: {
      width: 48,
      height: 48,
      backgroundColor: "#6366F1",
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    advancedFilters: {
      marginTop: 16,
      paddingBottom: 8,
    },
    dateFilterContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dateButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.15)"
        : "rgba(255,255,255,0.25)",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    dateButtonText: {
      fontSize: 14,
      color: "white",
      fontWeight: "500",
    },
    dateSeparator: {
      marginHorizontal: 12,
      fontSize: 18,
      color: "white",
      fontWeight: "bold",
    },

    // Category Section
    categorySection: {
      backgroundColor: isDarkMode ? "#0A0612" : "#F8F9FA",
      paddingTop: 24,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      color: isDarkMode ? "white" : "#333",
      fontSize: 20,
      fontWeight: "700",
    },
    eventsCountText: {
      color: "#6366F1",
      fontSize: 16,
      fontWeight: "600",
    },
    categoriesScroll: {
      marginBottom: 16,
    },
    categoriesContent: {
      gap: 12,
    },
    categoryPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(99, 102, 241, 0.1)",
      gap: 8,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(99, 102, 241, 0.2)",
    },
    categoryPillActive: {
      backgroundColor: "#6366F1",
      borderColor: "#6366F1",
    },
    categoryText: {
      color: isDarkMode ? "#999" : "#666",
      fontSize: 15,
      fontWeight: "600",
    },
    categoryTextActive: {
      color: "white",
    },

    // Events Scroll
    eventsScroll: {
      flex: 1,
      backgroundColor: isDarkMode ? "#0A0612" : "#F8F9FA",
    },
    eventsContent: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 30,
    },

    // Enhanced Event Card Styles
    enhancedCard: {
      height: 280,
      borderRadius: 24,
      overflow: "hidden",
      marginBottom: 20,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    cardImage: {
      flex: 1,
      width: "100%",
    },
    cardImageStyle: {
      borderRadius: 24,
    },
    cardGradientOverlay: {
      flex: 1,
      padding: 20,
      justifyContent: "space-between",
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    dateBadge: {
      width: 60,
      height: 70,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.3)",
      alignSelf: "flex-start",
      paddingVertical: 8,
    },
    dateMonth: {
      color: "white",
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    dateDay: {
      color: "white",
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 2,
    },
    dateYear: {
      color: "white",
      fontSize: 10,
      fontWeight: "500",
      opacity: 0.9,
    },
    heartButton: {
      position: "absolute",
      top: 20,
      right: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    eventInfoContainer: {
      gap: 8,
    },
    eventTitle: {
      color: "white",
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    locationText: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 13,
      fontWeight: "500",
      flex: 1,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    footerLeft: {
      flex: 1,
    },
    priceTag: {
      backgroundColor: "white",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: "flex-start",
    },
    priceText: {
      color: "#000",
      fontSize: 16,
      fontWeight: "700",
    },
    reminderBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.3)",
      justifyContent: "center",
      alignItems: "center",
    },
    reminderBadgeActive: {
      backgroundColor: "#6366F1",
    },

    // No Events
    noEventsContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
      marginTop: 60,
    },
    noEventsText: {
      color: isDarkMode ? "white" : "#333",
      fontSize: 18,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 16,
    },
    noEventsSubtext: {
      color: isDarkMode ? "#999" : "#666",
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },

    // Scroll to Top Button
    scrollTopButton: {
      position: "absolute",
      right: 20,
      bottom: 30,
      backgroundColor: "#6366F1",
      padding: 16,
      borderRadius: 28,
      width: 56,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: isDarkMode ? "#1F1535" : "white",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 24,
      color: isDarkMode ? "white" : "#333",
      fontWeight: "bold",
    },
    modalEventTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: isDarkMode ? "white" : "#333",
      marginBottom: 8,
    },
    modalEventDate: {
      fontSize: 14,
      color: isDarkMode ? "#999" : "#666",
      marginBottom: 24,
    },
    reminderDateContainer: {
      marginBottom: 24,
    },
    reminderLabel: {
      fontSize: 16,
      color: isDarkMode ? "white" : "#333",
      marginBottom: 12,
      fontWeight: "600",
    },
    dateTimeButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(99, 102, 241, 0.1)",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(99, 102, 241, 0.2)",
    },
    dateTimeText: {
      fontSize: 16,
      color: isDarkMode ? "white" : "#333",
      fontWeight: "600",
    },
    setReminderButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#6366F1",
      paddingVertical: 16,
      borderRadius: 16,
      gap: 10,
      elevation: 4,
    },
    setReminderButtonDisabled: {
      opacity: 0.6,
    },
    setReminderButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
    },
    logoButton: {
      padding: 8,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    logoImage: {
      width: 32,
      height: 32,
      borderRadius: 8,
    },

    // Custom Date Picker Styles
    customPickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "flex-end",
    },
    customPickerContent: {
      backgroundColor: isDarkMode ? "#1F1535" : "white",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: "80%",
    },
    customPickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    customPickerTitle: {
      fontSize: 20,
      color: isDarkMode ? "white" : "#333",
      fontWeight: "bold",
    },
    customPickerSubtitle: {
      fontSize: 14,
      color: isDarkMode ? "#999" : "#666",
      marginBottom: 16,
      textAlign: "center",
    },
    datesScroll: {
      maxHeight: 400,
    },
    dateOption: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateOptionSelected: {
      backgroundColor: "#6366F1",
      borderRadius: 12,
    },
    dateOptionText: {
      color: isDarkMode ? "white" : "#333",
      fontSize: 16,
      fontWeight: "500",
    },
    dateOptionTextSelected: {
      color: "white",
      fontWeight: "bold",
    },
    todayBadge: {
      backgroundColor: "#FF6B9D",
      color: "white",
      fontSize: 12,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
  });

export default EventsScreen;
