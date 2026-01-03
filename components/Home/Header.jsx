import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { useUser } from '@clerk/clerk-expo'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router';

const Header = () => {
  const { user } = useUser()

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.topSection}>
        <View style={styles.greetingRow}>
          <Ionicons name="sunny" size={20} color="#FFF" />
          <Text style={styles.greeting}>Welcome</Text>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.imageUrl || 'https://via.placeholder.com/55' }}
              style={styles.avatar}
            />
            <View style={styles.badge}>
              <Ionicons name="notifications" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.nameSection}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.fullName || 'Welcome Back!'}
          </Text>
          <Text style={styles.subtitle}>Have a great day ahead</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-new-pet')}
        >
          <MaterialIcons name="pets" size={20} color="#764ba2" />
          <Text style={styles.addButtonText}>Add New Pet</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'outfit',
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    marginLeft: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  nameSection: {
    flex: 1,
    marginRight: 15,
  },
  userName: {
    fontFamily: 'outfit-bold',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: 'outfit',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 110,
  },
  addButtonText: {
    fontFamily: 'outfit-semibold',
    fontSize: 15,
    color: '#764ba2',
    letterSpacing: 0.3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: '#FFF',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f56565',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#764ba2',
  },
})

export default Header