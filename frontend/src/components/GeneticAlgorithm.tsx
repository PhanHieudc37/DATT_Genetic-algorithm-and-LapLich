import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTimetable } from '../contexts/TimetableContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GeneticAlgorithmConfig, GenerationStats, Individual, ScheduleGene, TimeSlot } from '../types';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { geneticApi } from '../lib/api';

export const GeneticAlgorithm: React.FC = () => {
  const { classes, rooms, teachers, saveBestTimetable } = useData();
  const { setSelectedTimetable } = useTimetable();

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [generationStats, setGenerationStats] = useState<GenerationStats[]>([]);
  const [bestSolution, setBestSolution] = useState<Individual | null>(null);
  const [progress, setProgress] = useState(0);
  const [lastRunResult, setLastRunResult] = useState<any>(null);

  const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const PERIODS = [
    '6:30 - 7:20',   // Tiết 1
    '7:25 - 8:15',   // Tiết 2
    '8:20 - 9:10',   // Tiết 3
    '9:20 - 10:10',  // Tiết 4
    '10:15 - 11:05', // Tiết 5
    '11:10 - 12:00', // Tiết 6
    '12:30 - 13:20', // Tiết 7
    '13:25 - 14:15', // Tiết 8
    '14:20 - 15:10', // Tiết 9
    '15:20 - 16:10', // Tiết 10
    '16:15 - 17:05', // Tiết 11
    '17:10 - 18:00', // Tiết 12
    '18:15 - 19:05', // Tiết 13
    '19:10 - 20:00', // Tiết 14
    '20:05 - 20:55', // Tiết 15
  ];

  // Run algorithm using backend API
  const runAlgorithm = async () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentGeneration(0);
    setGenerationStats([]);
    setBestSolution(null);
    setProgress(0);

    try {
      toast.info('Đang chạy thuật toán di truyền...', {
        description: 'Backend đang xử lý với cấu hình tối ưu',
        duration: 500,
      });
      
      // Call backend API - let backend use its optimized defaults
      // Backend defaults: Population=200, Mutation=0.15, Crossover=0.85, Elitism=0.15, Generations=200
      const result = await geneticApi.runAlgorithm(
        null,  // No config - use backend defaults
        false  // Don't save yet - let user review first
      );
      
      // Update UI with results
      setCurrentGeneration(result.generations);
      setProgress(100);
      
      // Convert stats to frontend format
      const stats: GenerationStats[] = result.stats.map(s => ({
        generation: s.generation,
        bestFitness: s.best_fitness,
        bestEverFitness: s.best_ever_fitness || s.best_fitness,  // Track best ever
        avgFitness: s.avg_fitness,
        worstFitness: s.worst_fitness,
      }));
      setGenerationStats(stats);
      
      // Convert genes to frontend format
      const genes: ScheduleGene[] = result.genes.map(g => ({
        classId: g.class_id,
        teacherId: g.teacher_id,
        roomId: g.room_id,
        timeSlot: {
          day: g.time_slot.day,
          period: g.time_slot.period,
        },
      }));
      
      const solution = {
        id: 'best-solution',
        genes: genes,
        fitness: result.fitness,
      };
      
      console.log('Setting bestSolution:', solution);
      setBestSolution(solution);
      
      // Store result for saving later
      setLastRunResult(result);
      console.log('bestSolution set, button should appear now');
      
      toast.success('Hoàn thành!', {
        description: `Fitness: ${result.fitness.toFixed(2)} | Thế hệ: ${result.generations}`,
        duration: 500,
      });
    } catch (error: any) {
      console.error('Error running algorithm:', error);
      toast.error('Lỗi khi chạy thuật toán', {
        description: error.message || 'Vui lòng thử lại',
        duration: 3000,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Save timetable to database
  const saveTimetable = async () => {
    if (!bestSolution || !lastRunResult) {
      toast.error('Không có kết quả để lưu');
      return;
    }

    const attemptSave = async (): Promise<void> => {
      const defaultName = `TKB_${new Date().toLocaleDateString('vi-VN')}`;
      const timetableName = prompt('Nhập tên thời khóa biểu:', defaultName);
      if (!timetableName) return;

      try {
        toast.info('Đang lưu thời khóa biểu vào cơ sở dữ liệu...');
        
        // Save the ALREADY computed result (don't run again!)
        // Config will be taken from the result (backend already tracked it)
        const result = await geneticApi.saveTimetable({
          name: timetableName,
          fitness: lastRunResult.fitness,
          generations: lastRunResult.generations,
          genes: lastRunResult.genes,
          config: lastRunResult.config || {
            population_size: 250,
            mutation_rate: 0.1,
            crossover_rate: 0.8,
            elitism_rate: 0.12,
            max_generations: 250,
          },
        });
        
        // Update context with newly saved timetable
        if (result.timetable_id) {
          setSelectedTimetable(result.timetable_id, result.genes, timetableName);
          console.log('Auto-selected newly saved timetable:', result.timetable_id);
        }
        
        toast.success('Đã lưu thành công!', {
          description: `Thời khóa biểu "${timetableName}" đã được lưu vào hệ thống`,
          duration: 3000,
        });
      } catch (error: any) {
        console.error('Error saving timetable:', error);
        
        // Check if error is duplicate name
        if (error.message && error.message.includes('đã tồn tại')) {
          toast.error('Tên thời khóa biểu đã tồn tại!', {
            description: `"${timetableName}" đã được sử dụng. Vui lòng chọn tên khác.`,
            duration: 4000,
          });
          
          // Ask user if they want to try again with different name
          setTimeout(() => {
            const retry = confirm(`Tên "${timetableName}" đã tồn tại!\n\nBạn có muốn nhập tên khác không?`);
            if (retry) {
              attemptSave();
            }
          }, 500);
        } else {
          toast.error('Lỗi khi lưu thời khóa biểu', {
            description: error.message || 'Vui lòng thử lại',
            duration: 3000,
          });
        }
      }
    };

    await attemptSave();
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentGeneration(0);
    setGenerationStats([]);
    setBestSolution(null);
    setProgress(0);
    setLastRunResult(null);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tạo Thời khóa biểu</CardTitle>
          <CardDescription>
            Sử dụng Thuật toán Di truyền (Genetic Algorithm) để tối ưu hóa thời khóa biểu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runAlgorithm} 
              disabled={isRunning}
              className="bg-[#003d82] hover:bg-[#002952]"
            >
              <Play className="mr-2 h-4 w-4" />
              {isRunning ? 'Đang chạy...' : 'Chạy thuật toán'}
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={isRunning}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Đặt lại
            </Button>
            
            {/* Save button next to other buttons */}
            {bestSolution && (
              <Button 
                onClick={saveTimetable} 
                className="bg-green-600 hover:bg-green-700 text-white"
                style={{ backgroundColor: '#16a34a' }}
              >
                <Save className="mr-2 h-4 w-4" />
                Lưu thời khóa biểu
              </Button>
            )}
          </div>
          
          {/* Info text when solution exists */}
          {bestSolution && (
            <p className="text-sm text-gray-600 mt-4">
              Fitness: {bestSolution.fitness.toFixed(2)} | Click để lưu vào hệ thống
            </p>
          )}

          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span>Đang xử lý thế hệ: {currentGeneration + 1}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-sm text-gray-600 mt-2">
                Backend đang chạy thuật toán với cấu hình tối ưu...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {generationStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biểu đồ Evolution</CardTitle>
            <CardDescription>
              Thể hiện sự tiến hóa của fitness qua các thế hệ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={generationStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="generation" label={{ value: 'Thế hệ', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Fitness', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bestEverFitness" stroke="#10b981" strokeWidth={2} name="Tốt nhất (Ever)" />
                <Line type="monotone" dataKey="bestFitness" stroke="#22c55e" name="Tốt nhất (Gen)" />
                <Line type="monotone" dataKey="avgFitness" stroke="#3b82f6" name="Trung bình" />
                <Line type="monotone" dataKey="worstFitness" stroke="#ef4444" name="Tồi nhất" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {bestSolution && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kết quả tốt nhất</CardTitle>
                <CardDescription>
                  Fitness: {bestSolution.fitness.toFixed(2)} | Thế hệ: {currentGeneration + 1}
                </CardDescription>
              </div>
              <Button 
                onClick={saveTimetable}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Lưu thời khóa biểu
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bestSolution.fitness >= 0.999 ? (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <AlertDescription>
                  Đã tìm thấy lịch học hoàn hảo không có xung đột!
                </AlertDescription>
              </Alert>
            ) : bestSolution.fitness < 0.05 ? (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertDescription>
                  Lịch học vẫn còn nhiều xung đột. Hãy thử tăng số thế hệ hoặc điều chỉnh tham số.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100">Giờ</th>
                    {DAYS.map((day, idx) => (
                      <th key={idx} className="border p-2 bg-gray-100">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period, periodIdx) => (
                    <tr key={periodIdx}>
                      <td className="border p-2 bg-gray-50">{period}</td>
                      {DAYS.map((_, dayIdx) => {
                        const genesAtSlot = bestSolution.genes.filter(
                          (gene) =>
                            gene.timeSlot.day === dayIdx &&
                            gene.timeSlot.period === periodIdx
                        );
                        return (
                          <td key={dayIdx} className="border p-2">
                            {genesAtSlot.length > 0 ? (
                              <div className="space-y-1">
                                {genesAtSlot.map((gene, idx) => {
                                  const classItem = classes.find((c) => c.id === gene.classId);
                                  const room = rooms.find((r) => r.id === gene.roomId);
                                  return (
                                    <div
                                      key={idx}
                                      className="text-xs p-1 bg-blue-100 rounded border border-blue-300"
                                    >
                                      <div>{classItem?.name}</div>
                                      <div className="text-gray-600">{room?.name}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
