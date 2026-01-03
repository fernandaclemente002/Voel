//função responsavel por fazer a conexão com o supabase
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ykkiqivpptokpvbakoax.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2lxaXZwcHRva3B2YmFrb2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzY5OTYsImV4cCI6MjA4Mjk1Mjk5Nn0.XXAL66jC_N5z8mizBAQkBGZ-WMAEaiM4TN5Hlw7nVII'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
//fim da função de conexão com o supabase
