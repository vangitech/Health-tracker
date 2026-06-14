import { useState } from 'react';
import axios from '../lib/axios';
import {
  IonInput, IonButton, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonTextarea, IonNote, IonIcon,
} from '@ionic/react';

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

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
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
    <form onSubmit={handleSubmit} className="space-y-1">
      {error && (
        <div className="bg-red-900/30 border border-red-800/30 text-red-400 p-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <IonItem className="ion-no-padding custom-form-item">
          <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Date</IonLabel>
          <IonInput
            type="date"
            value={formData.date}
            onIonInput={(e) => handleChange('date', e.detail.value)}
            required
            mode="md"
          />
        </IonItem>
        <IonItem className="ion-no-padding custom-form-item">
          <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Time</IonLabel>
          <IonInput
            type="time"
            value={formData.time}
            onIonInput={(e) => handleChange('time', e.detail.value)}
            required
            mode="md"
          />
        </IonItem>
      </div>

      <IonItem className="ion-no-padding custom-form-item">
        <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">
          Blood Glucose (mmol/L)
        </IonLabel>
        <IonInput
          type="number"
          step="0.1"
          value={formData.glucoseValue}
          onIonInput={(e) => handleChange('glucoseValue', e.detail.value)}
          required
          placeholder={formData.mealType === 'fbs' ? '3.9 – 6.1' : '3.9 – 10.0'}
          mode="md"
        />
        <IonNote slot="helper" className="text-[10px] text-zinc-600">
          {formData.mealType === 'fbs'
            ? 'Target: 3.9 – 6.1 mmol/L (fasting)'
            : 'Target: 3.9 – 10.0 mmol/L (2h after meal)'}
        </IonNote>
      </IonItem>

      <IonItem className="ion-no-padding custom-form-item">
        <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Meal Type</IonLabel>
        <IonSelect
          value={formData.mealType}
          onIonChange={(e) => handleChange('mealType', e.detail.value)}
          interface="action-sheet"
          className="w-full"
          mode="md"
        >
          <IonSelectOption value="fbs">Fasting (FBS)</IonSelectOption>
          <IonSelectOption value="breakfast">Breakfast</IonSelectOption>
          <IonSelectOption value="lunch">Lunch</IonSelectOption>
          <IonSelectOption value="dinner">Dinner</IonSelectOption>
        </IonSelect>
      </IonItem>

      <IonItem className="ion-no-padding custom-form-item">
        <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Food Eaten</IonLabel>
        <IonInput
          type="text"
          value={formData.foodEaten}
          onIonInput={(e) => handleChange('foodEaten', e.detail.value)}
          placeholder="Describe your meal (optional)"
          mode="md"
        />
      </IonItem>

      <div className="grid grid-cols-2 gap-3">
        <IonItem className="ion-no-padding custom-form-item">
          <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Carbs (g)</IonLabel>
          <IonInput
            type="number"
            value={formData.carbs}
            onIonInput={(e) => handleChange('carbs', e.detail.value)}
            placeholder="Optional"
            mode="md"
          />
        </IonItem>
        <IonItem className="ion-no-padding custom-form-item">
          <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Insulin (units)</IonLabel>
          <IonInput
            type="number"
            step="0.5"
            value={formData.insulinUnits}
            onIonInput={(e) => handleChange('insulinUnits', e.detail.value)}
            placeholder="Optional"
            mode="md"
          />
        </IonItem>
      </div>

      <IonItem className="ion-no-padding custom-form-item">
        <IonLabel position="stacked" className="text-xs font-medium text-zinc-400">Notes</IonLabel>
        <IonTextarea
          value={formData.notes}
          onIonInput={(e) => handleChange('notes', e.detail.value)}
          rows={2}
          placeholder="Any additional notes..."
          mode="md"
        />
      </IonItem>

      <div className="flex gap-3 pt-4">
        <IonButton
          type="submit"
          disabled={loading}
          expand="block"
          className="flex-1"
        >
          {loading ? 'Saving...' : entryToEdit ? 'Update' : 'Save'}
        </IonButton>
        <IonButton
          type="button"
          onClick={onCancel}
          expand="block"
          fill="outline"
          className="flex-1"
        >
          Cancel
        </IonButton>
      </div>
    </form>
  );
}
