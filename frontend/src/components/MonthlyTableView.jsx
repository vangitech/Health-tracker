import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';
import EntryForm from './EntryForm';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonNote,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline, downloadOutline, addOutline, closeOutline } from 'ionicons/icons';

const getGlucoseColor = (value, isFasting) => {
  if (!value) return { bg: 'bg-zinc-800/40', text: 'text-zinc-600', label: 'No data' };
  if (isFasting) {
    if (value >= 3.9 && value <= 6.1) return { bg: 'bg-emerald-900/30', text: 'text-emerald-400', label: 'Normal' };
    if (value < 3.9) return { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Low' };
    return { bg: 'bg-red-900/30', text: 'text-red-400', label: 'High' };
  } else {
    if (value >= 3.9 && value <= 10.0) return { bg: 'bg-emerald-900/30', text: 'text-emerald-400', label: 'Normal' };
    if (value > 10.0) return { bg: 'bg-red-900/30', text: 'text-red-400', label: 'High' };
    return { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Low' };
  }
};

export default function MonthlyTableView({ entries, onDataChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMealType, setFormMealType] = useState(null);
  const [formDate, setFormDate] = useState(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEntryForDayAndMeal = (date, mealType) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(
      (e) => format(new Date(e.date), 'yyyy-MM-dd') === dateStr && e.mealType === mealType
    );
  };

  const handleAddOrEdit = (date, mealType, existingEntry = null) => {
    setFormDate(date);
    setFormMealType(mealType);
    setSelectedEntry(existingEntry);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedEntry(null);
    onDataChange();
  };

  const handleClose = () => {
    setShowForm(false);
    setSelectedEntry(null);
  };

  const exportToExcel = () => {
    const worksheetData = [];
    worksheetData.push([
      'Date', 'FBS (mmol/L)', 'FBS Time',
      'Breakfast (mmol/L)', 'Breakfast Food', 'Breakfast Carbs', 'Breakfast Insulin', 'Breakfast Notes',
      'Lunch (mmol/L)', 'Lunch Food', 'Lunch Carbs', 'Lunch Insulin', 'Lunch Notes',
      'Dinner (mmol/L)', 'Dinner Food', 'Dinner Carbs', 'Dinner Insulin', 'Dinner Notes'
    ]);

    days.forEach((day) => {
      const fbs = getEntryForDayAndMeal(day, 'fbs');
      const breakfast = getEntryForDayAndMeal(day, 'breakfast');
      const lunch = getEntryForDayAndMeal(day, 'lunch');
      const dinner = getEntryForDayAndMeal(day, 'dinner');

      worksheetData.push([
        format(day, 'yyyy-MM-dd'),
        fbs?.glucoseValue || '', fbs?.time || '',
        breakfast?.glucoseValue || '', breakfast?.foodEaten || '', breakfast?.carbs || '', breakfast?.insulinUnits || '', breakfast?.notes || '',
        lunch?.glucoseValue || '', lunch?.foodEaten || '', lunch?.carbs || '', lunch?.insulinUnits || '', lunch?.notes || '',
        dinner?.glucoseValue || '', dinner?.foodEaten || '', dinner?.carbs || '', dinner?.insulinUnits || '', dinner?.notes || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Blood Sugar Log');
    XLSX.writeFile(wb, `blood_sugar_${format(currentMonth, 'yyyy-MM')}.xlsx`);
  };

  return (
    <>
      <IonCard className="m-0 overflow-hidden">
        {/* Month Navigation & Export */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-1">
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="ion-no-padding"
            >
              <IonIcon slot="icon-only" icon={chevronBackOutline} className="size-5" />
            </IonButton>
            <span className="text-sm font-semibold text-zinc-100 min-w-[150px] text-center select-none">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <IonButton
              fill="clear"
              size="small"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="ion-no-padding"
            >
              <IonIcon slot="icon-only" icon={chevronForwardOutline} className="size-5" />
            </IonButton>
          </div>
          <IonButton
            size="small"
            onClick={exportToExcel}
            className="text-xs"
          >
            <IonIcon slot="start" icon={downloadOutline} className="size-4" />
            Export
          </IonButton>
        </div>

        {/* Scrollable Table */}
        <IonCardContent className="p-0 overflow-x-auto">
          <table className="min-w-[700px] w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th className="p-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider sticky left-0 bg-zinc-900/95 z-10 border-b border-zinc-800/50 min-w-[70px]">
                  Date
                </th>
                {['FBS', 'Breakfast', 'Lunch', 'Dinner'].map((meal) => (
                  <th key={meal} className="p-3 text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 min-w-[110px]">
                    {meal}
                    <span className="block text-[9px] font-normal text-zinc-700 tracking-normal mt-0.5">
                      {meal === 'FBS' ? '3.9–6.1' : '3.9–10'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day) => {
                const meals = ['fbs', 'breakfast', 'lunch', 'dinner'];
                const entries_map = meals.map(m => ({
                  mealType: m,
                  entry: getEntryForDayAndMeal(day, m)
                }));

                return (
                  <tr key={day.toISOString()} className="border-b border-zinc-800/20 hover:bg-zinc-800/10 transition-colors">
                    <td className="p-2.5 text-sm font-medium text-zinc-400 sticky left-0 bg-zinc-900 z-10">
                      {format(day, 'd MMM')}
                    </td>
                    {entries_map.map(({ mealType, entry }) => {
                      const isFasting = mealType === 'fbs';
                      const colors = getGlucoseColor(entry?.glucoseValue, isFasting);
                      return (
                        <td key={mealType} className="p-1.5">
                          <button
                            onClick={() => handleAddOrEdit(day, mealType, entry)}
                            className={`w-full p-2 rounded-xl cursor-pointer transition-all active:scale-[0.97] ${colors.bg} hover:ring-1 hover:ring-zinc-600 text-left min-h-[52px]`}
                          >
                            {entry ? (
                              <div>
                                <div className={`text-sm font-bold ${colors.text} leading-tight`}>
                                  {entry.glucoseValue}
                                  <span className="text-[9px] font-normal opacity-50 ml-0.5">mmol/L</span>
                                </div>
                                <div className="text-[10px] text-zinc-600 mt-0.5">{entry.time}</div>
                                {entry.foodEaten && (
                                  <div className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[100px]">{entry.foodEaten}</div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-[42px]">
                                <IonIcon icon={addOutline} className="size-4 text-zinc-700" />
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {days.length === 0 && (
            <div className="text-center py-12">
              <IonNote className="text-zinc-600">No data for this month</IonNote>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* Ionic Modal for Add/Edit */}
      <IonModal isOpen={showForm} onDidDismiss={handleClose} className="entry-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle className="text-sm font-semibold">
              {selectedEntry ? 'Edit' : 'Add'} {formMealType === 'fbs' ? 'Fasting' : formMealType || ''} Reading
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleClose}>
                <IonIcon slot="icon-only" icon={closeOutline} className="size-5" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <div className="p-5 pt-2">
          <EntryForm
            entryToEdit={selectedEntry}
            presetDate={formDate}
            presetMealType={formMealType}
            onSuccess={handleFormSuccess}
            onCancel={handleClose}
          />
        </div>
      </IonModal>
    </>
  );
}
