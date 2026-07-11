import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { WebViewErrorEvent, WebViewHttpErrorEvent } from "react-native-webview/lib/WebViewTypes";
import { API_BASE_URL, DEMO_FORM_ID, POPUP_DELAY_MS, POPUP_TRIGGER } from "./src/config";
import { OrderSuccessScreen } from "./src/screens/OrderSuccessScreen";
import { ThankYouScreen } from "./src/screens/ThankYouScreen";
import { buildSurveyHtml } from "./src/surveyHtml";

// No home/ordering screens — this demo starts where the survey actually matters:
// right after an order succeeds.
type Phase = "order" | "thanks";
type PopupStatus = "idle" | "submitted" | "error";

export default function App() {
  const [phase, setPhase] = useState<Phase>("order");
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupStatus, setPopupStatus] = useState<PopupStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // POPUP_TRIGGER (src/config.ts) is the integrating developer's choice, anchored to
  // the order-success screen — the moment a real app would want feedback — not to app
  // launch. "delay" pops it up automatically POPUP_DELAY_MS after arriving here;
  // "button" leaves it to the "תן לנו משוב" button on that screen.
  useEffect(() => {
    if (phase !== "order" || POPUP_TRIGGER !== "delay") return;
    const timer = setTimeout(() => setPopupVisible(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const openPopup = () => {
    setPopupStatus("idle");
    setErrorMessage(null);
    setPopupVisible(true);
  };

  // No home screen to return to — restarts the demo from "order success" instead.
  const restart = () => {
    setPhase("order");
    setPopupStatus("idle");
    setErrorMessage(null);
  };

  // The web page running inside the WebView posts a message on submit/error (see
  // surveyHtml.ts) — this is how the native shell finds out what happened inside the
  // SDK without needing any custom bridging beyond the standard postMessage API.
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    const payload = JSON.parse(event.nativeEvent.data) as
      | { type: "submitted"; data: Record<string, unknown> }
      | { type: "error"; message: string };

    if (payload.type === "submitted") {
      setPopupStatus("submitted");
      setTimeout(() => {
        setPopupVisible(false);
        setPhase("thanks");
      }, 900);
    } else {
      setPopupStatus("error");
      setErrorMessage(payload.message);
    }
  };

  // Covers failures the page's own JS never gets a chance to report — e.g. the WebView
  // engine itself refusing/failing to load the content — which previously showed as a
  // silent blank popup instead of the errorBanner.
  const handleWebViewError = (event: WebViewErrorEvent) => {
    setPopupStatus("error");
    setErrorMessage(`WebView load error: ${event.nativeEvent.description}`);
  };

  const handleWebViewHttpError = (event: WebViewHttpErrorEvent) => {
    setPopupStatus("error");
    setErrorMessage(`HTTP ${event.nativeEvent.statusCode} loading survey`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {phase === "order" && (
        <OrderSuccessScreen showFeedbackButton={POPUP_TRIGGER === "button"} onRequestFeedback={openPopup} />
      )}
      {phase === "thanks" && <ThankYouScreen onBackHome={restart} />}

      {!DEMO_FORM_ID && (
        <Text style={styles.warning}>Set DEMO_FORM_ID in src/config.ts to a published form's id first.</Text>
      )}

      <Modal visible={popupVisible} animationType="fade" transparent onRequestClose={() => setPopupVisible(false)}>
        <View style={styles.popupOverlay}>
          <View style={styles.popup}>
            {popupStatus === "error" && <Text style={styles.errorBanner}>Error: {errorMessage}</Text>}

            <WebView
              source={{ html: buildSurveyHtml(API_BASE_URL, DEMO_FORM_ID) }}
              onMessage={handleWebViewMessage}
              onError={handleWebViewError}
              onHttpError={handleWebViewHttpError}
              style={styles.webview}
            />

            <Pressable style={styles.closeButton} onPress={() => setPopupVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  warning: {
    color: "#c0292f",
    fontSize: 12,
    textAlign: "center",
    padding: 8,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "95%",
    height: "50%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#fdecec",
    color: "#c0292f",
    padding: 10,
    margin: 12,
    borderRadius: 8,
    textAlign: "center",
  },
  webview: {
    flex: 1,
  },
});
