// OwnerInfo.js component file
import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

const OwnerInfo = ({ pet }) => {
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
                {pet.ownerName?.charAt(0) || 'O'}
              </Text>
            </View>
          )}

          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>
              {pet.ownerName || 'Unknown Owner'}
            </Text>
            <Text style={styles.ownerUsername}>
              @{pet.username || 'owner'}
            </Text>
          </View>
        </View>

        <View style={styles.ownerDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={20} color="#4A6FFF" />
            <Text style={styles.detailText}>{pet.ownerContact}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color="#4A6FFF" />
            <Text style={styles.detailText}>{pet.ownerAddress}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#4A6FFF" />
            <Text style={styles.detailText}>Posted: {pet.postedDate}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default OwnerInfo

const styles = StyleSheet.create({
  ownerContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
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