import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import Colors from "../constants/Colors";
import { auth, db } from "../lib/firebaseConfig";

export default function RegisterScreen() {
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ alias?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const router = useRouter();
  const colorScheme = useColorScheme();

  const validateForm = () => {
    const newErrors: { alias?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!alias.trim()) {
      newErrors.alias = "Alias is required";
    } else if (alias.trim().length < 3) {
      newErrors.alias = "Alias must be at least 3 characters";
    }

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

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Set display name to alias
      await updateProfile(userCredential.user, { displayName: alias.trim() });
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        alias: alias.trim(),
        email: email.trim(),
        createdAt: new Date(),
        role: "student", // Default role
        isAnonymous: true // All users are anonymous by default
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak. Please choose a stronger password.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection.";
          break;
      }

      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? "light"].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? "light"].primary }]}>Create Your Anonymous Account</Text>
      <Text style={[styles.p]}>Join the Voxie community with your secret identity</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Choose an Alias"
          value={alias}
          onChangeText={setAlias}
          style={[styles.input, errors.alias && styles.inputError]}
          placeholderTextColor="#6D6D6D"
          autoCapitalize="none"
        />
        {errors.alias && <Text style={[styles.errorText, { color: "#ff4444" }]}>{errors.alias}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, errors.email && styles.inputError]}
          placeholderTextColor="#6D6D6D"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={[styles.errorText, { color: "#ff4444" }]}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, errors.password && styles.inputError]}
          placeholderTextColor="#6D6D6D"
          autoCapitalize="none"
        />
        {errors.password && <Text style={[styles.errorText, { color: "#ff4444" }]}>{errors.password}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholderTextColor="#6D6D6D"
          autoCapitalize="none"
        />
        {errors.confirmPassword && <Text style={[styles.errorText, { color: "#ff4444" }]}>{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity
        onPress={handleRegister}
        style={[styles.button, loading && styles.buttonDisabled, {
          backgroundColor: Colors[colorScheme ?? "light"].primary
        }]}
        disabled={loading}
      >
        {loading ? 
          <ActivityIndicator color={Colors[colorScheme ?? "light"].white} /> : 
          <Text style={[styles.buttonText, { color: Colors[colorScheme ?? "light"].white }]}>Register</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={[styles.link, { color: Colors[colorScheme ?? "light"].primary }]}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: "#ffffff", 
  },
  p: { 
    fontSize: 16, 
    fontWeight: "400", 
    marginBottom: 20, 
    color: "#081269", 
    textAlign: "center",
  },
  title: { 
    fontSize: 26, 
    fontWeight: "700", 
    marginBottom: 20, 
    color: "#081269", 
    textAlign: "center", 
  },
  inputContainer: { 
    marginBottom: 12 
  },
  input: { 
    backgroundColor: "#f0f2ff", 
    padding: 12, 
    borderRadius: 8, 
    color: "#000c74", 
  },
  inputError: { 
    borderColor: "#ff4444", 
    borderWidth: 1 
  },
  errorText: { 
    color: "#ff4444", 
    fontSize: 14, 
    marginTop: 4 
  },
  button: { 
    backgroundColor: "#000c74", 
    padding: 16, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 16 
  },
  buttonDisabled: { 
    opacity: 0.7 
  },
  buttonText: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  footer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: 32 
  },
  footerText: { 
    fontSize: 16,
    color: "#081269"
  },
  link: { 
    fontSize: 16, 
    color: "#000c74", 
    fontWeight: "600" 
  }
});
