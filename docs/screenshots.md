# Screenshots

The full flow in 3 steps: the form loads empty inside the bottom sheet, gets filled in, and after submitting moves to a thank-you screen — without ever leaving the app.

<div class="shots-gallery">

<figure>
  <img src="/screenshots/empty.jpeg" alt="The form, empty, before filling it in" />
  <figcaption><strong>1. Loaded empty</strong><br />Star rating and text field both empty, ready to fill in</figcaption>
</figure>

<figure>
  <img src="/screenshots/filled.jpeg" alt="The form, filled in, before pressing Submit" />
  <figcaption><strong>2. Filled in, before submitting</strong><br />5 stars and a free-text answer entered</figcaption>
</figure>

<figure>
  <img src="/screenshots/thanks.jpeg" alt="Thank-you screen after a successful submission" />
  <figcaption><strong>3. After submitting</strong><br />The native shell transitions to its own "Thank you" screen</figcaption>
</figure>

</div>

<style scoped>
.shots-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 24px 0;
}
.shots-gallery figure {
  margin: 0;
  flex: 1 1 160px;
  max-width: 180px;
}
.shots-gallery img {
  width: 100%;
  display: block;
  border-radius: 10px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.25);
}
.shots-gallery figcaption {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  text-align: center;
}
</style>
