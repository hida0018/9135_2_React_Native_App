import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import axios from "axios";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import UserAvatar from "react-native-user-avatar";

// API URL
const API_URL = "https://random-data-api.com/api/users/random_user?size=10";

// Fetch users function
const fetchUsers = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      Alert.alert("Too Many Requests", "Please wait before refreshing again.");
      console.error("Error fetching users: Too Many Requests", error);
    } else {
      console.error("Error fetching users", error);
      Alert.alert("Error", "Failed to load users. Please try again later.");
    }
    return [];
  }
};

export default function App() {
  const [users, setUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(0); // Track last refresh time

  // Initial fetch for 10 users when the app loads
  useEffect(() => {
    const loadData = async () => {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      setLoading(false); // Stop the loading spinner once data is fetched
    };
    loadData();
  }, []);

  // Pull-to-refresh handler with a 30-second cooldown
  const onRefresh = useCallback(async () => {
    const currentTime = Date.now();
    if (currentTime - lastRefreshTime < 10000) {
      // 10-second cooldown
      Alert.alert("Too Many Refreshes", "Please wait 10 seconds before refreshing again.");
      return;
    }
    setRefreshing(true);
    const fetchedUsers = await fetchUsers();
    setUsers(fetchedUsers);
    setRefreshing(false);
    setLastRefreshTime(currentTime); // Update the last refresh time
  }, [lastRefreshTime]);

  // Add one more user when the FAB is clicked
  const addUser = async () => {
    try {
      const newUserResponse = await axios.get("https://random-data-api.com/api/users/random_user?size=1");
      setUsers((prevUsers) => [newUserResponse.data[0], ...prevUsers]);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        Alert.alert("Too Many Requests", "Please wait before adding more users.");
      } else {
        console.error("Error fetching new user: ", error);
        Alert.alert("Error", "Failed to add a new user. Please try again.");
      }
    }
  };

  // Render each item in the FlatList
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.name}>{`${item.first_name} ${item.last_name}`}</Text>
      {Platform.OS === "ios" ? (
        // iOS: Display the initials
        <View style={styles.iosAvatar}>
          <Text style={styles.iosAvatarText}>{`${item.first_name[0]}${item.last_name[0]}`}</Text>
        </View>
      ) : (
        // Android: Display the cartoon avatar
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      )}
    </View>
  );

  if (loading) {
    // Show a loading spinner while the data is being fetched initially
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.contentContainer}
        />

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={addUser}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingBottom: 50,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: "#f9c2ff",
    marginBottom: 8,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between", // Align name and avatar side by side
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iosAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },
  iosAvatarText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#2196F3",
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
});
