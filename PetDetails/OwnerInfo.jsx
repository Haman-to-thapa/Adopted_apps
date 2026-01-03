import { View, Text, Image, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import Colors from '../constants/Colors'
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';

const OwnerInfo = ({ pet }) => {
  const handleCallOwner = () => {
    if (pet?.ownerContact) {
      const phoneNumber = pet.ownerContact.replace(/\D/g, '');
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleMessageOwner = () => {
    if (pet?.ownerContact) {
      Linking.openURL(`sms:${pet.ownerContact}`);
    }
  };

  return (
    <View style={{
      borderWidth: 1,
      borderRadius: 15,
      padding: 20,
      marginHorizontal: 20,
      backgroundColor: Colors.WHITE,
      gap: 15
    }}>
      {/* Header with Owner Info */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, flex: 1 }}>
          <Image
            source={{ uri: pet?.userImage }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 99
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'outfit-medium',
              fontSize: 18,
              marginBottom: 2
            }}>{pet?.ownerName || pet?.username}</Text>
            <Text style={{
              fontFamily: 'outfit',
              color: Colors.GRAY,
              fontSize: 14
            }}>Pet Owner</Text>
          </View>
        </View>

        <Text style={{
          fontFamily: 'outfit',
          color: Colors.GRAY,
          fontSize: 12
        }}>
          Posted {pet?.postedDate}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: Colors.LIGHT_GRAY }} />

      {/* Contact Information */}
      <View style={{ gap: 12 }}>
        {/* Phone Number */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            backgroundColor: Colors.LIGHT_GRAY,
            padding: 8,
            borderRadius: 10
          }}>
            <Feather name="phone" size={18} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'outfit-medium',
              fontSize: 15
            }}>Contact Number</Text>
            <Text style={{
              fontFamily: 'outfit',
              color: Colors.GRAY,
              fontSize: 14
            }}>{pet?.ownerContact}</Text>
          </View>
        </View>

        {/* Address */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{
            backgroundColor: Colors.LIGHT_GRAY,
            padding: 8,
            borderRadius: 10
          }}>
            <FontAwesome name="map-marker" size={18} color={Colors.PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'outfit-medium',
              fontSize: 15,
              marginBottom: 2
            }}>Address</Text>
            <Text style={{
              fontFamily: 'outfit',
              color: Colors.GRAY,
              fontSize: 14,
              lineHeight: 20
            }}>{pet?.ownerAddress}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        gap: 10,
        marginTop: 10
      }}>
        <TouchableOpacity
          onPress={handleCallOwner}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: Colors.PRIMARY,
            paddingVertical: 12,
            borderRadius: 10
          }}
        >
          <Feather name="phone" size={18} color={Colors.WHITE} />
          <Text style={{
            fontFamily: 'outfit-medium',
            color: Colors.WHITE,
            fontSize: 15
          }}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMessageOwner}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: Colors.WHITE,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Colors.PRIMARY
          }}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.PRIMARY} />
          <Text style={{
            fontFamily: 'outfit-medium',
            color: Colors.PRIMARY,
            fontSize: 15
          }}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default OwnerInfo