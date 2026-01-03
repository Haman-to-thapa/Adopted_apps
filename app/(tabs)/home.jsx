import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
import Header from "../../components/Home/Header";
import Slider from "../../components/Home/Slider";
import PetListByCategory from "../../components/Home/PetListByCategory";

const Home = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          padding: 5
        }}
        showsVerticalScrollIndicator={false}
      >

        <Header />


        <Slider />


        <PetListByCategory />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;