import { Image, StyleSheet, Text, View } from 'react-native';
import Colors from '../constants/Colors';
import MarkFav from '../components/MarkFav';

const PetInfo = ({ pet }) => {
  if (!pet) return null;

  return (
    <View style={styles.container}>


      {pet.imageUrl ? (
        <Image
          source={{ uri: pet.imageUrl }}
          style={styles.petImage}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ color: Colors.GRAY }}>No Image Available</Text>
        </View>
      )}

      <View style={styles.headerContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petAddress}>{pet.address}</Text>
        </View>

        <View style={styles.iconContainer}>
          <MarkFav petId={pet.id} />

        </View>
      </View>
    </View>
  );
};

export default PetInfo;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  petImage: {
    width: '100%',
    height: 360,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 360,
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.WHITE,
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  petName: {
    fontFamily: 'outfit-bold',
    fontSize: 28,
    color: Colors.DARK,
    marginBottom: 4,
  },
  petAddress: {
    fontFamily: 'outfit',
    fontSize: 15,
    color: Colors.GRAY,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.LIGHT_GRAY,
  },
});
