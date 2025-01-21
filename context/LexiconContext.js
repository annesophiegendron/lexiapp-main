import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LexiconContext = createContext();

export const LexiconProvider = ({ children }) => {
  const [lexicon, setLexicon] = useState([]);


const categoryColors = {
  'Daily Life': 'rgba(242, 143, 140, 0.4)', // Lighter pastel pink with reduced opacity
  'Social Interactions': 'rgba(161, 193, 247, 0.4)', // Lighter pastel blue
  'Work and School': 'rgba(169, 214, 120, 0.4)', // Lighter pastel green
  'Weather and Nature': 'rgba(161, 198, 182, 0.4)', // Lighter pastel green-blue
  'Emotions and Feelings': 'rgba(242, 143, 119, 0.4)', // Lighter coral with reduced opacity
  'Common Phrases': 'rgba(212, 159, 192, 0.4)', // Lighter pastel purple
  'Numbers and Time': 'rgba(193, 163, 217, 0.4)', // Lighter lavender pastel
  'Legal Matters': 'rgba(128, 196, 180, 0.4)', // Lighter muted teal
  'Cultural Context': 'rgba(234, 200, 106, 0.4)', // Lighter pastel yellow
  'Technology and Media': 'rgba(147, 184, 226, 0.4)', // Lighter pastel blue
  'Travel and Transportation': 'rgba(180, 213, 137, 0.4)' // Lighter greenish-yellow
};

  
  // Load lexicon from AsyncStorage on mount
  useEffect(() => {
    const loadLexicon = async () => {
      const savedLexicon = await AsyncStorage.getItem('lexicon');
      if (savedLexicon) {
        setLexicon(JSON.parse(savedLexicon));
      }
    };

    loadLexicon();
  }, []);

  // Add a word to the lexicon with multiple categories
  const addWord = async (original, translation, categories) => {
    if (!Array.isArray(categories)) {
      throw new Error('Categories must be an array');
    }
  
    const newWord = { original, translation, categories };
    const updatedLexicon = [...lexicon, newWord];
    setLexicon(updatedLexicon);
    await AsyncStorage.setItem('lexicon', JSON.stringify(updatedLexicon));
  };
  

  // Remove a word from the lexicon
  const removeWord = async (index) => {
    const updatedLexicon = lexicon.filter((_, i) => i !== index);
    setLexicon(updatedLexicon);
    await AsyncStorage.setItem('lexicon', JSON.stringify(updatedLexicon));
  };

  // Update a word in the lexicon with multiple categories
  const updateWord = async (index, updatedWord) => {
    const updatedLexicon = lexicon.map((word, i) => (i === index ? updatedWord : word)); 
    setLexicon(updatedLexicon);
    await AsyncStorage.setItem('lexicon', JSON.stringify(updatedLexicon));
  };
  

  return (
    <LexiconContext.Provider value={{ lexicon, addWord, removeWord, updateWord, categoryColors }}>
      {children}
    </LexiconContext.Provider>
  );
};

export const useLexicon = () => {
  return useContext(LexiconContext);
};
