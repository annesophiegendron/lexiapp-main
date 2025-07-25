import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '.supabaseClient';
import { getSession } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const WORDS_KEY = 'local_words';
const CATEGORIES_KEY = 'local_categories';

async function getUser() {
    const { data,error } = await supabase.auth.getUser();
    if (error || !data?.user) {
        throw new Error('Utilisateur non connecté');
    }
    return data.user;
}

export async function syncAll() {
    try {
        const user = await getUser();

        //synchronisation des catégories
        await syncCategories(user.id);

        //synchronisation des mots
        await syncWords(user.id);

        console.log('Synchronisation complète');
    } catch (error) {
        console.error('Erreur de synchronisation :', error.message);
    }
}

async function syncWords(userId) {
    // Récupère les mots locaux
    const localRaw = await AsyncStorage.getItem(WORDS_KEY);
    const localWords = localRaw ? JSON.parse(localRaw) : [];

    //Recuperer les mots distants (supabase)
    const { data: remoteWords, error } = await supabase
        .from('words')
        .select('*')
        .eq('user_id', userId);
    
    if (error) {
        console.error('Erreur Supabase (words)', error.message);
        return;
    }     

    //recuperation des mots loczux et distants
    const toPush = localWords.filter(
        localWords => !remoteWords.some(remoteWords => remoteWords.id === localWords.id)
    );

    // upload vers Supabase
    if (toPush.length > 0) {
        const { error: pushError } = await supabase.from('words').insert(
            toPush.map(words => ({
                ...words,
                user_id: userId,
            }))
        );

        if (pushError) {
            console.error('Erreur d envoi de mots vers Supabase :', pushError.message);
        }
    }

    //mis à jour d'asyncstorage avec la fusion
    const mergedWords = [...remoteWords, ...toPush];
    await AsyncStorage.setItem(WORDS_KEY, JSON.stringify(mergedWords));
}

//synchroniser les catégories
async function syncCategories(userId) {
    const localRaw = await AsyncStorage.getItem(CATEGORIES_KEY);
    const localCategories = localRaw ? JSON.parse(localRaw) : [];

    const { data: remoteCategories, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Erreur Supabase (categories)', error.message);
        return;
    }   

    const toPush = localCategories.filter(
        localCategories => !remoteCategories.some(remoteCategories => remoteCategories.id ===localCategories.id)
    );

    if (toPush.length > 0) {
        const { error: pushError } = await supabase.from('categories').insert(
            toPush.map(cat => ({
             ...cat,
             user_id: userId,   
            }))
        );

        if (pushError) {
            console.error('Erreur d envoie de catégories :', pushError.message);
        }
    }

    const mergerdCategories = [...remoteCategories, ...toPush];
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(mergerdCategories));
}
