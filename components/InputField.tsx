import React from "react";
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
      placeholderTextColor="#BBB"
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 6, marginBottom: 12 },
});
