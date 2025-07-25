import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase/supabaseClient';
import { useUser } from '.'

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    }
   setLoading(false);
  };
  getSession();
   
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    }); 
    
    return () => listener.subscription.unsubscribe();
  }, []);
  
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase 
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error)  setProfile(data);
    else console.log('Erreur profil :', error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider value={{ user, profile, loading, logout}}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
