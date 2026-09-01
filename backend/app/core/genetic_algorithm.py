import random
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class TimeSlot:
    """Time slot representation"""
    day: int  # 0-5 (Monday-Saturday)
    period: int  # 0-14 (15 periods per day)


@dataclass
class ScheduleGene:
    """A gene in the timetable chromosome
    """
    class_id: str
    teacher_id: str  
    room_id: str
    time_slot: TimeSlot


@dataclass
class Individual:
    """An individual in the population (a complete timetable)"""
    genes: List[ScheduleGene]
    fitness: float = 0.0


class GeneticAlgorithm:  
    def __init__(
        self,
        classes: List[Dict],
        rooms: List[Dict],
        teachers: List[Dict],
        population_size: int = 250,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8,
        elitism_rate: float = 0.12,
        max_generations: int = 250,
    ):
        self.classes = classes
        self.rooms = rooms
        self.teachers = teachers
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elitism_rate = elitism_rate
        self.max_generations = max_generations
        
        # Validate classes data before running GA
        self._validate_classes_data()
        
        # Constants
        self.DAYS = 6  # Monday to Saturday
        self.PERIODS = 15  # 15 periods per day
        
        # Create teacher lookup
        self.teacher_lookup = {t['id']: t for t in teachers}
        self.room_lookup = {r['id']: r for r in rooms}
        
        # Create optimized lookups for faster filtering
        self._build_optimized_lookups()
    
    def _validate_classes_data(self):
        """
        Validate classes data trước khi chạy GA
        Đảm bảo sessions_per_week hợp lệ và các thông tin cần thiết đầy đủ
        """
        for class_item in self.classes:
            # Check sessions_per_week exists and valid
            sessions = class_item.get('sessions_per_week')
            if sessions is None:
                raise ValueError(
                    f"Lớp '{class_item.get('name', 'unknown')}' thiếu sessions_per_week! "
                    f"Vui lòng cập nhật lại lớp học."
                )
            
            if not isinstance(sessions, int) or sessions <= 0:
                raise ValueError(
                    f"Lớp '{class_item.get('name', 'unknown')}' có sessions_per_week không hợp lệ: {sessions}. "
                    f"Phải là số nguyên dương."
                )
            
            if sessions > 5:
                raise ValueError(
                    f"Lớp '{class_item.get('name', 'unknown')}' có sessions_per_week = {sessions} quá lớn! "
                    f"Tối đa 5 buổi/tuần."
                )
            
            # Check other required fields
            required_fields = ['id', 'name', 'subject_id', 'number_of_students']
            for field in required_fields:
                if field not in class_item or class_item[field] is None:
                    raise ValueError(
                        f"Lớp '{class_item.get('name', 'unknown')}' thiếu field bắt buộc: {field}"
                    )
        
    def _build_optimized_lookups(self):
        """Build optimized lookup tables for room and teacher filtering"""
        # Categorize rooms by type and capacity
        self.rooms_by_type = {
            'theory': [r for r in self.rooms if r.get('type') in ['THEORY', 'theory']],
            'lab': [r for r in self.rooms if r.get('type') in ['LAB', 'lab']],
            'both': [r for r in self.rooms if r.get('type') in ['BOTH', 'both']]
        }
        
        # All rooms sorted by capacity (useful for quick filtering)
        self.rooms_sorted = sorted(self.rooms, key=lambda r: r.get('capacity', 0))

        self.subject_to_teachers = {}
        for class_item in self.classes:
            subject_id = class_item['subject_id']
            
            # Get qualified teachers from this class
            qualified = class_item.get('qualified_teachers', [class_item['teacher_id']])
            
            if subject_id not in self.subject_to_teachers:
                # First class of this subject - initialize list
                self.subject_to_teachers[subject_id] = set(qualified)
            else:
                # HỢP NHẤT để không mất GV
                self.subject_to_teachers[subject_id].update(qualified)
        
        # Convert sets back to lists for easier usage
        for subject_id in self.subject_to_teachers:
            self.subject_to_teachers[subject_id] = list(self.subject_to_teachers[subject_id])
        
        
    def _get_suitable_rooms(self, class_item: Dict) -> List[Dict]:
        class_room_type = class_item.get('room_type', 'theory').lower()
        min_capacity = class_item['number_of_students']
        
        suitable_rooms = []
        
        if class_room_type == 'theory':
            # Lớp lý thuyết có thể dùng phòng THEORY hoặc BOTH
            suitable_rooms = [
                r for r in self.rooms_by_type.get('theory', []) + self.rooms_by_type.get('both', [])
                if r.get('capacity', 0) >= min_capacity
            ]
        elif class_room_type == 'lab':
            # Lớp thí nghiệm có thể dùng phòng LAB hoặc BOTH
            suitable_rooms = [
                r for r in self.rooms_by_type.get('lab', []) + self.rooms_by_type.get('both', [])
                if r.get('capacity', 0) >= min_capacity
            ]
        else:  # both
            # Lớp cả hai loại có thể dùng phòng bất kỳ
            suitable_rooms = [
                r for r in self.rooms
                if r.get('capacity', 0) >= min_capacity
            ]
        
        # Nếu không tìm thấy phòng phù hợp, chọn phòng có sức chứa đủ
        if not suitable_rooms:
            suitable_rooms = [
                r for r in self.rooms
                if r.get('capacity', 0) >= min_capacity
            ]
        
        # Nếu vẫn không có, trả về tất cả phòng (sẽ bị phạt trong fitness)
        if not suitable_rooms:
            suitable_rooms = self.rooms
        
        return suitable_rooms
    
    def _is_teacher_available(self, teacher_id: str, day: int) -> bool:
        """Kiểm tra xem giáo viên có rảnh vào ngày cụ thể không"""
        teacher = self.teacher_lookup.get(teacher_id)
        if not teacher:
            return True
        
        unavailable_days = teacher.get('unavailable_days', [])
        if isinstance(unavailable_days, str):
            import json
            try:
                unavailable_days = json.loads(unavailable_days)
            except:
                unavailable_days = []
        
        return day not in unavailable_days
    
    def _select_room_balanced(self, suitable_rooms: List[Dict], current_genes: List[ScheduleGene], class_item: Dict) -> str:
     
        if not suitable_rooms:
            return random.choice(self.rooms)['id']
        
        num_students = class_item.get('number_of_students', 0)
        class_room_type = class_item.get('room_type', 'theory').upper()
        
        # Đếm số lần sử dụng mỗi phòng
        room_usage = {}
        for gene in current_genes:
            room_usage[gene.room_id] = room_usage.get(gene.room_id, 0) + 1
        
        # Tạo danh sách phòng với thông tin đầy đủ
        room_candidates = []
        for room in suitable_rooms:
            usage = room_usage.get(room['id'], 0)
            capacity = room.get('capacity', 0)
            room_type = room.get('type', 'THEORY').upper()
            waste = capacity - num_students
            
            type_bonus = 0
            if class_room_type == 'THEORY' and (room_type == 'THEORY' or room_type == 'BOTH'):
                type_bonus = 100  # Cả THEORY và BOTH đều đáp ứng ngang nhau
            elif class_room_type == 'LAB' and (room_type == 'LAB' or room_type == 'BOTH'):
                type_bonus = 100  # Cả LAB và BOTH đều đáp ứng ngang nhau
            elif class_room_type == 'BOTH':
                type_bonus = 100  # BOTH class dùng phòng nào cũng OK
            
           
            total_score = -(waste * 10) - (usage * 100) + type_bonus
            
            room_candidates.append({
                'room': room,
                'waste': waste if waste >= 0 else 9999,
                'type_bonus': type_bonus,
                'usage': usage,
                'total_score': total_score
            })
        
        # SẮP XẾP THEO ĐIỂM TỔNG HỢP (cao  thấp)
        # Điểm cao = Đúng loại + Vừa khít + Ít dùng
        room_candidates.sort(key=lambda x: -x['total_score'])
        
        # Lấy điểm cao nhất
        best_score = room_candidates[0]['total_score']
        
        # Tìm TẤT CẢ phòng có điểm bằng điểm cao nhất
        best_rooms = [r for r in room_candidates if r['total_score'] == best_score]
        
        # RANDOM trong nhóm phòng tốt nhất  LUÂN PHIÊN TỰ NHIÊN
        # Nếu chỉ 1 phòng tốt nhất → chọn luôn
        # Nếu nhiều phòng cùng điểm → random để phân bố đều
        if len(best_rooms) > 1:
            selected = random.choice(best_rooms)['room']
        else:
            selected = room_candidates[0]['room']
        
        return selected['id']
    
    def _select_optimal_teacher(self, qualified_teachers: List[str], class_item: Dict, 
                                current_genes: List[ScheduleGene], day: int, period: int) -> str:
       
        if not qualified_teachers:
            return None
        
        # Nếu chỉ có 1 GV thì chọn luôn
        if len(qualified_teachers) == 1:
            return qualified_teachers[0]
        
        suggested_teacher = class_item.get('teacher_id')
        teacher_scores = {}
        
        for teacher_id in qualified_teachers:
            score = 0
            
            # === HARD CONSTRAINT 1: Xung đột lịch dạy ===
            # Kiểm tra GV có đang dạy lớp khác cùng lúc không
            conflict = False
            for gene in current_genes:
                if (gene.teacher_id == teacher_id and 
                    gene.time_slot.day == day and 
                    gene.time_slot.period == period):
                    conflict = True
                    score += 100 
                    break
            
            # === HARD CONSTRAINT 2: Teacher availability ===
            if not self._is_teacher_available(teacher_id, day):
                score += 50  
            workload = sum(1 for gene in current_genes if gene.teacher_id == teacher_id)
            if len(qualified_teachers) == 1:
                # GV duy nhất → score += 0
                pass
            else:
                # Có nhiều GV  khuyến khích phân bổ đều
                # Tính workload trung bình của các GV dạy môn này
                subject_id = class_item['subject_id']
                subject_teachers_workload = [
                    sum(1 for g in current_genes if g.teacher_id == tid)
                    for tid in qualified_teachers
                ]
                avg_workload = sum(subject_teachers_workload) / len(subject_teachers_workload) if subject_teachers_workload else 0
                
                # Penalty dựa trên chênh lệch so với trung bình
                deviation_from_avg = workload - avg_workload
                if deviation_from_avg > 0:
                    # Đang dạy nhiều hơn TB  penalty tăng theo bình phương
                    score += int(deviation_from_avg * 15 + (deviation_from_avg ** 2) * 5)
                else:
                    # Đang dạy ít hơn TB bonus nhỏ
                    score += int(deviation_from_avg * 5)  # Số âm = giảm score
            
            # === SOFT CONSTRAINT 2: Consecutive periods in same day ===
            # Tránh GV dạy quá nhiều tiết liên tiếp trong cùng ngày
            teacher_periods_today = [g.time_slot.period for g in current_genes 
                                    if g.teacher_id == teacher_id and g.time_slot.day == day]
            if teacher_periods_today:
                teacher_periods_today_sorted = sorted(teacher_periods_today + [period])
                # Đếm số tiết liên tiếp
                consecutive = 1
                max_consecutive = 1
                for i in range(1, len(teacher_periods_today_sorted)):
                    if teacher_periods_today_sorted[i] == teacher_periods_today_sorted[i-1] + 1:
                        consecutive += 1
                        max_consecutive = max(max_consecutive, consecutive)
                    else:
                        consecutive = 1
                # Penalty nếu dạy >4 tiết liên tiếp
                if max_consecutive > 4:
                    score += (max_consecutive - 4) * 20
            
            # === SOFT CONSTRAINT 3: Suggested teacher preference ===
            # Ưu tiên NHẸ cho GV được gợi ý 
            # Bonus nhỏ để không ảnh hưởng quá nhiều đến tối ưu hóa
            if suggested_teacher and teacher_id == suggested_teacher:
                score -= 5  # Bonus nhỏ (giảm 5 điểm)
            
            teacher_scores[teacher_id] = score
        
        # Chọn GV có điểm THẤP NHẤT (tốt nhất)
        best_teacher = min(teacher_scores.items(), key=lambda x: x[1])
        
        # Nếu có nhiều GV cùng điểm tốt nhất → random
        best_score = best_teacher[1]
        best_teachers = [t_id for t_id, score in teacher_scores.items() if score == best_score]
        
        return random.choice(best_teachers)
    
    def generate_random_schedule(self) -> List[ScheduleGene]:

        genes: List[ScheduleGene] = []
        
        for class_item in self.classes:
            # Get suitable rooms for this class
            suitable_rooms = self._get_suitable_rooms(class_item)
            
            # Lấy danh sách giáo viên có thể dạy môn này
            subject_id = class_item['subject_id']
            qualified_teachers = self.subject_to_teachers.get(subject_id, [])
            
            # Kiểm tra phải có ít nhất 1 giáo viên
            if not qualified_teachers:
                raise ValueError(
                    f"Lớp '{class_item['name']}' không có giáo viên nào có thể dạy! "
                    f"Vui lòng kiểm tra lại cấu hình."
                )
            used_days_for_class = set()
            
            for session_num in range(class_item['sessions_per_week']):

                
                # Danh sách ngày ưu tiên: T2-T6 (0-4), tránh T7 (5)
                preferred_days = [0, 1, 2, 3, 4]
                
                # Lọc ngày chưa dùng
                unused_days = [d for d in preferred_days if d not in used_days_for_class]
                
                day = None
                if unused_days:
                    # Còn ngày chưa dùng → Ưu tiên chọn ngày mới
                    day = random.choice(unused_days)
                    used_days_for_class.add(day)
                elif random.random() < 0.85:
                    # Hết ngày T2-T6 chưa dùng → Chọn lại ngày đã dùng
                    day = random.choice(preferred_days)
                else:
                    # 15% cơ hội chọn T7 nếu cần thiết
                    day = 5
                
                # Fallback safety
                if day is None:
                    day = random.randint(0, self.DAYS - 1)
                period = None
                if random.random() < 0.95:  # 95% chọn giờ đẹp
                    good_periods = list(range(1, 6)) + list(range(7, 13))  # 1-5, 7-12
                    period = random.choice(good_periods)
                else:  # 5% chọn giờ khác (cho flexibility)
                    period = random.randint(0, self.PERIODS - 1)
                teacher_id = self._select_optimal_teacher(qualified_teachers, class_item, genes, day, period)
                
                # Kiểm tra kết quả chọn giáo viên
                if teacher_id is None:
                    raise ValueError(
                        f"Không thể chọn giáo viên cho lớp '{class_item['name']}' "
                        f"buổi {session_num + 1}/{class_item['sessions_per_week']}"
                    )
                
                genes.append(ScheduleGene(
                    class_id=class_item['id'],
                    teacher_id=teacher_id,
                    room_id=self._select_room_balanced(suitable_rooms, genes, class_item),
                    time_slot=TimeSlot(day=day, period=period)
                ))
        
        return genes
    
    def calculate_fitness(self, genes: List[ScheduleGene]) -> float:
        """
        Fitness = 1 / (1 + Cost)
        
        RÀNG BUỘC CỨNG (Hard Constraints) - Trọng số cao:
        H1. Xung đột phòng học - W = 20
        H2. Xung đột giảng viên - W = 20
        H3. Xung đột lớp học - W = 20
        H4. Vượt sức chứa phòng - W = 20
        H5. GV dạy quá 8 tiết/ngày - W = 15
        H6. Lớp học quá 6 tiết/ngày - W = 12
        H7. Phòng không phù hợp - W = 20
        H8. GV dạy ngày không rảnh - W = 20
        
        RÀNG BUỘC MỀM (Soft Constraints) - Trọng số thấp:
        S1. Phân bố không đều tuần - W = 3
        S2. GV dạy liên tiếp > 3 tiết - W = 5
        S3. Lớp buổi tối (tiết 13-14) - W = 8
        S4. Lớp sáng sớm (tiết 0) - W = 8
        S5. Lớp giờ nghỉ trưa (tiết 6) - W = 8
        S6. Lớp thứ 7 - W = 5
        S7. GV không nghỉ trưa - W = 6
        S8. Buổi học quá gần - W = 2
        S9. Mất cân bằng GV - W = 2
        """
        # Hard Constraints 
        W_ROOM_CONFLICT = 20
        W_TEACHER_CONFLICT = 20
        W_CLASS_CONFLICT = 20
        W_CAPACITY_OVERFLOW = 20
        W_TEACHER_OVERLOAD = 15
        W_CLASS_OVERLOAD = 12
        W_WRONG_ROOM_TYPE = 20
        W_TEACHER_UNAVAILABLE = 20
        
        # Soft Constraints 
        W_UNEVEN_DISTRIBUTION = 3
        W_CONSECUTIVE_TEACHING = 5
        W_EVENING_CLASS = 8
        W_EARLY_MORNING = 8
        W_LUNCH_TIME = 8
        W_SATURDAY = 5
        W_NO_LUNCH_BREAK = 6
        W_TOO_CLOSE = 2  
        W_TOO_MANY_CONSECUTIVE = 5  
        W_WORKLOAD_IMBALANCE = 2
        
        # Tổng cost
        cost = 0
        
        # Build a schedule map for faster lookup
        schedule_map: Dict[Tuple[int, int], List[ScheduleGene]] = {}
        for gene in genes:
            key = (gene.time_slot.day, gene.time_slot.period)
            if key not in schedule_map:
                schedule_map[key] = []
            schedule_map[key].append(gene)
        
        # ===== H1: XUNG ĐỘT PHÒNG HỌC (Hard) =====
        # Không được 2 lớp dùng chung 1 phòng cùng lúc
        for time_slot, genes_at_slot in schedule_map.items():
            if len(genes_at_slot) <= 1:
                continue
            
            room_counts: Dict[str, int] = {}
            for gene in genes_at_slot:
                room_counts[gene.room_id] = room_counts.get(gene.room_id, 0) + 1
            
            for count in room_counts.values():
                if count > 1:
                    cost += (count - 1) * W_ROOM_CONFLICT
        
        # ===== H2: XUNG ĐỘT GIẢNG VIÊN (Hard) =====
        # Một giảng viên không thể dạy 2 lớp cùng lúc
        for time_slot, genes_at_slot in schedule_map.items():
            if len(genes_at_slot) <= 1:
                continue
                
            teacher_counts: Dict[str, int] = {}
            for gene in genes_at_slot:
                teacher_id = gene.teacher_id
                teacher_counts[teacher_id] = teacher_counts.get(teacher_id, 0) + 1
            
            for count in teacher_counts.values():
                if count > 1:
                    cost += (count - 1) * W_TEACHER_CONFLICT
        
        # ===== H3: XUNG ĐỘT LỚP HỌC (Hard) =====
        # Một lớp không thể học 2 môn cùng lúc
        for time_slot, genes_at_slot in schedule_map.items():
            if len(genes_at_slot) <= 1:
                continue
            
            class_counts: Dict[str, int] = {}
            for gene in genes_at_slot:
                class_counts[gene.class_id] = class_counts.get(gene.class_id, 0) + 1
            
            for count in class_counts.values():
                if count > 1:
                    cost += (count - 1) * W_CLASS_CONFLICT
        
        # ===== H4: SỨC CHỨA PHÒNG HỌC (Hard) =====
        # Số sinh viên không được vượt quá sức chứa phòng
        for gene in genes:
            class_item = next((c for c in self.classes if c['id'] == gene.class_id), None)
            room = self.room_lookup.get(gene.room_id)
            
            if class_item and room:
                if class_item['number_of_students'] > room['capacity']:
                    cost += W_CAPACITY_OVERFLOW
        
        # ===== H5: GIẢNG VIÊN DẠY QUÁ NHIỀU TIẾT/NGÀY (Hard) =====
        # Một giảng viên không nên dạy quá 8 tiết trong 1 ngày
        teacher_daily_load: Dict[str, Dict[int, int]] = {}
        for gene in genes:
            teacher_id = gene.teacher_id
            day = gene.time_slot.day
            
            if teacher_id not in teacher_daily_load:
                teacher_daily_load[teacher_id] = {}
            teacher_daily_load[teacher_id][day] = teacher_daily_load[teacher_id].get(day, 0) + 1
        
        for teacher_id, days in teacher_daily_load.items():
            for day, count in days.items():
                if count > 8:
                    cost += (count - 8) * W_TEACHER_OVERLOAD
        
        # ===== H6: LỚP HỌC QUÁ NHIỀU TIẾT/NGÀY (Hard) =====
        # Một lớp không nên học quá 6 tiết trong 1 ngày
        class_daily_load: Dict[str, Dict[int, int]] = {}
        for gene in genes:
            class_id = gene.class_id
            day = gene.time_slot.day
            
            if class_id not in class_daily_load:
                class_daily_load[class_id] = {}
            class_daily_load[class_id][day] = class_daily_load[class_id].get(day, 0) + 1
        
        for class_id, days in class_daily_load.items():
            for day, count in days.items():
                if count > 6:
                    cost += (count - 6) * W_CLASS_OVERLOAD
        
        # ===== S1: PHÂN BỐ KHÔNG ĐỀU TRONG TUẦN (Soft) =====
        # Các buổi học nên phân bố đều trong tuần
        # Tính "ngày hiệu quả": nếu 1 ngày có 2 buổi liền → tính như 2 ngày
        class_day_distribution: Dict[str, set] = {}
        class_effective_days: Dict[str, int] = {}
        
        for gene in genes:
            if gene.class_id not in class_day_distribution:
                class_day_distribution[gene.class_id] = set()
            class_day_distribution[gene.class_id].add(gene.time_slot.day)
        
        # Tính số ngày hiệu quả cho mỗi lớp
        for class_id in class_day_distribution.keys():
            actual_days = len(class_day_distribution[class_id])
            
            # Đếm số ngày có ít nhất 1 cặp tiết liền
            days_with_consecutive = 0
            for day in class_day_distribution[class_id]:
                periods_in_day = [g.time_slot.period for g in genes 
                                if g.class_id == class_id and g.time_slot.day == day]
                
                if len(periods_in_day) > 1:
                    periods_sorted = sorted(periods_in_day)
                    # Kiểm tra có cặp liền nào không
                    has_consecutive = False
                    for i in range(len(periods_sorted) - 1):
                        if periods_sorted[i+1] == periods_sorted[i] + 1:
                            has_consecutive = True
                            break
                    
                    if has_consecutive:
                        days_with_consecutive += 1
            
            # Ngày hiệu quả = ngày thật + bonus cho ngày có 2 tiết liền
            effective_days = actual_days + days_with_consecutive
            class_effective_days[class_id] = effective_days
        
        # Kiểm tra phân bố dựa trên ngày hiệu quả
        for class_id, effective_days in class_effective_days.items():
            class_item = next((c for c in self.classes if c['id'] == class_id), None)
            if class_item:
                sessions = class_item['sessions_per_week']
                if effective_days < min(sessions, 3):
                    cost += W_UNEVEN_DISTRIBUTION
        
        # ===== S2: GIẢNG VIÊN DẠY LIÊN TIẾP QUÁ NHIỀU (Soft) =====
        # Giảng viên không nên dạy quá 3 tiết liên tiếp
        teacher_schedule: Dict[str, Dict[int, List[int]]] = {}
        for gene in genes:
            teacher_id = gene.teacher_id
            day = gene.time_slot.day
            period = gene.time_slot.period
            
            if teacher_id not in teacher_schedule:
                teacher_schedule[teacher_id] = {}
            if day not in teacher_schedule[teacher_id]:
                teacher_schedule[teacher_id][day] = []
            teacher_schedule[teacher_id][day].append(period)
        
        for teacher_id, days in teacher_schedule.items():
            for day, periods in days.items():
                periods_sorted = sorted(periods)
                consecutive = 1
                for i in range(1, len(periods_sorted)):
                    if periods_sorted[i] == periods_sorted[i-1] + 1:
                        consecutive += 1
                        if consecutive > 3:
                            cost += W_CONSECUTIVE_TEACHING
                    else:
                        consecutive = 1
        
        # ===== S3: LỚP HỌC VÀO BUỔI TỐI (Soft) =====
        # Tránh xếp lớp vào tiết 13-14 (buổi tối 19:10-20:55)
        for gene in genes:
            if gene.time_slot.period >= 13:
                cost += W_EVENING_CLASS
        
        # ===== S4: LỚP HỌC SÁNG QUÁ SỚM (Soft) =====
        # Tránh xếp lớp vào tiết 0 (6:30-7:20 - quá sớm)
        for gene in genes:
            if gene.time_slot.period == 0:
                cost += W_EARLY_MORNING
        
        # ===== S5: LỚP HỌC GIỜ NGHỈ TRƯA (Soft) =====
        # Tránh xếp lớp vào tiết 6 (12:30-13:20 - giờ nghỉ trưa)
        for gene in genes:
            if gene.time_slot.period == 6:
                cost += W_LUNCH_TIME
        
        # ===== S6: LỚP HỌC VÀO THỨ 7 (Soft) =====
        # Tránh xếp lớp vào thứ 7 (day = 5)
        for gene in genes:
            if gene.time_slot.day == 5:
                cost += W_SATURDAY
        
        # ===== S7: GIẢNG VIÊN KHÔNG CÓ GIỜ NGHỈ TRƯA (Soft) =====
        # Giảng viên nên có ít nhất 1 tiết nghỉ trong khung 11h30-13h30 (tiết 5-7)
        for teacher_id, days in teacher_schedule.items():
            for day, periods in days.items():
                lunch_periods = [5, 6, 7]
                if all(p in periods for p in lunch_periods):
                    cost += W_NO_LUNCH_BREAK
        
        # ===== H7: PHÒNG HỌC KHÔNG PHÙ HỢP (Hard) =====
        # Phòng học phải phù hợp với loại lớp (theory/lab/both)
        for gene in genes:
            class_item = next((c for c in self.classes if c['id'] == gene.class_id), None)
            room = self.room_lookup.get(gene.room_id)
            
            if class_item and room:
                class_room_type = class_item.get('room_type', 'theory').lower()
                room_type = room.get('type', 'theory').upper()
                
                if class_room_type == 'theory':
                    if room_type == 'LAB':
                        cost += W_WRONG_ROOM_TYPE
                
                elif class_room_type == 'lab':
                    if room_type == 'THEORY':
                        cost += W_WRONG_ROOM_TYPE
        
        # ===== H8: GIẢNG VIÊN DẠY VÀO NGÀY KHÔNG RẢNH (Hard) =====
        # Giảng viên không được dạy vào những ngày họ không rảnh
        for gene in genes:
            teacher_id = gene.teacher_id
            day = gene.time_slot.day
            
            if not self._is_teacher_available(teacher_id, day):
                cost += W_TEACHER_UNAVAILABLE
        
        # ===== S9: CÂN BẰNG KHỐI LƯỢNG CÔNG VIỆC GIỮA CÁC GIÁO VIÊN (Soft) =====
        # Các giáo viên có thể dạy cùng môn nên được phân chia công việc đều
        subject_teacher_workload: Dict[str, Dict[str, int]] = {}
        
        for gene in genes:
            class_item = next((c for c in self.classes if c['id'] == gene.class_id), None)
            if class_item:
                subject_id = class_item['subject_id']
                teacher_id = gene.teacher_id
                
                if subject_id not in subject_teacher_workload:
                    subject_teacher_workload[subject_id] = {}
                
                subject_teacher_workload[subject_id][teacher_id] = \
                    subject_teacher_workload[subject_id].get(teacher_id, 0) + 1
        
        for subject_id, teacher_loads in subject_teacher_workload.items():
            if len(teacher_loads) > 1:
                loads = list(teacher_loads.values())
                avg_load = sum(loads) / len(loads)
                
                for load in loads:
                    deviation = abs(load - avg_load)
                    if deviation >= 2:
                        cost += deviation * W_WORKLOAD_IMBALANCE
        
        # ===== S8: KHOẢNG CÁCH CÁC BUỔI HỌC TRONG CÙNG NGÀY (Soft) =====
        # Nếu 1 lớp có nhiều buổi trong cùng ngày:
        # - Cho phép tối đa 2 buổi liên tiếp (gap=1)
        # - Các buổi không liên tiếp (gap≥2) bị phạt
        class_schedule: Dict[str, Dict[int, List[int]]] = {}
        for gene in genes:
            class_id = gene.class_id
            day = gene.time_slot.day
            period = gene.time_slot.period
            
            if class_id not in class_schedule:
                class_schedule[class_id] = {}
            if day not in class_schedule[class_id]:
                class_schedule[class_id][day] = []
            class_schedule[class_id][day].append(period)
        
        for class_id, days in class_schedule.items():
            for day, periods in days.items():
                if len(periods) <= 1:
                    continue  # Chỉ 1 buổi/ngày → không kiểm tra
                
                periods_sorted = sorted(periods)
                
                # BƯỚC 1: Kiểm tra số buổi liên tiếp (tránh penalty lặp)
                i = 0
                while i < len(periods_sorted):
                    consecutive = 1
                    j = i
                    # Đếm các tiết liền nhau từ vị trí i
                    while j + 1 < len(periods_sorted) and periods_sorted[j+1] == periods_sorted[j] + 1:
                        consecutive += 1
                        j += 1
                    
                    # Nếu >2 buổi liên tiếp → phạt
                    if consecutive > 2:
                        cost += W_TOO_MANY_CONSECUTIVE
                    
                    i += consecutive  # Nhảy qua chuỗi liên tiếp
                
                # BƯỚC 2: Kiểm tra gap giữa các buổi
                for i in range(1, len(periods_sorted)):
                    gap = periods_sorted[i] - periods_sorted[i-1]
                    if gap >= 2:  # Không liên tiếp → phạt
                        cost += W_TOO_CLOSE
        
        # Tính fitness theo công thức: Fitness = 1 / (1 + Cost)
        # Cost càng thấp → Fitness càng cao → TKB càng tốt
        fitness = 1.0 / (1.0 + cost)
        return fitness
    
    def create_population(self) -> List[Individual]:
        """Tạo quần thể ban đầu với các cá thể ngẫu nhiên"""
        population = []
        for _ in range(self.population_size):
            genes = self.generate_random_schedule()
            individual = Individual(
                genes=genes,
                fitness=self.calculate_fitness(genes)
            )
            population.append(individual)
        return population
    
    def selection(self, population: List[Individual]) -> Individual:
        """
        Chọn lọc bằng Tournament Selection
        """
        tournament_size = 5
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=lambda ind: ind.fitness)
    
    def crossover(self, parent1: Individual, parent2: Individual) -> List[ScheduleGene]:
    
        if random.random() > self.crossover_rate:
            return parent1.genes.copy()
        
        # Nhóm genes theo class_id từ parent1
        p1_by_class: Dict[str, List[ScheduleGene]] = {}
        for gene in parent1.genes:
            if gene.class_id not in p1_by_class:
                p1_by_class[gene.class_id] = []
            p1_by_class[gene.class_id].append(gene)
        
        # Nhóm genes theo class_id từ parent2
        p2_by_class: Dict[str, List[ScheduleGene]] = {}
        for gene in parent2.genes:
            if gene.class_id not in p2_by_class:
                p2_by_class[gene.class_id] = []
            p2_by_class[gene.class_id].append(gene)
        
        # Với mỗi lớp, chọn toàn bộ schedule từ 1 trong 2 cha mẹ
        child_genes = []
        for class_id in p1_by_class.keys():
            if random.random() < 0.5:
                # Chọn schedule của lớp này từ parent1
                child_genes.extend(p1_by_class[class_id])
            else:
                # Chọn schedule của lớp này từ parent2
                child_genes.extend(p2_by_class.get(class_id, p1_by_class[class_id]))
        
        return child_genes
    
    def mutate(self, genes: List[ScheduleGene]) -> List[ScheduleGene]:
        mutated_genes = []
        for gene in genes:
            if random.random() < self.mutation_rate:
                # Tìm phòng phù hợp cho lớp này
                class_item = next((c for c in self.classes if c['id'] == gene.class_id), None)
                if class_item:
                    # Lấy danh sách phòng phù hợp dựa trên loại lớp
                    suitable_rooms = self._get_suitable_rooms(class_item)
                    
                    if not suitable_rooms:
                        suitable_rooms = self.rooms
                    
                    # Lấy danh sách giáo viên có thể dạy môn này
                    subject_id = class_item['subject_id']
                    qualified_teachers = self.subject_to_teachers.get(subject_id, [])
                    
                    # Nếu không có giáo viên nào thì giữ nguyên gene cũ
                    if not qualified_teachers:
                        mutated_genes.append(gene)
                        continue
                    
                    # Bước 1: Chọn ngày - ưu tiên các ngày trong tuần
                    day = None
                    attempts = 0
                    max_attempts = 20
                    
                    while day is None and attempts < max_attempts:
                        # 85% chọn ngày trong tuần (0-4), 15% chọn thứ 7 (5)
                        candidate_day = random.randint(0, 4) if random.random() < 0.85 else 5
                        day = candidate_day
                        attempts += 1
                    
                    # Nếu không tìm được ngày, chọn ngẫu nhiên
                    if day is None:
                        day = random.randint(0, self.DAYS - 1)
                    
                    # Step 2: Chọn period - ưu tiên giờ đẹp, tránh sáng sớm, nghỉ trưa và buổi tối
                    # Giờ đẹp: 1-5 (sáng: 7:25-12:00), 7-12 (chiều: 13:25-18:00)
                    # Tránh: 0 (6:30 quá sớm), 6 (12:30 nghỉ trưa), 13-14 (19:10-20:55 tối)
                    if random.random() < 0.95:  # 95% chọn giờ đẹp
                        good_periods = list(range(1, 6)) + list(range(7, 13))  # 1-5, 7-12
                        period = random.choice(good_periods)
                    else:
                        period = random.randint(0, self.PERIODS - 1)
                    
                    # Bước 3: Chọn giáo viên - 30% cơ hội thay đổi nếu có nhiều GV
                    if len(qualified_teachers) > 1 and random.random() < 0.3:
                        # Sử dụng thuật toán chọn giáo viên tối ưu
                        teacher_id = self._select_optimal_teacher(qualified_teachers, class_item, mutated_genes, day, period)
                    else:
                        teacher_id = gene.teacher_id
                    
                    mutated_genes.append(ScheduleGene(
                        class_id=gene.class_id,
                        teacher_id=teacher_id,
                        room_id=self._select_room_balanced(suitable_rooms, mutated_genes, class_item),
                        time_slot=TimeSlot(day=day, period=period)
                    ))
                else:
                    mutated_genes.append(gene)
            else:
                mutated_genes.append(gene)
        return mutated_genes
    
    def run(self, callback=None) -> Tuple[Individual, List[Dict]]:
        population = self.create_population()
        stats_history = []
        
        # Theo dõi giải pháp tốt nhất từ trước đến nay
        best_solution = max(population, key=lambda ind: ind.fitness)
        generations_without_improvement = 0
        last_best_fitness = best_solution.fitness
        
        for generation in range(self.max_generations):
            # Sắp xếp quần thể theo độ thích nghi
            population.sort(key=lambda ind: ind.fitness, reverse=True)
            
            # Tính toán thống kê
            fitnesses = [ind.fitness for ind in population]
            current_best = max(fitnesses)
            stats = {
                'generation': generation,
                'best_fitness': current_best,
                'best_ever_fitness': best_solution.fitness,
                'avg_fitness': sum(fitnesses) / len(fitnesses),
                'worst_fitness': min(fitnesses)
            }
            stats_history.append(stats)
            
            # Cập nhật giải pháp tốt nhất nếu tìm thấy giải pháp tốt hưn
            if population[0].fitness > best_solution.fitness:
                best_solution = population[0]
                generations_without_improvement = 0
                last_best_fitness = best_solution.fitness
            else:
                generations_without_improvement += 1
            
            # Gọi callback để cập nhật tiến độ
            if callback:
                callback(generation, stats, best_solution)
            
            # Kiểm tra xem đã đạt giải pháp đủ tốt chưa (dừng sớm)
            if best_solution.fitness >= 0.95:
                break
            
            # Khởi động lại: nếu bị kẹt sau 30 thế hệ, thêm độ đa dạng mới
            if generations_without_improvement >= 30 and generation < self.max_generations - 10:
                # Giữ 20% cá thể ưu tú, thay thế phần còn lại bằng cá thể ngẫu nhiên mới
                elite_count = int(self.population_size * 0.2)
                new_random = []
                for _ in range(self.population_size - elite_count):
                    genes = self.generate_random_schedule()
                    new_random.append(Individual(
                        genes=genes,
                        fitness=self.calculate_fitness(genes)
                    ))
                population = population[:elite_count] + new_random
                generations_without_improvement = 0
                continue
            
            # Tạo quần thể mới
            new_population = []
            
            # Chọn lọc ưu tú: giữ lại các cá thể tốt nhất
            elite_count = int(self.population_size * self.elitism_rate)
            new_population.extend(population[:elite_count])
            
            # Tạo con cái mới
            while len(new_population) < self.population_size:
                parent1 = self.selection(population)
                parent2 = self.selection(population)
                
                child_genes = self.crossover(parent1, parent2)
                child_genes = self.mutate(child_genes)
                
                child = Individual(
                    genes=child_genes,
                    fitness=self.calculate_fitness(child_genes)
                )
                new_population.append(child)
            
            population = new_population
        
        # Trả về giải pháp tốt nhất đã tìm được
        return best_solution, stats_history
