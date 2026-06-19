/* =========================================================
   auth.js — powers register.html and login.html.
   Validates input client-side, calls the API, and stores
   the session before redirecting into the app.
   ========================================================= */

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
  } catch (_) {
    return {};
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const alertBox = document.getElementById('formAlert');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertBox);

      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      let valid = true;
      setFieldError('field-fullName', !fullName); if (!fullName) valid = false;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setFieldError('field-email', !emailOk); if (!emailOk) valid = false;
      const passOk = password.length >= 8;
      setFieldError('field-password', !passOk); if (!passOk) valid = false;
      const matchOk = password === confirmPassword;
      setFieldError('field-confirmPassword', !matchOk); if (!matchOk) valid = false;

      if (!valid) {
        showAlert(alertBox, 'Fix the highlighted fields and try again.', 'error');
        return;
      }

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account…';

      try {
        await Api.register({ full_name: fullName, email, password, role: 'user' });
        showAlert(alertBox, 'Account created. Redirecting to sign in…', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      } catch (err) {
        showAlert(alertBox, err.message || 'Registration failed. That email may already be in use.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create account';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertBox);

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const remember = document.getElementById('rememberMe').checked;

      let valid = true;
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      setFieldError('field-email', !emailOk); if (!emailOk) valid = false;
      setFieldError('field-password', !password); if (!password) valid = false;

      if (!valid) {
        showAlert(alertBox, 'Enter your email and password.', 'error');
        return;
      }

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in…';

      try {
        const result = await Api.login({ email, password });
        const token = result.access_token || result.token;
        const claims = decodeJwtPayload(token);
        const user = {
          id: claims.user_id || claims.sub || claims.id,
          full_name: claims.full_name || email,
          role: claims.role || 'user',
        };
        Auth.setSession(token, user, remember);
        window.location.href = 'dashboard.html';
      } catch (err) {
        showAlert(alertBox, err.message || 'Incorrect email or password.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
      }
    });
  }
});
