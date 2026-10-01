import { askJSON } from '../agent.js';

const MAX_STEPS = 4;

async function readFields(page) {
  // Tag every visible field with data-hh so we can fill it by index later
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('input, textarea, select')].filter(
      (e) => e.type !== 'hidden' && e.type !== 'submit' && e.type !== 'button' && e.offsetParent !== null
    );
    return els.map((e, i) => {
      e.setAttribute('data-hh', i);// this is a custom attribute so we can fill it by index later
      return {
        index: i,
        tag: e.tagName.toLowerCase(),
        name: e.name || '',
        placeholder: e.placeholder || '',
        label: (e.labels && e.labels[0] && e.labels[0].innerText) || '',
        required: e.required,
      };
    });
  });
}

async function applyGeneric(page, url, candidate, jobTitle) {
  let serverError = null;
  page.on('response', (r) => {
    if (r.request().method() === 'POST' && r.status() >= 500) serverError = r.status();
  });

  try {
    await page.goto(url);

    for (let step = 1; step <= MAX_STEPS; step++) {
      const fields = await readFields(page);
      if (fields.length === 0) return { status: 'failed', reason: 'no form fields found' };

      // Ask Gemini to map candidate data onto the fields
      const mapping = await askJSON(
        `You fill job application forms.
Candidate: ${JSON.stringify(candidate)}
Job: ${jobTitle}
Form fields: ${JSON.stringify(fields)}
Return JSON like {"0": "value", "1": "value"}, keyed by field index.
Use ONLY the candidate data. For free-text fields like "why us", write 1-2 honest sentences.
If a field cannot be filled from the data, use null.`
      );

      // Validate: stop if a required field has no value (never submit a half-filled form)
      const missing = fields.filter((f) => f.required && !mapping[f.index]);
      if (missing.length) {
        return { status: 'failed', reason: 'missing required field: ' + (missing[0].name || missing[0].placeholder) };
      }

      for (const f of fields) {
        if (mapping[f.index]) await page.fill(`[data-hh="${f.index}"]`, String(mapping[f.index]));
      }

      await page.locator('button, input[type=submit]').first().click();
      await page.waitForLoadState('load');

      if (serverError) return { status: 'failed', reason: `server error ${serverError}`, maybeSaved: true };

      const text = await page.locator('body').innerText();
      if (/application received/i.test(text)) return { status: 'submitted' };
      // otherwise this was probably step 1 of a multi-step form, so loop again
    }
    return { status: 'failed', reason: 'no confirmation page after max steps', maybeSaved: true };
  } catch (err) {
    // timeouts land here: the server may or may not have saved it
    return { status: 'failed', reason: err.message.split('\n')[0], maybeSaved: true };
  }
}

export { applyGeneric };