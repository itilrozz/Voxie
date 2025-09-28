import { Slot } from "expo-router";
import { UserProvider } from "./context/userContext";

export default function RootLayout() {
  return (
    <UserProvider>
      <Slot />
    </UserProvider>
  );
}
