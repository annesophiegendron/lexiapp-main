import {supabase} from './supabaseClient.js';

//Créer le mot
export async function createWord(original_word, translation, language, difficulty_level = 1, notes = null) {
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authentification:", userError?.message || "Utilisateur non connecté");
        return;
    }

    const { data, error } = await supabase
    .from('words')
    .insert({
        original_word,
        translation,
        language,
        difficulty_level,
        notes,
        user_id: user.id
    })
    .select();

    if (error) {
        console.error("Erreur Supabase:", error.message);
    } else {
        console.log(`Mot ajouté avec succès :`, data[0]);
    }

    return data[0];
}

//Modifier le mot
export async function updateWord(id, updatedFields) {
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authentification:", userError?.message || "Utilisateur non connecté");
        return;
    }

    const {data,error} = await supabase
    .from('words')
    .update(updatedFields)
    .match({id, user_id: user.id})
    .select();

    if (error) {
        console.error("Erreur lors de la mise à jour: ", error.message);
    } else {
        console.log(`Mot mis à jour:`, data[0]);
    }

    return data;
}    

//Supprimer le mot
export async function deleteWord(id) {
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authentification:", userError?.message || "Utilisateur non connecté");
        return;
    }

    const {data,error} = await supabase
    .from('words')
    .delete()
    .match({id, user_id: user.id})
    .select();

    if (error) {
        console.error("Erreur lors de la suppression:", error.message);
    } else if (data.length > 0) { 
        console.log(`Mot supprimé :  ${data[0].original_word}`);    
    } else {
        console.log("Aucun mot trouvé à supprimer.");
    }

    return data;
}    

//Obtenir les mots
export async function getAllWords() {
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authentification:", userError?.message || "Utilisateur non connecté");
        return;
    }

    const{data,error} = await supabase
    .from('words')
    .select('*')
    .eq('user_id', user.id);
  

if (error) {
    console.error("Erreur lors de la récupération des mots: ", error.message);
    } else {
        console.log("Liste des mots :", data);
        return data;
    }
}  