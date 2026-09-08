from datetime import date

from pydantic import BaseModel

from app.schemas.reservation import (
    OperatorReservationResponse,
)


class OperatorDailyOperationsCounts(BaseModel):
    arrivals: int
    staying: int
    departures: int


class OperatorDailyOperationsResponse(BaseModel):
    date: date

    counts: OperatorDailyOperationsCounts

    arrivals: list[
        OperatorReservationResponse
    ]

    staying: list[
        OperatorReservationResponse
    ]

    departures: list[
        OperatorReservationResponse
    ]