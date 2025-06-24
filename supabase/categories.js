import { supabase } from './supabaseClient.js';

/*fonction pour créer une catégorie
export async function createCategory(name, label, color, userId){
    const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authenfication:", userError?.message || "Utilisateur non connecté");
        return;
    }

    const {data, error}= await supabase
    .from('categories')
    .insert({
        name,
        label,
        color,
        user_id: user.id
    })
    .select();
   

    if (error) {
        console.error("Erreur Supabase", error.message);
    } else {
        console.log("Catégorie créée avec succès : ", data);
    }

}
*/
//fonction pour supprimer une catégorie
export async function deleteCategory(id) {
  const {data: {user}, error: userError} = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Erreur d'authenfication:", userError?.message || "Utilisateur non connecté");
        return;
    }   

    const response = await supabase
        .from('categories')
        .delete()
        .match({id, user_id: user.id})
        .select('name');

        const{data, error} = response;

    if (error) {
        console.error("Erreur Supabase :", error.message);
    }   else if (data && data.length > 0) {
        console.log(`Catégorie supprimée : ${data[0].name}.`);
    } else {
        console.log("Aucune catégorie supprimée (vérifie l`ID.")
    }

}


/*fonction pour mettre à jour une catégorie
export async function updateCategory(categoryId, userId){
    const {data, error} = await supabase
    .from('categories')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', categoryId)

    if (error) throw error;
    return data;

}



//fonction pour lister ses catégories
export async function getUserCategories(userId) {
    const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false});

    if (error) throw error;
    return data;
}*/