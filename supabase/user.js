import {supabase} from './supabaseClient';

//Créer un profil
export async function createUserProfile(userId, username, nativeLang) {
    const { data, error } = await supabase
    .from('profiiles')
    .insert([
        {
            id: userId,
            username,
            native_lang: nativeLang,
            preferences: { theme: 'light '},
        },
    ]);

    if (error) {
        console.error('Erreur création profil:', error.message);
    } else {
        console.log('Profil créé :', data);
    }
    return { data, error };
}

//Garder le profil
export async function getCurrentUserProfile() {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return { data: null, error: authError };

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { data, error};    
}

//Modifier le profil
export async function updateUserProfil(updates) {
    const {
        data: {user},
    } = await supabase.auth.getUser();

    if(!user) return { data: null, error: 'Utilisateur non connecté'};

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    return { data, error };    
}