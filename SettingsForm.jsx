import { useState, useRef } from 'react';

const FIELD_DEFINITIONS = [
  {
    id: 'username',
    name: 'username',
    label: 'Username',
    type: 'text',
    required: true,
    minLength: 3,
    maxLength: 32,
    autoComplete: 'username',
    ariaLabel: 'Username',
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    autoComplete: 'email',
    ariaLabel: 'Email address',
  },
];

function renderFieldsRecursive(definitions, index, values, onChange, errors) {
  if (index >= definitions.length) {
    return null;
  }

  const field = definitions[index];
  const value = values[field.name] || '';
  const error = errors[field.name] || '';

  return (
    <>
      <div className="settings-form__field">
        <label htmlFor={field.id}>{field.label}</label>
        <input
          id={field.id}
          name={field.name}
          type={field.type}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          autoComplete={field.autoComplete}
          aria-label={field.ariaLabel}
          aria-required={field.required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${field.id}-error` : undefined}
        />
        {error ? (
          <span id={`${field.id}-error`} role="alert" className="settings-form__error">
            {error}
          </span>
        ) : null}
      </div>
      {renderFieldsRecursive(definitions, index + 1, values, onChange, errors)}
    </>
  );
}

function validateUsername(value) {
  if (!value || value.trim().length === 0) {
    return 'Username is required';
  }
  if (value.trim().length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (value.trim().length > 32) {
    return 'Username must be at most 32 characters';
  }
  return '';
}

function validateEmail(value) {
  if (!value || value.trim().length === 0) {
    return 'Email is required';
  }
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.value = value.trim();
  if (!emailInput.checkValidity()) {
    return 'Please enter a valid email address';
  }
  return '';
}

function validateFieldRecursive(definitions, index, values, accumulated) {
  if (index >= definitions.length) {
    return accumulated;
  }

  const field = definitions[index];
  let message = '';

  if (field.name === 'username') {
    message = validateUsername(values.username);
  } else if (field.name === 'email') {
    message = validateEmail(values.email);
  }

  const nextAccumulated = { ...accumulated };
  if (message) {
    nextAccumulated[field.name] = message;
  }

  return validateFieldRecursive(definitions, index + 1, values, nextAccumulated);
}

function validateSettings(values) {
  const errors = validateFieldRecursive(FIELD_DEFINITIONS, 0, values, {});
  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

function SettingsForm({ onSubmit }) {
  const [values, setValues] = useState({ username: '', email: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);

  const handleChange = (name, value) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const html5Valid = formRef.current ? formRef.current.checkValidity() : false;
    const { isValid, errors: validationErrors } = validateSettings(values);

    if (!html5Valid || !isValid) {
      setErrors(validationErrors);
      setSubmitted(false);
      if (formRef.current) {
        formRef.current.reportValidity();
      }
      return;
    }

    setErrors({});
    setSubmitted(true);

    if (onSubmit) {
      onSubmit({
        username: values.username.trim(),
        email: values.email.trim(),
      });
    }
  };

  return (
    <form
      ref={formRef}
      className="settings-form"
      onSubmit={handleSubmit}
      noValidate={false}
      aria-label="User settings form"
    >
      <h2 id="settings-form-heading">User Settings</h2>
      <fieldset aria-labelledby="settings-form-heading">
        <legend className="settings-form__legend">Account Information</legend>
        {renderFieldsRecursive(FIELD_DEFINITIONS, 0, values, handleChange, errors)}
      </fieldset>
      <button type="submit" aria-label="Save user settings">
        Save Settings
      </button>
      {submitted ? (
        <p role="status" aria-live="polite" className="settings-form__success">
          Settings saved successfully.
        </p>
      ) : null}
    </form>
  );
}

function runTestCaseRecursive(cases, index, passed, failed) {
  if (index >= cases.length) {
    return { passed, failed, total: cases.length };
  }

  const testCase = cases[index];
  const result = validateSettings(testCase.input);
  const errorsMatch =
    JSON.stringify(result.errors) === JSON.stringify(testCase.expectedErrors);
  const validMatch = result.isValid === testCase.expectedValid;
  const success = errorsMatch && validMatch;

  if (success) {
    console.log(`PASS: ${testCase.name}`);
    return runTestCaseRecursive(cases, index + 1, passed + 1, failed);
  }

  console.error(`FAIL: ${testCase.name}`);
  console.error('  Expected valid:', testCase.expectedValid, 'Got:', result.isValid);
  console.error('  Expected errors:', testCase.expectedErrors);
  console.error('  Got errors:', result.errors);
  return runTestCaseRecursive(cases, index + 1, passed, failed + 1);
}

function testSettingsFormLogic() {
  console.log('Running SettingsForm validation tests...');

  const testCases = [
    {
      name: 'empty values fail validation',
      input: { username: '', email: '' },
      expectedValid: false,
      expectedErrors: { username: 'Username is required', email: 'Email is required' },
    },
    {
      name: 'short username fails validation',
      input: { username: 'ab', email: 'user@example.com' },
      expectedValid: false,
      expectedErrors: { username: 'Username must be at least 3 characters' },
    },
    {
      name: 'invalid email fails validation',
      input: { username: 'validuser', email: 'not-an-email' },
      expectedValid: false,
      expectedErrors: { email: 'Please enter a valid email address' },
    },
    {
      name: 'valid username and email pass validation',
      input: { username: 'validuser', email: 'user@example.com' },
      expectedValid: true,
      expectedErrors: {},
    },
    {
      name: 'trimmed valid values pass validation',
      input: { username: '  flyrank  ', email: '  test@flyrank.com  ' },
      expectedValid: true,
      expectedErrors: {},
    },
  ];

  const summary = runTestCaseRecursive(testCases, 0, 0, 0);

  console.log(`Results: ${summary.passed}/${summary.total} passed, ${summary.failed} failed`);

  return summary.failed === 0;
}

export default SettingsForm;
export { testSettingsFormLogic, validateSettings, validateUsername, validateEmail };
