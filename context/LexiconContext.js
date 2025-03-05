import React, {createContext, useContext, useState, useEffect} from 'react';
import {supabase} from '../supabase';
import {useAuth} from './AuthContext';

const LexiconContext = createContext();

export const LexiconProvider = ({children}) => {
  const {isLoggedIn} = useAuth();
  const [lexicon, setLexicon] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categoryColors = {
    'Daily Life': 'rgba(242, 143, 140, 0.4)',
    'Social Interactions': 'rgba(161, 193, 247, 0.4)',
    'Work and School': 'rgba(169, 214, 120, 0.4)',
    'Weather and Nature': 'rgba(161, 198, 182, 0.4)',
    'Emotions and Feelings': 'rgba(242, 143, 119, 0.4)',
    'Common Phrases': 'rgba(212, 159, 192, 0.4)',
    'Numbers and Time': 'rgba(193, 163, 217, 0.4)',
    'Legal Matters': 'rgba(128, 196, 180, 0.4)',
    'Cultural Context': 'rgba(234, 200, 106, 0.4)',
    'Technology and Media': 'rgba(147, 184, 226, 0.4)',
    'Travel and Transportation': 'rgba(180, 213, 137, 0.4)',
  };

  const fetchLexicon = async () => {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) {
      console.error('User is not logged in');
      setLexicon([]);
      return;
    }

    try {
      const {data, error} = await supabase
        .from('lexicon')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setLexicon(data || []);
    } catch (error) {
      console.error('Error fetching lexicon:', error);
      setLexicon([]);
    }
  };

  useEffect(() => {
    fetchLexicon();
  }, [isLoggedIn]);

  const addWord = async (original, translation, categories) => {
    const {data: userData, error: authError} = await supabase.auth.getUser();

    if (authError || !userData?.user) {
      console.error('User is not logged in or error fetching user:', authError);
      return;
    }

    const user_id = userData.user.id;

    const newWord = {
      original,
      translation,
      categories,
      user_id,
      created_at: new Date().toISOString(),
    };

    try {
      const {data, error} = await supabase
        .from('lexicon')
        .insert([newWord])
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        console.error('Error: Supabase did not return the inserted data.');
        return;
      }

      setLexicon(prev => [...prev, data[0]]);
    } catch (error) {
      console.error('Error adding word:', error);
    }
  };

  const removeWord = async index => {
    const wordToRemove = lexicon[index];
    if (!wordToRemove || !wordToRemove.id) {
      console.error('Invalid word to remove or no ID found');
      return;
    }

    try {
      const {error} = await supabase
        .from('lexicon')
        .delete()
        .eq('id', wordToRemove.id);
      if (error) throw new Error(error.message);

      setLexicon(lexicon.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error removing word:', error);
    }
  };

  const updateWord = async (index, updatedWord) => {
    const wordToUpdate = lexicon[index];
    if (!wordToUpdate || !wordToUpdate.id) {
      console.error('Invalid word to update or no ID found');
      return;
    }

    try {
      const {error} = await supabase
        .from('lexicon')
        .update(updatedWord)
        .eq('id', wordToUpdate.id);
      if (error) throw new Error(error.message);

      setLexicon(
        lexicon.map((word, i) =>
          i === index ? {...word, ...updatedWord} : word,
        ),
      );
    } catch (error) {
      console.error('Error updating word:', error);
    }
  };

  const resetLexicon = () => {
    setLexicon([]);
  };

  const updateCategory = category => {
    if (!category || !categoryColors[category]) {
      console.error('Invalid category:', category);
      setSelectedCategory('');
      return;
    }

    console.log(`Category updated: ${category}`);
    setSelectedCategory(category);
  };

  const value = {
    lexicon: lexicon || [],
    addWord,
    removeWord,
    updateWord,
    resetLexicon,
    categoryColors,
    selectedCategory: selectedCategory || '',
    updateCategory,
  };

  return (
    <LexiconContext.Provider value={value}>{children}</LexiconContext.Provider>
  );
};

export const useLexicon = () => {
  return useContext(LexiconContext);
};
