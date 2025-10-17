import { useLocalSearchParams, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import PostCard from "../../components/PostCard";
import Colors from "../../constants/Colors";
import { useAuth } from "../../hooks/useAuth";
import { auth, db } from "../../lib/firebaseConfig";

interface Post {
  id: string;
  title?: string;
  content: string;
  uid: string;
  [key: string]: any;
}

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  // comments are shown inline within PostCard; no separate comments list here
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const colorScheme = useColorScheme();

  // Whose profile are we showing?
  const profileUserId = params?.userId || user?.uid || null;
  const isSelf = !!user && profileUserId === user.uid;

  
  useEffect(() => {
    if (!profileUserId) return;

    const postsRef = collection(db, "posts");

    // Listen for posts created with field uid
    const unsubscribeUid = onSnapshot(
      query(postsRef, where("uid", "==", profileUserId)),
      (querySnapshot) => {
        const arr: Post[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt =
            typeof data?.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toLocaleString()
              : typeof data?.createdAt === "string"
                ? data.createdAt
                : "Unknown date";
          arr.push({
            id: docSnap.id,
            ...data,
            // Ensure required fields for Post type exist
            content: typeof data?.content === "string" ? data.content : "",
            uid: (data?.uid as string) || (data?.authorId as string) || "",
            createdAt,
          } as Post);
        });
        setPosts((prev) => {
          // merge by id with any authorId results (set below)
          const map = new Map<string, Post>();
          [...arr, ...prev].forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
        setPostsLoading(false);
      },
      (error) => {
        console.error("Error listening to user posts (uid):", error);
        setPostsLoading(false);
      }
    );

    // Listen for posts/reposts created with field authorId (used by reposts)
    const unsubscribeAuthor = onSnapshot(
      query(postsRef, where("authorId", "==", profileUserId)),
      (querySnapshot) => {
        const arr: Post[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt =
            typeof data?.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toLocaleString()
              : typeof data?.createdAt === "string"
                ? data.createdAt
                : "Unknown date";
          arr.push({
            id: docSnap.id,
            ...data,
            content: typeof data?.content === "string" ? data.content : "",
            uid: (data?.uid as string) || (data?.authorId as string) || "",
            createdAt,
          } as Post);
        });
        setPosts((prev) => {
          const map = new Map<string, Post>();
          [...prev, ...arr].forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
        setPostsLoading(false);
      },
      (error) => {
        console.error("Error listening to user posts (authorId):", error);
        setPostsLoading(false);
      }
    );

    return () => {
      unsubscribeUid();
      unsubscribeAuthor();
    };
  }, [profileUserId]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleEdit = (postId: string, currentContent: string) => {
    setSelectedPostId(postId);
    setEditContent(currentContent);
    setIsEditing(true);
  };

  const handleSave = async (postId: string) => {
    try {
      const ref = doc(db, "posts", postId);
      await updateDoc(ref, { content: editContent });
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, content: editContent } : p))
      );
      setIsEditing(false);
      setSelectedPostId(null);
    } catch (err) {
      console.error("Failed to save post:", err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {profileUserId && (
        <Text style={[styles.title, { color: "#081269"}]}>
          {isSelf ? (user?.displayName || "No username set") : `User Profile`}
        </Text>
      )}
      {user && isSelf && (
        <>
          <Text style={[styles.label, { color: "#081269"}]}>Email: {user.email}</Text>
          

          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: Colors[colorScheme ?? "light"].primary }]} 
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { color: Colors[colorScheme ?? "dark"].white }]}>
              {loading ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </>
      )}

     
      <Text style={[styles.title, { marginTop: 20, color: "#081269"}]}>
        {isSelf ? "Your Posts & Reposts" : "Posts & Reposts"}
      </Text>
      {postsLoading ? 
        <ActivityIndicator size="small" color={Colors[colorScheme ?? "light"].primary} /> 
      : posts.length === 0 ? 
        <Text style={[styles.label, { color: "#081269" }]}>You have not created any posts yet.</Text>
      : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard post={item} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: "#ffffff" 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 12, 
    color: "#081269" 
  },
  label: { 
    color: "#081269", 
    fontSize: 16, 
    marginBottom: 12 
  },
  logoutButton: {
    backgroundColor: "#081269", 
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  logoutButtonText: { 
    color: "#ffffff", 
    fontWeight: "600" 
  },
  postContainer: {
    backgroundColor: "#ffffff", 
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c7c9ff",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#081269", 
    marginBottom: 4,
  },
  postContent: { 
    fontSize: 14, 
    color: "#000c74", 
    marginBottom: 6 
  },
  postDate: { 
    fontSize: 12, 
    color: "#000c74", 
    textAlign: "right" 
  },
  textInput: {
    backgroundColor: "#f0f2ff", 
    padding: 6,
    fontSize: 14,
    marginBottom: 8,
    color: "#081269", 
    borderWidth: 1,
    borderColor: "#c7c9ff", 
    borderRadius: 6,
  },
  dropdown: {
    flexDirection: "row",
    marginTop: 6,
    justifyContent: "flex-end",
  },
  editButton: {
    backgroundColor: "#081269", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deleteButton: {
    backgroundColor: "#ff3b30", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: "#081269", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cancelButton: {
    backgroundColor: "#6D6D6D", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionText: {
    color: "#ffffff", 
    fontSize: 12,
    fontWeight: "bold",
  },
  toggleText: {
    color: "#081269", 
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
});
