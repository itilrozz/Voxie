import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth } from "../lib/firebaseConfig";

export default function PostCard({ post }: { post: any }) {
  const [showActions, setShowActions] = useState(false);

  const formattedDate = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleString()
    : "Unknown date";

  const isOwner = auth.currentUser?.uid === post.authorId;

  return (
    <View style={styles.card}>
 
        <>
          <TouchableOpacity onPress={() => setShowActions(!showActions)}>
            <Text style={styles.title}>{post.title || "Untitled"}</Text>
            <Text style={styles.content}>{post.content || ""}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLeft}>
                👤 {post.authorusername || "Anonymous"}
              </Text>
              <Text style={styles.metaRight}> {formattedDate}</Text>
            </View>
          </TouchableOpacity>
        </>
      
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#CBDCEB", 
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    color: "#6D94C5", 
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  content: {
    color: "#003344", 
    fontSize: 14,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLeft: {
    color: "#544e3eff", 
    fontSize: 12,
  },
  metaRight: {
    color: "#544e3eff", 
    fontSize: 12,
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  smallButton: {
    backgroundColor: "#6D94C5", 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  buttonText: {
    color: "#F5EFE6", 
    fontSize: 12,
    fontWeight: "600",
  },
});

