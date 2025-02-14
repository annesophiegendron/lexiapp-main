import React, {useContext, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {useLexicon} from '../context/LexiconContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {categoryColors, categorySubtitles} from '../constants.js';
import {useTheme} from '../context/ThemeContext';

import AddWordScreen from './AddWordScreen';
import EditWordScreen from './EditWordScreen';
import DeleteConfirmationModal from './ui/DeleteConfirmationModal';

const CategoryWordsScreen = ({route, navigation}) => {
  const {category} = route.params;
  const {lexicon, removeWord, updateWord} = useLexicon();
  const [isModalVisible, setModalVisible] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const {isDarkMode} = useTheme();
  const toggleModal = () => setModalVisible(!isModalVisible);
  const toggleEditModal = () => setEditModalVisible(!isEditModalVisible);
  const handleDelete = word => {
    setWordToDelete(word);
    setShowDeleteModal(true);
  };
  const confirmDelete = () => {
    removeWord(lexicon.findIndex(w => w === wordToDelete));
    setShowDeleteModal(false);
  };

  const filteredWords = lexicon.filter(word =>
    word.categories.includes(category),
  );

  const opacityValue = new Animated.Value(1);

  const hexToRgba = (hex, alpha = 0.2) => {
    // Remove '#' if it's there
    let cleanedHex = hex.replace('#', '');

    // Extract RGB components
    let r = parseInt(cleanedHex.substring(0, 2), 16);
    let g = parseInt(cleanedHex.substring(2, 4), 16);
    let b = parseInt(cleanedHex.substring(4, 6), 16);

    // Return the RGBA color string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleEdit = word => {
    setCurrentWord(word);
    toggleEditModal();
  };

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
      ]),
    ).start();
  }, []);

  // Handlers
  const handleClose = () => {
    setModalVisible(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={[styles.title]}>{category}</Text>
      <Text style={styles.subtitle}>{categorySubtitles[category]}</Text>

      <TouchableOpacity
        style={[
          styles.card,
          styles.actionButton,
          {backgroundColor: categoryColors[category] || '#6b4f7d'},
        ]}
        onPress={() => setModalVisible(true)}>
        <View style={styles.textContainer}>
          <Ionicons name="add" size={23} color="#E9F1F2" style={styles.icon} />
        </View>
      </TouchableOpacity>

      <View
        style={[
          styles.listContainer,
          {paddingBottom: filteredWords.length > 0 ? 80 : 0},
        ]}>
        {filteredWords.length > 0 ? (
          <FlatList
            data={filteredWords}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <View
                  style={[
                    styles.wordContainer,
                    {
                      borderColor: categoryColors[category] || '#6b4f7d',
                      backgroundColor: hexToRgba(
                        categoryColors[category] || '#6b4f7d',
                        0.1,
                      ), // Reduced opacity background color
                    },
                  ]}>
                  <View style={[styles.textWrapper, {flexDirection: 'column'}]}>
                    <Text style={styles.wordText}>{item.original}</Text>
                    <Text style={styles.translationText}>
                      {item.translation}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item)}>
                    <Ionicons
                      name="trash"
                      size={15}
                      color={isDarkMode ? '#aaa' : '#888'}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Animated.View
              style={[
                styles.iconContainer,
                {transform: [{scale: opacityValue}]},
              ]}>
              <Ionicons name="sad-outline" size={60} color="#ccc" />
            </Animated.View>
            <Text style={styles.emptyText}>No words to display here.</Text>
          </View>
        )}
      </View>

      <AddWordScreen
        isVisible={isModalVisible}
        onClose={toggleModal}
        selectedCategory={category}
      />
      <EditWordScreen
        isVisible={isEditModalVisible}
        onClose={toggleEditModal}
        word={currentWord}
        onUpdateWord={updatedWord => {
          updateWord(
            lexicon.findIndex(word => word === currentWord),
            updatedWord,
          );
          toggleEditModal();
        }}
      />
      <DeleteConfirmationModal
        isVisible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={confirmDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 75,
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#262626',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    marginTop: 15,
  },
  wordContainer: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    top: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
  },

  textWrapper: {
    flexDirection: 'column',
    flexShrink: 1,
    maxWidth: '90%',
  },

  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    flexShrink: 0,
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
    marginTop: '-30%',
  },
  iconContainer: {
    marginBottom: 30,
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
    shadowOffset: {width: 0, height: 2},
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
  listContainer: {
    flex: 1,
  },
});

export default CategoryWordsScreen;
