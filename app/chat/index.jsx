import { StyleSheet, Text, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { addDoc, collection, doc, getDoc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import { useUser } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GiftedChat } from 'react-native-gifted-chat'
import { Ionicons } from '@expo/vector-icons'

const ChatScreen = () => {
  const params = useLocalSearchParams()
  const { user } = useUser()
  const navigation = useNavigation()
  const [messages, setMessages] = useState([])
  const [chatUser, setChatUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setupHeader = () => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: chatUser?.name || params.chatName || 'Chat',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
    })
  }

  const GetUserDetails = async () => {
    if (!params?.id || !user) return

    try {
      setLoading(true)
      const docRef = doc(db, 'Chat', params.id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        setLoading(false)
        return
      }

      const chatData = docSnap.data()
      let otherUser = null
      if (chatData?.users) {
        otherUser = chatData.users.find(item => {
          if (item.email && user?.primaryEmailAddress?.emailAddress) {
            return item.email !== user.primaryEmailAddress.emailAddress
          }
          if (item.username && user?.username) {
            return item.username !== user.username
          }
          if (item.id && user?.id) {
            return item.id !== user.id
          }
          return false
        })
      }

      if (otherUser) {
        setChatUser(otherUser)
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  useEffect(() => {
    GetUserDetails()
    setupHeader()

    if (params?.id) {
      const messagesRef = collection(db, 'Chat', params.id, 'Messages')
      const q = query(messagesRef, orderBy('createdAt', 'asc'))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messageData = snapshot.docs.map((doc) => {
          const data = doc.data()

          let createdAt;
          if (data.createdAt?.toDate) {
            createdAt = data.createdAt.toDate()
          } else if (data.createdAt) {
            createdAt = new Date(data.createdAt)
          } else {
            createdAt = new Date()
          }

          return {
            _id: doc.id,
            text: data.text || '',
            createdAt: createdAt,
            user: {
              _id: data.user?._id || data.user?.email || '',
              name: data.user?.name || '',
              avatar: data.user?.avatar || null,
            }
          }
        })
        setMessages(messageData)
      })

      return () => unsubscribe()
    }
  }, [params.id, user])

  useEffect(() => {
    setupHeader()
  }, [chatUser])

  const onSend = useCallback(async (newMessages = []) => {
    if (!params?.id || !user) return

    try {
      const message = newMessages[0]
      const messageToSave = {
        text: message.text,
        createdAt: new Date(),
        user: {
          _id: user?.primaryEmailAddress?.emailAddress || user?.id,
          name: user?.fullName || 'User',
          avatar: user?.imageUrl || null,
        }
      }

      const messagesRef = collection(db, 'Chat', params.id, 'Messages')
      await addDoc(messagesRef, messageToSave)

      const chatRef = doc(db, 'Chat', params.id)
      await updateDoc(chatRef, {
        lastMessage: message.text,
        lastMessageTime: new Date(),
        lastMessageSender: {
          id: user?.id,
          name: user?.fullName,
        }
      })

    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.')
    }
  }, [params.id, user])

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          showUserAvatar={true}
          user={{
            _id: user?.primaryEmailAddress?.emailAddress || user?.id,
            name: user?.fullName || 'User',
            avatar: user?.imageUrl
          }}
          placeholder="Type a message..."
          alwaysShowSend
          scrollToBottom
          scrollToBottomComponent={() => null}
          isLoadingEarlier={false}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text>Loading messages...</Text>
            </View>
          )}
          renderEmpty={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>Start the conversation!</Text>
            </View>
          )}
          minInputToolbarHeight={50}
          minComposerHeight={Platform.OS === 'ios' ? 34 : 40}
          maxComposerHeight={100}
          keyboardShouldPersistTaps="handled"
          bottomOffset={Platform.OS === 'ios' ? 90 : 60}
          listViewProps={{
            keyboardDismissMode: 'on-drag',
            keyboardShouldPersistTaps: 'handled',
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default ChatScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
})