import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import PostCard from "../../components/PostCard";
import { db } from "../../lib/firebaseConfig";

export default function HomeScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const postList: any[] = [];
        querySnapshot.forEach((doc) => {
          postList.push({ id: doc.id, ...doc.data() });
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
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {posts.length === 0 ? (
        <Text style={styles.emptyText}>No posts yet.</Text>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6", 
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6D94C5", 
    fontSize: 16,
  },
  emptyText: {
    color: "#E8DFCA", 
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});