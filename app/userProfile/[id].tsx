import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { db } from "../../lib/firebaseConfig";
import PostCard from "../../components/PostCard";
import Colors from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface UserData {
  id: string;
  alias: string;
  email: string;
  [key: string]: any;
}

interface Post {
  id: string;
  title?: string;
  content: string;
  uid: string;
  [key: string]: any;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", String(id)));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() } as UserData);
        } else {
          console.log("No such user!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const postsRef = collection(db, "posts");
    const q = query(postsRef, where("uid", "==", String(id)));
    
    // Set up real-time listener for user's posts
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userPosts: Post[] = [];
        querySnapshot.forEach((docSnap) => {
          userPosts.push({ id: docSnap.id, ...docSnap.data() } as Post);
        });
        setPosts(userPosts);
        setPostsLoading(false);
      },
      (error) => {
        console.error("Error fetching posts:", error);
        setPostsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <Text style={[styles.errorText, { color: "#081269" }]}>User not found</Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? "light"].primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: "#ffffff" }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      <TouchableOpacity 
        style={styles.backButtonContainer}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={Colors[colorScheme ?? "light"].primary} />
      </TouchableOpacity>
      
      <View style={styles.profileHeader}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: Colors[colorScheme ?? "light"].accent }]}>
          <Text style={[styles.avatarText, { color: "#ffffff" }]}>
            {userData.alias ? userData.alias.charAt(0).toUpperCase() : "?"}
          </Text>
        </View>
        <Text style={[styles.username, { color: "#081269" }]}>{userData.alias}</Text>
        <Text style={[styles.email, { color: "#081269" }]}>{userData.email}</Text>
      </View>

      <View style={styles.postsSection}>
        <Text style={[styles.sectionTitle, { color: "#081269" }]}>Posts</Text>
        
        {postsLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
        ) : posts.length === 0 ? (
          <Text style={[styles.noPosts, { color: "#081269" }]}>
            This user hasn't posted anything yet
          </Text>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostCard post={item} />}
            contentContainerStyle={styles.postsList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButtonContainer: {
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  postsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  postsList: {
    paddingBottom: 20,
  },
  noPosts: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});