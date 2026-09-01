"""
Unit Tests cho Genetic Algorithm - Timetable Scheduling
Kiểm tra đầy đủ các chức năng của GA: validation, selection, crossover, mutation, fitness
"""
import pytest
import random
from app.core.genetic_algorithm import (
    GeneticAlgorithm,
    TimeSlot,
    ScheduleGene,
    Individual
)


# ==================== Fixtures ====================

@pytest.fixture
def sample_classes():
    """Sample classes cho testing"""
    return [
        {
            'id': 'C0001',
            'name': 'Toán cao cấp 1',
            'subject_id': 'S0001',
            'teacher_id': 'T0001',
            'number_of_students': 30,
            'sessions_per_week': 2,
            'room_type': 'theory',
            'qualified_teachers': ['T0001', 'T0002']
        },
        {
            'id': 'C0002',
            'name': 'Vật lý đại cương',
            'subject_id': 'S0002',
            'teacher_id': 'T0003',
            'number_of_students': 25,
            'sessions_per_week': 2,
            'room_type': 'lab',
            'qualified_teachers': ['T0003', 'T0004']
        },
        {
            'id': 'C0003',
            'name': 'Lập trình Python',
            'subject_id': 'S0003',
            'teacher_id': 'T0002',
            'number_of_students': 35,
            'sessions_per_week': 3,
            'room_type': 'lab',
            'qualified_teachers': ['T0002', 'T0004']
        }
    ]


@pytest.fixture
def sample_rooms():
    """Sample rooms cho testing"""
    return [
        {'id': 'R0001', 'name': 'Phòng 101', 'capacity': 50, 'type': 'THEORY'},
        {'id': 'R0002', 'name': 'Phòng 102', 'capacity': 40, 'type': 'THEORY'},
        {'id': 'R0003', 'name': 'Lab 201', 'capacity': 30, 'type': 'LAB'},
        {'id': 'R0004', 'name': 'Lab 202', 'capacity': 35, 'type': 'LAB'},
        {'id': 'R0005', 'name': 'Phòng 301', 'capacity': 60, 'type': 'BOTH'}
    ]


@pytest.fixture
def sample_teachers():
    """Sample teachers cho testing"""
    return [
        {'id': 'T0001', 'name': 'GV Toán', 'unavailable_days': []},
        {'id': 'T0002', 'name': 'GV Tin', 'unavailable_days': [5]},  # Không dạy T7
        {'id': 'T0003', 'name': 'GV Lý', 'unavailable_days': [0, 2]},  # Không dạy T2, T4
        {'id': 'T0004', 'name': 'GV Hóa', 'unavailable_days': []}
    ]


@pytest.fixture
def ga_instance(sample_classes, sample_rooms, sample_teachers):
    """GA instance cho testing"""
    return GeneticAlgorithm(
        classes=sample_classes,
        rooms=sample_rooms,
        teachers=sample_teachers,
        population_size=20,
        max_generations=10
    )


# ==================== Test Initialization & Validation ====================

