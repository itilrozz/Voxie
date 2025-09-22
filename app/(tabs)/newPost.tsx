import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebaseConfig";

export default function NewPostScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim() && !content.trim()) {
      newErrors.title = "Please add a title or content";
      newErrors.content = "Please add a title or content";
    }

    if (title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (content.length > 2000) {
      newErrors.content = "Content must be less than 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRefresh = () => {
    router.replace("/newPost");
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "You must be logged in to create a post.",
        [{ text: "OK", onPress: () => router.replace("/login") }]
      );
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "posts"), {
        uid: user.uid,
        authorEmail: user.email || "anonymous",
        authorusername:
          user.displayName || user.email?.split("@")[0] || "Anonymous", // 👈 save username
        title: title.trim(),
        content: content.trim(),
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setContent("");
      setErrors({});
      handleRefresh();
    } catch (error: any) {
      console.error("Create post error:", error);
      let errorMessage = "Failed to create post. Please try again.";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to create posts.";
      } else if (error.code === "unavailable") {
        errorMessage = "Service is temporarily unavailable. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.screen}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Create Post</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Title (optional)"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            maxLength={100}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          <Text style={styles.characterCount}>{title.length}/100</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.textArea, errors.content && styles.inputError]}
            placeholder="Write your post..."
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />
          {errors.content && <Text style={styles.errorText}>{errors.content}</Text>}
          <Text style={styles.characterCount}>{content.length}/2000</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "#F5EFE6", 
  },
  container: { 
    flex: 1, 
    padding: 16, 
    justifyContent: "flex-start" 
  },
  header: { 
    fontSize: 22, 
    fontWeight: "700", 
    color: "#6D94C5", 
    marginBottom: 12 
  },
  inputContainer: { 
    marginBottom: 12 
  },
  input: {
    backgroundColor: "#E8DFCA", 
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#003344", 
    borderWidth: 1,
    borderColor: "#6D94C5",
  },
  inputError: {
    borderColor: "#6D94C5", 
  },
  textArea: {
    height: 140,
  },
  errorText: {
    color: "#6D94C5",
    fontSize: 12,
    marginTop: 4,
  },
  characterCount: {
    color: "#CBDCEB", 
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#6D94C5", 
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#F5EFE6",
    fontWeight: "700",
  },
});
