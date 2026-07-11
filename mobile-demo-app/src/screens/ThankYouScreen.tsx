import { Pressable, StyleSheet, Text, View } from "react-native";

interface ThankYouScreenProps {
  onBackHome: () => void;
}

export const ThankYouScreen = ({ onBackHome }: ThankYouScreenProps) => (
  <View style={styles.container}>
    <View style={styles.heartCircle}>
      <Text style={styles.heartEmoji}>💜</Text>
    </View>
    <Text style={styles.title}>תודה רבה!</Text>
    <Text style={styles.subtitle}>המשוב שלך נשלח בהצלחה</Text>

    <View style={styles.card}>
      <Text style={styles.cardText}>
        המשוב שלך עוזר לנו להשתפר. נשמח לראותך שוב בהזמנות הבאות 😊
      </Text>
    </View>

    <Pressable style={styles.homeButton} onPress={onBackHome}>
      <Text style={styles.homeButtonText}>חזרה לדף הבית</Text>
    </Pressable>
  </View>
);

const PRIMARY = "#7c6fee";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  heartCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f3f2fb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heartEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
  },
  card: {
    backgroundColor: "#f7f7fb",
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
  },
  cardText: {
    fontSize: 13,
    textAlign: "center",
    color: "#555",
    lineHeight: 20,
  },
  homeButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 24,
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