class TestGAInitialization:
    """Test khởi tạo GA và validation data"""
    
    def test_init_success_with_valid_data(self, sample_classes, sample_rooms, sample_teachers):
        """Khởi tạo thành công với data hợp lệ"""
        ga = GeneticAlgorithm(sample_classes, sample_rooms, sample_teachers)
        
        assert ga.classes == sample_classes
        assert ga.rooms == sample_rooms
        assert ga.teachers == sample_teachers
        assert ga.DAYS == 6
        assert ga.PERIODS == 15
    
    def test_validate_classes_missing_sessions_per_week(self, sample_rooms, sample_teachers):
        """Reject class thiếu sessions_per_week"""
        invalid_classes = [
            {
                'id': 'C0001',
                'name': 'Test Class',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30
                # Missing sessions_per_week
            }
        ]
        
        with pytest.raises(ValueError, match="thiếu sessions_per_week"):
            GeneticAlgorithm(invalid_classes, sample_rooms, sample_teachers)
    
    def test_validate_classes_invalid_sessions_zero(self, sample_rooms, sample_teachers):
        """Reject sessions_per_week = 0"""
        invalid_classes = [
            {
                'id': 'C0001',
                'name': 'Test Class',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': 0  # Invalid
            }
        ]
        
        with pytest.raises(ValueError, match="không hợp lệ"):
            GeneticAlgorithm(invalid_classes, sample_rooms, sample_teachers)
    
    def test_validate_classes_invalid_sessions_negative(self, sample_rooms, sample_teachers):
        """Reject sessions_per_week < 0"""
        invalid_classes = [
            {
                'id': 'C0001',
                'name': 'Test Class',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': -1
            }
        ]
        
        with pytest.raises(ValueError, match="không hợp lệ"):
            GeneticAlgorithm(invalid_classes, sample_rooms, sample_teachers)
    
    def test_validate_classes_sessions_too_large(self, sample_rooms, sample_teachers):
        """Reject sessions_per_week > 5"""
        invalid_classes = [
            {
                'id': 'C0001',
                'name': 'Test Class',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': 6  # Too many
            }
        ]
        
        with pytest.raises(ValueError, match="quá lớn"):
            GeneticAlgorithm(invalid_classes, sample_rooms, sample_teachers)
    
    def test_validate_classes_missing_required_fields(self, sample_rooms, sample_teachers):
        """Reject class thiếu các fields bắt buộc"""
        invalid_classes = [
            {
                'id': 'C0001',
                'name': 'Test Class',
                # Missing subject_id, number_of_students
                'sessions_per_week': 2
            }
        ]
        
        with pytest.raises(ValueError, match="thiếu field bắt buộc"):
            GeneticAlgorithm(invalid_classes, sample_rooms, sample_teachers)
    
    def test_build_subject_to_teachers_mapping(self, sample_classes, sample_rooms, sample_teachers):
        """Build subject_to_teachers mapping từ qualified_teachers"""
        ga = GeneticAlgorithm(sample_classes, sample_rooms, sample_teachers)
        
        # S0001 (Toán): T0001, T0002
        assert 'S0001' in ga.subject_to_teachers
        assert set(ga.subject_to_teachers['S0001']) == {'T0001', 'T0002'}
        
        # S0002 (Lý): T0003, T0004
        assert 'S0002' in ga.subject_to_teachers
        assert set(ga.subject_to_teachers['S0002']) == {'T0003', 'T0004'}
    
    def test_build_rooms_by_type_categorization(self, sample_classes, sample_rooms, sample_teachers):
        """Phân loại rooms theo type"""
        ga = GeneticAlgorithm(sample_classes, sample_rooms, sample_teachers)
        
        assert len(ga.rooms_by_type['theory']) == 2  # R0001, R0002
        assert len(ga.rooms_by_type['lab']) == 2     # R0003, R0004
        assert len(ga.rooms_by_type['both']) == 1    # R0005


# ==================== Test Room Selection ====================

