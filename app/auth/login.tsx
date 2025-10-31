import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const loginStart = performance.now();
    console.log('🚀 [LOGIN-SCREEN] Starting login process...');
    
    setLoading(true);
    const setLoadingStart = performance.now();
    const setLoadingDuration = performance.now() - setLoadingStart;
    console.log(`🚀 [LOGIN-SCREEN] setLoading(true) took ${setLoadingDuration.toFixed(2)}ms`);
    
    try {
      const signInCallStart = performance.now();
      console.log('🚀 [LOGIN-SCREEN] Calling signIn()...');
      
      const { error } = await signIn(email, password);
      
      const signInCallEnd = performance.now();
      const signInDuration = signInCallEnd - signInCallStart;
      console.log(`🚀 [LOGIN-SCREEN] signIn() returned after ${signInDuration.toFixed(2)}ms`);
      
      if (error) {
        const loginEnd = performance.now();
        console.error(`🚀 [LOGIN-SCREEN] Login failed after ${(loginEnd - loginStart).toFixed(2)}ms:`, error.message);
        Alert.alert('Login Failed', error.message);
        setLoading(false);
      } else {
        const delayStart = performance.now();
        console.log('🚀 [LOGIN-SCREEN] Waiting 100ms before navigation...');
        // Small delay to ensure state is fully updated
        await new Promise(resolve => setTimeout(resolve, 100));
        const delayEnd = performance.now();
        const delayDuration = delayEnd - delayStart;
        console.log(`🚀 [LOGIN-SCREEN] Delay took ${delayDuration.toFixed(2)}ms`);
        
        const navStart = performance.now();
        console.log('🚀 [LOGIN-SCREEN] Navigating to tabs...');
        // Navigate to dashboard after successful login
        router.replace('/(tabs)');
        const navEnd = performance.now();
        const navDuration = navEnd - navStart;
        console.log(`🚀 [LOGIN-SCREEN] Navigation completed in ${navDuration.toFixed(2)}ms`);
        
        setLoading(false);
        const loginEnd = performance.now();
        const totalLoginDuration = loginEnd - loginStart;
        console.log(`🚀 [LOGIN-SCREEN] Total login screen time: ${totalLoginDuration.toFixed(2)}ms`);
        console.log(`🚀 [LOGIN-SCREEN] Breakdown: signIn=${signInDuration.toFixed(2)}ms, delay=${delayDuration.toFixed(2)}ms, nav=${navDuration.toFixed(2)}ms`);
      }
    } catch (err: any) {
      const loginEnd = performance.now();
      console.error(`🚀 [LOGIN-SCREEN] Login exception after ${(loginEnd - loginStart).toFixed(2)}ms:`, err);
      Alert.alert('Login Failed', err?.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="shield-checkmark" size={60} color="#4CAF50" />
                <Text style={styles.logoText}>TRAKM</Text>
              </View>
              <Text style={styles.subtitle}>Neighbourhood Watch Management</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.description}>Sign in to continue</Text>

              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signUpLink}
                onPress={() => router.push('/auth/signup')}
              >
                <Text style={styles.signUpLinkText}>
                  Don't have an account? <Text style={styles.signUpLinkTextBold}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  signUpLinkText: {
    fontSize: 16,
    color: '#ccc',
  },
  signUpLinkTextBold: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
