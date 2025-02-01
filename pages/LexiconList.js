import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
  // Store multiple selected categories
  const [selectedCategories, setSelectedCategories] = useState([]);
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

  // Filter words based on search text and selected categories
  const filteredLexicon = lexicon.filter(item => {
    const matchesSearch =
      item.original.toLowerCase().includes(searchText.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategories.length > 0
        ? item.categories?.some(cat => selectedCategories.includes(cat))
        : true;
    return matchesSearch && matchesCategory;
  });

  const styles = isDarkMode ? darkStyles : lightStyles;

  // Toggle the selection for a category
  const toggleCategorySelection = category => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Clears all selected categories
  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

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

      {/* Centered and wrapped Category Filter UI */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategories.length === 0 && styles.selectedCategoryButton,
          ]}
          onPress={clearAllCategories}>
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategories.length === 0 &&
                styles.selectedCategoryButtonText,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.keys(categoryColors).map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategories.includes(category) &&
                styles.selectedCategoryButton,
            ]}
            onPress={() => toggleCategorySelection(category)}>
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategories.includes(category) &&
                  styles.selectedCategoryButtonText,
              ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  // Updated filter container is now centered with wrapping.
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#888',
  },
  categoryButtonText: {
    color: '#000',
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: '#fff',
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
  emptyMessage: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
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
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#555',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#bbb',
  },
  categoryButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    color: '#000',
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
  emptyMessage: {
    marginTop: 20,
    fontSize: 16,
    color: '#aaa',
  },
});

export default LexiconList;
