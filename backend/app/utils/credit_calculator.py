"""
Credit Calculator - Tính toán số buổi học mỗi tuần theo tín chỉ

Quy định cứng theo tín chỉ (mỗi buổi = 1 tiết):
- 1 tín chỉ → 1 buổi/tuần
- 2 tín chỉ → 2 buổi/tuần
- 3 tín chỉ → 2 buổi/tuần
- 4 tín chỉ → 2 buổi/tuần
- ≥5 tín chỉ → 3 buổi/tuần
"""


def calculate_sessions_per_week(credits: int) -> int:
    """
    Tính số buổi học mỗi tuần dựa trên số tín chỉ
    
    Quy định (mỗi buổi = 1 tiết):
    - 1 tín chỉ: 1 buổi/tuần
    - 2 tín chỉ: 2 buổi/tuần
    - 3 tín chỉ: 2 buổi/tuần
    - 4 tín chỉ: 2 buổi/tuần
    - >= 5 tín chỉ: 3 buổi/tuần
    
    Args:
        credits: Số tín chỉ của môn học
        
    Returns:
        Số buổi học mỗi tuần (mỗi buổi = 1 tiết)
    """
    if credits <= 0:
        raise ValueError("Số tín chỉ phải lớn hơn 0")
    
    if credits == 1:
        return 1
    elif credits >= 5:
        return 3
    else:
        return 2  # Chuẩn cho 2, 3, 4 tín chỉ


def validate_sessions_per_week(credits: int, sessions_per_week: int) -> tuple[bool, str]:
    """
    Kiểm tra xem số buổi/tuần có hợp lý với số tín chỉ không
    
    Args:
        credits: Số tín chỉ
        sessions_per_week: Số buổi học mỗi tuần
        
    Returns:
        Tuple (is_valid, error_message)
    """
    if credits <= 0:
        return False, "Số tín chỉ phải lớn hơn 0"
    
    if sessions_per_week <= 0:
        return False, "Số buổi/tuần phải lớn hơn 0"
    
    recommended = calculate_sessions_per_week(credits)
    
    # Cho phép linh hoạt ±1 buổi so với khuyến nghị
    min_sessions = max(1, recommended - 1)
    max_sessions = recommended + 1
    
    if sessions_per_week < min_sessions or sessions_per_week > max_sessions:
        return False, (
            f"Môn {credits} tín chỉ nên có {recommended} buổi/tuần "
            f"(cho phép {min_sessions}-{max_sessions} buổi). "
            f"Bạn đang đặt {sessions_per_week} buổi."
        )
    
    return True, ""


def get_recommended_sessions(credits: int) -> dict:
    """
    Lấy thông tin gợi ý về số buổi học
    
    Returns:
        {
            'recommended': int,
            'min': int,
            'max': int,
            'description': str
        }
    """
    recommended = calculate_sessions_per_week(credits)
    min_sessions = max(1, recommended - 1)
    max_sessions = recommended + 1
    
    # Mô tả đơn giản - mỗi buổi = 1 tiết
    description = f"{recommended} buổi/tuần"
    
    return {
        'recommended': recommended,
        'min': min_sessions,
        'max': max_sessions,
        'description': description
    }