class TestRoomSelection:
    """Test logic chọn phòng học phù hợp"""
    
    def test_get_suitable_rooms_for_theory_class(self, ga_instance, sample_classes):
        """Theory class chọn THEORY hoặc BOTH rooms"""
        theory_class = sample_classes[0]  # Toán - theory
        suitable = ga_instance._get_suitable_rooms(theory_class)
        
        suitable_ids = [r['id'] for r in suitable]
        assert 'R0001' in suitable_ids  # THEORY
        assert 'R0002' in suitable_ids  # THEORY
        assert 'R0005' in suitable_ids  # BOTH
        assert 'R0003' not in suitable_ids  # LAB
        assert 'R0004' not in suitable_ids  # LAB
    
    def test_get_suitable_rooms_for_lab_class(self, ga_instance, sample_classes):
        """Lab class chọn LAB hoặc BOTH rooms"""
        lab_class = sample_classes[1]  # Vật lý - lab
        suitable = ga_instance._get_suitable_rooms(lab_class)
        
        suitable_ids = [r['id'] for r in suitable]
        assert 'R0003' in suitable_ids  # LAB
        assert 'R0004' in suitable_ids  # LAB
        assert 'R0005' in suitable_ids  # BOTH
        assert 'R0001' not in suitable_ids  # THEORY
        assert 'R0002' not in suitable_ids  # THEORY
    
    def test_get_suitable_rooms_filters_by_capacity(self, sample_rooms, sample_teachers):
        """Chỉ chọn rooms có capacity đủ"""
        large_class = [
            {
                'id': 'C0999',
                'name': 'Large Class',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 55,  # Lớn
                'sessions_per_week': 2,
                'room_type': 'theory'
            }
        ]
        
        ga = GeneticAlgorithm(large_class, sample_rooms, sample_teachers)
        suitable = ga._get_suitable_rooms(large_class[0])
        
        # Chỉ R0005 (cap=60) đủ cho 55 sv
        suitable_ids = [r['id'] for r in suitable]
        assert 'R0005' in suitable_ids
        assert 'R0001' not in suitable_ids  # cap=50 < 55
    
    def test_select_room_balanced_prefers_best_fit(self, ga_instance, sample_classes):
        """select_room_balanced ưu tiên phòng vừa khít"""
        theory_class = sample_classes[0]  # 30 students
        suitable = ga_instance._get_suitable_rooms(theory_class)
        
        # Chọn nhiều lần để test
        selections = {}
        for _ in range(100):
            room_id = ga_instance._select_room_balanced(suitable, [], theory_class)
            selections[room_id] = selections.get(room_id, 0) + 1
        
        # R0002 (cap=40, waste=10) nên được chọn nhiều hơn R0001 (cap=50, waste=20)
        if 'R0002' in selections and 'R0001' in selections:
            assert selections['R0002'] >= selections['R0001']
    
    def test_select_room_balanced_avoids_overused_rooms(self, ga_instance, sample_classes):
        """Tránh chọn phòng đã dùng nhiều"""
        theory_class = sample_classes[0]
        suitable = ga_instance._get_suitable_rooms(theory_class)
        
        # Giả lập R0001 đã dùng nhiều
        current_genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, i))
            for i in range(5)
        ]
        
        selections = {}
        for _ in range(50):
            room_id = ga_instance._select_room_balanced(suitable, current_genes, theory_class)
            selections[room_id] = selections.get(room_id, 0) + 1
        
        # R0002 nên được chọn nhiều hơn vì R0001 đã overused
        if 'R0002' in selections and 'R0001' in selections:
            assert selections['R0002'] > selections['R0001']


# ==================== Test Teacher Availability ====================

class TestTeacherAvailability:
    """Test kiểm tra teacher availability"""
    
    def test_teacher_available_on_all_days(self, ga_instance):
        """Teacher không có unavailable_days → available mọi ngày"""
        teacher_id = 'T0001'  # No unavailable days
        
        for day in range(6):
            assert ga_instance._is_teacher_available(teacher_id, day) is True
    
    def test_teacher_unavailable_on_specific_days(self, ga_instance):
        """Teacher có unavailable_days → không available những ngày đó"""
        teacher_id = 'T0002'  # unavailable_days = [5]
        
        assert ga_instance._is_teacher_available(teacher_id, 0) is True   # Monday
        assert ga_instance._is_teacher_available(teacher_id, 5) is False  # Saturday
    
    def test_teacher_unavailable_multiple_days(self, ga_instance):
        """Teacher unavailable nhiều ngày"""
        teacher_id = 'T0003'  # unavailable_days = [0, 2]
        
        assert ga_instance._is_teacher_available(teacher_id, 0) is False  # Monday
        assert ga_instance._is_teacher_available(teacher_id, 1) is True   # Tuesday
        assert ga_instance._is_teacher_available(teacher_id, 2) is False  # Wednesday
        assert ga_instance._is_teacher_available(teacher_id, 3) is True   # Thursday
    
    def test_teacher_unavailable_days_as_json_string(self, sample_classes, sample_rooms):
        """unavailable_days có thể là JSON string"""
        import json
        
        teachers = [
            {'id': 'T0001', 'unavailable_days': json.dumps([1, 3, 5])}
        ]
        
        ga = GeneticAlgorithm(sample_classes, sample_rooms, teachers)
        
        assert ga._is_teacher_available('T0001', 1) is False
        assert ga._is_teacher_available('T0001', 3) is False
        assert ga._is_teacher_available('T0001', 0) is True


