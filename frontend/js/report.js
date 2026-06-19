document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();

  const form = document.getElementById('reportForm');
  const alertBox = document.getElementById('formAlert');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alertBox);

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const severity = document.getElementById('severity').value;
    const description = document.getElementById('description').value.trim();
    const evidenceFile = document.getElementById('evidence').files[0];

    let valid = true;
    setFieldError('field-title', !title); if (!title) valid = false;
    setFieldError('field-category', !category); if (!category) valid = false;
    setFieldError('field-severity', !severity); if (!severity) valid = false;
    setFieldError('field-description', !description); if (!description) valid = false;

    if (!valid) {
      showAlert(alertBox, 'Fill in all required fields.', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const incident = await Api.createIncident({
        title,
        category,
        severity,
        description
      });

      if (evidenceFile && incident && incident.incident_id) {
        try {
          await Api.uploadEvidence(incident.incident_id, evidenceFile);
        } catch (uploadErr) {
          console.warn("Evidence upload failed", uploadErr);
        }
      }

      showAlert(
        alertBox,
        `Incident #${incident.incident_id} reported successfully! Redirecting...`,
        'success'
      );

      form.reset();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 3000);

    } catch (err) {
      showAlert(alertBox, err.message || 'Could not submit report.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit report';
    }
  });
});