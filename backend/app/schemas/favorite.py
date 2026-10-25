"""User favorite location Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.location import LocationRead


class FavoriteCreate(BaseModel):
    user_id: uuid.UUID
    location_id: uuid.UUID


class FavoriteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    location_id: uuid.UUID
    created_at: datetime
    location: Optional[LocationRead] = None
