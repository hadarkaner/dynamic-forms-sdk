import { Pressable, StyleSheet, Text, View } from "react-native";

interface OrderSuccessScreenProps {
  /** Only shown when POPUP_TRIGGER === "button" (see src/config.ts) — gives a manual
   * way to bring up the survey instead of waiting for the auto-delay. */
  showFeedbackButton: boolean;
  onRequestFeedback: () => void;
}

const ORDER_ITEMS = [
  { name: "בורגר קלאסי", qty: "1x", price: "54₪" },
  { name: "צ'יפס גדול", qty: "1x", price: "18₪" },
  { name: "קולה זירו", qty: "1x", price: "10₪" },
];

export const OrderSuccessScreen = ({ showFeedbackButton, onRequestFeedback }: OrderSuccessScreenProps) => (
  <View style={styles.container}>
    <View style={styles.illustration}>
      <Text style={styles.illustrationEmoji}>🛵</Text>
    </View>
    <View style={styles.checkmark}>
      <Text style={styles.checkmarkText}>✓</Text>
    </View>

    <Text style={styles.title}>ההזמנה בוצעה!</Text>
    <Text style={styles.subtitle}>ההזמנה שלך התקבלה ומתחילה להתכונן</Text>

    <View style={styles.card}>
      {ORDER_ITEMS.map((item) => (
        <View key={item.name} style={styles.itemRow}>
          <Text style={styles.itemPrice}>{item.price}</Text>
          <Text style={styles.itemName}>
            {item.qty} {item.name}
          </Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.itemRow}>
        <Text style={styles.totalPrice}>82₪</Text>
        <Text style={styles.totalLabel}>סה"כ</Text>
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.deliveryTime}>⏱ זמן משלוח משוער: 30-40 דקות</Text>
      <Text style={styles.deliverySubtext}>🛵 שליח בדרך אליך</Text>
    </View>

    <Pressable style={styles.trackButton}>
      <Text style={styles.trackButtonText}>מעקב אחרי ההזמנה</Text>
    </Pressable>

    {showFeedbackButton && (
      <Pressable style={styles.feedbackButton} onPress={onRequestFeedback}>
        <Text style={styles.feedbackButtonText}>✍️ תן לנו משוב</Text>
      </Pressable>
    )}
  </View>
);

const PRIMARY = "#7c6fee";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  illustration: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#f3f2fb",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  illustrationEmoji: {
    fontSize: 48,
  },
  checkmark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2fbf71",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#f7f7fb",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginTop: 6,
  },
  itemRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 13,
  },
  itemPrice: {
    fontSize: 13,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e3e1f0",
  },
  totalLabel: {
    fontWeight: "700",
  },
  totalPrice: {
    fontWeight: "700",
    color: PRIMARY,
  },
  deliveryTime: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
  },
  deliverySubtext: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  trackButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  trackButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  feedbackButton: {
    paddingVertical: 10,
  },
  feedbackButtonText: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 13,
  },
});
