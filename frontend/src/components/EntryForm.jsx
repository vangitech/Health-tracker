import { useState } from 'react';
import axios from '../lib/axios';
import { motion } from 'framer-motion';

export default function EntryForm({ onSuccess, onCancel, entryToEdit, presetDate, presetMealType }) {
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    date: entryToEdit?.date?.split('T')[0] || presetDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    time: entryToEdit?.time || getCurrentTime(),
    glucoseValue: entryToEdit?.glucoseValue || '',
    mealType: entryToEdit?.mealType || presetMealType || 'breakfast',
    foodEaten: entryToEdit?.foodEaten || '',
    carbs: entryToEdit?.carbs !== undefined ? entryToEdit.carbs : '',
    insulinUnits: entryToEdit?.insulinUnits !== undefined ? entryToEdit.insulinUnits : '',
    notes: entryToEdit?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateGlucose = () => {
    const val = parseFloat(formData.glucoseValue);
    if (isNaN(val)) return 'Glucose value is required';
    if (formData.mealType === 'fbs') {
      if (val < 3.9 || val > 6.1) return 'Fasting glucose must be between 3.9 and 6.1 mmol/L';
    } else {
      if (val < 3.9 || val > 10.0) return 'Post-meal glucose must be between 3.9 and 10.0 mmol/L';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateGlucose();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      carbs: formData.carbs === '' ? 0 : Number(formData.carbs),
      insulinUnits: formData.insulinUnits === '' ? 0 : Number(formData.insulinUnits),
      glucoseValue: parseFloat(formData.glucoseValue)
    };

    try {
      if (entryToEdit?._id) {
        await axios.put(`/api/entries/${entryToEdit._id}`, payload);
      } else {
        await axios.post('/api/entries', payload);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {error && (
        <div className="bg-red-900/30 border border-red-800/30 text-red-400 p-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Time</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Blood Glucose (mmol/L)
        </label>
        <input
          type="number"
          step="0.1"
          name="glucoseValue"
          value={formData.glucoseValue}
          onChange={handleChange}
          required
          placeholder={formData.mealType === 'fbs' ? '3.9 – 6.1' : '3.9 – 10.0'}
          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
        />
        <p className="text-xs text-zinc-500 mt-1.5">
          {formData.mealType === 'fbs'
            ? 'Target range: 3.9 – 6.1 mmol/L (fasting)'
            : 'Target range: 3.9 – 10.0 mmol/L (2 hours after meal)'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Meal Type</label>
        <select
          name="mealType"
          value={formData.mealType}
          onChange={handleChange}
          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
        >
          <option value="fbs">Fasting (FBS)</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Food Eaten</label>
        <input
          type="text"
          name="foodEaten"
          value={formData.foodEaten}
          onChange={handleChange}
          placeholder="Describe your meal (optional)"
          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Carbs (g)</label>
          <input
            type="number"
            name="carbs"
            value={formData.carbs}
            onChange={handleChange}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Insulin (units)</label>
          <input
            type="number"
            step="0.5"
            name="insulinUnits"
            value={formData.insulinUnits}
            onChange={handleChange}
            placeholder="Optional"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Any additional notes..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-sky-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : entryToEdit ? 'Update' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
