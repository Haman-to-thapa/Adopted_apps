import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import Colors from '../../constants/Colors';
import { useUser } from '@clerk/clerk-expo'; // IMPORTANT: Added this import

const Index = () => {
  const router = useRouter();
  const { user } = useUser(); // IMPORTANT: Get the logged-in user

  const [image, setImage] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    username: '',
    breed: '',
    age: '',
    weight: '',
    sex: '',
    category: 'None', // Default to 'None'
    price: '',
    address: '',
    about: '',
    ownerName: '',
    ownerContact: '',
    ownerAddress: '',
  });

  // Pre-fill user data when component loads
  useEffect(() => {
    getCategories();

    // Pre-fill form with user data if available
    if (user) {
      const userName = user.username || user.fullName || user.firstName || '';
      const userEmail = user.primaryEmailAddress?.emailAddress || '';

      setForm(prev => ({
        ...prev,
        username: prev.username || userName || '',
        ownerName: prev.ownerName || userName || '',
        // You can pre-fill other fields if needed
      }));

      console.log('User logged in:', { userName, userEmail });
    }
  }, [user]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload pet images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  /* ---------------- FETCH CATEGORIES ---------------- */
  const getCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'Category'));
      const categories = [];

      snapshot.forEach(doc => {
        categories.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Add "None" option at the beginning
      const categoriesWithNone = [
        {
          id: 'none',
          name: 'None',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png',
        },
        ...categories,
      ];

      setCategoryList(categoriesWithNone);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    }
  };

  /* ---------------- SUBMIT TO FIREBASE ---------------- */
  const handleSubmit = async () => {
    // Validation
    if (!form.name.trim()) {
      Alert.alert('Required Field', 'Please enter pet name');
      return;
    }

    if (!image) {
      Alert.alert('Required Field', 'Please upload a pet image');
      return;
    }

    if (!form.sex) {
      Alert.alert('Required Field', 'Please select pet sex');
      return;
    }

    if (!form.category) {
      Alert.alert('Required Field', 'Please select a category');
      return;
    }

    // Check if user is logged in
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to add a pet');
      return;
    }

    // Get user information
    const userEmail = user.primaryEmailAddress?.emailAddress;
    const userName = user.username || user.fullName || user.firstName || 'User';
    const userId = user.id;

    if (!userEmail) {
      Alert.alert('Error', 'User email not found. Please update your profile.');
      return;
    }

    setIsSubmitting(true);

    try {
      const petData = {
        // Basic pet information
        name: form.name.trim(),
        breed: form.breed.trim(),
        age: form.age.trim(),
        weight: form.weight.trim(),
        sex: form.sex,
        category: form.category === 'None' ? '' : form.category,
        price: form.price.trim(),
        address: form.address.trim(),
        about: form.about.trim(),
        imageUrl: image,
        postedDate: new Date().toISOString(),
        status: 'available',

        // USER IDENTIFICATION FIELDS (CRITICAL FOR LINKING PETS TO USERS)
        userId: userId, // Clerk user ID
        userEmail: userEmail, // User's email
        username: form.username.trim() || userName, // Use form username or Clerk username

        // Owner information
        ownerName: form.ownerName.trim() || userName,
        ownerContact: form.ownerContact.trim(),
        ownerAddress: form.ownerAddress.trim(),
      };

      console.log('Submitting pet data with user info:', {
        userId: petData.userId,
        userEmail: petData.userEmail,
        username: petData.username
      });

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'Pets'), petData);
      console.log('Pet added with ID:', docRef.id, 'for user:', userEmail);

      // Success alert with options
      Alert.alert(
        'Success! 🎉',
        'Pet has been added successfully to your account.',
        [
          {
            text: 'View My Pets',
            onPress: () => {
              // Navigate to user posts page
              router.push('/user-posts');
            }
          },
          {
            text: 'Add Another Pet',
            onPress: () => {
              // Reset form for another pet
              setForm({
                name: '',
                username: form.username || userName, // Keep username
                breed: '',
                age: '',
                weight: '',
                sex: '',
                category: 'None',
                price: '',
                address: '',
                about: '',
                ownerName: form.ownerName || userName, // Keep owner name
                ownerContact: '',
                ownerAddress: '',
              });
              setImage(null);
              setIsSubmitting(false);
            }
          },
          {
            text: 'Done',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error adding pet:', error);
      Alert.alert('Error', 'Failed to add pet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- RENDER CATEGORY ITEM ---------------- */
  const renderCategoryItem = ({ item }) => {
    const active = form.category === item.name;
    return (
      <TouchableOpacity
        onPress={() => handleChange('category', item.name)}
        style={[
          styles.categoryItem,
          active && styles.activeCategory,
          item.name === 'None' && styles.noneCategoryItem,
        ]}
      >
        <View style={styles.categoryIconContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={[
              styles.categoryIcon,
              item.name === 'None' && styles.noneCategoryIcon,
            ]}
            resizeMode="contain"
          />
        </View>
        <Text style={[
          styles.categoryText,
          active && styles.activeCategoryText,
          item.name === 'None' && styles.noneCategoryText,
        ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* USER INFO DISPLAY (Optional - shows who's uploading) */}
        {user && (
          <View style={styles.userInfoSection}>
            <Text style={styles.userInfoText}>
              Uploading as: <Text style={styles.userInfoHighlight}>
                {user.username || user.fullName || user.firstName}
              </Text>
            </Text>
            <Text style={styles.userInfoEmail}>
              {user.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
        )}

        {/* IMAGE UPLOAD */}
        <View style={styles.imageSection}>
          <Text style={styles.sectionLabel}>Pet Image *</Text>
          <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.image} />
                <View style={styles.imageOverlay}>
                  <MaterialIcons name="edit" size={24} color={Colors.WHITE} />
                  <Text style={styles.editText}>Change Image</Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <MaterialIcons name="add-a-photo" size={40} color={Colors.PRIMARY} />
                <Text style={styles.placeholderText}>Tap to upload pet image</Text>
                <Text style={styles.placeholderSubtext}>Required</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BASIC INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Basic Information</Text>
          <Input
            label="Pet Name *"
            placeholder="Enter pet name"
            value={form.name}
            onChangeText={v => handleChange('name', v)}
          />
          <Input
            label="Username"
            placeholder="Enter username"
            value={form.username}
            onChangeText={v => handleChange('username', v)}
            helperText="This will be displayed as the pet owner's name"
          />
          <Input
            label="Breed"
            placeholder="Enter breed"
            value={form.breed}
            onChangeText={v => handleChange('breed', v)}
          />
          <Input
            label="Age"
            placeholder="Enter age"
            value={form.age}
            keyboardType="numeric"
            onChangeText={v => handleChange('age', v)}
          />
        </View>

        {/* SEX */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sex *</Text>
          <View style={styles.sexRow}>
            {['male', 'female'].map(item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.sexBtn,
                  form.sex === item && styles.sexActive,
                ]}
                onPress={() => handleChange('sex', item)}
              >
                <Text style={[
                  styles.sexText,
                  form.sex === item && styles.sexActiveText,
                ]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CATEGORY */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category *</Text>
          <Text style={styles.sectionSubtext}>Select "None" if pet doesn't fit any category</Text>

          <FlatList
            data={categoryList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={renderCategoryItem}
          />
        </View>

        {/* ADDITIONAL INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Additional Information</Text>
          <Input
            label="Price ($)"
            placeholder="Enter price"
            value={form.price}
            keyboardType="numeric"
            onChangeText={v => handleChange('price', v)}
            helperText="Enter 0 or leave empty for free adoption"
          />
          <Input
            label="Address"
            placeholder="Enter address"
            value={form.address}
            onChangeText={v => handleChange('address', v)}
          />
          <Input
            label="About Pet"
            placeholder="Tell us about your pet..."
            value={form.about}
            multiline
            numberOfLines={4}
            onChangeText={v => handleChange('about', v)}
          />
        </View>

        {/* OWNER INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Owner Information</Text>
          <Input
            label="Owner Name"
            placeholder="Enter owner name"
            value={form.ownerName}
            onChangeText={v => handleChange('ownerName', v)}
          />
          <Input
            label="Contact Number"
            placeholder="Enter contact number"
            value={form.ownerContact}
            keyboardType="phone-pad"
            onChangeText={v => handleChange('ownerContact', v)}
          />
          <Input
            label="Owner Address"
            placeholder="Enter owner address"
            value={form.ownerAddress}
            onChangeText={v => handleChange('ownerAddress', v)}
          />
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !user} // Disable if not logged in
        >
          <Text style={styles.submitBtnText}>
            {!user ? 'Please Sign In' : isSubmitting ? 'Adding Pet...' : 'Submit Pet'}
          </Text>
        </TouchableOpacity>

        {!user && (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.signInBtnText}>Sign In to Add Pets</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

/* ---------------- INPUT COMPONENT ---------------- */
const Input = ({ label, placeholder, value, onChangeText, multiline, numberOfLines, keyboardType, helperText }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      numberOfLines={numberOfLines}
      placeholder={placeholder}
      style={[styles.input, multiline && styles.multilineInput]}
      keyboardType={keyboardType}
      placeholderTextColor={Colors.GRAY}
    />
    {helperText && <Text style={styles.helperText}>{helperText}</Text>}
  </View>
);

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'outfit-semibold',
    color: Colors.DARK,
  },
  userInfoSection: {
    backgroundColor: Colors.LIGHT_PRIMARY,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.PRIMARY,
  },
  userInfoText: {
    fontSize: 14,
    fontFamily: 'outfit-medium',
    color: Colors.DARK_GRAY,
  },
  userInfoHighlight: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  userInfoEmail: {
    fontSize: 12,
    fontFamily: 'outfit-regular',
    color: Colors.GRAY,
    marginTop: 3,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'outfit-medium',
    color: Colors.DARK,
    marginBottom: 10,
  },
  sectionSubtext: {
    fontSize: 12,
    fontFamily: 'outfit-regular',
    color: Colors.GRAY,
    marginBottom: 15,
  },
  imageSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  imageBox: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: Colors.LIGHT_BACKGROUND,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editText: {
    color: Colors.WHITE,
    fontFamily: 'outfit-medium',
    fontSize: 14,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderText: {
    fontFamily: 'outfit-medium',
    color: Colors.DARK_GRAY,
    marginTop: 10,
    fontSize: 14,
  },
  placeholderSubtext: {
    fontFamily: 'outfit-regular',
    color: Colors.PRIMARY,
    fontSize: 12,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.DARK_GRAY,
    marginBottom: 5,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'outfit-regular',
    color: Colors.GRAY,
    marginTop: 4,
    marginLeft: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.WHITE,
    fontSize: 14,
    fontFamily: 'outfit-regular',
    color: Colors.DARK,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  sexRow: {
    flexDirection: 'row',
    gap: 15,
  },
  sexBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
  },
  sexActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  sexText: {
    fontFamily: 'outfit-medium',
    fontSize: 14,
    color: Colors.DARK_GRAY,
  },
  sexActiveText: {
    color: Colors.WHITE,
  },
  categoryList: {
    paddingVertical: 5,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 15,
    marginRight: 12,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
    minWidth: 100,
  },
  noneCategoryItem: {
    borderColor: Colors.GRAY,
  },
  activeCategory: {
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.LIGHT_PRIMARY,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.LIGHT_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 30,
    height: 30,
  },
  noneCategoryIcon: {
    tintColor: Colors.GRAY,
  },
  categoryText: {
    fontFamily: 'outfit-medium',
    fontSize: 13,
    color: Colors.DARK_GRAY,
    textAlign: 'center',
  },
  noneCategoryText: {
    color: Colors.GRAY,
  },
  activeCategoryText: {
    color: Colors.PRIMARY,
    fontFamily: 'outfit-semibold',
  },
  submitBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.GRAY,
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.WHITE,
    fontFamily: 'outfit-semibold',
    fontSize: 16,
  },
  signInBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    backgroundColor: Colors.SECONDARY,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInBtnText: {
    color: Colors.WHITE,
    fontFamily: 'outfit-semibold',
    fontSize: 16,
  },
  footerSpace: {
    height: 40,
  },
});