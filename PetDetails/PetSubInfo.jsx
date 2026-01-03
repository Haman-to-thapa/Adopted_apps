import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Colors from '../constants/Colors'
import Feather from '@expo/vector-icons/Feather';

const PetSubInfo = ({ pet }) => {
  const infoItems = [
    {
      id: 1,
      icon: 'calendar',
      label: 'Age',
      value: pet?.age || '--',
      unit: 'years',
      color: Colors.PRIMARY,
    },
    {
      id: 2,
      icon: 'activity',
      label: 'Price',
      value: pet?.price || '--',
      unit: '₹',
      color: Colors.SUCCESS,
    },
    {
      id: 3,
      icon: 'git-branch',
      label: 'Breed',
      value: pet?.breed || '--',
      color: Colors.WARNING,
    },
    {
      id: 4,
      icon: 'user',
      label: 'Sex',
      value: pet?.sex || '--',
      color: pet?.sex === 'male' ? Colors.INFO : Colors.ACCENT,
    },
  ];


  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <View style={styles.row}>
          {infoItems.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.infoBox}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Feather name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{item.value}</Text>
                  {item.unit && (
                    <Text style={styles.unit}> {item.unit}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          {infoItems.slice(2, 4).map((item) => (
            <View key={item.id} style={styles.infoBox}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Feather name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>{item.label}</Text>
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{item.value}</Text>
                  {item.unit && (
                    <Text style={styles.unit}> {item.unit}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default PetSubInfo

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  gridContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  label: {
    fontFamily: 'outfit',
    fontSize: 12,
    color: Colors.GRAY,
    marginBottom: 4,
  },
  value: {
    fontFamily: 'outfit-medium',
    fontSize: 20,
    color: Colors.DARK,
    lineHeight: 24,
  },
  unit: {
    fontFamily: 'outfit',
    fontSize: 14,
    color: Colors.GRAY,
    marginLeft: 2,
  },
})