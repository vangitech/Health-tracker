import { useState } from 'react';
import axios from '../lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Trash2,
  Clock,
  CalendarDays,
  Activity,
  Utensils,
  StickyNote,
  Droplets,
  Syringe,
  FlaskConical,
} from 'lucide-react';

export default function EntryForm({ onSuccess, onCancel, entryToEdit, presetDate, presetMealType }) {
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    date:
      entryToEdit?.date?.split('T')[0] ||
      (presetDate ? format(presetDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    time: entryToEdit?.time || getCurrentTime(),
    glucoseValue: entryToEdit?.glucoseValue !== undefined ? Number(entryToEdit.glucoseValue).toFixed(1) : '',
    mealType: entryToEdit?.mealType || presetMealType || 'breakfast',
    foodEaten: entryToEdit?.foodEaten || '',
    carbs: entryToEdit?.carbs !== undefined ? entryToEdit.carbs : '',
    insulinUnits: entryToEdit?.insulinUnits !== undefined ? entryToEdit.insulinUnits : '',
    notes: entryToEdit?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateGlucose = () => {
    const val = parseFloat(formData.glucoseValue);
    if (isNaN(val)) return 'Glucose value is required';
    return null;
  };

  const handleDelete = async () => {
    if (!entryToEdit?._id) return;
    setLoading(true);
    setError('');
    try {
      await axios.delete(`/api/entries/${entryToEdit._id}`);
      onSuccess({ _id: entryToEdit._id, _deleted: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete entry');
      setLoading(false);
    }
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
      glucoseValue: parseFloat(formData.glucoseValue),
    };

    try {
      let saved;
      if (entryToEdit?._id) {
        const { data } = await axios.put(`/api/entries/${entryToEdit._id}`, payload);
        saved = data;
      } else {
        const { data } = await axios.post('/api/entries', payload);
        saved = data;
      }
      onSuccess(saved);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="bg-red-900/30 border border-red-800/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-red-400 shrink-0" />
          {error}
        </div>
      )}

      {/* Date & Time */}
      <div className="bg-zinc-800/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Clock className="size-3.5 text-zinc-600" />
          Date & Time
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <CalendarDays className="size-3 inline mr-1 -mt-0.5" />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <Clock className="size-3 inline mr-1 -mt-0.5" />
              Time
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Glucose Reading */}
      <div className="bg-zinc-800/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Activity className="size-3.5 text-zinc-600" />
          Glucose Reading
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Blood Glucose (mmol/L)</label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              name="glucoseValue"
              value={formData.glucoseValue}
              onChange={handleChange}
              required
              placeholder={formData.mealType === 'fbs' ? '3.9 – 6.1' : '3.9 – 10.0'}
              className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
            />
            <FlaskConical className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-zinc-600 pointer-events-none" />
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            {formData.mealType === 'fbs'
              ? 'Target range: 3.9 – 6.1 mmol/L (fasting)'
              : 'Target range: 3.9 – 10.0 mmol/L (2 hours after meal)'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Meal Type</label>
          <select
            name="mealType"
            value={formData.mealType}
            onChange={handleChange}
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
          >
            <option value="fbs">Fasting (FBS)</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
      </div>

      {/* Meal Details */}
      <div className="bg-zinc-800/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <Utensils className="size-3.5 text-zinc-600" />
          Meal Details
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Food Eaten</label>
          <input
            type="text"
            name="foodEaten"
            value={formData.foodEaten}
            onChange={handleChange}
            placeholder="Describe your meal (optional)"
            className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <Droplets className="size-3 inline mr-1 -mt-0.5" />
              Carbs (g)
            </label>
            <input
              type="number"
              name="carbs"
              value={formData.carbs}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              <Syringe className="size-3 inline mr-1 -mt-0.5" />
              Insulin (units)
            </label>
            <input
              type="number"
              step="0.5"
              name="insulinUnits"
              value={formData.insulinUnits}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-zinc-800/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          <StickyNote className="size-3.5 text-zinc-600" />
          Notes
        </div>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Any additional notes..."
          className="w-full px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700/50 text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/40 transition-all resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-sky-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Saving...
            </span>
          ) : entryToEdit ? (
            'Update Entry'
          ) : (
            'Save Entry'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-[0.98] transition-all"
        >
          Cancel
        </button>
        {entryToEdit && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={loading}
            className="px-3 py-2.5 rounded-lg text-sm font-semibold bg-red-900/40 text-red-400 hover:bg-red-800/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="bg-zinc-900 border border-red-900/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">Delete Entry</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Are you sure you want to delete this entry? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                  className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
