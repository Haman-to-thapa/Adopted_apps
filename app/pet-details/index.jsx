import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import PetInfo from '../../PetDetails/PetInfo';
import { SafeAreaView } from 'react-native-safe-area-context';
import PetSubInfo from '../../PetDetails/PetSubInfo';
import AboutPet from '../../PetDetails/AboutPet';
import OwnerInfo from '../../PetDetails/OwnerInfo';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { collection, getDocs, query, setDoc, where, doc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';

const PetDetails = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const router = useRouter()

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [])

  const pet = {
    id: params.id || '',
    name: params.name || 'Unknown Pet',
    username: params.username || "Unknown Owner",
    about: params.about || 'No description available.',
    breed: params.breed || 'Unknown Breed',
    age: params.age || 'Unknown',
    sex: params.sex || 'Unknown',
    price: params.price || 'N/A',
    category: params.category || 'Pet',
    address: params.address || 'Unknown Location',
    postedDate: params.postedDate || 'Recently',
    imageUrl: params.imageUrl || null,
    userImage: params.userImage || null,
    ownerName: params.ownerName || 'John Doe',
    ownerContact: params.ownerContact || '+1 234 567 8900',
    ownerAddress: params.ownerAddress || '123 Pet Street, City',
  };

  const InitiateChat = async () => {
    try {

      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to start a chat.')
        return
      }


      const currentUsername = user?.username || user?.fullName || 'User'
      const petOwnerUsername = pet.username || 'Pet Owner'

      if (currentUsername.toLowerCase() === petOwnerUsername.toLowerCase()) {
        Alert.alert('Cannot Chat', 'You cannot start a chat with yourself.')
        return
      }


      const userEmail = user?.primaryEmailAddress?.emailAddress
      if (!userEmail) {
        Alert.alert('Error', 'Please update your email address in your profile.')
        return
      }


      const docId1 = currentUsername + '_' + petOwnerUsername
      const docId2 = petOwnerUsername + '_' + currentUsername

      console.log('Searching for chat with IDs:', [docId1, docId2])

      // Check if chat already exists
      const q = query(collection(db, 'Chat'), where('id', 'in', [docId1, docId2]))
      const querySnapShot = await getDocs(q)

      if (!querySnapShot.empty) {

        querySnapShot.forEach((chatDoc) => {
          console.log('Existing chat found:', chatDoc.data())
          router.push({
            pathname: '/chat',
            params: {
              id: chatDoc.id,
              chatName: petOwnerUsername,
              petName: pet.name
            }
          })
        })
      } else {



        await setDoc(doc(db, 'Chat', docId1), {
          id: docId1,
          users: [
            {
              id: user.id,
              email: userEmail,
              imageUrl: user?.imageUrl || null,
              name: user?.fullName || 'User',
              username: currentUsername
            },
            {
              id: 'pet_owner_' + pet.id,
              name: petOwnerUsername,
              imageUrl: pet.userImage || null,
              username: petOwnerUsername
            },
          ],
          petId: pet.id,
          petName: pet.name,
          petImage: pet.imageUrl,
          createdAt: new Date().toISOString(),
          lastMessage: null,
          lastMessageTime: null,
          lastMessageSender: null,
          unreadCount: 0
        })

        console.log('Chat created successfully')

        router.push({
          pathname: '/chat',
          params: {
            id: docId1,
            chatName: petOwnerUsername,
            petName: pet.name,
            petImage: pet.imageUrl,
            isNewChat: true
          }
        })
      }
    } catch (error) {
      console.error('Error initiating chat:', error)
      Alert.alert('Error', error.message || 'Failed to start chat. Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <PetInfo pet={pet} />
        <PetSubInfo pet={pet} />
        <AboutPet pet={pet} />
        <OwnerInfo pet={pet} />
        <View style={styles.spacer} />
      </ScrollView>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={InitiateChat}
      >
        <View style={styles.adoptButton}>
          <Text style={styles.adoptButtonText}>Adopt Me</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

export default PetDetails

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  spacer: {
    height: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  adoptButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adoptButtonText: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
})