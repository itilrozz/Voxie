import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from "../lib/firebaseConfig";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";
      
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          break;
      }
      
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail} 
          style={[styles.input, errors.email && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Password" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
          style={[styles.input, errors.password && styles.inputError]}
          autoCapitalize="none"
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>
      
      <TouchableOpacity 
        onPress={handleLogin} 
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>No account? Register here!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: "#F5EFE6", 
  },
  title: { 
    fontSize: 26, 
    fontWeight: "700", 
    marginBottom: 20, 
    color: "#6D94C5", 
    textAlign: "center",
  },
  inputContainer: { 
    marginBottom: 12 
  },
  input: { 
    backgroundColor: "#CBDCEB",
    padding: 12, 
    borderRadius: 6, 
    color: "#544e3eff", 
  },
  inputError: { 
    borderColor: "#ff4444", 
    borderWidth: 1 
  },
  errorText: { 
    color: "#ff4444", 
    fontSize: 12, 
    marginTop: 4 
  },
  button: { 
    backgroundColor: "#6D94C5", 
    padding: 14, 
    borderRadius: 6, 
    marginTop: 8, 
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  buttonText: { 
    color: "#F5EFE6", 
    fontWeight: "600", 
    textAlign: "center", 
  },
  link: { 
    marginTop: 12, 
    textAlign: "center", 
    color: "#544e3eff", 
  },
});
