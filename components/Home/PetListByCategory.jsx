import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import Category from './Category'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'

const PetListByCategory = () => {
  const [pets, setPets] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const router = useRouter()

  useEffect(() => {
    GetPetList('All')
  }, [])

  // Use useFocusEffect instead of router.addListener
  useFocusEffect(
    useCallback(() => {
      // Refresh when screen comes into focus
      GetPetList(selectedCategory)

      // Optional: Clean up function
      return () => {
        // Any cleanup if needed
      }
    }, [selectedCategory])
  )

  const GetPetList = async (category) => {
    if (!category) return

    setSelectedCategory(category)
    setLoading(true)
    setError(null)

    try {
      let snapshot;

      if (category === 'All') {
        snapshot = await getDocs(collection(db, 'Pets'))
      } else {
        const q = query(
          collection(db, 'Pets'),
          where('category', '==', category)
        )
        snapshot = await getDocs(q)
      }

      const list = []

      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setPets(list)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching pets:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Add this refresh function
  const onRefresh = async () => {
    setRefreshing(true)
    await GetPetList(selectedCategory)
  }

  return (
    <View style={styles.container}>
      <Category category={GetPetList} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {selectedCategory === 'All' ? 'All Pets' : `Pets in ${selectedCategory}`}
          </Text>
          {/* Add Refresh Button */}
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.count}>{pets.length} pets found</Text>
      </View>

      {loading && <Text style={styles.loading}>Loading pets...</Text>}

      {error && <Text style={styles.error}>Error: {error}</Text>}

      {!loading && pets.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>No pets found</Text>
          <Text style={styles.emptySubtext}>
            {selectedCategory === 'All'
              ? 'No pets available'
              : `No pets found in ${selectedCategory} category`}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => GetPetList(selectedCategory)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && pets.length > 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        >
          {pets.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/pet-details',
                  params: {
                    id: item.id,
                    name: item.name,
                    username: item.username,
                    about: item.about || 'No description available',
                    breed: item.breed || 'Unknown Breed',
                    age: item.age || 'N/A',
                    sex: item.sex || 'Unknown',
                    price: item.price || 'N/A',
                    imageUrl: item.imageUrl || '',
                    userImage: item.userImage || '',
                    address: item.address || 'Unknown Location',
                    category: item.category || 'Pet',
                    postedDate: item.postedDate || 'Recently',
                    ownerName: item.ownerName || 'John Doe',
                    ownerContact: item.ownerContact || '+1 234 567 8900',
                    ownerAddress: item.ownerAddress || '123 Pet Street, City',
                  },
                })
              }
            >
              <Image source={{ uri: item.imageUrl }} style={styles.image} />

              <View style={styles.info}>
                <View style={styles.infoHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.category && item.category !== '' && (
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.breed}>{item.breed || 'Unknown Breed'}</Text>

                <View style={styles.detailsRow}>
                  <Text style={styles.age}>Age: {item.age || 'N/A'}</Text>
                  <Text style={styles.sex}>{item.sex ? item.sex.charAt(0).toUpperCase() + item.sex.slice(1) : 'Unknown'}</Text>
                </View>

                <View style={styles.priceRow}>
                  {item.price && item.price !== '' ? (
                    <Text style={styles.price}>₹ {item.price}</Text>
                  ) : (
                    <Text style={styles.priceFree}>Free</Text>
                  )}
                  <Text style={styles.location}>
                    📍 {item.address ? item.address.split(',')[0] : 'Location'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default PetListByCategory

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
  },
  header: {
    marginVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loading: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  empty: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  info: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  categoryTag: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  breed: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  age: {
    color: '#555',
    fontSize: 14,
    marginRight: 16,
  },
  sex: {
    color: '#555',
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4CAF50',
  },
  priceFree: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4CAF50',
  },
  location: {
    color: '#777',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
})