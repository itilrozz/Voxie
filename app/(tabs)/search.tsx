import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../../constants/Colors';

interface User {
  id: string;
  alias: string;
  email: string;
  [key: string]: any;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('alias', '>=', searchQuery),
        where('alias', '<=', searchQuery + '\uf8ff')
      );
      
      const querySnapshot = await getDocs(q);
      const userResults: User[] = [];
      
      querySnapshot.forEach((doc) => {
        userResults.push({ id: doc.id, ...doc.data() } as User);
      });
      
      setUsers(userResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewUserProfile = (userId: string) => {
    router.push(`/userProfile/${userId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: "#f0f2ff",
            color: '#081269',
            borderColor: "#000c74",
            borderWidth: 1
          }]}
          placeholder="Search users..."
          placeholderTextColor="#081269"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchUsers}
        />
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]} 
          onPress={searchUsers}
        >
          <Ionicons name="search" size={20} color={Colors[colorScheme ?? 'light'].white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} style={styles.loader} />
      ) : (
        <>
          {searched && users.length === 0 ? (
            <Text style={[styles.noResults, { color: Colors[colorScheme ?? 'light'].text }]}>
              No users found
            </Text>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.userItem, { borderColor: Colors[colorScheme ?? 'light'].border }]} 
                  onPress={() => viewUserProfile(item.id)}
                >
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: '#081269' }]}>
                      {item.alias}
                    </Text>
                    <Text style={[styles.userEmail, { color: '#081269' }]}>
                      {item.email}
                    </Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={Colors[colorScheme ?? 'light'].secondary} 
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 20,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
});