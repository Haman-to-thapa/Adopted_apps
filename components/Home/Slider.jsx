import { View, FlatList, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';

const Slider = () => {
  const [sliderList, setSliderList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const GetSliders = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(db, 'Sliders'));
        const sliders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSliderList(sliders);
      } catch (error) {
        console.error("Error fetching sliders: ", error);
      } finally {
        setLoading(false);
      }
    };

    GetSliders();
  }, []);

  const screenWidth = Dimensions.get('screen').width;
  const sliderWidth = screenWidth * 0.9;
  const sliderHeight = 160;

  if (loading) {
    return (
      <View style={[styles.container, { width: sliderWidth }]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (sliderList.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer, { width: sliderWidth }]}>
        <Text style={styles.emptyText}>No sliders available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: sliderWidth }]}>
      <FlatList
        data={sliderList}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true}
        snapToInterval={sliderWidth + 10}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, {
            width: sliderWidth,
            height: sliderHeight
          }]}>
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="contain"
              onError={() => console.log(`Failed to load image: ${item.image}`)}
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default Slider;

const styles = StyleSheet.create({
  container: {
    height: 180,
    alignSelf: 'center',
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  slideContainer: {
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,

  },
});