import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, useColorScheme } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useLexicon } from '../context/LexiconContext';
import AddWordScreen from './AddWordScreen';
import EditWordScreen from './EditWordScreen';
import { useTheme } from '../context/ThemeContext';
import { categoryColors, categoryIcons } from '../constants';

const LexiconList = () => {
  const { lexicon, removeWord, updateWord } = useLexicon();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null); 
  const colorScheme = useColorScheme();
  const { isDarkMode } = useTheme();

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleEditModal = () => {
    setEditModalVisible(!isEditModalVisible);
  };

  const handleDelete = (word, index) => {
    setWordToDelete(word);
    setShowDeleteModal(true); 
  };

  const confirmDelete = () => {
    removeWord(lexicon.findIndex((w) => w === wordToDelete));
    setShowDeleteModal(false); 
  };

  const cancelDelete = () => {
    setShowDeleteModal(false); 
  };

  const handleEdit = (word) => {
    setCurrentWord(word);
    toggleEditModal();
  };

  const styles = colorScheme === 'dark' ? darkStyles : lightStyles;

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]}>
      {lexicon.length === 0 ? (
        <Text style={styles.emptyMessage}>No words in the lexicon</Text>
      ) : (
        <FlatList
          data={lexicon}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={[styles.wordContainer, { backgroundColor: isDarkMode ? '#333' : '#F2F2F2' }]}>
              <View style={styles.leftContainer}>
                <View style={styles.categoriesContainer}>
                  {item.categories && item.categories.map((cat, catIndex) => (
                    <View key={catIndex} style={[styles.categoryTag, { backgroundColor: categoryColors[cat] || '#ccc' }]}>
                      <Ionicons name={categoryIcons[cat] || 'help-circle'} size={12} color={isDarkMode ? '#fff' : '#000'} />
                    </View>
                  ))}
                </View>

                <Text style={[styles.wordText, { color: isDarkMode ? '#D9D9D9' : '#000' }]}>
                  <Text style={[styles.originalText, { color: isDarkMode ? '#D9D9D9' : '#000' }]}>{item.original}</Text>
                  <Text> - {item.translation}</Text>
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                  <Ionicons name="pencil" size={15} color={isDarkMode ? '#aaa' : '#888'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item, index)}>
                  <Ionicons name="trash" size={15} color={isDarkMode ? '#aaa' : '#888'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      <AddWordScreen isVisible={isModalVisible} onClose={toggleModal} />
      <EditWordScreen 
        isVisible={isEditModalVisible} 
        onClose={toggleEditModal} 
        word={currentWord} 
        onUpdateWord={(updatedWord) => {
          updateWord(lexicon.findIndex(word => word === currentWord), updatedWord);
          toggleEditModal();
        }} 
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
            <Text style={[styles.modalText, { color: isDarkMode ? '#D9D9D9' : '#000' }]}>
              Are you sure you want to delete this word?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={confirmDelete}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={cancelDelete}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f4f2ec',
    padding: 20,
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11,
    marginVertical: 5,
    borderRadius: 12,
    width: '100%',
  },
  leftContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
  },

  // Text styles
  emptyMessage: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#555',
    marginVertical: 20,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '400',
    flexShrink: 1,
  },
  originalText: {
    fontWeight: 'bold',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    alignSelf: 'center',
  },

  // Category styles
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryTag: {
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 5,
    marginRight: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Button styles
  editButton: {
    padding: 5,
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007BFF',
    width: '48%',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    padding: 20,
    borderRadius: 12,
    width: '90%',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});

const darkStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11,
    marginVertical: 5,
    borderRadius: 12,
    width: '100%',
  },
  leftContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },

});


export default LexiconList;
