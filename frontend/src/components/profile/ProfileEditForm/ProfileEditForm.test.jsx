import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileEditForm from './ProfileEditForm';

// Mocking CSS module paths to intercept runtime style execution blocks
vi.mock('./ProfileEditForm.module.css', () => ({
  default: { form: 'mocked-form-class' },
}));

vi.mock('../../../pages/ProfilePage/ProfilePage.module.css', () => ({
  default: {
    actions: 'mocked-actions-class',
    btnSave: 'mocked-btnSave-class',
    btnCancel: 'mocked-btnCancel-class',
  },
}));

describe('ProfileEditForm Configuration & Value Tracking Suite', () => {
  const mockFormData = {
    displayName: 'Jane Doe',
    bio: 'Frontend architecture explorer.',
    themePreference: 'EMERALD',
  };

  test('pre-fills layout input fields correctly with incoming form data properties', () => {
    render(
      <ProfileEditForm
        formData={mockFormData}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/display name/i)).toHaveValue('Jane Doe');
    expect(screen.getByLabelText(/bio/i)).toHaveValue('Frontend architecture explorer.');
    expect(screen.getByLabelText(/theme preference/i)).toHaveValue('EMERALD');
  });

  test('renders all available enum options within the theme selector layout wrapper', () => {
    render(
      <ProfileEditForm
        formData={mockFormData}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const selectEl = screen.getByLabelText(/theme preference/i);
    const options = Array.from(selectEl.querySelectorAll('option'));
    const values = options.map((opt) => opt.value);

    expect(values).toEqual(['SLATE', 'EMERALD', 'OCEAN', 'AMETHYST', 'ROSE']);
  });

  test('triggers the onChange handler with updated values when modifying text input parameters', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileEditForm
        formData={mockFormData}
        onChange={handleChange}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/display name/i);
    await user.type(nameInput, '!');

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...mockFormData,
      displayName: 'Jane Doe!',
    });
  });

  test('triggers the onChange handler with appropriate enum options when selection fields change', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileEditForm
        formData={mockFormData}
        onChange={handleChange}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const selectEl = screen.getByLabelText(/theme preference/i);
    await user.selectOptions(selectEl, 'AMETHYST');

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...mockFormData,
      themePreference: 'AMETHYST',
    });
  });

  test('dispatches save updates smoothly when clicking the primary action trigger button', async () => {
    const handleSave = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileEditForm
        formData={mockFormData}
        onChange={vi.fn()}
        onSave={handleSave}
        onCancel={vi.fn()}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save/i });
    await user.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  test('dispatches cleanup actions when clicking the cancel interface layout element', async () => {
    const handleCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ProfileEditForm
        formData={mockFormData}
        onChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
