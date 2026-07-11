import { DFSDK_BUNDLE } from "./sdkBundle";

// Builds the page the WebView loads. The SDK bundle is inlined (see scripts/syncSdkBundle.js)
// rather than fetched from a URL — in a real app you'd more likely load it from a CDN
// (e.g. unpkg) the same way the web demo does, but inlining keeps this demo self-contained
// and working offline against a locally-built, unpublished package.
export const buildSurveyHtml = (baseUrl: string, formId: string): string => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      body { margin: 0; padding: 12px; background: #f4f5f7; }
    </style>
  </head>
  <body>
    <div id="form-container"></div>
    <script>
      // Registered before the SDK bundle runs, so a parse/runtime error in the bundle
      // itself (which the SDK's own try/catch can't reach — it hasn't executed yet)
      // still gets reported instead of leaving a silent blank page.
      window.onerror = function (message, source, lineno) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "error", message: "Script error: " + message + " (line " + lineno + ")" })
          );
        }
        return true;
      };
    </script>
    <script>${DFSDK_BUNDLE}</script>
    <script>
      try {
        var form = new DynamicFormsSDK.DynamicForm({
          baseUrl: ${JSON.stringify(baseUrl)},
          formId: ${JSON.stringify(formId)},
          container: "#form-container",
          onSubmit: function (data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "submitted", data: data }));
          },
          onError: function (error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: error.message }));
          },
        });
        form.mount();
      } catch (e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: "Init error: " + e.message }));
      }
    </script>
  </body>
</html>
`;
