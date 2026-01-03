import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import Shared from '../Shared/Shared';

const MarkFav = ({ petId }) => {
  const { user } = useUser();
  const [favorites, setFavorites] = useState([]);
  const hasFetched = useRef(false);


  useEffect(() => {
    if (!user || hasFetched.current) return;

    hasFetched.current = true;

    (async () => {
      try {
        const res = await Shared.GetFavList(user);
        setFavorites(res?.favorites ?? []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setFavorites([]);
      }
    })();
  }, [user?.id]);

  if (!user || !petId) return null;

  const isFav = favorites.includes(petId);

  const toggleFav = async () => {
    const updated = isFav
      ? favorites.filter(id => id !== petId)
      : [...favorites, petId];

    setFavorites(updated);

    try {
      await Shared.UpdateFav(user, updated);
    } catch (error) {
      console.error("Error updating favorites:", error);

      setFavorites(favorites);
    }
  };

  return (
    <View>
      <Pressable onPress={toggleFav}>
        <Ionicons
          name={isFav ? "heart" : "heart-outline"}
          size={28}
          color={isFav ? Colors.PRIMARY : Colors.GRAY}
        />
      </Pressable>
    </View>
  );
};

export default MarkFav;