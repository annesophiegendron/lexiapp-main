import { supabase } from "./supabaseClient";

// Nombre total de mots ajoutés par l'utilisateur
export async function getWordCount(userId) {
    const { count, error } = await supabase 
    .from('words')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

    return error ? 0 : count;
}

// Catégories les plus utilisées
export async function getTopCategories(userId) {
    const { data, error } = await supabase
    .from('words')
    .select('category, count:category', { count: 'exact'})
    .eq('user_id', userId)
    .group('category');

    return error ? [] : data;
}

// Mots ajoutés par semaine
export async function getWordsByPeriod(userId, period = 'week') {
    const format = period === 'month' ? 'YYY-MM' : 'IYYY-IW';
    const { data, error } = await supabase.rpc('words_grouped_by_period', {
        user_id_input: userId,
        format_input: format,
    });

    return error ? [] : data;
}