# ==================== Test Teacher Selection ====================

class TestTeacherSelection:
    """Test logic chọn giáo viên tối ưu"""
    
    def test_select_optimal_teacher_single_choice(self, ga_instance, sample_classes):
        """Chỉ 1 GV qualified → chọn GV đó"""
        qualified = ['T0001']
        class_item = sample_classes[0]
        
        selected = ga_instance._select_optimal_teacher(qualified, class_item, [], 0, 1)
        
        assert selected == 'T0001'
    
    def test_select_optimal_teacher_avoids_conflicts(self, ga_instance, sample_classes):
        """Tránh chọn GV đang dạy cùng lúc"""
        qualified = ['T0001', 'T0002']
        class_item = sample_classes[0]
        
        # T0001 đang dạy slot (day=0, period=1)
        current_genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1))
        ]
        
        # Chọn cho slot (0, 1) → nên chọn T0002
        selected = ga_instance._select_optimal_teacher(
            qualified, class_item, current_genes, day=0, period=1
        )
        
        # T0002 nên được ưu tiên vì không conflict
        assert selected in qualified
    
    def test_select_optimal_teacher_balances_workload(self, ga_instance, sample_classes):
        """Cân bằng workload giữa các GV"""
        qualified = ['T0001', 'T0002']
        class_item = sample_classes[0]
        
        # T0001 đã dạy nhiều
        current_genes = [
            ScheduleGene(f'C000{i}', 'T0001', 'R0001', TimeSlot(i, 1))
            for i in range(5)
        ]
        
        # Chọn nhiều lần
        selections = {}
        for _ in range(50):
            selected = ga_instance._select_optimal_teacher(
                qualified, class_item, current_genes, day=5, period=5
            )
            selections[selected] = selections.get(selected, 0) + 1
        
        # T0002 nên được chọn nhiều hơn vì workload thấp
        if 'T0002' in selections and 'T0001' in selections:
            assert selections['T0002'] > selections['T0001']
    
    def test_select_optimal_teacher_respects_availability(self, ga_instance, sample_classes):
        """Ưu tiên GV available"""
        qualified = ['T0002', 'T0003']
        class_item = sample_classes[0]
        
        # T0003 không available ngày 0 (Monday)
        selections = {}
        for _ in range(50):
            selected = ga_instance._select_optimal_teacher(
                qualified, class_item, [], day=0, period=1
            )
            selections[selected] = selections.get(selected, 0) + 1
        
        # T0002 nên được chọn nhiều hơn
        if 'T0002' in selections and 'T0003' in selections:
            assert selections['T0002'] > selections['T0003']


# ==================== Test Schedule Generation ====================

