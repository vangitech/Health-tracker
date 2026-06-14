import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';
import EntryForm from './EntryForm';
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent, IonNote,
} from '@ionic/react';
import {
  chevronBackOutline, chevronForwardOutline, downloadOutline,
  addOutline, closeOutline,
} from 'ionicons/icons';

const getGlucoseColor = (value, isFasting) => {
  if (!value) return { dot: 'bg-zinc-700', text: 'text-zinc-600', label: '' };
  if (isFasting) {
    if (value >= 3.9 && value <= 6.1) return { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Normal' };
    if (value < 3.9) return { dot: 'bg-rose-400', text: 'text-rose-400', label: 'Low' };
    return { dot: 'bg-rose-400', text: 'text-rose-400', label: 'High' };
  }
  if (value >= 3.9 && value <= 10.0) return { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Normal' };
  if (value > 10.0) return { dot: 'bg-rose-400', text: 'text-rose-400', label: 'High' };
  return { dot: 'bg-rose-400', text: 'text-rose-400', label: 'Low' };
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
    const header = [
      'Date', 'FBS (mmol/L)', 'FBS Time',
      'Breakfast (mmol/L)', 'Breakfast Food', 'Breakfast Carbs', 'Breakfast Insulin', 'Breakfast Notes',
      'Lunch (mmol/L)', 'Lunch Food', 'Lunch Carbs', 'Lunch Insulin', 'Lunch Notes',
      'Dinner (mmol/L)', 'Dinner Food', 'Dinner Carbs', 'Dinner Insulin', 'Dinner Notes'
    ];
    const data = [header];

    days.forEach((day) => {
      const fbs = getEntryForDayAndMeal(day, 'fbs');
      const breakfast = getEntryForDayAndMeal(day, 'breakfast');
      const lunch = getEntryForDayAndMeal(day, 'lunch');
      const dinner = getEntryForDayAndMeal(day, 'dinner');
      data.push([
        format(day, 'yyyy-MM-dd'),
        fbs?.glucoseValue || '', fbs?.time || '',
        breakfast?.glucoseValue || '', breakfast?.foodEaten || '', breakfast?.carbs || '', breakfast?.insulinUnits || '', breakfast?.notes || '',
        lunch?.glucoseValue || '', lunch?.foodEaten || '', lunch?.carbs || '', lunch?.insulinUnits || '', lunch?.notes || '',
        dinner?.glucoseValue || '', dinner?.foodEaten || '', dinner?.carbs || '', dinner?.insulinUnits || '', dinner?.notes || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Blood Sugar Log');
    XLSX.writeFile(wb, `blood_sugar_${format(currentMonth, 'yyyy-MM')}.xlsx`);
  };

  const mealTypes = [
    { key: 'fbs', label: 'FBS' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
  ];

  return (
    <>
      <IonCard className="m-0 overflow-hidden mt-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-0.5">
            <IonButton fill="clear" size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <IonIcon slot="icon-only" icon={chevronBackOutline} className="size-[18px] text-zinc-400" />
            </IonButton>
            <span className="text-sm font-bold text-zinc-100 min-w-[140px] text-center select-none">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <IonButton fill="clear" size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <IonIcon slot="icon-only" icon={chevronForwardOutline} className="size-[18px] text-zinc-400" />
            </IonButton>
          </div>
          <IonButton size="small" onClick={exportToExcel} className="text-xs font-semibold h-8">
            <IonIcon slot="start" icon={downloadOutline} className="size-3.5" />
            Export
          </IonButton>
        </div>

        <IonCardContent className="p-0 overflow-x-auto">
          {days.length === 0 ? (
            <div className="text-center py-12">
              <IonNote className="text-zinc-600 text-sm">No data for this month</IonNote>
            </div>
          ) : (
            <table className="w-full" style={{ minWidth: 640, borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="p-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider sticky left-0 bg-zinc-900/95 z-10 border-b border-zinc-800/50 w-[68px]">
                    Date
                  </th>
                  {mealTypes.map(({ key, label }) => (
                    <th key={key} className="p-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50 min-w-[100px]">
                      {label}
                      <span className="block text-[8px] font-medium text-zinc-700 tracking-normal mt-0.5">
                        {key === 'fbs' ? '3.9–6.1' : '3.9–10.0'} mmol/L
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.toISOString()} className="border-b border-zinc-800/15 hover:bg-zinc-800/10 transition-colors">
                    <td className="p-2.5 text-sm font-semibold text-zinc-400 sticky left-0 bg-zinc-900 z-10">
                      {format(day, 'd')}
                      <span className="block text-[9px] font-medium text-zinc-600 uppercase tracking-wider mt-0.5">
                        {format(day, 'MMM')}
                      </span>
                    </td>
                    {mealTypes.map(({ key, isFasting }) => {
                      const entry = getEntryForDayAndMeal(day, key);
                      const colors = getGlucoseColor(entry?.glucoseValue, key === 'fbs');
                      return (
                        <td key={key} className="p-1.5">
                          <button
                            onClick={() => handleAddOrEdit(day, key, entry)}
                            className="w-full p-2.5 rounded-xl cursor-pointer active:scale-[0.97] transition-all bg-zinc-800/20 hover:bg-zinc-800/40 min-h-[52px] text-left"
                          >
                            {entry ? (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`size-1.5 rounded-full ${colors.dot}`} />
                                  <span className={`text-sm font-bold ${colors.text} leading-tight`}>
                                    {entry.glucoseValue}
                                  </span>
                                </div>
                                <div className="text-[10px] font-medium text-zinc-600 ml-3">
                                  {entry.time}
                                  {entry.foodEaten && (
                                    <span className="text-zinc-500 ml-1.5 truncate inline-block max-w-[80px] align-bottom">
                                      · {entry.foodEaten}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-[40px]">
                                <IonIcon icon={addOutline} className="size-4 text-zinc-700" />
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </IonCardContent>
      </IonCard>

      <IonModal isOpen={showForm} onDidDismiss={handleClose} className="entry-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle className="text-sm font-bold">
              {selectedEntry ? 'Edit' : 'Add'} {formMealType === 'fbs' ? 'Fasting' : formMealType || ''} Reading
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleClose}>
                <IonIcon slot="icon-only" icon={closeOutline} className="size-5 text-zinc-400" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <div className="px-5 pb-5 pt-3">
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
