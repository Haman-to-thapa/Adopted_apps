import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth, useUser } from '@clerk/clerk-expo'
import Colors from '../../constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const Profile = () => {
  const Menu = [
    {
      id: 1,
      name: "Add New Pet",
      icon: 'add-circle-outline',
      path: '/add-new-pet',
      color: '#4A6FFF',
    },
    {
      id: 5,
      name: "My Post",
      icon: 'bookmark',
      path: '/user-post'
    },
    {
      id: 2,
      name: "Favorites",
      icon: 'heart-outline',
      path: '/(tabs)/favorite',
      color: '#FF6B6B',
    },
    {
      id: 3,
      name: 'Inbox',
      icon: 'chatbubble-outline',
      path: '/(tabs)/inbox',
      color: '#4CD964',
    },
    {
      id: 4,
      name: 'Logout',
      icon: 'log-out-outline',
      path: 'logout',
      color: '#FF3B30',
    }
  ]

  const { user } = useUser()
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Error', 'Failed to logout. Please try again.')
    }
  }

  const onPressMenu = async (menu) => {
    if (menu.path === 'logout') {

      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: handleLogout,
          },
        ]
      )
      return
    }
    router.push(menu.path)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.imageUrl }}
            style={styles.avatar}
          />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4A6FFF" />
          </View>
        </View>

        <Text style={styles.userName}>{user?.fullName}</Text>
        <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>
      </View>

      <FlatList
        data={Menu}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onPressMenu(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>

            <Text style={styles.menuName}>{item.name}</Text>

            <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.chevron} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 32,
    color: '#333',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  userName: {
    fontFamily: 'outfit-bold',
    fontSize: 22,
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontFamily: 'outfit-regular',
    fontSize: 16,
    color: '#666',
  },
  menuList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuName: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  chevron: {
    marginLeft: 10,
  },
})

export default Profile