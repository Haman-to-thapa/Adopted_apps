import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import Colors from '../../constants/Colors'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const UserItem = ({ userInfo }) => {
  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';

    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      // Today - show time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInHours < 168) {
      // This week - show day name
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Truncate long messages
  const truncateMessage = (text, maxLength = 30) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link
      href={{
        pathname: '/chat',
        params: {
          id: userInfo.docId,
          chatName: userInfo.name,
          petName: userInfo.petName
        }
      }}
      asChild
    >
      <TouchableOpacity style={styles.container} activeOpacity={0.7}>
        <View style={styles.contentContainer}>
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            {userInfo.imageUrl ? (
              <Image
                source={{ uri: userInfo.imageUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
            )}

            {/* Unread badge */}
            {userInfo.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {userInfo.unreadCount > 9 ? '9+' : userInfo.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {userInfo?.name || 'Unknown User'}
              </Text>
              {userInfo.lastMessageTime && (
                <Text style={styles.timeText}>
                  {formatTime(userInfo.lastMessageTime)}
                </Text>
              )}
            </View>

            {/* Pet info if available */}
            {userInfo.petName && (
              <Text style={styles.petName} numberOfLines={1}>
                Re: {userInfo.petName}
              </Text>
            )}

            {/* Last message preview */}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {truncateMessage(userInfo.lastMessage) || 'Start a conversation...'}
            </Text>
          </View>

          {/* Chevron icon */}
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>

        {/* Separator */}
        <View style={styles.separator} />
      </TouchableOpacity>
    </Link>
  )
}

export default UserItem

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontFamily: 'outfit-regular',
    fontSize: 12,
    color: '#999',
  },
  petName: {
    fontFamily: 'outfit-regular',
    fontSize: 13,
    color: Colors.GRAY,
    marginBottom: 2,
  },
  lastMessage: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: '#666',
  },
  separator: {
    marginTop: 12,
    marginHorizontal: 15,
    height: 1,
    backgroundColor: '#f0f0f0',
  },
})