export default function Host() {

  const rootURL = window.location.host;
  const fakeCode = "ABCD";

  return (
    <main style={{ textAlign: "center" }}>
      <h2>{"Go to " + rootURL}</h2>
      <h2>{"Enter room code: " + fakeCode}</h2>
    </main>
  );
}
