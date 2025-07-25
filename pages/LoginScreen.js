import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { supabase } from '../supabase/supabaseClient';
import { syncAll } from '../services/syncService';

useEffect(() => {
    if (session) {
        syncAll();
    }
},[session]);

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
    };

    return (
        <View>
            <Text>Email</Text>
            <TextInput onChangeText={setEmail} value={email} />
            <Text>password</Text>
            <TextInput on ChangeText={setPassword} value={password} secureTextEntry />
            <Button title="Connexion" onPress={handleLogin} />
            <Button title="Pas de compte ? Inscription" onPress={() => navigation.navigate('Signup')} />
        </View>
    );
}