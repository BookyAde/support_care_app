from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.core.dependencies import get_current_admin, get_current_client
from app.models.shift import Shift
from app.models.rating import Rating
from app.models.enums import ShiftStatus
from app.schemas.rating import RatingCreate, RatingResponse

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("/shifts/{shift_id}", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def rate_shift(
    shift_id: UUID, payload: RatingCreate, client=Depends(get_current_client), db: Session = Depends(get_db)
):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift or shift.client_id != client.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found")
    if shift.status != ShiftStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only completed visits can be rated")

    existing = db.query(Rating).filter(Rating.shift_id == shift_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This visit has already been rated")

    rating = Rating(
        shift_id=shift.id,
        client_id=client.id,
        worker_id=shift.worker_id,
        stars=payload.stars,
        comment=payload.comment,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/worker/{worker_id}")
def get_worker_ratings(worker_id: UUID, admin=Depends(get_current_admin), db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(Rating.worker_id == worker_id).order_by(Rating.created_at.desc()).all()
    count = len(ratings)
    average = round(sum(r.stars for r in ratings) / count, 2) if count else None

    return {
        "ratings": [RatingResponse.model_validate(r) for r in ratings],
        "average": average,
        "count": count,
    }
