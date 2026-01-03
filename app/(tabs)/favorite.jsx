import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity
} from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser } from '@clerk/clerk-expo'
import Shared from './../../Shared/Shared'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'
import { useFocusEffect } from '@react-navigation/native'

const Favorite = () => {
  const { user, isLoaded } = useUser();
  const [favIds, setFavIds] = useState([])
  const [favPetList, setFavPetList] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)

  const isRefreshingRef = useRef(false)
  const refreshTimeoutRef = useRef(null)

  const GetFavPetId = async (isSilentRefresh = false) => {
    if (isRefreshingRef.current) {
      return
    }

    try {
      isRefreshingRef.current = true

      if (!isSilentRefresh) {
        setError(null)
        setRefreshing(true)
      }

      const result = await Shared.GetFavList(user);

      if (result?.favorites && Array.isArray(result.favorites) && result.favorites.length > 0) {
        setFavIds(result.favorites);
        await GetFavPetList(result.favorites);
      } else {
        setFavPetList([]);
        setFavIds([]);
      }

      setLastRefreshTime(new Date());
    } catch (err) {
      if (!isSilentRefresh) {
        setError('Failed to load favorites');
      }
    } finally {
      if (!isSilentRefresh) {
        setLoading(false);
        setRefreshing(false);
      }
      isRefreshingRef.current = false
    }
  }

  const GetFavPetList = async (favId_) => {
    try {
      if (!favId_ || favId_.length === 0) {
        setFavPetList([]);
        return;
      }

      const allPetsSnapshot = await getDocs(collection(db, 'Pets'));
      const matchedPets = [];

      allPetsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = docSnap.id;

        let isMatch = false;
        const possibleIdFields = ['id', 'petId', 'customId', 'documentId'];

        for (const field of possibleIdFields) {
          if (data[field] && favId_.includes(data[field].toString())) {
            isMatch = true;
            break;
          }
        }

        if (!isMatch && favId_.includes(docId)) {
          isMatch = true;
        }

        if (isMatch) {
          matchedPets.push({
            id: docId,
            savedId: favId_.find(id => {
              if (id === docId) return true;
              for (const field of possibleIdFields) {
                if (data[field] && id === data[field].toString()) return true;
              }
              return false;
            }),
            ...data
          });
        }
      });

      setFavPetList(matchedPets);
    } catch (err) {
      setError('Failed to load pet details');
    }
  }

  const handleRemoveFavorite = async (petId, savedId) => {
    try {
      const idToRemove = savedId || petId;
      const updatedFavorites = favIds.filter(id => id !== idToRemove);

      setFavPetList(prev => prev.filter(pet => {
        return pet.id !== petId && pet.savedId !== idToRemove;
      }));
      setFavIds(updatedFavorites);

      if (Shared.UpdateFav) {
        await Shared.UpdateFav(user, updatedFavorites);
      }

      setLastRefreshTime(new Date());
    } catch (err) {
      GetFavPetId();
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    GetFavPetId();
  }, []);

  useEffect(() => {
    if (user && isLoaded) {
      GetFavPetId();
    } else {
      setFavPetList([]);
      setLoading(false);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user, isLoaded]);

  useFocusEffect(
    useCallback(() => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        if (user && isLoaded) {
          GetFavPetId(true);
        }
      }, 500);

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }, [user, isLoaded])
  );

  const renderPetItem = ({ item }) => (
    <View style={styles.petCard}>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => handleRemoveFavorite(item.id, item.savedId)}
      >
        <Ionicons name="heart" size={24} color="#FF6B6B" />
      </TouchableOpacity>

      <Image
        source={{
          uri: item.imageUrl ||
            'https://cdn-icons-png.flaticon.com/512/194/194279.png'
        }}
        style={styles.petImage}
        resizeMode="cover"
      />

      <View style={styles.petInfo}>
        <View style={styles.petHeader}>
          <Text style={styles.petName}>{item.name || 'Unnamed Pet'}</Text>
          {item.age && (
            <View style={styles.petAgeBadge}>
              <Text style={styles.petAgeText}>
                {item.age} {Number(item.age) > 1 ? 'yrs' : 'yr'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.petDetails}>
          {item.breed && (
            <View style={styles.detailRow}>
              <Ionicons name="paw" size={16} color="#FFD700" />
              <Text style={styles.petBreed}>{item.breed}</Text>
            </View>
          )}

          {item.gender && (
            <View style={styles.detailRow}>
              <Ionicons
                name={item.gender.toLowerCase() === 'female' ? 'female' : 'male'}
                size={16}
                color={item.gender.toLowerCase() === 'female' ? '#FF69B4' : '#4169E1'}
              />
              <Text style={styles.petGender}>{item.gender}</Text>
            </View>
          )}

          {item.price && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#4CAF50" />
              <Text style={styles.petPrice}>{item.price}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <View style={styles.authIconContainer}>
            <Ionicons name="heart-outline" size={80} color={Colors.PRIMARY} />
          </View>
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authText}>
            Please sign in to view and manage your favorite pets
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={Colors.PRIMARY} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => GetFavPetId()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Favorites</Text>
          <Text style={styles.subtitle}>
            Pets you've loved ❤️
            {lastRefreshTime && (
              <Text style={styles.refreshTime}>
                {' '}• Updated {Math.floor((new Date() - lastRefreshTime) / 1000)}s ago
              </Text>
            )}
          </Text>
        </View>
        <View style={styles.countContainer}>
          <Text style={styles.countNumber}>{favPetList.length}</Text>
          <Text style={styles.countLabel}>Pets</Text>
        </View>

        <TouchableOpacity
          style={styles.headerRefreshButton}
          onPress={() => GetFavPetId()}
        >
          <Ionicons name="refresh" size={22} color={Colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {favPetList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076506.png' }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any pet to save it here for later!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={() => GetFavPetId()}>
            <Ionicons name="refresh" size={20} color={Colors.WHITE} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {refreshing && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={styles.refreshIndicatorText}>Refreshing...</Text>
            </View>
          )}

          <FlatList
            data={favPetList}
            keyExtractor={(item) => item.id}
            renderItem={renderPetItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.PRIMARY]}
                tintColor={Colors.PRIMARY}
                progressBackgroundColor="#ffffff"
              />
            }
          />
        </>
      )}
    </SafeAreaView>
  )
}

