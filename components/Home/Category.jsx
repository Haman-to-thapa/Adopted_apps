import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../config/FirebaseConfig'
import Colors from '../../constants/Colors'

const Category = ({ category }) => {
  const [categoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All')

  const GetCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Category'));
      const categories = [];

      snapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });


      const categoriesWithAll = [
        {
          id: 'all',
          name: 'All',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/2138/2138440.png',
        },
        ...categories,
      ];

      setCategoryList(categoriesWithAll);


      if (category && typeof category === 'function') {
        category('All');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    GetCategories();
  }, []);

  const handleCategoryPress = (categoryName) => {
    setSelectedCategory(categoryName);


    if (category && typeof category === 'function') {
      category(categoryName);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Category
        </Text>
      </View>

      <FlatList
        data={categoryList}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => {
          const isActive = selectedCategory === item.name;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(item.name)}
              style={[
                styles.categoryItem,
                isActive && styles.activeCategoryItem,
                item.name === 'All' && styles.allCategoryItem,
                styles.categoryShadow
              ]}
            >
              <View style={[
                styles.iconContainer,
                isActive && styles.activeIconContainer,
                item.name === 'All' && styles.allIconContainer
              ]}>
                <Image
                  source={{ uri: item?.imageUrl }}
                  style={[
                    styles.categoryIcon,
                    item.name === 'All' && styles.allCategoryIcon
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text style={[
                styles.categoryText,
                isActive && styles.activeCategoryText,
                item.name === 'All' && styles.allCategoryText
              ]}>
                {item.name}
              </Text>

              {isActive && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default Category;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mainContainer: {
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  headerText: {
    fontFamily: 'outfit-medium',
    fontSize: 22,
    color: Colors.DARK,
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontFamily: 'outfit-regular',
    fontSize: 14,
    color: Colors.PRIMARY,
  },
  flatListContent: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.WHITE,
    borderWidth: 1.5,
    borderColor: Colors.LIGHT_GRAY,
    minWidth: 90,
    shadowColor: Colors.DARK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  allCategoryItem: {
    borderColor: Colors.SECONDARY,
  },
  activeCategoryItem: {
    backgroundColor: Colors.LIGHT_PRIMARY,
    borderColor: Colors.PRIMARY,
    transform: [{ scale: 1.05 }],
  },
  categoryShadow: {
    shadowColor: Colors.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  allIconContainer: {
    backgroundColor: Colors.LIGHT_SECONDARY,
  },
  activeIconContainer: {
    backgroundColor: Colors.WHITE,
    transform: [{ scale: 1.1 }],
  },
  categoryIcon: {
    width: 80,
    height: 30,
    borderRadius: 15,
  },
  allCategoryIcon: {
    width: 30,
    height: 30,
  },
  categoryText: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginTop: 4,
  },
  allCategoryText: {
    color: Colors.SECONDARY,
  },
  activeCategoryText: {
    color: Colors.PRIMARY,
    fontFamily: 'outfit-semibold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.PRIMARY,
  },
});