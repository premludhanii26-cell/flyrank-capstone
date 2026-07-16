const { useState } = React;

const FIELD_GROUPS = [
  {
    title: 'Profile',
    fields: [
      { id: 'displayName', label: 'Display Name', type: 'text', placeholder: 'Your name' },
      { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
      { id: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself' },
    ],
  },
  {
    title: 'Preferences',
    fields: [
      { id: 'emailNotifications', label: 'Email notifications', type: 'checkbox' },
      { id: 'pushNotifications', label: 'Push notifications', type: 'checkbox' },
      { id: 'darkMode', label: 'Dark mode', type: 'checkbox' },
    ],
  },
  {
    title: 'Account',
    fields: [
      {
        id: 'language',
        label: 'Language',
        type: 'select',
        options: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' },
        ],
      },
      {
        id: 'timezone',
        label: 'Timezone',
        type: 'select',
        options: [
          { value: 'UTC', label: 'UTC' },
          { value: 'America/New_York', label: 'Eastern Time' },
          { value: 'America/Los_Angeles', label: 'Pacific Time' },
          { value: 'Asia/Kolkata', label: 'India Standard Time' },
        ],
      },
      {
        id: 'visibility',
        label: 'Profile visibility',
        type: 'select',
        options: [
          { value: 'public', label: 'Public' },
          { value: 'private', label: 'Private' },
          { value: 'friends', label: 'Friends only' },
        ],
      },
    ],
  },
];

const INITIAL_VALUES = {
  displayName: '',
  email: '',
  bio: '',
  emailNotifications: true,
  pushNotifications: false,
  darkMode: false,
  language: 'en',
  timezone: 'UTC',
  visibility: 'public',
};

function renderOptions(options, index) {
  if (index >= options.length) return null;
  const option = options[index];
  return (
    <>
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
      {renderOptions(options, index + 1)}
    </>
  );
}

function renderField(field, values, onChange) {
  const value = values[field.id];

  if (field.type === 'checkbox') {
    return (
      <label className="settings-checkbox">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(field.id, e.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <>
        <label htmlFor={field.id}>{field.label}</label>
        <textarea
          id={field.id}
          value={value}
          placeholder={field.placeholder}
          rows={3}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
      </>
    );
  }

  if (field.type === 'select') {
    return (
      <>
        <label htmlFor={field.id}>{field.label}</label>
        <select
          id={field.id}
          value={value}
          onChange={(e) => onChange(field.id, e.target.value)}
        >
          {renderOptions(field.options, 0)}
        </select>
      </>
    );
  }

  return (
    <>
      <label htmlFor={field.id}>{field.label}</label>
      <input
        id={field.id}
        type={field.type}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.id, e.target.value)}
      />
    </>
  );
}

function renderFields(fields, index, values, onChange) {
  if (index >= fields.length) return null;
  const field = fields[index];
  return (
    <>
      <div key={field.id} className="settings-field">
        {renderField(field, values, onChange)}
      </div>
      {renderFields(fields, index + 1, values, onChange)}
    </>
  );
}

function renderGroups(groups, index, values, onChange) {
  if (index >= groups.length) return null;
  const group = groups[index];
  return (
    <>
      <section key={group.title} className="settings-section">
        <h2>{group.title}</h2>
        {renderFields(group.fields, 0, values, onChange)}
      </section>
      {renderGroups(groups, index + 1, values, onChange)}
    </>
  );
}

function validateFields(fields, index, values, errors) {
  if (index >= fields.length) return errors;
  const field = fields[index];
  const value = values[field.id];
  const next = { ...errors };

  if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    next[field.id] = 'Enter a valid email address';
  }

  if (field.type === 'text' && field.id === 'displayName' && !value.trim()) {
    next[field.id] = 'Display name is required';
  }

  return validateFields(fields, index + 1, values, next);
}

function validateGroups(groups, index, values, errors) {
  if (index >= groups.length) return errors;
  const merged = validateFields(groups[index].fields, 0, values, errors);
  return validateGroups(groups, index + 1, values, merged);
}

function renderErrors(fields, index, errors) {
  if (index >= fields.length) return null;
  const field = fields[index];
  const message = errors[field.id];
  return (
    <>
      {message ? (
        <p key={field.id} className="settings-error">
          {message}
        </p>
      ) : null}
      {renderErrors(fields, index + 1, errors)}
    </>
  );
}

function collectFields(groups, groupIndex, fieldIndex, acc) {
  if (groupIndex >= groups.length) return acc;
  const group = groups[groupIndex];
  if (fieldIndex >= group.fields.length) {
    return collectFields(groups, groupIndex + 1, 0, acc);
  }
  return collectFields(groups, groupIndex, fieldIndex + 1, [...acc, group.fields[fieldIndex]]);
}

function SettingsForm({ onSave }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const handleChange = (id, value) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateGroups(FIELD_GROUPS, 0, values, {});
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      if (onSave) onSave(values);
      setSaved(true);
    }
  };

  const handleReset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setSaved(false);
  };

  const allFields = collectFields(FIELD_GROUPS, 0, 0, []);

  return (
    <div className="settings-form-wrapper">
      <style>{`
        .settings-form-wrapper {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 520px;
          margin: 0 auto;
          padding: 2rem;
        }
        .settings-form-wrapper h1 {
          margin: 0 0 0.25rem;
          font-size: 1.75rem;
          font-weight: 600;
          color: #111;
        }
        .settings-form-wrapper .settings-subtitle {
          margin: 0 0 2rem;
          color: #666;
          font-size: 0.95rem;
        }
        .settings-section {
          margin-bottom: 2rem;
        }
        .settings-section h2 {
          margin: 0 0 1rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #888;
        }
        .settings-field {
          margin-bottom: 1rem;
        }
        .settings-field label {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #333;
        }
        .settings-field input[type="text"],
        .settings-field input[type="email"],
        .settings-field textarea,
        .settings-field select {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95rem;
          box-sizing: border-box;
          background: #fff;
          transition: border-color 0.15s;
        }
        .settings-field input:focus,
        .settings-field textarea:focus,
        .settings-field select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        .settings-field textarea {
          resize: vertical;
          min-height: 80px;
        }
        .settings-checkbox {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.95rem;
          color: #333;
        }
        .settings-checkbox input {
          width: 1rem;
          height: 1rem;
          accent-color: #4f46e5;
        }
        .settings-error {
          margin: -0.5rem 0 0.75rem;
          font-size: 0.8rem;
          color: #dc2626;
        }
        .settings-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
        }
        .settings-actions button {
          padding: 0.6rem 1.25rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .settings-actions .btn-primary {
          background: #4f46e5;
          color: #fff;
          border: none;
        }
        .settings-actions .btn-primary:hover {
          background: #4338ca;
        }
        .settings-actions .btn-secondary {
          background: #fff;
          color: #333;
          border: 1px solid #ddd;
        }
        .settings-actions .btn-secondary:hover {
          background: #f9fafb;
        }
        .settings-success {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          color: #166534;
          font-size: 0.875rem;
        }
      `}</style>

      <h1>Settings</h1>
      <p className="settings-subtitle">Manage your account preferences and profile.</p>

      <form onSubmit={handleSubmit}>
        {renderGroups(FIELD_GROUPS, 0, values, handleChange)}
        {renderErrors(allFields, 0, errors)}

        <div className="settings-actions">
          <button type="submit" className="btn-primary">
            Save changes
          </button>
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        {saved ? (
          <p className="settings-success">Settings saved successfully.</p>
        ) : null}
      </form>
    </div>
  );
}

export default SettingsForm;