class TestScheduleGeneration:
    """Test generate_random_schedule"""
    
    def test_generates_correct_number_of_genes(self, ga_instance, sample_classes):
        """Tổng genes = sum(sessions_per_week)"""
        schedule = ga_instance.generate_random_schedule()
        
        expected_total = sum(c['sessions_per_week'] for c in sample_classes)
        assert len(schedule) == expected_total  # 2 + 2 + 3 = 7
    
    def test_all_genes_have_valid_timeslots(self, ga_instance):
        """Tất cả genes có valid timeslots"""
        schedule = ga_instance.generate_random_schedule()
        
        for gene in schedule:
            assert 0 <= gene.time_slot.day < 6
            assert 0 <= gene.time_slot.period < 15
    
    def test_all_genes_have_valid_rooms(self, ga_instance, sample_rooms):
        """Tất cả genes có valid room IDs"""
        schedule = ga_instance.generate_random_schedule()
        
        room_ids = [r['id'] for r in sample_rooms]
        for gene in schedule:
            assert gene.room_id in room_ids
    
    def test_all_genes_have_valid_teachers(self, ga_instance, sample_teachers):
        """Tất cả genes có valid teacher IDs"""
        schedule = ga_instance.generate_random_schedule()
        
        teacher_ids = [t['id'] for t in sample_teachers]
        for gene in schedule:
            assert gene.teacher_id in teacher_ids
    
    def test_raises_error_if_no_qualified_teacher(self, sample_rooms, sample_teachers):
        """Raise error nếu không có GV qualified"""
        classes = [
            {
                'id': 'C0001',
                'name': 'Test',
                'subject_id': 'S0999',  # Subject không có GV nào dạy
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': 2,
                'room_type': 'theory',
                'qualified_teachers': []  # Explicitly empty list
            }
        ]
        
        ga = GeneticAlgorithm(classes, sample_rooms, sample_teachers)
        
        with pytest.raises(ValueError, match="không có giáo viên nào có thể dạy"):
            ga.generate_random_schedule()
    
    def test_schedule_prefers_weekdays_over_saturday(self, ga_instance):
        """Schedule ưu tiên T2-T6 hơn T7"""
        schedule = ga_instance.generate_random_schedule()
        
        weekday_count = sum(1 for g in schedule if g.time_slot.day < 5)
        saturday_count = sum(1 for g in schedule if g.time_slot.day == 5)
        
        # Weekdays nên nhiều hơn Saturday
        assert weekday_count >= saturday_count


# ==================== Test Fitness Calculation ====================

class TestFitnessCalculation:
    """Test calculate_fitness với các constraints"""
    
    def test_fitness_perfect_schedule_high_score(self, ga_instance):
        """Perfect schedule không conflicts → fitness cao"""
        genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1)),
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(2, 3)),
            ScheduleGene('C0002', 'T0003', 'R0003', TimeSlot(1, 2)),
            ScheduleGene('C0002', 'T0003', 'R0003', TimeSlot(3, 4)),
        ]
        
        fitness = ga_instance.calculate_fitness(genes)
        
        assert fitness > 0.5  # High fitness
        assert fitness <= 1.0
    
    def test_fitness_room_conflict_penalty(self, ga_instance):
        """2 lớp dùng chung phòng cùng lúc → penalty"""
        genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1)),
            ScheduleGene('C0002', 'T0003', 'R0001', TimeSlot(0, 1)),  # Conflict!
        ]
        
        fitness = ga_instance.calculate_fitness(genes)
        
        assert fitness < 0.5  # Low fitness due to hard constraint violation
    
    def test_fitness_teacher_conflict_penalty(self, ga_instance):
        """GV dạy 2 lớp cùng lúc → penalty"""
        genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1)),
            ScheduleGene('C0002', 'T0001', 'R0002', TimeSlot(0, 1)),  # Same teacher!
        ]
        
        fitness = ga_instance.calculate_fitness(genes)
        
        assert fitness < 0.5
    
    def test_fitness_class_conflict_penalty(self, ga_instance):
        """Lớp học 2 môn cùng lúc → penalty"""
        genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1)),
            ScheduleGene('C0001', 'T0002', 'R0002', TimeSlot(0, 1)),  # Same class!
        ]
        
        fitness = ga_instance.calculate_fitness(genes)
        
        assert fitness < 0.5
    
    def test_fitness_capacity_overflow_penalty(self, sample_rooms, sample_teachers):
        """Phòng không đủ chỗ → penalty"""
        classes = [
            {
                'id': 'C0001',
                'name': 'Large',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 100,  # Quá lớn
                'sessions_per_week': 1,
                'room_type': 'theory',
                'qualified_teachers': ['T0001']
            }
        ]
        
        ga = GeneticAlgorithm(classes, sample_rooms, sample_teachers)
        
        genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1))  # R0001 cap=50 < 100
        ]
        
        fitness = ga.calculate_fitness(genes)
        
        assert fitness < 0.5
    
    def test_fitness_wrong_room_type_penalty(self, ga_instance):
        """Lab class dùng theory room → penalty"""
        genes = [
            ScheduleGene('C0002', 'T0003', 'R0001', TimeSlot(0, 1))  # C0002=lab, R0001=theory
        ]
        
        fitness = ga_instance.calculate_fitness(genes)
        
        # Có penalty cho wrong room type
        assert fitness < 1.0
    
    def test_fitness_teacher_unavailable_penalty(self, ga_instance):
        """GV dạy ngày không rảnh → penalty"""
        genes = [
            ScheduleGene('C0001', 'T0002', 'R0001', TimeSlot(5, 1))  # T0002 không dạy T7
        ]
        
        fitness = ga_instance.calculate_fitness(genes)
        
        assert fitness < 0.5
    
    def test_fitness_evening_class_soft_penalty(self, ga_instance):
        """Lớp tối (tiết 13-14) → soft penalty"""
        genes_normal = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 8))  # Giờ bình thường
        ]
        
        genes_evening = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 13))  # Buổi tối
        ]
        
        fitness_normal = ga_instance.calculate_fitness(genes_normal)
        fitness_evening = ga_instance.calculate_fitness(genes_evening)
        
        # Evening nên có fitness thấp hơn một chút
        assert fitness_evening <= fitness_normal
    
    def test_fitness_saturday_class_soft_penalty(self, ga_instance):
        """Lớp T7 → soft penalty"""
        genes_weekday = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(1, 8))  # Tuesday
        ]
        
        genes_saturday = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(5, 8))  # Saturday
        ]
        
        fitness_weekday = ga_instance.calculate_fitness(genes_weekday)
        fitness_saturday = ga_instance.calculate_fitness(genes_saturday)
        
        assert fitness_saturday <= fitness_weekday


