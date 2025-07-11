import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { supabase } from '../supabase/supabaseClient';

export default function SignupScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async () => {
        const { error } = await supabase.auth.signUp({ email, password});
        if (error) {
            alert(error.message);
            return;      
        }

        const user = DataTransfer.user;

        if (user) {
            const { error: insertError } = await supabase.from('profiles').insert([
                {
                    id: user.id,
                    native_lang: 'fr',
                    preferences: {},
                    created_at: {},
                },
            ]);

            if (insertError) {
                console.error('Erreur lors de la création du profil :', insertError.message);
            } else {
                alert('Inscription réussie ! Vérifie ton mail pour confirmer.');
            }
        }
    };
    return (
        <View>
            <Text>Email</Text>
            <TextInput onChangeText={setEmail} value={email} />
            <Text>Password</Text>
            <TextInput onChangeText={setPassword} value={password} secureTextEntry />
            <Button title="S'inscrire" onPress={handleSignup} />
            <Button title="Déjà inscrit ? Connexion" onPress={() => navigation.navigate('Login')} />
        </View>
    );
}