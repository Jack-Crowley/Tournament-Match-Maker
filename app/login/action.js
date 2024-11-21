'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData) {
  const supabase = createClient();

  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const { error: signupError } = await supabase.auth.signUp(data, {
    redirectTo: '/', 
  });

  if (signupError) {
    return { error: signupError.message };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword(data);

  const { data: { user } } = await supabase.auth.getUser();

  if (signInError) {
    return { error: signInError.message };
  }

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

