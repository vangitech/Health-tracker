import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/axios', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    form: 'form',
    div: 'div',
  },
  AnimatePresence: ({ children }) => children,
}));

import EntryForm from '../EntryForm';
import axios from '../../lib/axios';

const defaultProps = {
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
};

function getFormData() {
  return {
    date: '2024-01-15',
    time: '09:00',
    glucoseValue: '5.5',
    mealType: 'breakfast',
    foodEaten: 'Oatmeal',
    carbs: '30',
    insulinUnits: '5',
    notes: 'Test note',
  };
}

function fillForm(user, container) {
  const dateInput = container.querySelector('input[name="date"]');
  const timeInput = container.querySelector('input[name="time"]');
  const glucoseInput = container.querySelector('input[name="glucoseValue"]');
  const foodInput = container.querySelector('input[name="foodEaten"]');
  const carbsInput = container.querySelector('input[name="carbs"]');
  const insulinInput = container.querySelector('input[name="insulinUnits"]');
  const notesInput = container.querySelector('textarea');

  return {
    async fill(data = getFormData()) {
      if (data.date && dateInput) await user.type(dateInput, data.date);
      if (data.time && timeInput) await user.type(timeInput, data.time);
      if (data.glucoseValue && glucoseInput) {
        await user.clear(glucoseInput);
        await user.type(glucoseInput, data.glucoseValue);
      }
      if (data.foodEaten && foodInput) await user.type(foodInput, data.foodEaten);
      if (data.carbs && carbsInput) await user.type(carbsInput, data.carbs);
      if (data.insulinUnits && insulinInput) await user.type(insulinInput, data.insulinUnits);
      if (data.notes && notesInput) await user.type(notesInput, data.notes);
    },
  };
}

describe('EntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with all fields', () => {
    const { container } = render(<EntryForm {...defaultProps} />);
    expect(container.querySelector('input[name="date"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="time"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="glucoseValue"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="mealType"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="foodEaten"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="carbs"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="insulinUnits"]')).toBeInTheDocument();
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('shows Save button in create mode and hides delete button', () => {
    render(<EntryForm {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.queryByTitle('Delete entry')).not.toBeInTheDocument();
  });

  it('shows Update and Delete buttons in edit mode', () => {
    const entryToEdit = {
      _id: '123',
      date: '2024-01-15T00:00:00',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    };
    render(<EntryForm {...defaultProps} entryToEdit={entryToEdit} />);
    expect(screen.getByText('Update')).toBeInTheDocument();
    expect(screen.getByTitle('Delete entry')).toBeInTheDocument();
  });

  it('shows error on submit with empty glucose value', async () => {
    render(<EntryForm {...defaultProps} />);
    fireEvent.submit(screen.getByRole('button', { name: /save/i }).closest('form'));
    expect(await screen.findByText(/required/i)).toBeInTheDocument();
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('submits form successfully in create mode', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    axios.post.mockResolvedValueOnce({
      data: { _id: 'new-id', glucoseValue: 5.5 },
    });

    const { container } = render(<EntryForm {...defaultProps} onSuccess={onSuccess} />);
    const glucoseInput = container.querySelector('input[name="glucoseValue"]');
    await user.clear(glucoseInput);
    await user.type(glucoseInput, '5.5');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ _id: 'new-id', glucoseValue: 5.5 });
    });
    expect(axios.post).toHaveBeenCalledWith('/api/entries', expect.objectContaining({ glucoseValue: 5.5 }));
  });

  it('submits form successfully in edit mode', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const entryToEdit = {
      _id: 'edit-id',
      date: '2024-01-15T00:00:00',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    };
    axios.put.mockResolvedValueOnce({ data: { _id: 'edit-id', glucoseValue: 6.0 } });

    const { container } = render(<EntryForm {...defaultProps} onSuccess={onSuccess} entryToEdit={entryToEdit} />);
    const glucoseInput = container.querySelector('input[name="glucoseValue"]');
    await user.clear(glucoseInput);
    await user.type(glucoseInput, '6.0');
    await user.click(screen.getByText('Update'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ _id: 'edit-id', glucoseValue: 6.0 });
    });
    expect(axios.put).toHaveBeenCalledWith('/api/entries/edit-id', expect.any(Object));
  });

  it('shows error message from API on failure', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Server error occurred' } },
    });

    const { container } = render(<EntryForm {...defaultProps} />);
    const glucoseInput = container.querySelector('input[name="glucoseValue"]');
    await user.clear(glucoseInput);
    await user.type(glucoseInput, '5.5');
    await user.click(screen.getByText('Save'));

    expect(await screen.findByText('Server error occurred')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<EntryForm {...defaultProps} onCancel={onCancel} />);
    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('opens delete confirmation modal', async () => {
    const user = userEvent.setup();
    const entryToEdit = {
      _id: '123',
      date: '2024-01-15T00:00:00',
      time: '09:00',
      glucoseValue: 5.5,
      mealType: 'breakfast',
    };
    render(<EntryForm {...defaultProps} entryToEdit={entryToEdit} />);
    await user.click(screen.getByTitle('Delete entry'));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it('deletes entry when confirmed', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const entryToEdit = { _id: 'delete-id', glucoseValue: 5.5, mealType: 'breakfast' };
    axios.delete.mockResolvedValueOnce({});

    render(<EntryForm {...defaultProps} onSuccess={onSuccess} entryToEdit={entryToEdit} />);
    await user.click(screen.getByTitle('Delete entry'));
    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ _id: 'delete-id', _deleted: true });
    });
    expect(axios.delete).toHaveBeenCalledWith('/api/entries/delete-id');
  });
});
