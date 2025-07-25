import {supabase} from './supabaseClient.js';

//Lier le mot à la catégorie
export async function linkWordToCategory(wordId, categoryId) {
    const { error } = await supabase
    .from('word_categories')
    .insert({word_id: wordId, category_id: categoryId});

    if (error) {
        console.error("Erreur lors du lien mot-catégorie :", error.message);
        return;
    } 

    const { data: wordData, error: wordError } = await supabase
        .from('words')
        .select('original_word')
        .eq('id', wordId)
        .single();

    const { data: catData, error: catError } = await supabase 
        .from('categories')   
        .select('name') 
        .eq('id', categoryId)
        .single();

    const wordName = wordData?.original_word || wordId;
    const categoryName = catData?.name || categoryId;

    console.log(`Mot "${wordName}" lié à la catégorie "${categoryName}"`);
}

//Enlever le lien entre le mot et la catégorie
export async function unlinkWordFromCategory(wordId, categoryId) {
    const {error} = await supabase
    .from('word_categories')
    .delete()
    .match({ word_id: wordId, category_id: categoryId});

    if (error) {
        console.error("Erreur lors de la suppression du lien :", error.message);
    } else {
        console.log(`Lien supprimé entre le mot ${wordId} et la catégorie ${categoryId}`);
    }
}









