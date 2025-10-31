import { NeighborhoodMember, SecurityOfficer, supabase, User } from '@/utils/supabase';
import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AuthError {
  message: string;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  securityOfficer: SecurityOfficer | null;
  neighborhoodMember: NeighborhoodMember | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    userType: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuration constants
const AUTH_TIMEOUT_MS = 8000; // 8 seconds - optimized for mobile
const PROFILE_FETCH_RETRIES = 1; // Reduced retries for faster sign-in (user should exist)
const PROFILE_FETCH_RETRY_DELAY_MS = 100; // Faster delay for mobile

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [securityOfficer, setSecurityOfficer] = useState<SecurityOfficer | null>(null);
  const [neighborhoodMember, setNeighborhoodMember] = useState<NeighborhoodMember | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let sessionChecked = false;
    let timeout: ReturnType<typeof setTimeout>;

    console.log('🔍 [AuthContext] Starting auth check...');
    console.log('🔍 [AuthContext] Timeout set to:', AUTH_TIMEOUT_MS, 'ms');
    console.log('🔍 [AuthContext] Supabase client initialized:', !!supabase);
    console.log('🔍 [AuthContext] Current session in state:', !!session);
    console.log('🔍 [AuthContext] Current user in state:', !!user);
    console.log('🔍 [AuthContext] Session checked ref:', sessionCheckedRef.current);

    // If we already have a session/user, skip the timeout check
    if (session?.user || user) {
      console.log('✅ [AuthContext] Session/user already exists, skipping timeout check');
      sessionChecked = true;
      sessionCheckedRef.current = true;
      setLoading(false);
      
      // Still set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          clearAuthState();
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    // Also check if session was already checked in a previous mount
    if (sessionCheckedRef.current) {
      console.log('✅ [AuthContext] Session was already checked previously, skipping timeout');
      sessionChecked = true;
      setLoading(false);
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id);
        } else {
          clearAuthState();
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    // Get initial session with timeout protection
    timeout = setTimeout(() => {
      if (mounted && !sessionChecked && !sessionCheckedRef.current) {
        console.warn('⏱️ [AuthContext] Auth check timeout - assuming no session');
        console.warn('⏱️ [AuthContext] Timeout fired after', AUTH_TIMEOUT_MS, 'ms');
        console.warn('⏱️ [AuthContext] sessionChecked:', sessionChecked, 'mounted:', mounted);
        console.warn('⏱️ [AuthContext] sessionCheckedRef:', sessionCheckedRef.current);
        setLoading(false);
      } else {
        console.log('✅ [AuthContext] Timeout prevented - session already checked');
      }
    }, AUTH_TIMEOUT_MS);

    // Listen for auth changes - this fires IMMEDIATELY with current session
    // Set this up FIRST since it's more reliable than getSession()
    console.log('👂 [AuthContext] Setting up auth state change listener...');
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthContext] Auth state changed:', event);
      console.log('🔄 [AuthContext] Session:', session ? 'exists' : 'null');
      
      if (!mounted) {
        console.log('⚠️ [AuthContext] Component unmounted, ignoring auth state change');
        return;
      }

      // Mark as checked when we get a session from onAuthStateChange
      // This prevents timeout if getSession() is hanging
      if (session && !sessionChecked) {
        console.log('✅ [AuthContext] Session found via onAuthStateChange, marking as checked');
        sessionChecked = true;
        sessionCheckedRef.current = true;
        clearTimeout(timeout);
      }

      setSession(session);
      if (session?.user) {
        console.log('👤 [AuthContext] User in auth state change, fetching profile...');
        await fetchUserProfile(session.user.id);
      } else {
        console.log('👤 [AuthContext] No user in auth state change, clearing state');
        clearAuthState();
      }
    });

    // Also try getSession() as a backup, but don't rely on it if onAuthStateChange already fired
    // Add a shorter timeout for getSession() since onAuthStateChange should fire first
    const getSessionTimeout = setTimeout(() => {
      if (!sessionChecked && mounted) {
        console.warn('⚠️ [AuthContext] getSession() is taking too long, but onAuthStateChange should have fired');
      }
    }, 2000); // 2 second warning, then rely on onAuthStateChange

    console.log('📞 [AuthContext] Calling supabase.auth.getSession()...');
    const startTime = Date.now();

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(getSessionTimeout);
        const duration = Date.now() - startTime;
        console.log('✅ [AuthContext] getSession() resolved after', duration, 'ms');
        console.log('📦 [AuthContext] Session exists:', !!session);
        console.log('📦 [AuthContext] Session user:', session?.user ? `${session.user.id.substring(0, 8)}...` : 'none');
        console.log('❌ [AuthContext] Error:', error || 'none');

        // Only process if we haven't already handled it via onAuthStateChange
        if (sessionChecked) {
          console.log('⚠️ [AuthContext] Session already handled via onAuthStateChange, ignoring getSession result');
          return;
        }

        sessionChecked = true;
        sessionCheckedRef.current = true;
        clearTimeout(timeout);
        
        if (!mounted) {
          console.log('⚠️ [AuthContext] Component unmounted, ignoring result');
          return;
        }

        if (error) {
          console.error('❌ [AuthContext] Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        if (session?.user) {
          console.log('👤 [AuthContext] User found, fetching profile:', session.user.id.substring(0, 8) + '...');
          fetchUserProfile(session.user.id);
        } else {
          console.log('👤 [AuthContext] No user in session');
          setLoading(false);
        }
      })
      .catch((error) => {
        clearTimeout(getSessionTimeout);
        const duration = Date.now() - startTime;
        console.error('❌ [AuthContext] getSession() rejected after', duration, 'ms');
        console.error('❌ [AuthContext] Error details:', error);
        console.error('❌ [AuthContext] Error message:', error?.message);
        console.error('❌ [AuthContext] Error stack:', error?.stack);
        
        // Only process if we haven't already handled it via onAuthStateChange
        if (sessionChecked) {
          console.log('⚠️ [AuthContext] Session already handled via onAuthStateChange, ignoring getSession error');
          return;
        }

        sessionChecked = true;
        sessionCheckedRef.current = true;
        clearTimeout(timeout);
        if (!mounted) {
          console.log('⚠️ [AuthContext] Component unmounted, ignoring error');
          return;
        }
        console.error('❌ [AuthContext] Failed to get session:', error);
        setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      clearTimeout(getSessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Clears all authentication state
   */
  const clearAuthState = () => {
    console.log('🧹 [AuthContext] clearAuthState() called');
    setUser(null);
    setSecurityOfficer(null);
    setNeighborhoodMember(null);
    setLoading(false);
    console.log('🧹 [AuthContext] Auth state cleared');
  };

  /**
   * Fetches user profile with retry mechanism to handle race conditions
   * during sign-up when database triggers may not have completed yet
   */
  const fetchUserProfile = async (
    userId: string,
    retries: number = PROFILE_FETCH_RETRIES
  ): Promise<void> => {
    const profileStart = performance.now();
    console.log('📥 [PROFILE] fetchUserProfile called for user:', userId.substring(0, 8) + '...');
    console.log('📥 [PROFILE] Will retry up to', retries, 'times');
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const attemptStart = performance.now();
        console.log(`📥 [PROFILE] Attempt ${attempt + 1}/${retries} - Fetching user data...`);
        
        // Fetch user data
        const dbQueryStart = performance.now();
        console.log(`📥 [PROFILE] About to execute DB query for user_id: ${userId}`);
        console.log(`📥 [PROFILE] Supabase client status:`, supabase ? 'initialized' : 'not initialized');
        console.log(`📥 [PROFILE] Supabase URL:`, supabase?.supabaseUrl || 'unknown');
        
        // Add timeout detection
        let queryCompleted = false;
        const timeoutDuration = 10000; // 10 seconds
        const timeoutId = setTimeout(() => {
          if (!queryCompleted) {
            console.error(`📥 [PROFILE] ⚠️ QUERY TIMEOUT: Query has been running for more than ${timeoutDuration}ms`);
            console.error(`📥 [PROFILE] This suggests network issues or database connectivity problems`);
          }
        }, timeoutDuration);
        
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        console.log(`📥 [PROFILE] Query promise created, awaiting response...`);
        const queryStartTime = Date.now();
        console.log(`📥 [PROFILE] Query start timestamp: ${queryStartTime}`);
        
        let userData, userError;
        try {
          const result = await queryPromise;
          userData = result.data;
          userError = result.error;
          queryCompleted = true;
          clearTimeout(timeoutId);
        } catch (err) {
          queryCompleted = true;
          clearTimeout(timeoutId);
          console.error(`📥 [PROFILE] Query threw exception:`, err);
          throw err;
        }
        
        const dbQueryEnd = performance.now();
        const queryEndTime = Date.now();
        const dbQueryDuration = dbQueryEnd - dbQueryStart;
        const networkLatency = queryEndTime - queryStartTime;
        
        console.log(`📥 [PROFILE] DB query completed in ${dbQueryDuration.toFixed(2)}ms (network: ${networkLatency}ms)`);
        console.log(`📥 [PROFILE] Query end timestamp: ${queryEndTime}`);
        
        if (userError) {
          console.error(`📥 [PROFILE] Query error details:`, {
            code: userError.code,
            message: userError.message,
            details: userError.details,
            hint: userError.hint
          });
        } else {
          console.log(`📥 [PROFILE] Query success, got user data:`, {
            userId: userData?.user_id?.substring(0, 8),
            email: userData?.email,
            userType: userData?.user_type
          });
        }

        if (userError) {
          const attemptEnd = performance.now();
          console.error(`❌ [PROFILE] Attempt ${attempt + 1} - Error after ${(attemptEnd - attemptStart).toFixed(2)}ms:`, userError);
          console.error(`❌ [PROFILE] Error code:`, userError.code);
          console.error(`❌ [PROFILE] Error message:`, userError.message);
          
          // If it's the last attempt or not a "not found" error, handle it
          if (attempt === retries - 1 || userError.code !== 'PGRST116') {
            console.error('❌ [PROFILE] Final error or not a "not found" error, clearing auth state');
            clearAuthState();
            return;
          }

          // Retry after delay for "not found" errors (possible race condition)
          console.log(`⏳ [PROFILE] Retrying after ${PROFILE_FETCH_RETRY_DELAY_MS}ms (race condition possible)...`);
          const retryDelayStart = performance.now();
          await new Promise((resolve) => setTimeout(resolve, PROFILE_FETCH_RETRY_DELAY_MS));
          const retryDelayEnd = performance.now();
          console.log(`⏳ [PROFILE] Retry delay: ${(retryDelayEnd - retryDelayStart).toFixed(2)}ms`);
          continue;
        }

        if (userData) {
          const userDataFetchEnd = performance.now();
          console.log(`✅ [PROFILE] User data fetched in ${(userDataFetchEnd - attemptStart).toFixed(2)}ms:`, {
            userId: userData.user_id.substring(0, 8) + '...',
            email: userData.email,
            userType: userData.user_type,
            status: userData.status
          });
          
          const setUserStart = performance.now();
          setUser(userData);
          const setUserEnd = performance.now();
          console.log(`📥 [PROFILE] setUser() took ${(setUserEnd - setUserStart).toFixed(2)}ms`);
          
          console.log('📥 [PROFILE] Fetching role-specific data...');
          const roleFetchStart = performance.now();
          await fetchRoleSpecificData(userData.user_type, userId);
          const roleFetchEnd = performance.now();
          console.log(`📥 [PROFILE] Role fetch completed in ${(roleFetchEnd - roleFetchStart).toFixed(2)}ms`);
          
          const setLoadingStart = performance.now();
          setLoading(false);
          const setLoadingEnd = performance.now();
          console.log(`📥 [PROFILE] setLoading(false) took ${(setLoadingEnd - setLoadingStart).toFixed(2)}ms`);
          
          const profileEnd = performance.now();
          console.log(`✅ [PROFILE] Total profile fetch time: ${(profileEnd - profileStart).toFixed(2)}ms`);
          console.log(`✅ [PROFILE] Breakdown: DB=${(dbQueryEnd - dbQueryStart).toFixed(2)}ms, setUser=${(setUserEnd - setUserStart).toFixed(2)}ms, Role=${(roleFetchEnd - roleFetchStart).toFixed(2)}ms`);
          return;
        }
      } catch (error) {
        const attemptEnd = performance.now();
        console.error(`❌ [PROFILE] Attempt ${attempt + 1} - Exception after ${(attemptEnd - attemptStart).toFixed(2)}ms:`, error);
        if (attempt === retries - 1) {
          console.error('❌ [PROFILE] All retries exhausted, clearing auth state');
          clearAuthState();
          return;
        }
        console.log(`⏳ [PROFILE] Retrying after ${PROFILE_FETCH_RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, PROFILE_FETCH_RETRY_DELAY_MS));
      }
    }

    // If we exhausted all retries
    const profileEnd = performance.now();
    console.error(`❌ [PROFILE] All retries exhausted after ${(profileEnd - profileStart).toFixed(2)}ms, clearing auth state`);
    clearAuthState();
  };

  /**
   * Fetches role-specific data based on user type
   * Runs non-blocking for faster UI response
   */
  const fetchRoleSpecificData = async (
    userType: string,
    userId: string
  ): Promise<void> => {
    const roleStart = performance.now();
    console.log(`👤 [ROLE] Fetching ${userType} data for user: ${userId.substring(0, 8)}...`);
    
    // Don't await - let it run in parallel to speed up sign-in
    if (userType === 'security_officer') {
      const queryStart = performance.now();
      supabase
        .from('security_officers')
        .select('*')
        .eq('officer_id', userId)
        .single()
        .then(({ data: officerData, error: officerError }) => {
          const queryEnd = performance.now();
          console.log(`👤 [ROLE] Security officer query completed in ${(queryEnd - queryStart).toFixed(2)}ms`);
          
          if (!officerError && officerData) {
            const setStart = performance.now();
            setSecurityOfficer(officerData);
            const setEnd = performance.now();
            console.log(`👤 [ROLE] setSecurityOfficer() took ${(setEnd - setStart).toFixed(2)}ms`);
            
            const roleEnd = performance.now();
            console.log(`👤 [ROLE] Total role fetch: ${(roleEnd - roleStart).toFixed(2)}ms`);
          } else if (officerError) {
            console.error(`👤 [ROLE] Error fetching security officer data (${(queryEnd - queryStart).toFixed(2)}ms):`, officerError);
          }
        })
        .catch((error) => {
          const roleEnd = performance.now();
          console.error(`👤 [ROLE] Exception fetching security officer data (${(roleEnd - roleStart).toFixed(2)}ms):`, error);
        });
    } else if (userType === 'neighborhood_member') {
      const queryStart = performance.now();
      supabase
        .from('neighborhood_members')
        .select('*')
        .eq('member_id', userId)
        .single()
        .then(({ data: memberData, error: memberError }) => {
          const queryEnd = performance.now();
          console.log(`👤 [ROLE] Neighborhood member query completed in ${(queryEnd - queryStart).toFixed(2)}ms`);
          
          if (!memberError && memberData) {
            const setStart = performance.now();
            setNeighborhoodMember(memberData);
            const setEnd = performance.now();
            console.log(`👤 [ROLE] setNeighborhoodMember() took ${(setEnd - setStart).toFixed(2)}ms`);
            
            const roleEnd = performance.now();
            console.log(`👤 [ROLE] Total role fetch: ${(roleEnd - roleStart).toFixed(2)}ms`);
          } else if (memberError) {
            console.error(`👤 [ROLE] Error fetching neighborhood member data (${(queryEnd - queryStart).toFixed(2)}ms):`, memberError);
          }
        })
        .catch((error) => {
          const roleEnd = performance.now();
          console.error(`👤 [ROLE] Exception fetching neighborhood member data (${(roleEnd - roleStart).toFixed(2)}ms):`, error);
        });
    }
  };

  /**
   * Signs in a user with email and password
   */
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    const signInStart = performance.now();
    console.log('🔐 [SIGN-IN] Starting sign-in process...');
    
    try {
      const authCallStart = performance.now();
      console.log('🔐 [SIGN-IN] Calling supabase.auth.signInWithPassword...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      const authCallEnd = performance.now();
      const authDuration = authCallEnd - authCallStart;
      console.log(`🔐 [SIGN-IN] Auth call completed in ${authDuration.toFixed(2)}ms`);

      if (error) {
        const signInEnd = performance.now();
        console.error(`🔐 [SIGN-IN] Auth error:`, error.message, `(${(signInEnd - signInStart).toFixed(2)}ms total)`);
        return {
          error: {
            message: error.message,
            code: error.status?.toString(),
          },
        };
      }

      // Wait for profile to be fetched before returning for faster UX
      let profileDuration = 0;
      if (data?.user) {
        const profileFetchStart = performance.now();
        console.log('🔐 [SIGN-IN] Auth successful, starting profile fetch...');
        console.log(`🔐 [SIGN-IN] User ID: ${data.user.id.substring(0, 8)}...`);
        
        await fetchUserProfile(data.user.id);
        
        const profileFetchEnd = performance.now();
        profileDuration = profileFetchEnd - profileFetchStart;
        console.log(`🔐 [SIGN-IN] Profile fetch completed in ${profileDuration.toFixed(2)}ms`);
      }

      const signInEnd = performance.now();
      const totalDuration = signInEnd - signInStart;
      console.log(`🔐 [SIGN-IN] Total sign-in time: ${totalDuration.toFixed(2)}ms`);
      console.log(`🔐 [SIGN-IN] Breakdown: Auth=${authDuration.toFixed(2)}ms, Profile=${profileDuration.toFixed(2)}ms`);

      return { error: null };
    } catch (error: any) {
      const signInEnd = performance.now();
      console.error(`🔐 [SIGN-IN] Sign in error after ${(signInEnd - signInStart).toFixed(2)}ms:`, error);
      return {
        error: {
          message: error.message || 'An unexpected error occurred during sign in',
        },
      };
    }
  };

  /**
   * Signs up a new user
   * Creates user record in users table and role-specific records manually
   */
  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    userType: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      // Validate user type
      const validUserTypes = ['admin', 'security_officer', 'neighborhood_member'];
      if (!validUserTypes.includes(userType)) {
        return {
          error: {
            message: 'Invalid user type',
            code: 'INVALID_USER_TYPE',
          },
        };
      }

      // Step 1: Sign up with Supabase Auth
      console.log('📝 [AuthContext] Attempting to sign up user:', email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            user_type: userType,
          },
        },
      });

      if (authError) {
        console.error('❌ [AuthContext] Sign up error:', authError);
        console.error('❌ [AuthContext] Error message:', authError.message);
        console.error('❌ [AuthContext] Error code:', authError.status);
        
        // Check if user already exists - only check error message, not status code
        // 422 can mean other validation errors too
        const errorMessage = authError.message?.toLowerCase() || '';
        const isAlreadyRegistered = 
          errorMessage.includes('already registered') || 
          errorMessage.includes('user already exists') ||
          errorMessage.includes('already been registered') ||
          errorMessage.includes('email already registered');
        
        if (isAlreadyRegistered) {
          console.log('⚠️ [AuthContext] User already exists in Auth, checking database...');
          
          // Try to sign in to get the user ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError || !signInData.user) {
            return {
              error: {
                message: 'An account with this email already exists. Please sign in instead.',
                code: 'USER_EXISTS_SIGN_IN',
              },
            };
          }

          // Check if user exists in database
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('user_id')
            .eq('user_id', signInData.user.id)
            .single();

          if (existingUser) {
            // User exists in both Auth and database
            await supabase.auth.signOut();
            return {
              error: {
                message: 'An account with this email already exists. Please sign in instead.',
                code: 'USER_EXISTS_SIGN_IN',
              },
            };
          }

          // User exists in Auth but not in database - create database record
          console.log('⚠️ [AuthContext] User exists in Auth but not in database, creating database record...');
          const userId = signInData.user.id;

          try {
            // Create user record in users table
            console.log('📝 [AuthContext] Creating user record for existing auth user...');
            const { error: userError } = await supabase
              .from('users')
              .insert({
                user_id: userId,
                email: email,
                password_hash: '',
                phone_number: phoneNumber,
                first_name: firstName,
                last_name: lastName,
                user_type: userType as 'admin' | 'security_officer' | 'neighborhood_member',
                status: 'pending_approval',
                is_approved: false,
              });

            if (userError) {
              console.error('❌ [AuthContext] Error creating user record:', userError);
              console.error('❌ [AuthContext] Error code:', userError.code);
              console.error('❌ [AuthContext] Error message:', userError.message);
              console.error('❌ [AuthContext] Error details:', userError.details);
              await supabase.auth.signOut();
              return {
                error: {
                  message: 'Failed to complete registration. Please contact support.',
                  code: 'DATABASE_ERROR',
                },
              };
            }

            // Create role-specific record
            console.log('📝 [AuthContext] Creating role-specific record for existing auth user...');
            await createRoleSpecificRecord(userId, userType);
            
            // Sign out after creating records
            await supabase.auth.signOut();
            
            return { error: null };
          } catch (error: any) {
            console.error('❌ [AuthContext] Error creating database records:', error);
            console.error('❌ [AuthContext] Error message:', error?.message);
            console.error('❌ [AuthContext] Error stack:', error?.stack);
            await supabase.auth.signOut();
            return {
              error: {
                message: 'Failed to complete registration. Please contact support.',
                code: 'DATABASE_ERROR',
              },
            };
          }
        }

        // For other errors, return the actual error message
        // Check for common validation errors and provide user-friendly messages
        let userFriendlyMessage = authError.message;
        
        if (authError.status === 422) {
          if (errorMessage.includes('password')) {
            userFriendlyMessage = 'Password does not meet requirements. Please choose a stronger password.';
          } else if (errorMessage.includes('email')) {
            userFriendlyMessage = 'Invalid email address. Please check your email and try again.';
          } else {
            userFriendlyMessage = authError.message || 'Invalid input. Please check your information and try again.';
          }
        }

        return {
          error: {
            message: userFriendlyMessage,
            code: authError.status?.toString(),
          },
        };
      }

      if (!authData.user) {
        return {
          error: {
            message: 'Failed to create user account',
            code: 'USER_CREATION_FAILED',
          },
        };
      }

      // Step 2: Create user record and role-specific records manually
      console.log('✅ [AuthContext] Auth user created, creating database records...');
      console.log('✅ [AuthContext] User ID:', authData.user.id);
      console.log('✅ [AuthContext] User Type:', userType);
      try {
        // Create user record in users table
        // Note: password_hash is managed by Supabase Auth, so we leave it empty
        console.log('📝 [AuthContext] Creating user record in database...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            user_id: authData.user.id,
            email: email,
            password_hash: '', // Supabase Auth handles password hashing separately
            phone_number: phoneNumber,
            first_name: firstName,
            last_name: lastName,
            user_type: userType as 'admin' | 'security_officer' | 'neighborhood_member',
            status: 'pending_approval',
            is_approved: false,
          })
          .select();

        if (userError) {
          console.error('❌ [AuthContext] Error creating user record:', userError);
          console.error('❌ [AuthContext] Error code:', userError.code);
          console.error('❌ [AuthContext] Error message:', userError.message);
          console.error('❌ [AuthContext] Error details:', userError.details);
          console.error('❌ [AuthContext] Error hint:', userError.hint);
          // Attempt to clean up the auth user
          await cleanupAuthUser(authData.user.id);
          return {
            error: {
              message: `Failed to create user profile: ${userError.message}`,
              code: 'PROFILE_CREATION_FAILED',
            },
          };
        }

        console.log('✅ [AuthContext] User record created successfully:', userData);
        console.log('✅ [AuthContext] Now creating role-specific record...');
        // Create role-specific record
        await createRoleSpecificRecord(authData.user.id, userType);
        console.log('✅ [AuthContext] Sign up completed successfully!');
        
        // Sign out after creating records to prevent immediate login
        // This avoids race conditions with profile fetching
        console.log('🔒 [AuthContext] Signing out after signup to require fresh login...');
        await supabase.auth.signOut();
        console.log('✅ [AuthContext] Signed out, user can now login with fresh session');
      } catch (error: any) {
        console.error('❌ [AuthContext] Error in manual record creation (catch block):', error);
        console.error('❌ [AuthContext] Error type:', typeof error);
        console.error('❌ [AuthContext] Error message:', error?.message);
        console.error('❌ [AuthContext] Error stack:', error?.stack);
        await cleanupAuthUser(authData.user.id);
        return {
          error: {
            message: error.message || 'Failed to complete user registration',
            code: 'REGISTRATION_FAILED',
          },
        };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        error: {
          message: error.message || 'An unexpected error occurred during sign up',
        },
      };
    }
  };

  /**
   * Creates role-specific records (security_officers or neighborhood_members)
   */
  const createRoleSpecificRecord = async (
    userId: string,
    userType: string
  ): Promise<void> => {
    if (userType === 'security_officer') {
      console.log('📝 [AuthContext] Creating security officer record for:', userId.substring(0, 8) + '...');
      const { error: officerError } = await supabase
        .from('security_officers')
        .insert({
          officer_id: userId,
          is_permanently_deleted: false,
        });

      if (officerError) {
        console.error('❌ [AuthContext] Error creating security officer record:', officerError);
        console.error('❌ [AuthContext] Error code:', officerError.code);
        console.error('❌ [AuthContext] Error message:', officerError.message);
        console.error('❌ [AuthContext] Error details:', officerError.details);
        console.error('❌ [AuthContext] Error hint:', officerError.hint);
        throw new Error('Failed to create security officer profile');
      }
      console.log('✅ [AuthContext] Security officer record created successfully');
    } else if (userType === 'neighborhood_member') {
      console.log('📝 [AuthContext] Creating neighborhood member record for:', userId.substring(0, 8) + '...');
      const { data: memberData, error: memberError } = await supabase
        .from('neighborhood_members')
        .insert({
          member_id: userId,
          subscription_status: 'active',
        })
        .select();

      if (memberError) {
        console.error('❌ [AuthContext] Error creating neighborhood member record:', memberError);
        console.error('❌ [AuthContext] Error code:', memberError.code);
        console.error('❌ [AuthContext] Error message:', memberError.message);
        console.error('❌ [AuthContext] Error details:', memberError.details);
        console.error('❌ [AuthContext] Error hint:', memberError.hint);
        throw new Error('Failed to create neighborhood member profile');
      }
      console.log('✅ [AuthContext] Neighborhood member record created successfully:', memberData);
    }
  };

  /**
   * Cleans up auth user if profile creation fails
   * Note: Requires service role key or admin API access
   */
  const cleanupAuthUser = async (userId: string): Promise<void> => {
    try {
      // This requires admin privileges
      // You may need to call a server-side function or Edge Function
      // that has the service role key to delete the user
      console.error(
        'User cleanup needed for userId:',
        userId,
        '- implement server-side cleanup endpoint'
      );
      
      // Example: await fetch('/api/admin/cleanup-user', { method: 'POST', body: JSON.stringify({ userId }) });
    } catch (error) {
      console.error('Error cleaning up auth user:', error);
    }
  };

  /**
   * Signs out the current user
   */
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      clearAuthState();
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear state anyway to prevent UI issues
      clearAuthState();
    }
  };

  const value: AuthContextType = {
    user,
    session,
    securityOfficer,
    neighborhoodMember,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}