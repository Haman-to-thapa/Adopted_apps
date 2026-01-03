import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import { useUser } from '@clerk/clerk-expo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GiftedChat, Bubble, Send, InputToolbar } from 'react-native-gifted-chat'
import { Ionicons } from '@expo/vector-icons'

const ChatScreen = () => {
  const params = useLocalSearchParams()
  const { user } = useUser()
  const navigation = useNavigation()
  const [messages, setMessages] = useState([])
  const [chatUser, setChatUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatData, setChatData] = useState(null)
  const [isTyping, setIsTyping] = useState(false)

  const setupHeader = () => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chatUser?.name || params.chatName || 'Chat'}
          </Text>
          {isTyping && (
            <Text style={styles.typingIndicator}>typing...</Text>
          )}
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleInfoPress}
          style={styles.infoButton}
        >
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
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

  const handleInfoPress = () => {
    if (chatData) {
      Alert.alert(
        'Chat Info',
        `Pet: ${chatData.petName || 'Unknown'}\n` +
        `Created: ${new Date(chatData.createdAt).toLocaleDateString()}\n` +
        `Participants: ${chatData.participants?.join(', ') || 'Unknown'}`,
        [{ text: 'OK' }]
      )
    }
  }

  const GetChatDetails = async () => {
    if (!params?.id || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const userEmail = user?.primaryEmailAddress?.emailAddress

      // Get the chat document
      const docRef = doc(db, 'Chat', params.id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        Alert.alert('Chat Not Found', 'This chat may have been deleted.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ])
        setLoading(false)
        return
      }

      const chatData = docSnap.data()
      setChatData(chatData)

      // Find the other user in the chat
      if (chatData?.users && Array.isArray(chatData.users)) {
        const otherUser = chatData.users.find(chatUser => {
          const chatUserEmail = chatUser.email?.toLowerCase()
          const currentUserEmail = userEmail?.toLowerCase()

          // First try to match by email
          if (chatUserEmail && currentUserEmail) {
            return chatUserEmail !== currentUserEmail
          }

          // Fallback: match by username
          if (chatUser.username && user?.username) {
            return chatUser.username !== user.username
          }

          // Fallback: match by ID
          if (chatUser.id && user?.id) {
            return chatUser.id !== user.id
          }

          return false
        })

        if (otherUser) {
          setChatUser(otherUser)
        } else if (chatData.users.length > 0) {
          // If can't identify other user, use the first one
          setChatUser(chatData.users[0])
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error getting chat details:', error)
      Alert.alert('Error', 'Failed to load chat. Please try again.')
      setLoading(false)
    }
  }

  // Listen for messages
  useEffect(() => {
    if (!params?.id) return

    const messagesRef = collection(db, 'Chat', params.id, 'Messages')
    const q = query(messagesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => {
        const data = doc.data()

        // Handle timestamp
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
            _id: data.user?._id || data.user?.email || data.user?.id || 'unknown',
            name: data.user?.name || 'User',
            avatar: data.user?.avatar || data.user?.imageUrl || null,
          },
          // Store original data for reference
          originalData: data
        }
      })

      // GiftedChat expects messages in descending order (newest first)
      setMessages(messageData)

      // Mark messages as read
      markMessagesAsRead()
    }, (error) => {
      console.error('Error listening to messages:', error)
    })

    return () => unsubscribe()
  }, [params.id])

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!params?.id || !user) return

    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress
      const chatRef = doc(db, 'Chat', params.id)

      // Reset unread count for current user
      await updateDoc(chatRef, {
        [`unreadCount.${userEmail}`]: 0,
        lastSeen: {
          [userEmail]: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  useEffect(() => {
    GetChatDetails()
    setupHeader()
  }, [params.id, user])

  useEffect(() => {
    setupHeader()
  }, [chatUser, isTyping])

  const onSend = useCallback(async (newMessages = []) => {
    if (!params?.id || !user) {
      Alert.alert('Error', 'Cannot send message')
      return
    }

    try {
      const message = newMessages[0]
      const userEmail = user?.primaryEmailAddress?.emailAddress
      const userName = user?.fullName || user?.username || 'User'
      const userId = user.id

      if (!message.text.trim()) {
        return
      }

      const messageToSave = {
        text: message.text.trim(),
        createdAt: new Date(),
        user: {
          _id: userEmail || userId,
          name: userName,
          avatar: user?.imageUrl || null,
          email: userEmail,
          userId: userId
        },
        readBy: [userEmail] // Mark as read by sender
      }

      // Save message
      const messagesRef = collection(db, 'Chat', params.id, 'Messages')
      const messageRef = await addDoc(messagesRef, messageToSave)

      // Update chat metadata
      const chatRef = doc(db, 'Chat', params.id)
      await updateDoc(chatRef, {
        lastMessage: message.text,
        lastMessageTime: new Date().toISOString(),
        lastMessageSender: {
          id: userId,
          name: userName,
          email: userEmail
        },
        updatedAt: new Date().toISOString(),
        // Increment unread count for the other user
        [`unreadCount.${getOtherUserEmail()}`]: getOtherUserUnreadCount() + 1
      })

      console.log('Message sent successfully with ID:', messageRef.id)

    } catch (error) {
      console.error('Error sending message:', error)
      Alert.alert('Error', 'Failed to send message. Please try again.')
    }
  }, [params.id, user])

  // Helper to get other user's email
  const getOtherUserEmail = () => {
    const userEmail = user?.primaryEmailAddress?.emailAddress
    if (!chatData?.participants || !userEmail) return null

    return chatData.participants.find(email =>
      email.toLowerCase() !== userEmail.toLowerCase()
    )
  }

  // Helper to get other user's unread count
  const getOtherUserUnreadCount = () => {
    const otherUserEmail = getOtherUserEmail()
    if (!otherUserEmail || !chatData?.unreadCount) return 0

    return chatData.unreadCount[otherUserEmail] || 0
  }

  // Custom render bubble
  const renderBubble = (props) => {
    const isCurrentUser = props.currentMessage.user._id === (user?.primaryEmailAddress?.emailAddress || user?.id)

    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#007AFF',
            marginVertical: 2,
          },
          left: {
            backgroundColor: '#E9E9EB',
            marginVertical: 2,
          }
        }}
        textStyle={{
          right: {
            color: '#fff',
            fontSize: 15,
          },
          left: {
            color: '#000',
            fontSize: 15,
          }
        }}
        timeTextStyle={{
          right: {
            color: 'rgba(255,255,255,0.7)',
          },
          left: {
            color: 'rgba(0,0,0,0.5)',
          }
        }}
      />
    )
  }

  // Custom render send button
  const renderSend = (props) => {
    return (
      <Send
        {...props}
        disabled={!props.text || props.text.trim() === ''}
        containerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 10,
        }}
      >
        <View style={[
          styles.sendButton,
          (!props.text || props.text.trim() === '') && styles.sendButtonDisabled
        ]}>
          <Ionicons
            name="send"
            size={20}
            color={props.text && props.text.trim() !== '' ? '#fff' : '#ccc'}
          />
        </View>
      </Send>
    )
  }

  // Custom input toolbar
  const renderInputToolbar = (props) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    )
  }

  // Render loading
  const renderLoading = () => (
    <View style={styles.loadingMessages}>
      <ActivityIndicator size="small" color="#007AFF" />
      <Text style={styles.loadingText}>Loading messages...</Text>
    </View>
  )

  // Render empty chat
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={80} color="#E5E5EA" />
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubText}>
        Say hello to {chatUser?.name || 'the pet owner'}!
      </Text>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: user?.primaryEmailAddress?.emailAddress || user?.id,
            name: user?.fullName || user?.username || 'User',
            avatar: user?.imageUrl
          }}
          renderBubble={renderBubble}
          renderSend={renderSend}
          renderInputToolbar={renderInputToolbar}
          renderLoading={renderLoading}
          renderChatEmpty={renderEmpty}
          placeholder="Type a message..."
          alwaysShowSend
          scrollToBottom
          scrollToBottomComponent={() => (
            <View style={styles.scrollToBottom}>
              <Ionicons name="chevron-down" size={20} color="#007AFF" />
            </View>
          )}
          minInputToolbarHeight={60}
          minComposerHeight={40}
          maxComposerHeight={100}
          keyboardShouldPersistTaps="handled"
          bottomOffset={Platform.OS === 'ios' ? 90 : 60}
          listViewProps={{
            style: { backgroundColor: '#fff' },
            keyboardDismissMode: 'on-drag',
            keyboardShouldPersistTaps: 'handled',
          }}
          textInputProps={{
            style: styles.textInput,
            placeholderTextColor: '#8E8E93',
            multiline: true,
            blurOnSubmit: false,
          }}
          onInputTextChanged={(text) => {
            // You can add typing indicator logic here
            setIsTyping(text.length > 0)
          }}
          infiniteScroll
          isLoadingEarlier={false}
          showAvatarForEveryMessage={true}
          renderAvatarOnTop={true}
          alignTop
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
    marginTop: 12,
    fontFamily: 'System',
  },
  loadingMessages: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: 'System',
  },
  infoButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'System',
    maxWidth: 200,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
    fontFamily: 'System',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptySubText: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
    fontFamily: 'System',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  scrollToBottom: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 18,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    fontFamily: 'System',
    color: '#000',
    marginLeft: 4,
    flex: 1,
  },
})