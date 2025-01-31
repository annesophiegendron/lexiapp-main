import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  useColorScheme,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useLexicon} from '../context/LexiconContext';
import AddWordScreen from './AddWordScreen';
import EditWordScreen from './EditWordScreen';
import {useTheme} from '../context/ThemeContext';
import {categoryColors, categoryIcons} from '../constants';
import DeleteConfirmationModal from './ui/DeleteConfirmationModal';
const LexiconList = () => {
  const {lexicon, removeWord, updateWord} = useLexicon();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const colorScheme = useColorScheme();
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
  const cancelDelete = () => setShowDeleteModal(false);
  const handleEdit = word => {
    setCurrentWord(word);
    toggleEditModal();
  };

  const filteredLexicon = lexicon.filter(
    item =>
      (item.original.toLowerCase().includes(searchText.toLowerCase()) ||
        item.translation.toLowerCase().includes(searchText.toLowerCase())) &&
      (selectedCategory ? item.categories?.includes(selectedCategory) : true),
  );

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#ffffff'},
      ]}>
      <TextInput
        style={[styles.searchBar, searchText ? styles.searchBarFocused : {}]}
        placeholder="Search words..."
        placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
        value={searchText}
        onChangeText={setSearchText}
      />
      {lexicon.length === 0 ? (
        <Text style={styles.emptyMessage}>No words in the lexicon</Text>
      ) : (
        <FlatList
          data={filteredLexicon}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={[
                styles.wordContainer,
                {backgroundColor: isDarkMode ? '#333' : '#F2F2F2'},
              ]}>
              <View style={styles.leftContainer}>
                <View style={styles.categoriesContainer}>
                  {item.categories?.map((cat, catIndex) => (
                    <View
                      key={catIndex}
                      style={[
                        styles.categoryTag,
                        {backgroundColor: categoryColors[cat] || '#ccc'},
                      ]}>
                      <Ionicons
                        name={categoryIcons[cat] || 'help-circle'}
                        size={12}
                        color={isDarkMode ? '#fff' : '#000'}
                      />
                    </View>
                  ))}
                </View>
                <Text
                  style={[
                    styles.wordText,
                    {color: isDarkMode ? '#D9D9D9' : '#000'},
                  ]}>
                  <Text style={styles.originalText}>{item.original}</Text> -{' '}
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
            </TouchableOpacity>
          )}
        />
      )}
      <AddWordScreen isVisible={isModalVisible} onClose={toggleModal} />
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

const lightStyles = StyleSheet.create({
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

  searchBar: {
    width: '100%',
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

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
  deleteButton: {
    padding: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const darkStyles = StyleSheet.create({
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

  searchBar: {
    width: '100%',
    height: 45,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: '#333',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

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
});
export default LexiconList;