export default Favorite

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 24,
    color: Colors.DARK,
  },
  subtitle: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginTop: 2,
  },
  refreshTime: {
    fontSize: 12,
    color: Colors.GRAY,
    fontStyle: 'italic',
  },
  countContainer: {
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    minWidth: 70,
  },
  countNumber: {
    fontFamily: 'outfit-bold',
    fontSize: 20,
    color: Colors.WHITE,
  },
  countLabel: {
    fontFamily: 'outfit-medium',
    fontSize: 12,
    color: Colors.WHITE,
    opacity: 0.9,
    marginTop: 2,
  },
  headerRefreshButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
    paddingTop: 10,
  },
  petCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: Colors.DARK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: Colors.WHITE,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  petImage: {
    width: '100%',
    height: 180,
  },
  petInfo: {
    padding: 15,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  petName: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: Colors.DARK,
    flex: 1,
  },
  petAgeBadge: {
    backgroundColor: Colors.SECONDARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 10,
  },
  petAgeText: {
    fontFamily: 'outfit-medium',
    fontSize: 12,
    color: Colors.WHITE,
  },
  petDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  petBreed: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.DARK,
    marginLeft: 8,
  },
  petGender: {
    fontFamily: 'outfit-regular',
    fontSize: 13,
    color: Colors.DARK_GRAY,
    marginLeft: 8,
  },
  petPrice: {
    fontFamily: 'outfit-regular',
    fontSize: 13,
    color: Colors.DARK_GRAY,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  loadingText: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.7,
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: Colors.DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.WHITE,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  errorTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: Colors.DARK,
    marginTop: 15,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'outfit-bold',
    fontSize: 14,
    color: Colors.WHITE,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  authIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.LIGHT_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  authTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 20,
    color: Colors.DARK,
    marginBottom: 8,
  },
  authText: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.LIGHT_PRIMARY,
  },
  refreshIndicatorText: {
    fontFamily: 'outfit-medium',
    fontSize: 12,
    color: Colors.PRIMARY,
    marginLeft: 8,
  },
})