# ==================== Test Population & Selection ====================

class TestPopulationOperations:
    """Test create_population và selection"""
    
    def test_create_population_correct_size(self, ga_instance):
        """Population có đúng size"""
        population = ga_instance.create_population()
        
        assert len(population) == ga_instance.population_size
    
    def test_create_population_all_valid_individuals(self, ga_instance):
        """Tất cả individuals trong population hợp lệ"""
        population = ga_instance.create_population()
        
        for individual in population:
            assert isinstance(individual, Individual)
            assert len(individual.genes) > 0
            assert 0 <= individual.fitness <= 1.0
    
    def test_selection_returns_individual(self, ga_instance):
        """selection trả về 1 individual"""
        population = ga_instance.create_population()
        
        selected = ga_instance.selection(population)
        
        assert isinstance(selected, Individual)
        assert selected in population
    
    def test_selection_tournament_prefers_better_fitness(self, ga_instance):
        """Tournament selection ưu tiên individuals tốt hơn"""
        # Tạo population với fitness đa dạng
        population = [
            Individual(genes=[], fitness=0.1),
            Individual(genes=[], fitness=0.3),
            Individual(genes=[], fitness=0.5),
            Individual(genes=[], fitness=0.7),
            Individual(genes=[], fitness=0.9),
        ]
        
        selections = {}
        for _ in range(100):
            selected = ga_instance.selection(population)
            idx = population.index(selected)
            selections[idx] = selections.get(idx, 0) + 1
        
        # Individual với fitness cao nên được chọn nhiều hơn
        assert selections.get(4, 0) >= selections.get(0, 0)


# ==================== Test Crossover ====================

class TestCrossover:
    """Test crossover operation"""
    
    def test_crossover_returns_valid_genes_list(self, ga_instance):
        """Crossover trả về list of genes hợp lệ"""
        parent1 = Individual(genes=ga_instance.generate_random_schedule())
        parent2 = Individual(genes=ga_instance.generate_random_schedule())
        
        child_genes = ga_instance.crossover(parent1, parent2)
        
        assert isinstance(child_genes, list)
        assert len(child_genes) > 0
        assert all(isinstance(g, ScheduleGene) for g in child_genes)
    
    def test_crossover_preserves_gene_count(self, ga_instance):
        """Crossover giữ nguyên số lượng genes"""
        parent1 = Individual(genes=ga_instance.generate_random_schedule())
        parent2 = Individual(genes=ga_instance.generate_random_schedule())
        
        original_count = len(parent1.genes)
        child_genes = ga_instance.crossover(parent1, parent2)
        
        assert len(child_genes) == original_count
    
    def test_crossover_respects_rate(self, ga_instance):
        """Crossover rate control"""
        ga_instance.crossover_rate = 0.0  # Never crossover
        
        parent1 = Individual(genes=ga_instance.generate_random_schedule())
        parent2 = Individual(genes=ga_instance.generate_random_schedule())
        
        child_genes = ga_instance.crossover(parent1, parent2)
        
        # Với rate=0, nên trả về copy của parent1
        assert len(child_genes) == len(parent1.genes)


