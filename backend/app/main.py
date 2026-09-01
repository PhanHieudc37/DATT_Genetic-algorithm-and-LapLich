"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, close_db
from app.api.v1 import auth, teachers, subjects, rooms, classes, genetic, periods


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API cho hệ thống xếp thời khóa biểu sử dụng giải thuật di truyền",
    lifespan=lifespan
)

# Configure CORS - Allow frontend origin explicitly
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3710",
    "http://127.0.0.1:3710",
    "http://localhost:3711",
    "http://127.0.0.1:3711",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://ga.oliveinfo.cn",
    "http://ga.oliveinfo.cn",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["*"],
    max_age=3600,
)


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Timetable Genetic Algorithm API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(teachers.router, prefix="/api/v1/teachers", tags=["Teachers"])
app.include_router(subjects.router, prefix="/api/v1/subjects", tags=["Subjects"])
app.include_router(rooms.router, prefix="/api/v1/rooms", tags=["Rooms"])
app.include_router(classes.router, prefix="/api/v1/classes", tags=["Classes"])
app.include_router(genetic.router, prefix="/api/v1/genetic", tags=["Genetic Algorithm"])
app.include_router(periods.router, prefix="/api/v1", tags=["Periods & TimeSlots"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
