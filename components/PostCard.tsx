import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal, Platform, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../lib/firebaseConfig";
import CommentItem from "./CommentItem";

export default function PostCard({ post }: { post: any }) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || "");
  const [editedTitle, setEditedTitle] = useState(post.title || "");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostCaption, setRepostCaption] = useState("");
  const commentsUnsubscribeRef = useRef<null | (() => void)>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const formatDate = (value: any) => {
    try {
      if (value?.toDate) return value.toDate().toLocaleString();
      if (typeof value === "string") return value;
      if (typeof value?.seconds === "number") return new Date(value.seconds * 1000).toLocaleString();
      if (typeof value === "number") return new Date(value).toLocaleString();
    } catch {}
    return new Date().toLocaleString();
  };
  const formattedDate = formatDate(post.createdAt);

  const isOwner = auth.currentUser?.uid === (post.authorId || post.uid);

  // Real-time post counts
  const [checkCount, setCheckCount] = useState<number>(post.checkCount || 0);
  const [xCount, setXCount] = useState<number>(post.xCount || 0);
  const [pendingDelta, setPendingDelta] = useState<{check:number;x:number}>({check:0,x:0});

  useEffect(() => {
    const ref = doc(db, "posts", post.id);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any;
      setCheckCount(d?.checkCount || 0);
      setXCount(d?.xCount || 0);
    });
    return () => unsub();
  }, [post.id]);

  // Handle post deletion
  const handleDelete = async () => {
    const confirm = Platform.OS === 'web' 
      ? (window.confirm ? window.confirm('Delete this post?') : true)
      : true;
    if (Platform.OS !== 'web') {
      // Native confirmation
      let resolved = false;
      Alert.alert(
        "Delete Post",
        "Are you sure you want to delete this post?",
        [
          { text: "Cancel", style: "cancel", onPress: () => { resolved = true; } },
          { text: "Delete", style: "destructive", onPress: async () => {
            try {
              setIsDeleted(true);
              await deleteDoc(doc(db, "posts", post.id));
            } catch (err:any) {
              console.error("Error deleting post:", err);
              Alert.alert("Error", String(err?.message || err));
              setIsDeleted(false);
            }
          }}
        ]
      );
      return;
    }

    if (!confirm) return;
    try {
      setIsDeleted(true);
      await deleteDoc(doc(db, "posts", post.id));
    } catch (err:any) {
      console.error("Error deleting post:", err);
      alert(String(err?.message || err));
      setIsDeleted(false);
    }
  };

  // Handle post update
  const handleUpdate = async () => {
    if (!editedContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }

    try {
      await updateDoc(doc(db, "posts", post.id), {
        title: editedTitle.trim(),
        content: editedContent.trim(),
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update post");
    }
  };

  // Handle reactions (check/x)
  const handleReaction = async (type: 'check' | 'x') => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const postRef = doc(db, "posts", post.id);
      
      // Check if user has already reacted
      const reactionsRef = collection(db, "reactions");
      const q = query(
        reactionsRef, 
        where("postId", "==", post.id),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const userReaction = querySnapshot.docs[0]?.data()?.type as 'check' | 'x' | undefined;
      
      // If user already reacted with the same type, remove the reaction
      if (querySnapshot.docs.length > 0 && userReaction === type) {
        // Optimistic UI: decrement now
        setPendingDelta((d)=>({
          check: d.check + (type==='check'?-1:0),
          x: d.x + (type==='x'?-1:0)
        }));
        // Remove reaction
        await deleteDoc(querySnapshot.docs[0].ref);
        
        // Update post count
        if (type === 'check') {
          await updateDoc(postRef, { checkCount: increment(-1) });
        } else {
          await updateDoc(postRef, { xCount: increment(-1) });
        }
        return;
      }
      
      // If user already reacted with different type, remove old reaction and add new one
      if (querySnapshot.docs.length > 0) {
        // Remove old reaction
        setPendingDelta((d)=>({
          check: d.check + (userReaction==='check'?-1:0) + (type==='check'?1:0),
          x: d.x + (userReaction==='x'?-1:0) + (type==='x'?1:0)
        }));
        await deleteDoc(querySnapshot.docs[0].ref);
        
        // Update old reaction count
        if (userReaction === 'check') {
          await updateDoc(postRef, { checkCount: increment(-1) });
        } else {
          await updateDoc(postRef, { xCount: increment(-1) });
        }
      }
      
      // Add new reaction
      await addDoc(collection(db, "reactions"), {
        postId: post.id,
        userId: userId,
        type: type,
        createdAt: serverTimestamp()
      });
      
      // Update post count
      if (type === 'check') {
        await updateDoc(postRef, { checkCount: increment(1) });
      } else {
        await updateDoc(postRef, { xCount: increment(1) });
      }
      // Clear pending once server snapshot catches up; minimal timeout safety
      setTimeout(()=>setPendingDelta({check:0,x:0}), 500);
    } catch (error) {
      console.error("Error adding reaction:", error);
      Alert.alert("Error", "Failed to add reaction");
      // Rollback optimistic deltas
      setPendingDelta({check:0,x:0});
    }
  };

  // Start real-time comments listener for this post
  const startCommentsListener = () => {
    if (commentsUnsubscribeRef.current) return; // already listening
    setLoading(true);
    const q = query(
      collection(db, "comments"),
      where("postId", "==", post.id),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setComments(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to comments:", err);
        setLoading(false);
      }
    );
    commentsUnsubscribeRef.current = unsubscribe;
  };

  const stopCommentsListener = () => {
    if (commentsUnsubscribeRef.current) {
      commentsUnsubscribeRef.current();
      commentsUnsubscribeRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCommentsListener();
    };
  }, []);

  // Add comment
  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, "comments"), {
        content: newComment.trim(),
        postId: post.id,
        authorId: auth.currentUser?.uid,
        uid: auth.currentUser?.uid,
        authorUsername: auth.currentUser?.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        checkCount: 0,
        xCount: 0
      });
      setNewComment("");
      // No manual refresh needed; onSnapshot updates the UI
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  // Handle repost
  const handleRepost = async () => {
    try {
      await addDoc(collection(db, "posts"), {
        title: `Repost: ${post.title || "Untitled"}`,
        content: repostCaption,
        originalPostId: post.id,
        originalAuthor: post.authorusername || "Anonymous",
        originalContent: post.content,
        authorId: auth.currentUser?.uid,
        uid: auth.currentUser?.uid,
        authorusername: auth.currentUser?.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        checkCount: 0,
        xCount: 0
      });
      setShowRepostModal(false);
      setRepostCaption("");
    } catch (error) {
      console.error("Error reposting:", error);
      Alert.alert("Error", "Failed to repost");
    }
  };

  // Toggle comments view and load if needed
  const toggleComments = () => {
    if (!showComments) {
      startCommentsListener();
    } else {
      stopCommentsListener();
    }
    setShowComments(!showComments);
  };

  if (isDeleted) return null;

  return (
    <View style={styles.card}>
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editTitleInput}
            value={editedTitle}
            onChangeText={setEditedTitle}
            placeholder="Title"
            placeholderTextColor="#000c74"
          />
          <TextInput
            style={styles.editContentInput}
            value={editedContent}
            onChangeText={setEditedContent}
            placeholder="What's on your mind?"
            placeholderTextColor="#000c74"
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
            <Text style={styles.title}>{post.title || "Untitled"}</Text>
            <Text style={styles.content}>{post.content || ""}</Text>
            
            {post.originalContent && (
              <View style={styles.repostContainer}>
                <Text style={styles.repostHeader}>Reposted from {post.originalAuthor}</Text>
                <Text style={styles.repostContent}>{post.originalContent}</Text>
              </View>
            )}
            
            <View style={styles.metaRow}>
              <Text style={styles.metaLeft}>
                👤 {post.authorusername || "Anonymous"}
              </Text>
              <Text style={styles.metaRight}>{formattedDate}</Text>
            </View>
            
            <View style={styles.reactionsRow}>
              <Text style={styles.reactionCount}>
                <AntDesign name="check" size={14} color="#081269" /> {Math.max(0, checkCount + pendingDelta.check)}
              </Text>
              <Text style={styles.reactionCount}>
                <AntDesign name="close" size={14} color="#081269" /> {Math.max(0, xCount + pendingDelta.x)}
              </Text>
            </View>
          </TouchableOpacity>

          {showActions && (
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleReaction('check')}
              >
                <AntDesign name="check" size={16} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleReaction('x')}
              >
                <AntDesign name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={toggleComments}
              >
                <Feather name="message-circle" size={16} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowRepostModal(true)}
              >
                <MaterialCommunityIcons name="repeat" size={16} color="#ffffff" />
              </TouchableOpacity>
              
              {isOwner && (
                <>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Feather name="edit" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Feather name="trash-2" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {showComments && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsHeader}>Comments</Text>
              
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment..."
                  placeholderTextColor="#6D94C5"
                />
                <TouchableOpacity 
                  style={styles.commentButton}
                  onPress={addComment}
                >
                  <Text style={styles.buttonText}>Post</Text>
                </TouchableOpacity>
              </View>
              
              {loading ? 
                <Text style={styles.loadingText}>Loading comments...</Text>
              : comments.length === 0 ? 
                <Text style={styles.noCommentsText}>No comments yet</Text>
              : (
                comments.map(comment => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    postId={post.id}
                  />
                ))
              )}
            </View>
          )}
          
          {/* Repost Modal */}
          <Modal
            visible={showRepostModal}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Repost</Text>
                <Text style={styles.modalSubtitle}>Add your thoughts</Text>
                
                <TextInput
                  style={styles.repostInput}
                  value={repostCaption}
                  onChangeText={setRepostCaption}
                  placeholder="What are your thoughts?"
                  placeholderTextColor="#6D94C5"
                  multiline
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowRepostModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleRepost}
                  >
                    <Text style={styles.buttonText}>Repost</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff", 
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#c7c9ff",
    shadowColor: "#081269",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    color: "#081269", 
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  content: {
    color: "#000c74", 
    fontSize: 16,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  metaLeft: {
    color: "#000c74", 
    fontSize: 12,
    opacity: 0.8,
  },
  metaRight: {
    color: "#000c74", 
    fontSize: 12,
    textAlign: "right",
    opacity: 0.8,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#081269",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
  },
  buttonText: {
    color: "#ffffff", 
    fontSize: 14,
    fontWeight: "600",
  },
  reactionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  reactionCount: {
    fontSize: 14,
    color: "#000c74",
  },
  editContainer: {
    padding: 8,
  },
  editTitleInput: {
    backgroundColor: "#f0f2ff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#081269",
    marginBottom: 10,
  },
  editContentInput: {
    backgroundColor: "#f0f2ff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#081269",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: "#6D6D6D",
  },
  saveButton: {
    backgroundColor: "#081269",
  },
  commentsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#c7c9ff",
    paddingTop: 12,
  },
  commentsHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#081269",
    marginBottom: 10,
  },
  commentInputContainer: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f2ff",
    borderRadius: 8,
    padding: 10,
    color: "#081269",
  },
  commentButton: {
    backgroundColor: "#081269",
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#000c74",
    textAlign: "center",
    padding: 10,
  },
  noCommentsText: {
    color: "#000c74",
    textAlign: "center",
    padding: 10,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#081269",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#000c74",
    marginBottom: 16,
  },
  repostInput: {
    backgroundColor: "#f0f2ff",
    borderRadius: 8,
    padding: 12,
    color: "#081269",
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  repostContainer: {
    backgroundColor: "#f0f2ff",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#081269",
  },
  repostHeader: {
    fontSize: 12,
    color: "#000c74",
    fontWeight: "600",
    marginBottom: 4,
  },
  repostContent: {
    fontSize: 14,
    color: "#000c74",
    fontStyle: "italic",
  },
});

