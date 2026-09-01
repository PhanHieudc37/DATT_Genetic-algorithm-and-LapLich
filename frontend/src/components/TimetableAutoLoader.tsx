import { useEffect, useState } from 'react';
import { useTimetable } from '../contexts/TimetableContext';
import { geneticApi } from '../lib/api';
import { toast } from 'sonner';

/**
 * Component to auto-load the latest timetable when dashboard mounts
 * This ensures statistics always have data even if user doesn't visit "Xem Thời Khóa Biểu" first
 */
export const TimetableAutoLoader: React.FC = () => {
  const { selectedTimetableId, setSelectedTimetable } = useTimetable();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const autoLoadLatestTimetable = async () => {
      // Only load if no timetable is selected and we haven't loaded yet
      if (selectedTimetableId || hasLoaded) {
        console.log('⏭️ Skipping auto-load:', { selectedTimetableId, hasLoaded });
        return;
      }

      try {
        console.log('Auto-loading latest timetable...');
        const timetables = await geneticApi.getTimetables();
        
        if (timetables.length === 0) {
          console.log('ℹ️ No timetables found');
          setHasLoaded(true);
          return;
        }

        // Get the latest timetable
        const latest = timetables.reduce((prev, current) => 
          new Date(current.created_at) > new Date(prev.created_at) ? current : prev
        );

        console.log('Loading latest timetable:', latest.name, latest.id);
        
        // Load full details with genes
        const details = await geneticApi.getTimetable(latest.id);
        
        // Normalize genes
        const normalizedGenes = details.genes.map((gene: any) => ({
          class_id: gene.class_id,
          room_id: gene.room_id,
          time_slot: {
            day: gene.time_slot.day,
            period: gene.time_slot.period
          }
        }));

        console.log('Auto-loaded timetable:', {
          id: latest.id,
          name: latest.name,
          genesCount: normalizedGenes.length
        });

        setSelectedTimetable(latest.id, normalizedGenes, latest.name);
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to auto-load timetable:', error);
        setHasLoaded(true); // Mark as loaded to prevent retry loop
      }
    };

    autoLoadLatestTimetable();
  }, [selectedTimetableId, hasLoaded, setSelectedTimetable]);

  return null; // This component doesn't render anything
};
