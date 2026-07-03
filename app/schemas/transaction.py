"""
Pydantic schemas for the transactions module.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ── Request schemas ───────────────────────────────────────────────────────────

class TransactionCreateIn(BaseModel):
    """Customer initiates a transaction with a provider."""
    provider_id: uuid.UUID
    amount_xaf:  int
    description: Optional[str] = None

    @field_validator("amount_xaf")
    @classmethod
    def amount_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Le montant doit être supérieur à 0 XAF.")
        if v < 500:
            raise ValueError("Le montant minimum est de 500 XAF.")
        return v

    @field_validator("description")
    @classmethod
    def description_not_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.strip()) > 500:
            raise ValueError("La description ne peut pas dépasser 500 caractères.")
        return v.strip() if v else v


class RatingCreateIn(BaseModel):
    """Customer submits a rating after confirming a transaction."""
    thumbs_up: bool
    comment:   Optional[str] = None

    @field_validator("comment")
    @classmethod
    def comment_not_too_long(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.strip()) > 500:
            raise ValueError("Le commentaire ne peut pas dépasser 500 caractères.")
        return v.strip() if v else v


# ── Response schemas ──────────────────────────────────────────────────────────

class RatingOut(BaseModel):
    id:         uuid.UUID
    thumbs_up:  bool
    comment:    Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionOut(BaseModel):
    id:                    uuid.UUID
    provider_id:           uuid.UUID
    customer_id:           uuid.UUID
    amount_xaf:            int
    description:           Optional[str]
    status:                str
    initiated_by:          uuid.UUID
    initiated_at:          datetime
    expires_at:            datetime
    provider_confirmed_at: Optional[datetime]
    customer_confirmed_at: Optional[datetime]
    # Denormalised display fields
    provider_name:         str
    customer_name:         Optional[str]
    rating:                Optional[RatingOut]

    model_config = {"from_attributes": True}


class TransactionListOut(BaseModel):
    total:     int
    page:      int
    page_size: int
    results:   list[TransactionOut]