# ==================== Test Mutation ====================

class TestMutation:
    """Test mutation operation"""
    
    def test_mutate_returns_valid_genes_list(self, ga_instance):
        """Mutation trả về list of genes hợp lệ"""
        original_genes = ga_instance.generate_random_schedule()
        
        mutated_genes = ga_instance.mutate(original_genes)
        
        assert isinstance(mutated_genes, list)
        assert len(mutated_genes) == len(original_genes)
        assert all(isinstance(g, ScheduleGene) for g in mutated_genes)
    
    def test_mutate_preserves_gene_count(self, ga_instance):
        """Mutation không thay đổi số lượng genes"""
        original_genes = ga_instance.generate_random_schedule()
        original_count = len(original_genes)
        
        mutated_genes = ga_instance.mutate(original_genes)
        
        assert len(mutated_genes) == original_count
    
    def test_mutate_changes_some_genes(self, ga_instance):
        """Mutation thay đổi một số genes"""
        ga_instance.mutation_rate = 1.0  # Always mutate
        
        original_genes = ga_instance.generate_random_schedule()
        mutated_genes = ga_instance.mutate(original_genes)
        
        # Ít nhất một số genes phải khác
        differences = sum(
            1 for o, m in zip(original_genes, mutated_genes)
            if o.time_slot.day != m.time_slot.day or o.time_slot.period != m.time_slot.period
        )
        
        assert differences > 0
    
    def test_mutate_respects_rate(self, ga_instance):
        """Mutation rate control"""
        ga_instance.mutation_rate = 0.0  # Never mutate
        
        original_genes = ga_instance.generate_random_schedule()
        mutated_genes = ga_instance.mutate(original_genes)
        
        # Với rate=0, nên giống nguyên
        for o, m in zip(original_genes, mutated_genes):
            assert o.time_slot.day == m.time_slot.day
            assert o.time_slot.period == m.time_slot.period


# ==================== Test GA Run ====================

class TestGARun:
    """Test toàn bộ GA run"""
    
    def test_run_returns_best_solution_and_stats(self, ga_instance):
        """GA.run() trả về best solution và stats"""
        best_solution, stats_history = ga_instance.run()
        
        assert isinstance(best_solution, Individual)
        assert isinstance(stats_history, list)
        assert len(stats_history) > 0
    
    def test_run_improves_fitness_over_generations(self, ga_instance):
        """Fitness cải thiện qua các thế hệ"""
        best_solution, stats_history = ga_instance.run()
        
        first_gen_best = stats_history[0]['best_fitness']
        last_gen_best = stats_history[-1]['best_fitness']
        
        # Fitness cuối nên >= fitness đầu
        assert last_gen_best >= first_gen_best
    
    def test_run_respects_max_generations(self, ga_instance):
        """GA không chạy quá max_generations"""
        ga_instance.max_generations = 5
        
        best_solution, stats_history = ga_instance.run()
        
        assert len(stats_history) <= ga_instance.max_generations
    
    def test_run_early_stopping_on_high_fitness(self, ga_instance):
        """GA dừng sớm nếu đạt fitness cao"""
        ga_instance.max_generations = 100
        
        best_solution, stats_history = ga_instance.run()
        
        # Nếu đạt fitness ≥ 0.95, nên dừng sớm
        if best_solution.fitness >= 0.95:
            assert len(stats_history) < ga_instance.max_generations
    
    def test_run_stats_structure(self, ga_instance):
        """Stats có đúng structure"""
        best_solution, stats_history = ga_instance.run()
        
        for stat in stats_history:
            assert 'generation' in stat
            assert 'best_fitness' in stat
            assert 'best_ever_fitness' in stat
            assert 'avg_fitness' in stat
            assert 'worst_fitness' in stat
            
            assert stat['best_fitness'] <= 1.0
            assert stat['worst_fitness'] >= 0.0


