import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import PetInfo from '../../PetDetails/PetInfo'
import { SafeAreaView } from 'react-native-safe-area-context'
import PetSubInfo from '../../PetDetails/PetSubInfo'
import AboutPet from '../../PetDetails/AboutPet'
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '@clerk/clerk-expo'
import { collection, getDocs, query, setDoc, where, doc, getDoc } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'

const PetDetails = () => {
  const params = useLocalSearchParams()
  const navigation = useNavigation()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    })
  }, [])

  const pet = {
    id: params.id || '',
    name: params.name || 'Unknown Pet',
    username: params.username || 'Unknown Owner',
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
    // Try to get userEmail from params or use a default
    userEmail: params.userEmail || 'unknown@example.com',
  }

  const InitiateChat = async () => {
    try {
      console.log('Initiating chat for pet:', pet.name)

      if (!user) {
        Alert.alert('Sign In Required', 'Please sign in to start a chat.')
        return
      }

      const currentUserEmail = user?.primaryEmailAddress?.emailAddress
      const currentUserName = user?.fullName || user?.username || user?.firstName || 'User'

      if (!currentUserEmail) {
        Alert.alert('Error', 'Please update your email address in your profile.')
        return
      }

      // IMPORTANT: Get the PET OWNER'S email
      // First try to get it from the pet's userEmail field
      let petOwnerEmail = pet.userEmail

      // If not available in pet data, try to fetch it from Firestore
      if (!petOwnerEmail || petOwnerEmail === 'unknown@example.com') {
        console.log('Pet owner email not in params, fetching from Firestore...')
        try {
          const petDocRef = doc(db, 'Pets', pet.id)
          const petDocSnap = await getDoc(petDocRef)

          if (petDocSnap.exists()) {
            const petData = petDocSnap.data()
            petOwnerEmail = petData.userEmail || petData.email
            console.log('Found pet owner email in Firestore:', petOwnerEmail)
          }
        } catch (fetchError) {
          console.error('Error fetching pet owner email:', fetchError)
        }
      }

      // If still no email, try to get from username/owner info
      if (!petOwnerEmail) {
        // Try to find pets by this owner to get their email
        try {
          const petsRef = collection(db, 'Pets')
          const ownerQuery = query(
            petsRef,
            where('username', '==', pet.username)
          )
          const querySnapshot = await getDocs(ownerQuery)

          if (!querySnapshot.empty) {
            const firstPet = querySnapshot.docs[0].data()
            petOwnerEmail = firstPet.userEmail || firstPet.email
            console.log('Found pet owner email from other pets:', petOwnerEmail)
          }
        } catch (error) {
          console.error('Error finding pet owner:', error)
        }
      }

      if (!petOwnerEmail) {
        Alert.alert('Error', 'Cannot find pet owner information. Please try again later.')
        return
      }

      console.log('Current user email:', currentUserEmail)
      console.log('Pet owner email:', petOwnerEmail)

      if (currentUserEmail.toLowerCase() === petOwnerEmail.toLowerCase()) {
        Alert.alert('Cannot Chat', 'You cannot start a chat with yourself.')
        return
      }

      // Create consistent chat ID using BOTH emails
      const emails = [
        currentUserEmail.toLowerCase(),
        petOwnerEmail.toLowerCase()
      ].sort() // Sort alphabetically for consistency

      const chatId = emails.join('_')
      console.log('Generated chat ID:', chatId)

      // Check if chat already exists
      const chatRef = doc(db, 'Chat', chatId)
      const chatSnap = await getDoc(chatRef)

      if (!chatSnap.exists()) {
        console.log('Creating new chat...')

        // Try to get pet owner's details from their pets
        let petOwnerData = {
          id: `pet_owner_${pet.id}`,
          email: petOwnerEmail,
          name: pet.ownerName || pet.username || 'Pet Owner',
          username: pet.username || 'Pet Owner',
          imageUrl: pet.userImage || null
        }

        // Try to find more details about the pet owner
        try {
          const ownerPetsQuery = query(
            collection(db, 'Pets'),
            where('userEmail', '==', petOwnerEmail)
          )
          const ownerPetsSnapshot = await getDocs(ownerPetsQuery)

          if (!ownerPetsSnapshot.empty) {
            const ownerPet = ownerPetsSnapshot.docs[0].data()
            petOwnerData = {
              ...petOwnerData,
              name: ownerPet.ownerName || ownerPet.username || petOwnerData.name,
              username: ownerPet.username || petOwnerData.username,
              imageUrl: ownerPet.userImage || petOwnerData.imageUrl
            }
          }
        } catch (error) {
          console.log('Could not fetch additional owner details:', error)
        }

        // Create the chat with BOTH users
        await setDoc(chatRef, {
          id: chatId,
          users: [
            // Current user (message sender)
            {
              id: user.id,
              email: currentUserEmail,
              name: currentUserName,
              imageUrl: user?.imageUrl,
              username: user?.username,
              clerkId: user.id
            },
            // Pet owner (you - the receiver)
            {
              ...petOwnerData,
              clerkId: petOwnerData.id
            }
          ],
          participants: [currentUserEmail, petOwnerEmail], // CRITICAL: Both emails here
          petId: pet.id,
          petName: pet.name,
          petImage: pet.imageUrl,
          petOwnerEmail: petOwnerEmail,
          messageSenderEmail: currentUserEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessage: null,
          lastMessageTime: null,
          lastMessageSender: null,
          unreadCount: {
            [currentUserEmail]: 0,
            [petOwnerEmail]: 0
          }
        })

        console.log('Chat created successfully with participants:', [currentUserEmail, petOwnerEmail])
      } else {
        console.log('Chat already exists')
      }

      // Navigate to chat
      router.push({
        pathname: '/chat',
        params: {
          id: chatId,
          chatName: pet.ownerName || pet.username || 'Pet Owner',
          petName: pet.name,
          petImage: pet.imageUrl,
        }
      })

    } catch (error) {
      console.error('Error initiating chat:', error)
      Alert.alert('Error', error.message || 'Failed to start chat. Please try again.')
    }
  }

  // Custom OwnerInfo Component
  const CustomOwnerInfo = ({ pet }) => {
    return (
      <View style={styles.ownerContainer}>
        <Text style={styles.sectionTitle}>Pet Owner</Text>

        <View style={styles.ownerCard}>
          <View style={styles.ownerHeader}>
            {pet.userImage ? (
              <Image
                source={{ uri: pet.userImage }}
                style={styles.ownerImage}
              />
            ) : (
              <View style={styles.ownerImagePlaceholder}>
                <Text style={styles.ownerInitial}>
                  {pet.ownerName?.charAt(0) || pet.username?.charAt(0) || 'O'}
                </Text>
              </View>
            )}

            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>
                {pet.ownerName || pet.username || 'Unknown Owner'}
              </Text>
              {pet.username && (
                <Text style={styles.ownerUsername}>
                  @{pet.username}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.ownerDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color="#4A6FFF" />
              <Text style={styles.detailText}>
                {pet.ownerContact || 'Contact not provided'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#4A6FFF" />
              <Text style={styles.detailText}>
                {pet.ownerAddress || 'Address not provided'}
              </Text>
            </View>

            {pet.postedDate && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#4A6FFF" />
                <Text style={styles.detailText}>
                  Posted: {new Date(pet.postedDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
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

        {/* Use the custom OwnerInfo component */}
        <CustomOwnerInfo pet={pet} />

        <View style={styles.spacer} />
      </ScrollView>

      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={InitiateChat}
      >
        <View style={styles.adoptButton}>
          <Text style={styles.adoptButtonText}>
            {user ? 'Message Owner' : 'Sign In to Chat'}
          </Text>
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
    paddingHorizontal: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  adoptButton: {
    backgroundColor: '#4A6FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A6FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
  // Custom OwnerInfo Styles
  ownerContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 20,
    color: '#333',
    marginBottom: 16,
  },
  ownerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ownerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#e9ecef',
  },
  ownerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A6FFF',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitial: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'outfit-bold',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontFamily: 'outfit-bold',
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  ownerUsername: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: '#666',
  },
  ownerDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontFamily: 'outfit-regular',
    fontSize: 15,
    color: '#444',
    flex: 1,
    flexWrap: 'wrap',
  },
})