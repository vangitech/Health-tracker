import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';
import EntryForm from './EntryForm';
import { ChevronLeft, ChevronRight, Download, Plus, Edit2, X, Calendar } from 'lucide-react';

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
      (e) => e.date?.split('T')[0] === dateStr && e.mealType === mealType
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

  const exportToExcel = () => {
    const worksheetData = [];
    worksheetData.push([
      'Date',
      'FBS (mmol/L)',
      'FBS Time',
      'Breakfast (mmol/L)',
      'Breakfast Food',
      'Breakfast Carbs',
      'Breakfast Insulin',
      'Breakfast Notes',
      'Lunch (mmol/L)',
      'Lunch Food',
      'Lunch Carbs',
      'Lunch Insulin',
      'Lunch Notes',
      'Dinner (mmol/L)',
      'Dinner Food',
      'Dinner Carbs',
      'Dinner Insulin',
      'Dinner Notes'
    ]);

    days.forEach((day) => {
      const fbs = getEntryForDayAndMeal(day, 'fbs');
      const breakfast = getEntryForDayAndMeal(day, 'breakfast');
      const lunch = getEntryForDayAndMeal(day, 'lunch');
      const dinner = getEntryForDayAndMeal(day, 'dinner');

      worksheetData.push([
        format(day, 'yyyy-MM-dd'),
        fbs?.glucoseValue || '',
        fbs?.time || '',
        breakfast?.glucoseValue || '',
        breakfast?.foodEaten || '',
        breakfast?.carbs || '',
        breakfast?.insulinUnits || '',
        breakfast?.notes || '',
        lunch?.glucoseValue || '',
        lunch?.foodEaten || '',
        lunch?.carbs || '',
        lunch?.insulinUnits || '',
        lunch?.notes || '',
        dinner?.glucoseValue || '',
        dinner?.foodEaten || '',
        dinner?.carbs || '',
        dinner?.insulinUnits || '',
        dinner?.notes || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Blood Sugar Log');
    XLSX.writeFile(wb, `blood_sugar_${format(currentMonth, 'yyyy-MM')}.xlsx`);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
      {/* Month Navigation & Export */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-zinc-100 min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="ml-2 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Go to current month"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[800px] w-full">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider sticky left-0 bg-zinc-900 z-10">
                Date
              </th>
              <th className="p-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                FBS
                <span className="block text-[10px] font-normal text-zinc-600 tracking-normal">3.9–6.1</span>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Breakfast
                <span className="block text-[10px] font-normal text-zinc-600 tracking-normal">3.9–10</span>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Lunch
                <span className="block text-[10px] font-normal text-zinc-600 tracking-normal">3.9–10</span>
              </th>
              <th className="p-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Dinner
                <span className="block text-[10px] font-normal text-zinc-600 tracking-normal">3.9–10</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const fbsEntry = getEntryForDayAndMeal(day, 'fbs');
              const breakfastEntry = getEntryForDayAndMeal(day, 'breakfast');
              const lunchEntry = getEntryForDayAndMeal(day, 'lunch');
              const dinnerEntry = getEntryForDayAndMeal(day, 'dinner');

              return (
                <tr key={day.toISOString()} className="border-t border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-3 text-sm font-medium text-zinc-300 sticky left-0 bg-zinc-900 z-10">
                    {format(day, 'd MMM')}
                  </td>

                  <td className="p-2">
                    <div
                      onClick={() => handleAddOrEdit(day, 'fbs', fbsEntry)}
                      className={`p-2.5 rounded-xl cursor-pointer transition ${getGlucoseColor(fbsEntry?.glucoseValue, true).bg} hover:ring-1 hover:ring-zinc-700`}
                    >
                      {fbsEntry ? (
                        <div>
                          <div className={`text-base font-bold ${getGlucoseColor(fbsEntry.glucoseValue, true).text}`}>
                            {fbsEntry.glucoseValue} <span className="text-[10px] font-normal opacity-60">mmol/L</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{fbsEntry.time}</div>
                          {fbsEntry.foodEaten && (
                            <div className="text-[11px] text-zinc-400 mt-1 truncate max-w-[120px]">{fbsEntry.foodEaten}</div>
                          )}
                          <div className="flex justify-end mt-1">
                            <Edit2 className="w-3 h-3 text-zinc-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[60px] text-zinc-600">
                          <Plus className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-2">
                    <div
                      onClick={() => handleAddOrEdit(day, 'breakfast', breakfastEntry)}
                      className={`p-2.5 rounded-xl cursor-pointer transition ${getGlucoseColor(breakfastEntry?.glucoseValue, false).bg} hover:ring-1 hover:ring-zinc-700`}
                    >
                      {breakfastEntry ? (
                        <div>
                          <div className={`text-base font-bold ${getGlucoseColor(breakfastEntry.glucoseValue, false).text}`}>
                            {breakfastEntry.glucoseValue} <span className="text-[10px] font-normal opacity-60">mmol/L</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{breakfastEntry.time}</div>
                          {breakfastEntry.foodEaten && (
                            <div className="text-[11px] text-zinc-400 mt-1 truncate max-w-[120px]">{breakfastEntry.foodEaten}</div>
                          )}
                          <div className="flex justify-end mt-1">
                            <Edit2 className="w-3 h-3 text-zinc-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[60px] text-zinc-600">
                          <Plus className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-2">
                    <div
                      onClick={() => handleAddOrEdit(day, 'lunch', lunchEntry)}
                      className={`p-2.5 rounded-xl cursor-pointer transition ${getGlucoseColor(lunchEntry?.glucoseValue, false).bg} hover:ring-1 hover:ring-zinc-700`}
                    >
                      {lunchEntry ? (
                        <div>
                          <div className={`text-base font-bold ${getGlucoseColor(lunchEntry.glucoseValue, false).text}`}>
                            {lunchEntry.glucoseValue} <span className="text-[10px] font-normal opacity-60">mmol/L</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{lunchEntry.time}</div>
                          {lunchEntry.foodEaten && (
                            <div className="text-[11px] text-zinc-400 mt-1 truncate max-w-[120px]">{lunchEntry.foodEaten}</div>
                          )}
                          <div className="flex justify-end mt-1">
                            <Edit2 className="w-3 h-3 text-zinc-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[60px] text-zinc-600">
                          <Plus className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-2">
                    <div
                      onClick={() => handleAddOrEdit(day, 'dinner', dinnerEntry)}
                      className={`p-2.5 rounded-xl cursor-pointer transition ${getGlucoseColor(dinnerEntry?.glucoseValue, false).bg} hover:ring-1 hover:ring-zinc-700`}
                    >
                      {dinnerEntry ? (
                        <div>
                          <div className={`text-base font-bold ${getGlucoseColor(dinnerEntry.glucoseValue, false).text}`}>
                            {dinnerEntry.glucoseValue} <span className="text-[10px] font-normal opacity-60">mmol/L</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{dinnerEntry.time}</div>
                          {dinnerEntry.foodEaten && (
                            <div className="text-[11px] text-zinc-400 mt-1 truncate max-w-[120px]">{dinnerEntry.foodEaten}</div>
                          )}
                          <div className="flex justify-end mt-1">
                            <Edit2 className="w-3 h-3 text-zinc-600" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-[60px] text-zinc-600">
                          <Plus className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Form for Adding/Editing */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-semibold text-zinc-100">
                    {selectedEntry ? 'Edit' : 'Add'} {formMealType === 'fbs' ? 'Fasting' : formMealType} Reading
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>
                <EntryForm
                  entryToEdit={selectedEntry}
                  presetDate={formDate}
                  presetMealType={formMealType}
                  onSuccess={handleFormSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