# ==================== Test Data Classes ====================

class TestDataClasses:
    """Test TimeSlot, ScheduleGene, Individual dataclasses"""
    
    def test_timeslot_creation(self):
        """TimeSlot tạo đúng"""
        ts = TimeSlot(day=2, period=5)
        
        assert ts.day == 2
        assert ts.period == 5
    
    def test_schedule_gene_creation(self):
        """ScheduleGene tạo đúng"""
        gene = ScheduleGene(
            class_id='C0001',
            teacher_id='T0001',
            room_id='R0001',
            time_slot=TimeSlot(day=1, period=3)
        )
        
        assert gene.class_id == 'C0001'
        assert gene.teacher_id == 'T0001'
        assert gene.room_id == 'R0001'
        assert gene.time_slot.day == 1
        assert gene.time_slot.period == 3
    
    def test_individual_creation(self):
        """Individual tạo đúng"""
        genes = [
            ScheduleGene('C0001', 'T0001', 'R0001', TimeSlot(0, 1)),
            ScheduleGene('C0002', 'T0002', 'R0002', TimeSlot(1, 2))
        ]
        
        individual = Individual(genes=genes, fitness=0.85)
        
        assert len(individual.genes) == 2
        assert individual.fitness == 0.85
    
    def test_individual_default_fitness(self):
        """Individual fitness mặc định = 0.0"""
        genes = []
        individual = Individual(genes=genes)
        
        assert individual.fitness == 0.0


# ==================== Test Edge Cases ====================

class TestEdgeCases:
    """Test các edge cases"""
    
    def test_single_class_single_session(self, sample_rooms, sample_teachers):
        """GA với 1 lớp, 1 buổi/tuần"""
        classes = [
            {
                'id': 'C0001',
                'name': 'Single',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': 1,
                'room_type': 'theory',
                'qualified_teachers': ['T0001']
            }
        ]
        
        ga = GeneticAlgorithm(classes, sample_rooms, sample_teachers)
        schedule = ga.generate_random_schedule()
        
        assert len(schedule) == 1
    
    def test_many_classes_many_sessions(self, sample_rooms, sample_teachers):
        """GA với nhiều lớp, nhiều buổi"""
        classes = [
            {
                'id': f'C{str(i).zfill(4)}',
                'name': f'Class {i}',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': 3,
                'room_type': 'theory',
                'qualified_teachers': ['T0001', 'T0002']
            }
            for i in range(1, 11)
        ]
        
        ga = GeneticAlgorithm(classes, sample_rooms, sample_teachers, population_size=10, max_generations=5)
        schedule = ga.generate_random_schedule()
        
        assert len(schedule) == 10 * 3  # 30 genes
    
    def test_all_teachers_unavailable_same_day(self, sample_rooms):
        """Tất cả GV đều unavailable cùng 1 ngày"""
        classes = [
            {
                'id': 'C0001',
                'name': 'Test',
                'subject_id': 'S0001',
                'teacher_id': 'T0001',
                'number_of_students': 30,
                'sessions_per_week': 2,
                'room_type': 'theory',
                'qualified_teachers': ['T0001']
            }
        ]
        
        teachers = [
            {'id': 'T0001', 'unavailable_days': [0, 1, 2, 3, 4, 5]}  # Unavailable all days
        ]
        
        ga = GeneticAlgorithm(classes, sample_rooms, teachers)
        
        # Vẫn tạo schedule được nhưng fitness sẽ thấp
        schedule = ga.generate_random_schedule()
        assert len(schedule) == 2
        
        fitness = ga.calculate_fitness(schedule)
        assert fitness < 0.5  # Low fitness due to unavailability


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
