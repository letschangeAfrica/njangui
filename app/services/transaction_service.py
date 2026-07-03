"""
Transaction service — all business logic for the transaction lifecycle.

Endpoints supported:
  POST   /transactions              initiate (customer side)
  GET    /transactions              list my transactions (both roles)
  GET    /transactions/:id          get one transaction
  POST   /transactions/:id/confirm  provider confirms
  POST   /transactions/:id/rate     customer rates
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.rating import Rating, RatingValue
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User
from app.schemas.transaction import (
    RatingCreateIn,
    RatingOut,
    TransactionCreateIn,
    TransactionListOut,
    TransactionOut,
)

TRANSACTION_WINDOW_HOURS = 24


# ── Helpers ───────────────────────────────────────────────────────────────────


def _to_out(tx: Transaction) -> TransactionOut:
    """Convert a Transaction ORM object to TransactionOut schema."""
    provider_name = ""
    if tx.provider and tx.provider.provider_profile:
        provider_name = tx.provider.provider_profile.full_name
    elif tx.provider:
        provider_name = tx.provider.phone_number

    customer_name = None
    if tx.customer and tx.customer.provider_profile:
        customer_name = tx.customer.provider_profile.full_name
    elif tx.customer:
        customer_name = tx.customer.phone_number

    rating_out = None
    if tx.rating:
        rating_out = RatingOut(
            id=tx.rating.id,
            thumbs_up=(tx.rating.rating == RatingValue.thumbs_up),
            comment=tx.rating.comment,
            created_at=tx.rating.created_at,
        )

    return TransactionOut(
        id=tx.id,
        provider_id=tx.provider_id,
        customer_id=tx.customer_id,
        amount_xaf=tx.amount_xaf,
        description=tx.description,
        status=tx.status.value,
        initiated_by=tx.initiated_by,
        initiated_at=tx.initiated_at,
        expires_at=tx.expires_at,
        provider_confirmed_at=tx.provider_confirmed_at,
        customer_confirmed_at=tx.customer_confirmed_at,
        provider_name=provider_name,
        customer_name=customer_name,
        rating=rating_out,
    )


def _load_tx(tx_id: uuid.UUID, db: Session) -> Transaction:
    tx = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.provider).joinedload(User.provider_profile),
            joinedload(Transaction.customer).joinedload(User.provider_profile),
            joinedload(Transaction.rating),
        )
        .filter(Transaction.id == tx_id)
        .first()
    )
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable.",
        )
    return tx


# ── Initiate ──────────────────────────────────────────────────────────────────


def initiate_transaction(
    data: TransactionCreateIn,
    current_user: User,
    db: Session,
) -> TransactionOut:
    """
    Customer initiates a transaction.

    - Validates provider exists and is active
    - Customer auto-confirms their side (customer_confirmed_at = NOW)
    - Transaction status stays 'pending' until provider also confirms
    """
    if data.provider_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas initier une transaction avec vous-même.",
        )

    provider = (
        db.query(User)
        .options(joinedload(User.provider_profile))
        .filter(User.id == data.provider_id)
        .first()
    )
    if not provider or not provider.provider_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prestataire introuvable.",
        )
    if not provider.provider_profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce prestataire n'est plus actif.",
        )

    now = datetime.now(timezone.utc)
    tx = Transaction(
        provider_id=data.provider_id,
        customer_id=current_user.id,
        amount_xaf=data.amount_xaf,
        description=data.description,
        initiated_by=current_user.id,
        initiated_at=now,
        customer_confirmed_at=now,  # customer auto-confirms by initiating
        expires_at=now + timedelta(hours=TRANSACTION_WINDOW_HOURS),
        status=TransactionStatus.pending,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    return _to_out(_load_tx(tx.id, db))


# ── List ──────────────────────────────────────────────────────────────────────


def list_transactions(
    current_user: User,
    db: Session,
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> TransactionListOut:
    """Return all transactions where user is either provider or customer."""
    query = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.provider).joinedload(User.provider_profile),
            joinedload(Transaction.customer).joinedload(User.provider_profile),
            joinedload(Transaction.rating),
        )
        .filter(
            or_(
                Transaction.provider_id == current_user.id,
                Transaction.customer_id == current_user.id,
            )
        )
    )

    if status_filter:
        try:
            s = TransactionStatus(status_filter)
            query = query.filter(Transaction.status == s)
        except ValueError:
            pass  # ignore invalid status filter

    total = query.count()
    txs = (
        query.order_by(Transaction.initiated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return TransactionListOut(
        total=total,
        page=page,
        page_size=page_size,
        results=[_to_out(tx) for tx in txs],
    )


# ── Get one ───────────────────────────────────────────────────────────────────


def get_transaction(
    tx_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> TransactionOut:
    tx = _load_tx(tx_id, db)
    if tx.provider_id != current_user.id and tx.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette transaction.",
        )
    return _to_out(tx)


# ── Confirm ───────────────────────────────────────────────────────────────────


def confirm_transaction(
    tx_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> TransactionOut:
    """
    Provider confirms their side.
    When both parties have confirmed → status becomes 'confirmed'.
    """
    tx = _load_tx(tx_id, db)

    if tx.provider_id != current_user.id and tx.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas accès à cette transaction.",
        )

    if tx.status != TransactionStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de confirmer une transaction avec le statut '{tx.status.value}'.",
        )

    now = datetime.now(timezone.utc)
    if tx.expires_at < now:
        tx.status = TransactionStatus.expired
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cette transaction a expiré (délai de 24h dépassé).",
        )

    if current_user.id == tx.provider_id:
        if tx.provider_confirmed_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez déjà confirmé cette transaction.",
            )
        tx.provider_confirmed_at = now
    else:
        if tx.customer_confirmed_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez déjà confirmé cette transaction.",
            )
        tx.customer_confirmed_at = now

    # Both confirmed → mark as confirmed
    if tx.provider_confirmed_at and tx.customer_confirmed_at:
        tx.status = TransactionStatus.confirmed

    db.commit()
    return _to_out(_load_tx(tx_id, db))


# ── Rate ──────────────────────────────────────────────────────────────────────


def rate_transaction(
    tx_id: uuid.UUID,
    data: RatingCreateIn,
    current_user: User,
    db: Session,
) -> RatingOut:
    """
    Customer submits a rating.
    Allowed as soon as the customer has confirmed their side
    (customer_confirmed_at IS NOT NULL).
    """
    tx = _load_tx(tx_id, db)

    if tx.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le client peut laisser un avis sur cette transaction.",
        )

    if not tx.customer_confirmed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous devez d'abord confirmer la transaction avant de laisser un avis.",
        )

    if tx.rating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un avis a déjà été soumis pour cette transaction.",
        )

    rating = Rating(
        transaction_id=tx.id,
        rated_by=current_user.id,
        rating=RatingValue.thumbs_up if data.thumbs_up else RatingValue.thumbs_down,
        comment=data.comment,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)

    return RatingOut(
        id=rating.id,
        thumbs_up=rating.is_positive,
        comment=rating.comment,
        created_at=rating.created_at,
    )
