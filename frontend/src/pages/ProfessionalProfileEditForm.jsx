import { useState } from 'react'
import { api } from '../services/api'

function createInitialValues(profile) {
  const professional = profile.professionalProfile || {}

  return {
    fullName: profile.fullName || '',
    profileImageUrl: profile.profileImageUrl || '',
    companyName: professional.companyName || '',
    industry: professional.industry || '',
    jobPosition: professional.jobPosition || '',
    skills: Array.isArray(professional.skills) ? professional.skills.join(', ') : '',
  }
}

function splitSkills(value) {
  return [...new Set(value.split(/[,\n]/).map((skill) => skill.trim()).filter(Boolean))]
}

function validate(values) {
  const errors = {}
  const requiredTextFields = [
    ['fullName', 'Full name', 120],
    ['companyName', 'Company name', 200],
    ['industry', 'Industry', 120],
    ['jobPosition', 'Job position', 150],
  ]

  requiredTextFields.forEach(([field, label, maxLength]) => {
    const value = values[field].trim()
    if (!value) {
      errors[field] = `${label} is required.`
    } else if (value.length > maxLength) {
      errors[field] = `${label} must be ${maxLength} characters or fewer.`
    }
  })

  if (values.profileImageUrl.trim().length > 2048) {
    errors.profileImageUrl = 'The image URL must be 2048 characters or fewer.'
  }

  const skills = splitSkills(values.skills)
  if (skills.length > 100) {
    errors.skills = 'Skills can contain at most 100 items.'
  } else if (skills.some((skill) => skill.length > 80)) {
    errors.skills = 'Each skill must be 80 characters or fewer.'
  }

  return errors
}

function ProfileField({ id, label, error, children }) {
  return (
    <div className="profile-edit-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="profile-edit-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function ProfessionalProfileEditForm({ profile, onCancel, onSaved }) {
  const [values, setValues] = useState(() => createInitialValues(profile))
  const [errors, setErrors] = useState({})
  const [formMessage, setFormMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (isSaving) return

    const validationErrors = validate(values)
    setErrors(validationErrors)
    setFormMessage('')
    if (Object.keys(validationErrors).length > 0) return

    const request = {
      fullName: values.fullName.trim(),
      profileImageUrl: values.profileImageUrl.trim() || null,
      companyName: values.companyName.trim(),
      industry: values.industry.trim(),
      jobPosition: values.jobPosition.trim(),
      skills: splitSkills(values.skills),
    }

    setIsSaving(true)
    try {
      const response = await api.put('/api/users/me', request)
      onSaved(response.data)
    } catch (error) {
      const status = error.response?.status

      if (status === 400) {
        setFormMessage('Please check your profile details and try again.')
      } else if (status === 401) {
        setFormMessage('Your session expired. Please sign in again.')
      } else if (status === 403) {
        setFormMessage('You are not allowed to update this profile.')
      } else if (error.request && !error.response) {
        setFormMessage(
          'Unable to reach UniConnect. Check that the backend is running and try again.',
        )
      } else if (status >= 500) {
        setFormMessage('The profile service is temporarily unavailable. Please try again.')
      } else {
        setFormMessage('We could not save your profile. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="profile-edit-card" onSubmit={handleSubmit} noValidate>
      <div className="profile-edit-heading">
        <div>
          <p className="dashboard-eyebrow">PROFILE DETAILS</p>
          <h2>Edit your profile</h2>
          <p>Update your professional information and skills.</p>
        </div>
        <span className="profile-edit-required">* Required</span>
      </div>

      <div className="profile-edit-grid">
        <ProfileField id="professional-edit-name" label="Full name *" error={errors.fullName}>
          <input
            id="professional-edit-name"
            name="fullName"
            value={values.fullName}
            onChange={updateField}
            maxLength={120}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'professional-edit-name-error' : undefined}
          />
        </ProfileField>

        <ProfileField
          id="professional-edit-image"
          label="Profile image URL"
          error={errors.profileImageUrl}
        >
          <input
            id="professional-edit-image"
            name="profileImageUrl"
            value={values.profileImageUrl}
            onChange={updateField}
            maxLength={2048}
            placeholder="https://example.com/your-photo.jpg"
            aria-invalid={Boolean(errors.profileImageUrl)}
            aria-describedby={
              errors.profileImageUrl ? 'professional-edit-image-error' : undefined
            }
          />
        </ProfileField>

        <ProfileField
          id="professional-edit-company"
          label="Company name *"
          error={errors.companyName}
        >
          <input
            id="professional-edit-company"
            name="companyName"
            value={values.companyName}
            onChange={updateField}
            maxLength={200}
            autoComplete="organization"
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={
              errors.companyName ? 'professional-edit-company-error' : undefined
            }
          />
        </ProfileField>

        <ProfileField
          id="professional-edit-industry"
          label="Industry *"
          error={errors.industry}
        >
          <input
            id="professional-edit-industry"
            name="industry"
            value={values.industry}
            onChange={updateField}
            maxLength={120}
            aria-invalid={Boolean(errors.industry)}
            aria-describedby={
              errors.industry ? 'professional-edit-industry-error' : undefined
            }
          />
        </ProfileField>

        <ProfileField
          id="professional-edit-position"
          label="Job position *"
          error={errors.jobPosition}
        >
          <input
            id="professional-edit-position"
            name="jobPosition"
            value={values.jobPosition}
            onChange={updateField}
            maxLength={150}
            aria-invalid={Boolean(errors.jobPosition)}
            aria-describedby={
              errors.jobPosition ? 'professional-edit-position-error' : undefined
            }
          />
        </ProfileField>

        <ProfileField id="professional-edit-skills" label="Skills" error={errors.skills}>
          <textarea
            id="professional-edit-skills"
            name="skills"
            rows="3"
            value={values.skills}
            onChange={updateField}
            placeholder="For example: Leadership, Data analysis, Mentoring"
            aria-invalid={Boolean(errors.skills)}
            aria-describedby={
              errors.skills
                ? 'professional-edit-skills-help professional-edit-skills-error'
                : 'professional-edit-skills-help'
            }
          />
          <span className="profile-edit-help" id="professional-edit-skills-help">
            Separate skills with commas or new lines.
          </span>
        </ProfileField>
      </div>

      {formMessage && (
        <p className="profile-edit-message" role="alert">
          {formMessage}
        </p>
      )}

      <div className="profile-edit-actions">
        <button
          className="profile-edit-cancel"
          type="button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button className="dashboard-primary-button" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default ProfessionalProfileEditForm
