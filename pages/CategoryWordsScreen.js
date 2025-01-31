import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, TouchableOpacity } from 'react-native';
import { useLexicon } from '../context/LexiconContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { categoryColors } from '../constants.js';

// Components
import AddWordScreen from './AddWordScreen';

const CategoryWordsScreen = ({ route }) => {
  const { category } = route.params;
  const { lexicon } = useLexicon();
  const [modalVisible, setModalVisible] = useState(false);

  const filteredWords = lexicon.filter(word => word.categories.includes(category));

  const opacityValue = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


// Handlers
const handleClose = () => {
  setModalVisible(false);
};


  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: categoryColors[category] || '#6b4f7d' }]}>
        {category}
      </Text>
      <TouchableOpacity
  style={[
    styles.card,
    styles.actionButton,
    { backgroundColor: categoryColors[category] || '#6b4f7d' }
  ]}
  onPress={() => setModalVisible(true)}
>
  <View style={styles.textContainer}>
    <Ionicons name="add" size={23} color="#E9F1F2" style={styles.icon} />
  </View>
</TouchableOpacity>


      {filteredWords.length > 0 ? (
        <FlatList
          data={filteredWords}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.wordContainer, { borderColor: categoryColors[category] || '#6b4f7d' }]}>
              <Text style={styles.wordText}>{item.original}</Text>
              <Text style={styles.translationText}>{item.translation}</Text>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Animated.View
            style={[styles.iconContainer, { transform: [{ scale: opacityValue }] }]}
          >
            <Ionicons name="sad-outline" size={60} color="#ccc" />
          </Animated.View>
          <Text style={styles.emptyText}>No words to display here.</Text>
        </View>
      )}
          <AddWordScreen isVisible={modalVisible} onClose={handleClose} />

    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 60,
    backgroundColor: '#f4f2ec',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  wordContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  wordText: {
    fontSize: 15, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 4,
  },
  translationText: {
    fontSize: 13, 
    color: '#555',
  },
  emptyContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: '-50%'
  },
  iconContainer: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  card: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 10,
  },
  actionButton: {
    width: 60, 
    height: 60, 
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    borderColor: '#E9F1F2',
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextAction: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryWordsScreen;
