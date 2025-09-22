import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { auth, db } from "../../lib/firebaseConfig";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  
  useEffect(() => {
    if (!user) return;

    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const userPosts: any[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          userPosts.push({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleString()
              : "Unknown date",
          });
        });
        setPosts(userPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [user]);

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
    <View style={styles.container}>
      {user&&(
        <Text style={styles.title}>
    {user.displayName ? user.displayName : "No username set"}
  </Text>
    )}
      {user && (
        <>
          <Text style={styles.label}>Email: {user.email}</Text>
          

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>
              {loading ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </>
      )}

     
      <Text style={[styles.title, { marginTop: 20 }]}>Your Posts</Text>
      {postsLoading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : posts.length === 0 ? (
        <Text style={styles.label}>You have not created any posts yet.</Text>
        
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              {isEditing && selectedPostId === item.id ? (
                <>
                  <TextInput
                    style={styles.textInput}
                    value={editContent}
                    onChangeText={setEditContent}
                    multiline
                  />
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={() => handleSave(item.id)}
                    >
                      <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setIsEditing(false);
                        setSelectedPostId(null);
                      }}
                    >
                      <Text style={styles.actionText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.postTitle}>
                    {item.title || "Untitled"}
                  </Text>
                  <Text style={styles.postContent}>{item.content || ""}</Text>
                  <Text style={styles.postDate}>{item.createdAt}</Text>

                  {selectedPostId === item.id ? (
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(item.id, item.content)}
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Text style={styles.actionText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedPostId(
                          selectedPostId === item.id ? null : item.id
                        )
                      }
                    >
                      <Text style={styles.toggleText}>⋮ Options</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
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
    backgroundColor: "#F5EFE6" 
  },
  title: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 12, 
    color: "#6D94C5" 
  },
  label: { 
    color: "#6D94C5", 
    fontSize: 16, 
    marginBottom: 12 
  },
  logoutButton: {
    backgroundColor: "#E8DFCA", 
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  logoutButtonText: { 
    color: "#6D94C5", 
    fontWeight: "600" 
  },
  postContainer: {
    backgroundColor: "#CBDCEB", 
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6D94C5", 
    marginBottom: 4,
  },
  postContent: { 
    fontSize: 14, 
    color: "#333", 
    marginBottom: 6 
  },
  postDate: { 
    fontSize: 12, 
    color: "#6D94C5", 
    textAlign: "right" 
  },
  textInput: {
    backgroundColor: "#E8DFCA", 
    padding: 6,
    fontSize: 14,
    marginBottom: 8,
    color: "#333", 
    borderWidth: 1,
    borderColor: "#6D94C5", 
    borderRadius: 6,
  },
  dropdown: {
    flexDirection: "row",
    marginTop: 6,
    justifyContent: "flex-end",
  },
  editButton: {
    backgroundColor: "#6D94C5", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deleteButton: {
    backgroundColor: "#E8DFCA", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: "#CBDCEB", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cancelButton: {
    backgroundColor: "#E8DFCA", 
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionText: {
    color: "#333", 
    fontSize: 12,
    fontWeight: "bold",
  },
  toggleText: {
    color: "#6D94C5", 
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
});
