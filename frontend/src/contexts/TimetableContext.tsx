import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ScheduleGene {
  class_id: string;
  teacher_id: string;  // Teacher selected by GA
  room_id: string;
  time_slot: {
    day: number;
    period: number;
  };
}

interface TimetableContextType {
  selectedTimetableId: string | null;
  selectedTimetableName: string | null;
  selectedTimetableGenes: ScheduleGene[];
  setSelectedTimetable: (id: string | null, genes: ScheduleGene[], name?: string) => void;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [selectedTimetableName, setSelectedTimetableName] = useState<string | null>(null);
  const [selectedTimetableGenes, setSelectedTimetableGenes] = useState<ScheduleGene[]>([]);

  const setSelectedTimetable = (id: string | null, genes: ScheduleGene[], name?: string) => {
    setSelectedTimetableId(id);
    setSelectedTimetableName(name || null);
    setSelectedTimetableGenes(genes);
    console.log('Timetable context updated:', { id, name, genesCount: genes.length });
  };

  return (
    <TimetableContext.Provider
      value={{
        selectedTimetableId,
        selectedTimetableName,
        selectedTimetableGenes,
        setSelectedTimetable,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
