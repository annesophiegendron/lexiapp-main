import { supabase } from './supabaseClient.js'
/*import { createCategory} from './categories.js';*/

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
*/

/*import { createTag } from './tags.js';
await createTag('Essaie numero3', 'rgba(60, 142, 22, 0.67)',userId);

import { updateTag } from './tags.js';
await updateTag('7971fc6b-aba4-4dca-bf25-b58c4ced7e29','nouvel essaie hihi', 'rgba(24, 22, 142, 0.67)' );*/

import { deleteTag } from './tags.js';
await deleteTag('e65fe476-a000-479c-bbd5-6047f308ae97');
