import { AntDesign, Feather } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, query as fsQuery, getDocs, increment, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../lib/firebaseConfig";

interface CommentItemProps {
  comment: any;
  postId: string;
}

export default function CommentItem({ comment, postId }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content || "");
  const [showActions, setShowActions] = useState(false);

  const formatDate = (value: any) => {
    try {
      if (value?.toDate) return value.toDate().toLocaleString();
      if (typeof value === "string") return value;
      if (typeof value?.seconds === "number") return new Date(value.seconds * 1000).toLocaleString();
      if (typeof value === "number") return new Date(value).toLocaleString();
    } catch {}
    return new Date().toLocaleString();
  };
  const formattedDate = formatDate(comment.createdAt);

  const isOwner = auth.currentUser?.uid === comment.authorId;

  // Handle comment deletion
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const ok = (window as any).confirm ? (window as any).confirm('Delete this comment?') : true;
      if (!ok) return;
      try {
        setIsDeleted(true);
        await deleteDoc(doc(db, "comments", comment.id));
      } catch (error:any) {
        console.error("Error deleting comment:", error);
        alert(String(error?.message || error));
        setIsDeleted(false);
      }
      return;
    }

    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleted(true);
              await deleteDoc(doc(db, "comments", comment.id));
            } catch (error:any) {
              console.error("Error deleting comment:", error);
              Alert.alert("Error", String(error?.message || error));
              setIsDeleted(false);
            }
          },
        },
      ]
    );
  };

  // Handle comment update
  const handleUpdate = async () => {
    if (!editedContent.trim()) {
      Alert.alert("Error", "Comment cannot be empty");
      return;
    }

    try {
      await updateDoc(doc(db, "comments", comment.id), {
        content: editedContent.trim(),
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
      Alert.alert("Error", "Failed to update comment");
    }
  };

  // Handle reactions (check/x) with per-user toggle behavior similar to posts
  const handleReaction = async (type: 'check' | 'x') => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const commentRef = doc(db, "comments", comment.id);

      // Store comment reactions in a separate collection to allow toggling
      const reactionsRef = collection(db, "commentReactions");
      const q = fsQuery(
        reactionsRef,
        where("commentId", "==", comment.id),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const existing = querySnapshot.docs[0];
      const existingType = existing?.data()?.type as 'check' | 'x' | undefined;

      // If the same reaction exists, remove it (toggle off)
      if (existing && existingType === type) {
        await deleteDoc(existing.ref);
        await updateDoc(commentRef, {
          [type === 'check' ? 'checkCount' : 'xCount']: increment(-1),
        });
        return;
      }

      // If a different reaction exists, remove it and decrement its counter
      if (existing) {
        await deleteDoc(existing.ref);
        await updateDoc(commentRef, {
          [existingType === 'check' ? 'checkCount' : 'xCount']: increment(-1),
        });
      }

      // Add new reaction and increment its counter
      await addDoc(reactionsRef, {
        commentId: comment.id,
        userId,
        type,
        createdAt: serverTimestamp(),
      });

      await updateDoc(commentRef, {
        [type === 'check' ? 'checkCount' : 'xCount']: increment(1),
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      Alert.alert("Error", "Failed to add reaction");
    }
  };

  // Keep this comment's counts in sync in real-time (optional fine-grained listener when shown)
  // Parent list already updates counts; this ensures an individual row stays fresh if counts change elsewhere.
  // We intentionally don't start or manage this here to avoid nested listeners; counts are updated by PostCard's comments snapshot.

  if (isDeleted) return null;

  return (
    <View style={styles.commentContainer}>
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editedContent}
            onChangeText={setEditedContent}
            placeholder="Edit your comment..."
            multiline
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowActions(!showActions)}>
            <Text style={styles.commentContent}>{comment.content}</Text>
            <View style={styles.commentMeta}>
              <Text style={styles.commentAuthor}>
                👤 {comment.authorUsername || "Anonymous"}
              </Text>
              <Text style={styles.commentDate}>{formattedDate}</Text>
            </View>
            
            <View style={styles.reactionsRow}>
              <Text style={styles.reactionCount}>
                <AntDesign name="check" size={12} color="#081269" /> {comment.checkCount || 0}
              </Text>
              <Text style={styles.reactionCount}>
                <AntDesign name="close" size={12} color="#081269" /> {comment.xCount || 0}
              </Text>
            </View>
          </TouchableOpacity>

          {showActions && (
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleReaction('check')}
              >
                <AntDesign name="check" size={14} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleReaction('x')}
              >
                <AntDesign name="close" size={14} color="#ffffff" />
              </TouchableOpacity>
              
              {isOwner && (
                <>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Feather name="edit" size={14} color="#ffffff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Feather name="trash-2" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    backgroundColor: "#c7c9ff",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  commentContent: {
    color: "#081269",
    fontSize: 14,
    marginBottom: 4,
  },
  commentMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    color: "#000c74",
    fontSize: 12,
  },
  commentDate: {
    color: "#000c74",
    fontSize: 10,
  },
  reactionsRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 8,
  },
  reactionCount: {
    fontSize: 12,
    color: "#000c74",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 6,
  },
  actionButton: {
    backgroundColor: "#081269",
    padding: 6,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
  },
  editContainer: {
    marginTop: 4,
  },
  editInput: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    padding: 8,
    color: "#081269",
    minHeight: 60,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: "#6D6D6D",
  },
  saveButton: {
    backgroundColor: "#081269",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});