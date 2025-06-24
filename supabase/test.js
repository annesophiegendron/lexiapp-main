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

/*await createCategory('Test catégorie12', 'hiiii', 'rgba(144, 21, 231, 0.4)', userId);*/

import { deleteCategory } from './categories.js';

await deleteCategory('137220fe-eac1-485e-9918-b78ec61072f5');