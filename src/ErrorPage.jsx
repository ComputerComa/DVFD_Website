const content = {
  401: {
    label: "Authentication required",
    title: "Please sign in.",
    copy: "This area is reserved for authorized department administrators.",
  },
  403: {
    label: "Access restricted",
    title: "You are not cleared for this page.",
    copy: "Your account is signed in, but it does not have permission to access this area.",
  },
  404: {
    label: "Page not found",
    title: "This route has gone dark.",
    copy: "The page may have moved, been removed, or never existed.",
  },
};
export default function ErrorPage({ code = 404, onSignIn, detail }) {
  const page = content[code] ?? content[404];
  return (
    <main className="error-page">
      <div className="error-rail">
        <a href="/" className="error-brand">
          <span>✦</span>Deshler
          <br />
          Fire &amp; Rescue
        </a>
        <p>
          Emergency? Call <a href="tel:911">911</a>
        </p>
      </div>
      <section className="error-content">
        <p className="eyebrow gold">{page.label}</p>
        <div className="error-code" aria-hidden="true">
          {code}
        </div>
        <h1>{page.title}</h1>
        <p>{detail || page.copy}</p>
        {onSignIn ? (
          <form className="error-login" onSubmit={onSignIn}>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" required />
            </label>
            <button>Sign in</button>
          </form>
        ) : (
          <a className="button" href="/">
            Return home <span>→</span>
          </a>
        )}
      </section>
    </main>
  );
}
