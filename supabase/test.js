import { supabase } from './supabaseClient.js'
/*import { createCategory} from './categories.js';*/
import { createWord } from './word.js';

const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
  email: 'testhawa@gmail.com',
  password: 'test'
})

if (loginError) {
  console.error('Erreur de login :', loginError.message)
  process.exit(1)
}

const userId = loginData.user.id
console.log('Connecté avec user ID :', userId)

/*await createCategory('Test catégorie12', 'hiiii', 'rgba(144, 21, 231, 0.4)', userId);

/*import { deleteCategory } from './categories.js';

await deleteCategory('137220fe-eac1-485e-9918-b78ec61072f5');

import { updateCategory } from './categories.js'

await updateCategory(
  'b702a798-a6a6-4c41-b646-08b5c5459c81',
  'nouveau test catégorie12',
  'newwww',
  'rgba(113, 100, 255, 0.4)'
);


import { createTag } from './tags.js';
await createTag('Essaie numero3', 'rgba(60, 142, 22, 0.67)',userId);

import { updateTag } from './tags.js';
await updateTag('7971fc6b-aba4-4dca-bf25-b58c4ced7e29','nouvel essaie hihi', 'rgba(24, 22, 142, 0.67)' );

import { deleteTag } from './tags.js';
await deleteTag('e65fe476-a000-479c-bbd5-6047f308ae97');

*/

/*import { updateWord } from './word.js';
await updateWord('e2e954c5-713e-49ad-b478-6a1daf07c856', {
  translation: {es:'hola' },
  difficulty_level: 1
});

import { deleteWord } from './word.js';
await deleteWord('fd4b711e-09b0-4b0f-8935-5e97c3e6dfec');*/

import { linkWordToCategory, unlinkWordFromCategory } from './wordCategories.js';

const { data: categories, error: catError } = await supabase
  .from('categories')
  .select()
  .or(`user_id.eq.${userId},user_id.is.null`);

if (catError || !categories || categories.length === 0) {
  console.error('Erreur ou aucune catégorie disponible.');
  process.exit(1);
}

console.log("Données brutes des catégories :", categories);
console.log("Catégories disponibles :");
categories.forEach(c => {
  console.log(`- Nom: "${c.name}", ID: ${c.id}, user_id: ${c.user_id ?? 'défaut'}`);
});

const categoryName = "Daily Life";
const testCategory = categories.find(cat => cat.name === categoryName);

if (!testCategory) {
  console.error(`Catégorie "${categoryName}" introuvable.`);
  console.log("Catégories disponibles :", categories.map(c => `${c.name} (${c.user_id ?? "par défaut"})`).join(", "));
  process.exit(1);
}

const newWord = await createWord(
  "jouer",
  { en: "play", es: "jugar" },
  "fr",
  1,
  "very good"
);

if (newWord && newWord.id) {
  await linkWordToCategory(newWord.id, testCategory.id);
  // await unlinkWordFromCategory(newWord.id, testCategory.id);
}