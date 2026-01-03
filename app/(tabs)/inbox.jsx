import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs, query } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import { useUser } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const Inbox = () => {
  const { user } = useUser();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const GetUserList = async () => {
    try {
      setRefreshing(true);

      if (!user?.primaryEmailAddress?.emailAddress) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const userEmail = user.primaryEmailAddress.emailAddress;
      const q = query(collection(db, 'Chat'));
      const querySnapShot = await getDocs(q);
      const userChats = [];

      querySnapShot.forEach(doc => {
        const chatData = doc.data();
        const userInChat = chatData.users?.some(chatUser => {
          if (chatUser.email === userEmail) return true;
          if (chatUser.id === user?.id) return true;
          if (chatUser.username === user?.username) return true;
          return false;
        });

        if (userInChat) {
          userChats.push({
            id: doc.id,
            ...chatData
          });
        }
      });

      const processedChats = userChats.map(chat => {
        const otherUser = chat.users?.find(chatUser => {
          if (chatUser.email && chatUser.email !== userEmail) return true;
          if (chatUser.id && chatUser.id !== user?.id) return true;
          if (chatUser.username && user?.username && chatUser.username !== user.username) return true;
          return false;
        });

        let lastMessageTime = new Date();

        if (chat.lastMessageTime) {
          if (chat.lastMessageTime.toDate) {
            lastMessageTime = chat.lastMessageTime.toDate();
          } else if (typeof chat.lastMessageTime === 'string') {
            lastMessageTime = new Date(chat.lastMessageTime);
          } else if (chat.lastMessageTime.seconds) {
            lastMessageTime = new Date(chat.lastMessageTime.seconds * 1000);
          }
        } else if (chat.createdAt) {
          if (chat.createdAt.toDate) {
            lastMessageTime = chat.createdAt.toDate();
          } else if (typeof chat.createdAt === 'string') {
            lastMessageTime = new Date(chat.createdAt);
          } else if (chat.createdAt.seconds) {
            lastMessageTime = new Date(chat.createdAt.seconds * 1000);
          }
        }

        return {
          ...otherUser,
          id: chat.id,
          chatId: chat.id,
          lastMessage: chat.lastMessage || 'Start a conversation...',
          lastMessageTime: lastMessageTime,
          petName: chat.petName || '',
          petImage: chat.petImage || null,
          unreadCount: chat.unreadCount || 0
        };
      });

      processedChats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setChats(processedChats);

    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    GetUserList();
  }

  useEffect(() => {
    if (user) {
      GetUserList();
    } else {
      setLoading(false);
    }
  }, [user]);

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const messageDate = date;
    const diffInDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>
              {chats.length} conversation{chats.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {user?.imageUrl && (
            <TouchableOpacity onPress={() => router.push('/profile')}>
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={100} color="#e0e0e0" />
          </View>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Start a conversation by tapping "Adopt Me" on a pet's profile
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.browseButtonText}>Browse Pets</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() => router.push({
                pathname: '/chat',
                params: {
                  id: item.id,
                  chatName: item.name,
                  petName: item.petName
                }
              })}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.defaultAvatar]}>
                    <Ionicons name="person" size={24} color="#666" />
                  </View>
                )}
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName} numberOfLines={1}>
                    {item.name || 'Unknown User'}
                  </Text>
                  <Text style={styles.chatTime}>
                    {formatDate(item.lastMessageTime)}
                  </Text>
                </View>

                {item.petName ? (
                  <Text style={styles.petName} numberOfLines={1}>
                    About: {item.petName}
                  </Text>
                ) : null}

                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 32,
    color: '#333',
  },
  subtitle: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontFamily: 'outfit-semibold',
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontFamily: 'outfit-regular',
    fontSize: 12,
    color: '#999',
  },
  petName: {
    fontFamily: 'outfit-regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  lastMessage: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: '#888',
  },
  separator: {
    marginHorizontal: 20,
    height: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontFamily: 'outfit-regular',
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    marginBottom: 30,
  },
  emptyTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'outfit-regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: '#4A6FFF',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#4A6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    fontFamily: 'outfit-semibold',
    fontSize: 16,
    color: '#fff',
  },
})

export default Inbox