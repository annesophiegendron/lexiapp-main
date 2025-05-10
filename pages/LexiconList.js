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

const LexiconList = ({selectedCategory = []}) => {
  const {lexicon, removeWord, updateWord} = useLexicon();
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] =
    useState(selectedCategory);
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

  const handleEdit = word => {
    setCurrentWord(word);
    toggleEditModal();
  };

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

  const toggleCategorySelection = category => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.searchBar, searchText ? styles.searchBarFocused : {}]}
        placeholder="Search words..."
        placeholderTextColor={isDarkMode ? '#aaa' : '#555'}
        value={searchText}
        onChangeText={setSearchText}
      />

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
              selectedCategories.includes(category)
                ? {backgroundColor: categoryColors[category]}
                : {},
            ]}
            onPress={() => toggleCategorySelection(category)}>
            <Text
              style={{
                color: selectedCategories.includes(category)
                  ? '#fff'
                  : isDarkMode
                  ? '#fff'
                  : '#000',
              }}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {lexicon.length === 0 || filteredLexicon.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyMessage}>No words added yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLexicon}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.wordContainer}>
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
                        size={13}
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
                  size={19}
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

export default LexiconList;

const baseStyles = {
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginVertical: 6,
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
    marginBottom: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 15,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  selectedCategoryButton: {
    backgroundColor: 'transparent',
    borderColor: '#888',
    borderWidth: 1.5,
  },
  categoryButtonText: {
    fontSize: 14,
  },
  selectedCategoryButtonText: {
    fontWeight: 'bold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryTag: {
    borderRadius: 12,
    padding: 4,
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
  wordText: {
    fontSize: 16,
  },
  originalText: {
    fontWeight: 'bold',
  },
  emptyMessage: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyStateContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: 'transparent',
  },
  wordContainer: {
    ...baseStyles.wordContainer,
    backgroundColor: '#e0e0e0',
  },
  searchBar: {
    ...baseStyles.searchBar,
    borderColor: '#ccc',
    color: '#000',
  },
  categoryButtonText: {
    ...baseStyles.categoryButtonText,
    color: '#000',
  },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: 'transparent',
  },
  wordContainer: {
    ...baseStyles.wordContainer,
    backgroundColor: '#2c2c2c',
  },
  searchBar: {
    ...baseStyles.searchBar,
    borderColor: '#555',
    color: '#fff',
  },
  categoryButtonText: {
    ...baseStyles.categoryButtonText,
    color: '#fff',
  },
});
