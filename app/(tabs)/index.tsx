import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import PostCard from "../../components/PostCard";
import Colors from "../../constants/Colors";
import { db } from "../../lib/firebaseConfig";

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const postList: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          postList.push({ id: docSnap.id, ...data });
        });
        setPosts(postList);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to posts:", error);
        setLoading(false);
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? "light"].primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      {posts.length === 0 ? (
        <Text style={[styles.emptyText, { color: Colors[colorScheme ?? "light"].text }]}>No posts yet.</Text>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});