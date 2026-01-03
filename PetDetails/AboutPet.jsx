import { View, Text, Pressable } from 'react-native'
import React, { useState } from 'react'
import Colors from '../constants/Colors'

const AboutPet = ({ pet }) => {
  const [readMore, setReadMore] = useState(true)
  const petName = pet?.name || 'Pet';
  const aboutText = pet?.about || 'No description available.';
  const showReadMore = aboutText.length > 100 && readMore;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{
        fontFamily: "outfit-medium",
        fontSize: 20
      }}>
        About {petName}
      </Text>

      <Text
        numberOfLines={readMore ? 3 : undefined}
        style={{
          fontFamily: 'outfit',
          fontSize: 14,
          color: Colors.GRAY,
          lineHeight: 20,
          marginTop: 8
        }}
      >
        {aboutText}
      </Text>

      {showReadMore && (
        <Pressable
          onPress={() => setReadMore(false)}
          style={{ marginTop: 8 }}
        >
          <Text style={{
            fontFamily: 'outfit-medium',
            fontSize: 14,
            color: Colors.SECONDARY
          }}>
            Read More
          </Text>
        </Pressable>
      )}

      {!readMore && aboutText.length > 100 && (
        <Pressable
          onPress={() => setReadMore(true)}
          style={{ marginTop: 8 }}
        >
          <Text style={{
            fontFamily: 'outfit-medium',
            fontSize: 14,
            color: Colors.SECONDARY
          }}>
            Read Less
          </Text>
        </Pressable>
      )}
    </View>
  )
}

export default AboutPet