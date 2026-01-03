import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRouter } from 'expo-router'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import { useUser } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'

const UserPosts = () => {
  const navigation = useNavigation()
  const router = useRouter()
  const { user } = useUser()
  const [userPostList, setUserPostList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'My Pets',
      headerTitleStyle: {
        fontSize: 20,
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
    if (user) {
      GetUserPost()
    } else {
      setLoading(false)
    }
  }, [user])

  const GetUserPost = async () => {
    try {
      setLoading(true)
      setUserPostList([])

      if (!user?.primaryEmailAddress?.emailAddress) {
        setLoading(false)
        return
      }

      const userEmail = user.primaryEmailAddress.emailAddress
      const q = query(collection(db, 'Pets'), where('email', '==', userEmail))
      const querySnapshot = await getDocs(q)

      const posts = []
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setUserPostList(posts)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user posts:', error)
      Alert.alert('Error', 'Failed to load your pets')
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderPetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => router.push({
        pathname: '/pet-details',
        params: {
          id: item.id,
          name: item.name,
          breed: item.breed,
          age: item.age,
          sex: item.sex,
          price: item.price,
          address: item.address,
          category: item.category,
          imageUrl: item.imageUrl,
          about: item.about,
          postedDate: item.postedDate,
          username: item.username,
          userImage: item.userImage,
        }
      })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
        style={styles.petImage}
      />

      <View style={styles.petInfo}>
        <View style={styles.petHeader}>
          <Text style={styles.petName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.petPrice}>
            ${item.price || 'Free'}
          </Text>
        </View>

        <Text style={styles.petBreed} numberOfLines={1}>
          {item.breed || 'Mixed Breed'}
        </Text>

        <View style={styles.petDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.age} years</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name={item.sex?.toLowerCase() === 'female' ? 'female-outline' : 'male-outline'}
              size={14}
              color="#666"
            />
            <Text style={styles.detailText}>{item.sex || 'Unknown'}</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="paw-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{item.category || 'Pet'}</Text>
          </View>
        </View>

        {item.postedDate && (
          <Text style={styles.postedDate}>
            Posted on {formatDate(item.postedDate)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FFF" />
        <Text style={styles.loadingText}>Loading your pets...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {userPostList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="paw-outline" size={80} color="#e0e0e0" />
          <Text style={styles.emptyTitle}>No pets listed</Text>
          <Text style={styles.emptyText}>
            You haven't listed any pets for adoption yet
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-new-pet')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New Pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={userPostList}
          keyExtractor={(item) => item.id}
          renderItem={renderPetItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>My Listed Pets</Text>
              <Text style={styles.headerSubtitle}>
                {userPostList.length} pet{userPostList.length !== 1 ? 's' : ''} listed
              </Text>
            </View>
          }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
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
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  headerInfo: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  petCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  petInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  petPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A6FFF',
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  petDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  postedDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4A6FFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#4A6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})

export default UserPosts