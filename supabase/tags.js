import { supabase } from './supabaseClient.js';

//fonction pour crée un tag
export async function createTag(name, color, userId){
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError|| !user ) {
        console.error("Erreur d'authentification:", userError?.message || "Utilisateur non connecté");
        return;
    }

 
const {data, error} = await supabase
    .from('tags')
    .insert({
        name,
        color,
        user_id: user.id
    })
    .select();

if (error) {
    console.error("Erreur Supabase:", error.message);
} else {
    console.log("Tag créé avec succès:", data)
}
}

//fonction pour mettre à jour un tag
export async function updateTag(id, newName, newColor){
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authentification :", userError?.message || "Utilisateur non connecté");
        return;
    }

const {data, error} = await supabase
    .from('tags')
    .update({ name: newName, color: newColor})
    .match({id, user_id: user.id})
    .select();

    if (error) {
        console.error("Erreur Supabase:", error.message);
    } else {
        console.log("Tag modifié avec succès:", data);
    }
}

//fonction pour supprimé un tag
export async function deleteTag(id) {
    const { data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authentification : ", userError?.message || "Utilisateur non connecté");
        return;
    }

const {data, error} = await supabase
    .from('tags')
    .delete()
    .match({id,user_id: user.id})
    .select();

    if (error) {
        console.error("Erreur Supabase:", error.message);
    } else if (data && data.length > 0) {
        console.log(`Tag supprimé : ${data[0].name}`);
    } else {
        console.log("Aucun tag supprimé.");
    }
}
