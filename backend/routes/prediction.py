from fastapi import APIRouter

from ml_model import predict_disease
from schemas import PredictionRequest

router = APIRouter(tags=["prediction"])


@router.post("/predict")
async def predict(payload: PredictionRequest) -> dict:
    return predict_disease(payload.symptoms)
