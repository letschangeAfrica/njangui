"""
Transactions router.

POST   /transactions              initiate a transaction (customer)
GET    /transactions              list my transactions
GET    /transactions/:id          get one transaction
POST   /transactions/:id/confirm  provider confirms
POST   /transactions/:id/rate     customer rates provider
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.schemas.transaction import (
    RatingCreateIn,
    RatingOut,
    TransactionCreateIn,
    TransactionListOut,
    TransactionOut,
)
from app.services import transaction_service

router = APIRouter()


# ── POST /transactions ────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate a transaction",
    description=(
        "Customer initiates a transaction with a provider. "
        "The customer auto-confirms their side. "
        "The transaction stays 'pending' until the provider also confirms."
    ),
)
def initiate_transaction(
    body: TransactionCreateIn,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.initiate_transaction(
        data=body, current_user=current_user, db=db
    )


# ── GET /transactions ─────────────────────────────────────────────────────────
@router.get(
    "",
    response_model=TransactionListOut,
    status_code=status.HTTP_200_OK,
    summary="List my transactions",
    description="Returns all transactions where the authenticated user is provider or customer.",
)
def list_transactions(
    status: Optional[str] = Query(None, description="Filter: pending | confirmed | expired | disputed"),
    page:      int = Query(1,  ge=1),
    page_size: int = Query(20, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.list_transactions(
        current_user=current_user,
        db=db,
        status_filter=status,
        page=page,
        page_size=page_size,
    )


# ── GET /transactions/:id ─────────────────────────────────────────────────────
@router.get(
    "/{tx_id}",
    response_model=TransactionOut,
    status_code=status.HTTP_200_OK,
    summary="Get a transaction",
)
def get_transaction(
    tx_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.get_transaction(
        tx_id=tx_id, current_user=current_user, db=db
    )


# ── POST /transactions/:id/confirm ────────────────────────────────────────────
@router.post(
    "/{tx_id}/confirm",
    response_model=TransactionOut,
    status_code=status.HTTP_200_OK,
    summary="Confirm a transaction",
    description=(
        "Either the provider or the customer can call this. "
        "When both have confirmed, the transaction becomes 'confirmed' (immutable)."
    ),
)
def confirm_transaction(
    tx_id: uuid.UUID,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.confirm_transaction(
        tx_id=tx_id, current_user=current_user, db=db
    )


# ── POST /transactions/:id/rate ───────────────────────────────────────────────
@router.post(
    "/{tx_id}/rate",
    response_model=RatingOut,
    status_code=status.HTTP_201_CREATED,
    summary="Rate a transaction",
    description=(
        "Customer submits a thumbs-up or thumbs-down rating. "
        "Can be submitted as soon as the customer has confirmed their side. "
        "One rating per transaction — immutable once submitted."
    ),
)
def rate_transaction(
    tx_id: uuid.UUID,
    body: RatingCreateIn,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return transaction_service.rate_transaction(
        tx_id=tx_id, data=body, current_user=current_user, db=db
    )
