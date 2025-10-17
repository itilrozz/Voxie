import { StyleSheet, TextInput } from "react-native";
import { InputFieldProps } from "../types";

export default function InputField({ 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry = false, 
  multiline = false,
  style 
}: InputFieldProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#000c74"
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: { 
    backgroundColor: "#f0f2ff", 
    color: "#081269",
    borderColor: "#c7c9ff",
    borderWidth: 1,
    padding: 12, 
    borderRadius: 6, 
    marginBottom: 12 
  },
});
