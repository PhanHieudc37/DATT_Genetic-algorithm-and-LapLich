"""
Genetic Algorithm schemas
"""
from pydantic import BaseModel, Field
from typing import Optional


class GeneticAlgorithmConfig(BaseModel):
    """Genetic Algorithm configuration"""
    population_size: int = Field(default=100, ge=10, le=500)
    mutation_rate: float = Field(default=0.1, ge=0.0, le=1.0)
    crossover_rate: float = Field(default=0.8, ge=0.0, le=1.0)
    elitism_rate: float = Field(default=0.1, ge=0.0, le=1.0)
    max_generations: int = Field(default=100, ge=10, le=1000)


class GeneticAlgorithmRun(BaseModel):
    """Request to run genetic algorithm"""
    config: Optional[GeneticAlgorithmConfig] = None
    save_best: bool = True
    timetable_name: Optional[str] = None


class GenerationStats(BaseModel):
    """Statistics for a generation"""
    generation: int
    best_fitness: float
    avg_fitness: float
    worst_fitness: float
